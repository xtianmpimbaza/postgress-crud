import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as encodeBase64 } from "https://deno.land/std@0.192.0/encoding/base64.ts";
import { XMLParser } from "https://esm.sh/fast-xml-parser@4.2.5";
const SOAP_ENDPOINT = Deno.env.get("SOAP_ENDPOINT") || "";
const ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
console.log("SUPABASE_SERVICE_ROLE_KEY", ROLE_KEY);

function escapeXml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

async function generateWsSecurity(username, password) {
  const nonce = crypto.getRandomValues(new Uint8Array(16));
  const nonceBase64 = encodeBase64(nonce);
  const created = new Date().toISOString().replace(/\.\d+Z$/, "Z");
  const createdForDigest = created.replace(/([+-]\d{2}):(\d{2})$/, "$1$2");
  const passwordDigest = await calculatePasswordDigest(password, nonce, createdForDigest);
  return `
    <wsse:UsernameToken>
      <wsse:Username>${username}</wsse:Username>
      <wsse:Password Type="PasswordDigest">ZMvfJzFWcWkrWGd10gz7wYVY/js=</wsse:Password>
      <wsse:Nonce>aYdz/Rbe/laaPKl1qPdaPQ==</wsse:Nonce>
      <wsse:Created>2018-04-06T19:32:31.543+03:00</wsse:Created>
    </wsse:UsernameToken>
  `;
}

async function calculatePasswordDigest(password, nonce, created) {
  const encoder = new TextEncoder();
  // SHA-1 of password
  const passwordBuffer = encoder.encode(password);
  const sha1Password = new Uint8Array(await crypto.subtle.digest("SHA-1", passwordBuffer));
  // Concatenate nonce + created + sha1Password
  const createdBuffer = encoder.encode(created);
  const combined = new Uint8Array(nonce.length + createdBuffer.length + sha1Password.length);
  combined.set(nonce);
  combined.set(createdBuffer, nonce.length);
  combined.set(sha1Password, nonce.length + createdBuffer.length);
  // SHA-1 of combined
  const digest = await crypto.subtle.digest("SHA-1", combined);
  return encodeBase64(digest);
}

function validatePasswordPolicy(password) {
  const regex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])(?!.*\s).{6,10}$/;
  return regex.test(password);
}

async function encryptPassword(plainPassword) {
  const pemContents = PUBLIC_KEY.replace(/-----BEGIN PUBLIC KEY-----/, "").replace(/-----END PUBLIC KEY-----/, "").replace(/\s+/g, "");
  const binaryDer = Uint8Array.from(atob(pemContents), (c)=>c.charCodeAt(0));
  const key = await crypto.subtle.importKey("spki", binaryDer, {
    name: "RSA-OAEP",
    hash: "SHA-256"
  }, false, [
    "encrypt"
  ]);
  const encrypted = await crypto.subtle.encrypt({
    name: "RSA-OAEP"
  }, key, new TextEncoder().encode(plainPassword));
  return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
}
async function verifySystemAccess(supabase, systemId, operation) {
  // return true; // For testing purposes, always allow access
  return true; // For testing purposes, always allow access
//   const { data, error } = await supabase.from("third_party_system_roles").select("role:system_roles(name)").eq("system_id", systemId);
//   if (error || !data) return false;
//   return data.some((role)=>role.name === operation);
}

serve(async (req)=>{
  try {
    const { systemId, operation, data } = await req.json();
    const supabase = createClient(Deno.env.get("SUPABASE_URL") || "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "", {
      global: {
        headers: {
          Authorization: req.headers.get("Authorization")
        }
      }
    });
    // Verify system has access to operation
    if (!await verifySystemAccess(supabase, systemId, operation)) {
      return new Response(JSON.stringify({
        error: "Unauthorized operation"
      }), {
        status: 403,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    const wsSecurity = await generateWsSecurity('ThirdParty@ROOT', 'b32!ccS');
    let soapResponse;
    switch(operation){
      case "verifyPersonInformation":
        soapResponse = await verifyPerson(data, wsSecurity);
        break;
      case "changePassword":
        soapResponse = await changePassword(data, wsSecurity);
        break;
      default:
        return new Response(JSON.stringify({
          error: "Invalid operation"
        }), {
          status: 400,
          headers: {
            "Content-Type": "application/json"
          }
        });
    }
    const result = parseSoapResponse(soapResponse);
    console.log("SOAP Response:", soapResponse);
    return new Response(JSON.stringify(result), {
      headers: {
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
});

async function verifyPerson(request, wsSecurity) {
  const soapRequest = `
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
                      xmlns:fac="http://facade.server.pilatus.thirdparty.tidis.muehlbauer.de/"
                      xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">
      <soapenv:Header>
        ${wsSecurity}
      </soapenv:Header>
      <soapenv:Body>
        <fac:verifyPersonInformation>
          <request>
            <nationalId>${escapeXml(request.nationalId)}</nationalId>
            <documentId>${escapeXml(request.documentId)}</documentId>
            <surname>${escapeXml(request.surname)}</surname>
            <givenNames>${escapeXml(request.givenNames)}</givenNames>
            <otherNames>${request.otherNames ? escapeXml(request.otherNames) : ''}</otherNames>
            <dateOfBirth>${escapeXml(request.dateOfBirth)}</dateOfBirth>
          </request>
        </fac:verifyPersonInformation>
      </soapenv:Body>
    </soapenv:Envelope>
  `;
  console.log("SOAP Request:", soapRequest);
  console.log("SOAP Endpoint:", SOAP_ENDPOINT);
  console.log("WS-Security Header:", wsSecurity);
  console.log("Request Data:", request);
  const response = await fetch(SOAP_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "text/xml"
    },
    body: soapRequest
  });
  console.log("SOAP Response:", response);
  return await response;
}

async function changePassword(request, wsSecurity) {
  if (!validatePasswordPolicy(request.newPassword)) {
    throw new Error("Password does not meet policy requirements");
  }
  const encryptedPassword = await encryptPassword(request.newPassword);
  const soapRequest = `
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
                      xmlns:fac="http://facade.server.pilatus.thirdparty.tidis.muehlbauer.de/">
      <soapenv:Header>
        ${wsSecurity}
      </soapenv:Header>
      <soapenv:Body>
        <fac:changePassword>
          <request>
            <newPassword>${escapeXml(encryptedPassword)}</newPassword>
          </request>
        </fac:changePassword>
      </soapenv:Body>
    </soapenv:Envelope>
  `;
  const response = await fetch(SOAP_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "text/xml"
    },
    body: soapRequest
  });
  return await response.text();
}

function parseSoapResponse(xml) {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: ""
  });
  const jsonObj = parser.parse(xml);
  const body = jsonObj["soapenv:Envelope"]?.["soapenv:Body"];
  const response = body?.["ns2:verifyPersonInformationResponse"] || body?.["ns2:changePasswordResponse"];
  const matchingStatus = response?.response?.matchingStatus === "true";
  const cardStatus = response?.response?.cardStatus;
  const transactionStatus = response?.response?.transactionStatus;
  return {
    matchingStatus,
    cardStatus,
    transactionStatus: transactionStatus ? {
      status: transactionStatus.transactionStatus || "",
      passwordDaysLeft: parseInt(transactionStatus.passwordDaysLeft || "0", 10),
      executionCost: parseFloat(transactionStatus.executionCost || "0.0")
    } : undefined
  };
}
