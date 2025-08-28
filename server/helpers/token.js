const jwt = require("jsonwebtoken");
const axios = require("axios");
const crypto = require("crypto");

// Replace with your values
const baseUrl = process.env.NIRA_BASE_URL;
const clientKey = process.env.CONSUMER_KEY;
const clientSecret = process.env.CONSUMER_SECRET;
// other requests follow baseurl/t/nira.go.ug/nira-api/1.0.0/{resource_name}


// Sample credentials
const username = process.env.USER_NAME;
const password = process.env.PASSWORD || "b32!ccS";

// Generate Nonce (random string)
const nonce = crypto.randomBytes(16).toString("base64");
// Generate Created timestamp
const created = new Date().toISOString(); // e.g. 2025-08-26T16:23:45.678Z
// SHA1(password)
// const sha1Password = crypto.createHash("sha1").update(password);
const sha1Password = crypto.createHash("sha1").update(password).digest("base64");
// crypto.createHash("sha1").update(text).digest("hex");

// digest = SHA1(Nonce + Created + SHA1(password))
const digestInput = Buffer.concat([
    Buffer.from(nonce, "base64"),
    Buffer.from(created, "base64"),
    Buffer.from(sha1Password, "base64"),
    // Buffer.from(sha1Password, "base64"),
]);
const passwordDigest = crypto.createHash("sha1").update(digestInput).digest("base64");
// Encode username:Password_Digest
const niraAuthForward = Buffer.from(`${username}:${passwordDigest}`).toString("base64");
// Encode client credentials to Base64
const credentials = Buffer.from(`${clientKey}:${clientSecret}`).toString("base64");


async function generateToken() {
    // try {
    const response = await axios.post(
        `${baseUrl}/token`,
        new URLSearchParams({grant_type: "client_credentials"}), // form data
        {
            headers: {
                "Authorization": `Basic ${credentials}`,
                "Content-Type": "application/x-www-form-urlencoded"
            }
        }
    );
    console.log("Access Token Response:", response.data);
    console.log('Generated token: ', response.data);
    return response.data;
    // } catch (error) {
    //     console.error("Error fetching token:", error.response?.data || error.message);
    // }
}

async function getToken() {
    // try {
    const response = await axios.post(
        "https://api-uat.integration.go.ug/token",
        new URLSearchParams({
            grant_type: "client_credentials",
        }),
        {
            headers: {
                "Authorization": "Basic dzU2VXRTR1NVbHRkT3ZMUUdRVEY4Rlk2ZTd3YTpWeDkzd2lmNU5mdml5TjIwQWl0MUpZNVNITWdh",
                "Content-Type": "application/x-www-form-urlencoded",
            },
            httpsAgent: new (require("https").Agent)({rejectUnauthorized: false}) // same as curl -k (ignore SSL verification)
        }
    );

    console.log('token: ', response.data);
    return response.data;
    // } catch (error) {
    //     console.error(error.response?.data || error.message);
    // }
}

//Make request with headers
async function getPerson() {

    // try {
    const response = await axios.get(`${baseUrl}/getPerson?nationalId=CM930121003EGE`, {
        headers: {
            "Authorization": generateToken,
            "nira-auth-forward": niraAuthForward,
            "nira-nonce": nonce,
            "nira-created": created
        }
    });

    console.log("Person:", response.data);

    return response.data;
    // } catch (error) {
    //     console.error("Request failed:", error.response?.data || error.message);
    // }
}

// Export the functions for import in the routes that will need them
module.exports = {
    generateToken,
    getPerson,
    getToken
};
