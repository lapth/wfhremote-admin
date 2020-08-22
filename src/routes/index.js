var express = require("express");
var axios = require("axios");
var router = express.Router();

const clientID = "<clientID>";
const clientSecret = "<clientSecret>";
const reposName = 'wfhremote';
const controler = 'controller';

/* GET home page. */
router.get("/", function (req, res) {
  res.render("index");
});

router.get("/home", (req, res) => {

    console.log('Retrieving access token!');

    const requestToken = req.query.code;

    axios({
        method: "post",
        url: `https://github.com/login/oauth/access_token?client_id=${clientID}&client_secret=${clientSecret}&code=${requestToken}`,
        headers: {
        accept: "application/json",
        },
    }).then((response) => {

        console.log('Retrieving user information!');

        // console.log(response.data);
        const accessToken = response.data.access_token;
        let sess = req.session;
        sess.accessToken = accessToken;

        axios({
        method: "get",
        url: "https://api.github.com/user",
        headers: {
            accept: "application/json",
            Authorization: "token " + accessToken,
        },
        }).then((userRes) => {
            // Store user information
            sess.userData = userRes.data;
            console.log(userRes.data);
            res.render("home", { name: sess.userData.name, message: 'Have a good day!' });
        });
    });
});

// Init the wfhremote repository as public repository
router.post("/initrepos", (req, res) => {

    console.log('Initializing repository!');

    let sess = req.session;
    const access_token = sess.accessToken;
    if (!access_token) res.send("Please login first");

    // Step 1: inititalize the repository
    axios({
        method: "post",
        url: "https://api.github.com/user/repos",
        // Set the content type header, so that we get the response in JSON
        headers: {
            accept: "application/json",
            Authorization: "token " + access_token,
        },
        data: {
            name: reposName,
            auto_init: true,
            private: false,
            gitignore_template: "nanoc",
        },
    }).then((response) => {

        console.log('Creating controller file!');

        // Create the controller file
        axios({
            method: "put",
            url: `https://api.github.com/repos/${sess.userData.login}/${reposName}/contents/${controler}`,
            // Set the content type header, so that we get the response in JSON
            headers: {
                accept: "application/json",
                Authorization: "token " + access_token,
            },
            data: {
                "message": "init controller file",
                "content": Buffer.from("0").toString('base64')
            },
        }).then((response) => {
            res.render("home", {
                name: sess.userData.name,
                message: `Initialized ${reposName} repository. Please replace the the account Id with your own: ${sess.userData.login}`,
            });
        }).catch(err => {
            console.log(err);
            res.render("home", {
                name: sess.userData.name,
                message: `Can not create file`,
            });
        });
    }).catch((err) => {
        console.log(err);
        res.render("home", {
            name: sess.userData.name,
            message: `Error during initializing ${reposName} repository`,
        });
    });
});

router.post("/delete", (req, res) => {

    console.log('Deleting repository!');

    let sess = req.session;
    const access_token = sess.accessToken;
    if (!access_token) res.send("Please login first");
  
    axios({
        method: "delete",
        url: `https://api.github.com/repos/${sess.userData.login}/${reposName}`,
        headers: {
            Authorization: "token " + access_token,
        },
    }).then((response) => {
        res.render("home", { 
            name: sess.userData.name, 
            message: `Deleted ${reposName} repository`
        });
    }).catch((err) => {
        console.log(err);
        res.render("home", {
            name: sess.userData.name,
            message: `Can not delete ${reposName} repository`,
        });
    });
});

router.post("/restart", (req, res) => {

    console.log('Reading controler file!');

    let sess = req.session;
    const access_token = sess.accessToken;
    if (!access_token) res.send("Please login first");
    axios({
        method: "get",
        url: `https://api.github.com/repos/${sess.userData.login}/${reposName}/contents/${controler}`,
        headers: {
            Authorization: "token " + access_token,
        },
    }).then(response => {

        console.log('Updating controler to 1!');

        const fileData = response.data;

        axios({
            method: "put",
            url: `https://api.github.com/repos/${sess.userData.login}/${reposName}/contents/${controler}`,
            // Set the content type header, so that we get the response in JSON
            headers: {
                accept: "application/json",
                Authorization: "token " + access_token,
            },
            data: {
                "message": "Triggering restart network",
                "content": Buffer.from("1").toString('base64'),
                "sha": fileData.sha,
            },
        }).then((updateRes) => {
            res.render("home", {
                name: sess.userData.name,
                message: `Network will restart after 5 minutes`,
            });
        }).catch(err => {
            console.log(err);
            res.render("home", {
                name: sess.userData.name,
                message: `Fail to update restart network flag`,
            });
        });

    }).catch(err => {
        console.log(err);
        res.render("home", {
            name: sess.userData.name,
            message: `Fail to update restart network flag`,
        });
    });
});

router.post("/restartpc", (req, res) => {

    console.log('Restarting Computer!');

    let sess = req.session;
    const access_token = sess.accessToken;
    if (!access_token) res.send("Please login first");

    axios({
        method: "get",
        url: `https://api.github.com/repos/${sess.userData.login}/${reposName}/contents/${controler}`,
        headers: {
            Authorization: "token " + access_token,
        },
    }).then(response => {

        console.log('Updating controler to 2!');

        const fileData = response.data;

        axios({
            method: "put",
            url: `https://api.github.com/repos/${sess.userData.login}/${reposName}/contents/${controler}`,
            // Set the content type header, so that we get the response in JSON
            headers: {
                accept: "application/json",
                Authorization: "token " + access_token,
            },
            data: {
                "message": "Cleaning flag",
                "content": Buffer.from("2").toString('base64'),
                "sha": fileData.sha,
            },
        }).then((updateRes) => {
            res.render("home", {
                name: sess.userData.name,
                message: `Computer will be restarted in 5 minutes`,
            });
        }).catch(err => {
            console.log(err);
            res.render("home", {
                name: sess.userData.name,
                message: `Fail to restart computer`,
            });
        });

    }).catch(err => {
        console.log(err);
        res.render("home", {
            name: sess.userData.name,
            message: `Fail to restart computer`,
        });
    });
});

router.post("/cleanflag", (req, res) => {

    console.log('Cleaning controler file!');

    let sess = req.session;
    const access_token = sess.accessToken;
    if (!access_token) res.send("Please login first");
    axios({
        method: "get",
        url: `https://api.github.com/repos/${sess.userData.login}/${reposName}/contents/${controler}`,
        headers: {
            Authorization: "token " + access_token,
        },
    }).then(response => {

        console.log('Updating controler to 0!');

        const fileData = response.data;

        axios({
            method: "put",
            url: `https://api.github.com/repos/${sess.userData.login}/${reposName}/contents/${controler}`,
            // Set the content type header, so that we get the response in JSON
            headers: {
                accept: "application/json",
                Authorization: "token " + access_token,
            },
            data: {
                "message": "Cleaning flag",
                "content": Buffer.from("0").toString('base64'),
                "sha": fileData.sha,
            },
        }).then((updateRes) => {
            res.render("home", {
                name: sess.userData.name,
                message: `Flag cleaned, no more action needed!`,
            });
        }).catch(err => {
            console.log(err);
            res.render("home", {
                name: sess.userData.name,
                message: `Fail to clean flag`,
            });
        });

    }).catch(err => {
        console.log(err);
        res.render("home", {
            name: sess.userData.name,
            message: `Fail to clean flag`,
        });
    });
});

module.exports = router;
