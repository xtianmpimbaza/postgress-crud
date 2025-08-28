//#region Module import
const {getToken, getPerson, generateToken} = require("../../helpers/token");

const userRoute = require('express').Router();
const User = require('../../models/user')
const router = require("express").Router();
//#endregion


//#region Get Methods
router.get('/verifyPerson', async (req, res) => {
    const soapEnvelope = `
  <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
    xmlns:fac="http://facade.server.pilatus.thirdparty.tidis.muehlbauer.de/"
    xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">
    <soapenv:Header>
      <wsse:UsernameToken>
        <wsse:Username>ThirdParty@ROOT</wsse:Username>
        <wsse:Password Type="PasswordDigest">ZMvfJzFWcWkrWGd10gz7wYVY/js=</wsse:Password>
        <wsse:Nonce>aYdz/Rbe/laaPKl1qPdaPQ==</wsse:Nonce>
        <wsse:Created>2018-04-06T19:32:31.543+03:00</wsse:Created>
      </wsse:UsernameToken>
    </soapenv:Header>
    <soapenv:Body>
      <fac:verifyPersonInformation>
        <request>
          <dateOfBirth>01/01/1993</dateOfBirth>
          <documentId>000092564</documentId>
          <givenNames>Johnson</givenNames>
          <nationalId>CM930121003EGE</nationalId>
          <otherNames></otherNames>
          <surname>Tipiyai</surname>
        </request>
      </fac:verifyPersonInformation>
    </soapenv:Body>
  </soapenv:Envelope>
  `;

    try {
        const response = await axios.post("YOUR_SOAP_ENDPOINT_URL", soapEnvelope, {
            headers: {
                "Content-Type": "text/xml;charset=UTF-8",
                "SOAPAction": "verifyPersonInformation", // sometimes required
            },
        });

        console.log(response.data);
        res.send(response.data)
    } catch (error) {
        console.error(error.response?.data || error.message);
    }
});

//#region Get Methods
router.get('/generateToken', async (req, res) => {
    return generateToken;
});

//#region Get Methods
router.get('/getToken', async (req, res) => {
    return getToken;
});

//#region Get Methods
router.get('/getPerson', async (req, res) => {
    return getPerson;
});

//#region Get Methods
router.get('/getAll', async (req, res) => {
    try {
        let data = await User.findAll();
        // console.log(data);
        return (data && data.length > 0 ? res.send({status: true, data}) : res.send({
            status: false,
            message: 'No data found'
        }))
    } catch (e) {
        console.log(e)
        res.send({status: false, message: 'Something went wrong.'})
    }
});


router.get('/getUserById/:_id', async (req, res) => {
    try {
        let {_id} = req.params;
        let data = await User.findOne({
            where: {_id},
        });
        return (data ? res.send({status: true, data}) : res.send({status: false, message: 'No data found'}))
    } catch (e) {
        console.log(e);
        res.send({status: false, message: 'Something went wrong.'})
    }
})
//#endregion


//#region Post Methods
router.post('/addEditUser', async (req, res) => {
    try {
        let {actionType, _id, UserName, Bio, DateOfBirth, Hobbies, Role, ProfilePic} = req.body;

        if (actionType === 'edit') {

            let data = await User.update({UserName, Bio, DateOfBirth, Hobbies, Role, ProfilePic}, {where: {_id}});
            res.send({status: true, message: 'User  updated successfully'})
        } else {
            let data = await User.create({UserName, Bio, DateOfBirth, Hobbies, Role, ProfilePic})
            res.send({status: true, message: 'User  inserted successfully'})
        }
    } catch (e) {
        console.log(e)
        res.send({status: false, message: 'Something went wrong.'})
    }
})


//#Add user
router.post('/addUser', async (req, res) => {
    try {
        let {actionType, _id, UserName, Bio, DateOfBirth, Hobbies, Role, ProfilePic} = req.body;

        let data = await User.create({UserName, Bio, DateOfBirth, Hobbies, Role, ProfilePic})
        res.send({status: true, message: 'User  inserted successfully', user: data})
    } catch (e) {
        console.log(e)
        res.send({status: false, message: 'Something went wrong.'})
    }
})

//#edit user
router.post('/editUser', async (req, res) => {
    try {
        let {actionType, _id, UserName, Bio, DateOfBirth, Hobbies, Role, ProfilePic} = req.body;
        let data = await User.update({UserName, Bio, DateOfBirth, Hobbies, Role, ProfilePic}, {where: {_id}});
        res.send({status: true, message: 'User  updated successfully'})
    } catch (e) {
        console.log(e)
        res.send({status: false, message: 'Something went wrong.'})
    }
})

//delete user
router.post('/deleteUser', async (req, res) => {
    try {
        let {_id} = req.body

        if (_id) {
            const data = await User.findOne({where: {_id}})
            if (data) {
                await data.destroy()
                res.send({status: true, message: 'User  deleted successfully'})
            } else {
                res.send({status: false, message: "User  doesn't exists."})
            }
        } else {
            res.send({status: false, message: "User  id is required."})
        }
    } catch (e) {
        console.log(e)
        res.send({status: false, message: 'Something went wrong.'})
    }
})
//#endregion

// module.exports = userRoute;
module.exports = router;
