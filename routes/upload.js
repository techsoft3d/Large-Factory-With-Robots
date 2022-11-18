const express = require('express');
const router = express.Router();
const request = require('request');
const fs = require('fs');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');

router.use('/upload_file', bodyParser.urlencoded({ extended: true }));
router.use('/upload_file', bodyParser.json());

// Set storage for /upload_file endpoint
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'data'); // files stored temporarily in the /data folder
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const fileUploader = multer({ storage: storage });

router.use((req, res, next) => {
    if (req.body.cognito_auth_token) {
        req.auth = { header: 'X-Cognito-Access-Token', token: req.body.cognito_auth_token };
    } else {
        req.auth = { header: 'Authorization', token: process.env.COMMUNICATOR_SERVICE_UPLOADER_TOKEN };
    }
    next();
});

// endpoint to upload cadfile to communicator service
router.post('/create_model', (req, res) => {
    const filename = req.body.filename;
    const headers = {
        'Content-Type': 'application/json'
    };
    headers[req.auth.header] = req.auth.token;

    request.post({
        url: `${process.env.COMMUNICATOR_SERVICE_API}/models/`,
        body: JSON.stringify({
            "name": filename,
            "description": ""
        }),
        headers: headers
    }, (error, response, body) => {
        if (response.statusCode === 201) {
            // model created
            const uid = JSON.parse(body).unique_id;
            res.send(JSON.stringify({ uid: uid }));
        } else {
            console.log("ERROR: ", response.body);
        }
    });
});

const getModelData = (model_id, auth) => {
    const headers = {};
    headers[auth.header] = auth.token;
    return new Promise((resolve, reject) => {
        request.get({
            url: `${process.env.COMMUNICATOR_SERVICE_API}/models/${model_id}/`,
            headers: headers
        }, (error, response, body) => {
            if (response.statusCode === 200) {
                resolve(body);
            }
        });
    });
}

router.post('/upload_files', fileUploader.array('file', 999), async (req, res) => {
    const files = req.files;
    const uid = req.body.unique_id;
    const rootfile = req.body.rootfile;
    const models_map = req.app.get('models_map').set(rootfile, uid);
    req.app.set('models_map', models_map);

    // for some reason, req.auth doesn't come through on this route, set it manually
    if (req.body.cognito_auth_token) {
		req.auth = {header: "X-Cognito-Access-Token", token: req.body.cognito_auth_token};
	}

    await uploadFiles(files, uid, rootfile, req.auth);
    let conversionData;
    try {
        conversionData = await convertModel(uid, req.auth);
    } catch (err) {
        console.log(err);
        res.status(400).send();
    }
    const conversionId = JSON.parse(conversionData).unique_id;
    try {
        await waitForConversion(conversionId, req.auth);
    } catch (err) {
        res.status(500).send("Model failed to convert");
    }
    const modelData = await getModelData(uid, req.auth);
    res.status(200).send(modelData);
});

const uploadFiles = (files, uid, rootfile, auth) => {
    const headers = {
        'Access-Control-Allow-Origin': '*'
    }
    headers[auth.header] = auth.token
    return new Promise((resolve, reject) => {
        const uploads = [];
        files.forEach((file) => {
            const p = new Promise((resolve, reject) => {
                let is_root = (rootfile === file.originalname);
                const formData = {
                    "file": fs.createReadStream(file.path),
                }
                if (is_root) formData.is_root_file = "true";

                request.post({
                    url: `${process.env.COMMUNICATOR_SERVICE_API}/models/${uid}/cad-files/`,
                    formData: formData,
                    headers: headers
                }, (error, response, body) => {
                    if (response.statusCode === 201) {
                        resolve();
                    } else {
                        console.log("Cannot add model, code : ", response.statusCode);
                        console.log(body);
                    }
                });
            });
            uploads.push(p);
        });
        Promise.all(uploads).then(() => {
            resolve();
        });
    });
}

const convertModel = (unique_id, auth) => {
    const headers = {
        'Content-Type': 'application/json'
    }
    headers[auth.header] = auth.token;
    return new Promise((resolve, reject) => {
        request.post({
            url: `${process.env.COMMUNICATOR_SERVICE_API}/conversions/`,
            body: JSON.stringify({
                object_type: "MODEL",
                object_id: unique_id
            }),
            headers: headers
        }, (error, response, body) => {
            if (response.statusCode === 201) {
                resolve(body);
            } else {
                reject(`Can't convert this model: ${response.statusCode} ${response.body}`)
            }
        });
    });
}

const waitForConversion = (conversion_id, auth) => {
    const headers = {}
    headers[auth.header] = auth.token;
    return new Promise((resolve, reject) => {
        request.get({
            url: `${process.env.COMMUNICATOR_SERVICE_API}/conversions/${conversion_id}`,
            headers: headers
        }, (error, response, body) => {
            if (response.statusCode === 200) {
                const status = JSON.parse(body)[0].status;
                if (status === "SUCCESSFUL") {
                    resolve(body);
                }  else if (status === "FAILED") {
                    reject(body);
                } else {
                    setTimeout(() => {
                        resolve(waitForConversion(conversion_id, auth));
                    }, 500);
                }
            } else {
                console.log(error);
            }
        });
    });
}

router.post('/delete_model', (req, res) => {
    const modelId = req.body.modelId;
    const headers = {
        'Access-Control-Allow-Origin': '*'
    }
    headers[req.auth.header] = req.auth.token;
    request.delete({
        url: `${process.env.COMMUNICATOR_SERVICE_API}/models/${modelId}/`,
        headers: headers
    }, (error, response, body) => {
        if (response.statusCode != 200) {
            console.log(response.body)
        } else {
            // when we exit, make sure all temp files are nuked
            const deletePath = path.join(__dirname, "../", "/data");
            fs.readdirSync(deletePath).forEach(file => {
                if (file != '.gitkeep') {
                    fs.unlinkSync(deletePath + "/" + file);
                }
            });
            console.log("Model deleted");
        }
    });
});

module.exports = router;
