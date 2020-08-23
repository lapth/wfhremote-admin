var express = require("express");
var axios = require("axios");
var router = express.Router();

const clientID = APPCONFIG.clientID;
const clientSecret = APPCONFIG.clientSecret;
const reposName = APPCONFIG.reposName;
const controller = APPCONFIG.controller;

/* GET home page. */
router.get("/", function (req, res) {
  res.render("index");
});

router.get("/home", (req, res) => {

    log(req, 'Retrieving access token!');

    const cbCode = req.query.code;
    if (!cbCode) return res.render('index');

    axios({
        method: "post",
        url: `https://github.com/login/oauth/access_token?client_id=${clientID}&client_secret=${clientSecret}&code=${cbCode}`,
        headers: {
            accept: "application/json",
        },
    }).then((response) => {

        log(req, 'Retrieving user information!');

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
            log(req, "Authenticated!");
            return gotoHome(req, res, {
                message: `Have a good day!`,
            });
        });
    });
});

// Init the wfhremote repository as public repository
router.post("/initrepos", (req, res) => {

    log(req, 'Initializing repository!');

    let sess = req.session;
    const access_token = sess.accessToken;
    
    if (!validateRest(req, res)) return;

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

        log(req, 'Created repository, creating controller file!');

        // Create the controller file
        axios({
            method: "put",
            url: `https://api.github.com/repos/${sess.userData.login}/${reposName}/contents/${controller}`,
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
            log(req, 'Created controller file!');
            return gotoHome(req, res, {
                message: `Initialized ${reposName} repository.`,
                message1: `Please replace the the <git_account_Id> in <C:\\SyncVPNStatus.ps1> with your own: ${sess.userData.login}`,
            });
        }).catch(err => {
            log(req, err);
            return gotoHome(req, res, {
                message: `Error during initializing ${reposName} repository!`,
            });
        });
    }).catch((err) => {
        log(req, err);
        return gotoHome(req, res, {
            message: `Error during initializing ${reposName} repository!`,
        });
    });
});

router.post("/delete", (req, res) => {

    log(req, 'Deleting repository!');

    let sess = req.session;
    const access_token = sess.accessToken;
    
    if (!validateRest(req, res)) return;

    axios({
        method: "delete",
        url: `https://api.github.com/repos/${sess.userData.login}/${reposName}`,
        headers: {
            Authorization: "token " + access_token,
        },
    }).then((response) => {
        log(req, 'Deleted repository!');
        return gotoHome(req, res, {
            message: `Deleted ${reposName} repository!`,
        });
    }).catch((err) => {
        log(req, err);
        return gotoHome(req, res, {
            message: `Can not delete ${reposName} repository!`,
        });
    });
});

router.post("/restart", (req, res) => {

    log(req, 'Reading controler file!');

    let sess = req.session;
    const access_token = sess.accessToken;
    
    if (!validateRest(req, res)) return;

    axios({
        method: "get",
        url: `https://api.github.com/repos/${sess.userData.login}/${reposName}/contents/${controller}`,
        headers: {
            Authorization: "token " + access_token,
        },
    }).then(response => {

        log(req, 'Updating controler to 1!');

        const fileData = response.data;

        axios({
            method: "put",
            url: `https://api.github.com/repos/${sess.userData.login}/${reposName}/contents/${controller}`,
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
            log(req, 'Updated controler to 1!');
            return gotoHome(req, res, {
                message: `Network will be restarted after 5 minutes!`,
            });
        }).catch(err => {
            log(req, err);
            return gotoHome(req, res, {
                message: `Fail to restart network!`,
            });
        });

    }).catch(err => {
        log(req, err);
        return gotoHome(req, res, {
            message: `Fail to restart network!`,
        });
    });
});

router.post("/restartpc", (req, res) => {

    log(req, 'Restarting Computer!');

    let sess = req.session;
    const access_token = sess.accessToken;
    
    if (!validateRest(req, res)) return;

    axios({
        method: "get",
        url: `https://api.github.com/repos/${sess.userData.login}/${reposName}/contents/${controller}`,
        headers: {
            Authorization: "token " + access_token,
        },
    }).then(response => {

        log(req, 'Updating controler to 2!');

        const fileData = response.data;

        axios({
            method: "put",
            url: `https://api.github.com/repos/${sess.userData.login}/${reposName}/contents/${controller}`,
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
            log(req, 'Updated controler to 2!');
            return gotoHome(req, res, {
                message: `Computer will be restarted in 5 minutes!`,
            });
        }).catch(err => {
            log(req, err);
            return gotoHome(req, res, {
                message: `Fail to restart computer!`,
            });
        });

    }).catch(err => {
        log(req, err);
        return gotoHome(req, res, {
            message: `Fail to restart computer!`,
        });
    });
});

router.post("/cleanflag", (req, res) => {

    log(req, 'Cleaning controler file!');

    let sess = req.session;
    const access_token = sess.accessToken;
    if (!validateRest(req, res)) return;

    axios({
        method: "get",
        url: `https://api.github.com/repos/${sess.userData.login}/${reposName}/contents/${controller}`,
        headers: {
            Authorization: "token " + access_token,
        },
    }).then(response => {

        log(req, 'Updating controler to 0!');

        const fileData = response.data;

        axios({
            method: "put",
            url: `https://api.github.com/repos/${sess.userData.login}/${reposName}/contents/${controller}`,
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
            log(req, 'Updated controler to 0!');
            return gotoHome(req, res, {
                message: `Flag cleaned, no more action needed!`,
            });
        }).catch(err => {
            log(req, err);
            return gotoHome(req, res, {
                message: `Fail to clean flag!`,
            });
        });

    }).catch(err => {
        log(req, err);
        return gotoHome(req, res, {
            message: `Fail to clean flag!`,
        });
    });
});

function gotoHome(req, res, opts) {
    let sess = req.session;
    
    res.render("home", {
        name: sess.userData.name,
        login: sess.userData.login,
        message: opts.message,
        message1: opts.message1 || '',
    });
}

function validateRest(req, res) {
    let sess = req.session;
    const access_token = sess.accessToken;
    if (!access_token) {
        res.render("index");
        return false;
    }

    return true;
}

function log(req, ...msgs) {
    let sess = req.session;
    const loginId = sess.userData ? sess.userData.login : 'Anonymous';
    console.log(loginId, ':', ...msgs);
}

module.exports = router;
