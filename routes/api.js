const express = require('express');
const router = express.Router();
const request = require('request');
const throttle = require('express-throttle');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const { exec, spawn } = require('child_process');
const { createProxyMiddleware } = require('http-proxy-middleware');

router.use("/spawn", (req, res, next) => {
    const host = req.hostname || req.headers.host;
    const isStaging = host.includes("staging");

    console.log(`Incoming URL ${host} is staging: ${isStaging}`);

    const target = isStaging 
        ? "https://hoops-staging:11183"
        : "https://hoops:11182";

    console.log(`Routing /api/spawn request to: ${target}`);

    return createProxyMiddleware({
        target,
        changeOrigin: true,
        secure: false,
        logLevel: "debug",
    })(req, res, next);
});

const throttle_options = {
    'rate': '5/s',
    'on_throttled': function (req, res, next, bucket) {
        res.send('error: 429 - Too many requests');
    }
};


router.use((req, res, next) => {
    if (req.body.cognito_auth_token) {
        req.auth = { header: 'X-Cognito-Access-Token', token: req.body.cognito_auth_token };
    } else {
        req.auth = { header: 'Authorization', token: process.env.COMMUNICATOR_SERVICE_AUTH_TOKEN };
    }
    next();
});

router.post('/request_session', throttle(throttle_options), async (req, res, next) => {
    // If we're running the local server, do nothing
    if (process.env.COMMUNICATOR_SERVICE_API.includes("localhost")) {
        res.send({
            offline: true,
            endpoint: process.env.COMMUNICATOR_SERVICE_API
        })
        return;
    }

    const type = req.body.type;
    let session;
    switch (type) {
        case "model":
            const model = req.body.model;
            const model_id = (req.body.model_id) ? req.body.model_id : req.app.get('models_map').get(model);
            if (!req.body.cognito_auth_token && req.body.uploaded) req.auth.token = process.env.COMMUNICATOR_SERVICE_UPLOADER_TOKEN;
            session = await request_model(model_id, req.auth);
            res.send(session);
            break;
        case "collection":
            const collection_models = get_model_ids(req.body.models, req.app.get('roots_map'));
            const initialFile = req.app.get('roots_map').get(req.body.initial);
            session = await request_collection(collection_models, initialFile);
            res.send(session);
            break;
        default:
            res.status(404).send(`Invalid session type ${type}`);
    }
});

const request_model = (model_id, auth) => {
    const headers = {
        'Content-Type': 'application/json'
    }
    headers[auth.header] = auth.token;
    return new Promise((resolve, reject) => {
        const params = {
            type: "model",
            resource_id: model_id
        }
        request.post({
            url: `${process.env.COMMUNICATOR_SERVICE_API}/sessions/`,
            body: JSON.stringify(params),
            headers: headers
        }, function (error, response, body) {
            if (response.statusCode !== 201) {
                console.log(`${response.statusCode} ${response.statusMessage} in model request`);
                console.log(body);
            } else {
                console.log(`REQUEST session: ${JSON.parse(body).unique_id}`);
                console.log(`Status Code: ${response && response.statusCode}`);

                if (error !== null) { console.log(`Error: ${error}`); }

                let data = {
                    endpoint: `${process.env.COMMUNICATOR_SERVICE_ENDPOINT}/sessions/${JSON.parse(body).unique_id}/`,
                }
                resolve(data);
            }
        });
    });
};

const request_collection = (models, initial) => {
    // create collection first
    return new Promise((resolve, reject) => {
        const p = new Promise((resolve, reject) => {
            request.post({
                url: `${process.env.COMMUNICATOR_SERVICE_API}/collections/`,
                body: JSON.stringify({
                    name: "stuff",
                    files: models
                }),
                headers: { 'Content-Type': 'application/json', 'Authorization': process.env.COMMUNICATOR_SERVICE_AUTH_TOKEN }
            }, (error, response, body) => {
                if (error === null && response.statusCode === 201) {
                    resolve(JSON.parse(body).unique_id);
                } else {
                    console.log(`${response.statusCode} ${response.statusMessage}`);
                    console.log(body);
                }
            });
        });

        // now create session
        p.then((id) => {
            request.post({
                url: `${process.env.COMMUNICATOR_SERVICE_API}/sessions/`,
                body: JSON.stringify({
                    type: "collection",
                    resource_id: id,
                    initialFile: initial
                }),
                headers: { 'Content-Type': 'application/json', 'Authorization': process.env.COMMUNICATOR_SERVICE_AUTH_TOKEN }
            }, (error, response, body) => {
                if (error) {
                    console.log(error);
                } else if (response.statusCode !== 201) {
                    console.log(response.statusMessage);
                } else {
                    const data = {
                        endpoint: `${process.env.COMMUNICATOR_SERVICE_ENDPOINT}/sessions/${JSON.parse(body).unique_id}/`,
                        collection_id: id
                    }
                    resolve(data);
                }
            });
        });
    });
}

router.get('/delete_collection', (req, res) => {
    const collection_id = req.query.collection;
    request.delete({
        url: `${process.env.COMMUNICATOR_SERVICE_API}/collections/${collection_id}/`,
        headers: { 'Authorization': process.env.COMMUNICATOR_SERVICE_AUTH_TOKEN }
    }, (error, response, body) => {
        if (error) { console.log(error); }
        if (response.statusCode !== 200) { console.log(`Could not remove collection: ${response.statusCode}, ${response.statusMessage}`); }
        if (response.statusCode === 200) { res.status(200).send(); }
    })
});

const get_model_ids = (models, map) => {
    return models.map((model) => map.get(model));
}

router.use('/export_json', bodyParser.urlencoded({ extended: true }));
router.use('/export_json', bodyParser.json());

router.use('/run_executable', bodyParser.urlencoded({ extended: true }));
router.use('/run_executable', bodyParser.json());

/*
    Data must be sent in ajax call as follows:
    data: {
        data: (data to send),
        filePath: (frontend filepath)
    }
    dataType: 'json'

    See robotics.js in factory-status demo for pattern in practice
*/
router.post('/export_json', (req, res) => {
    const filepath = String(req.body.filePath);
    const data = req.body.data;

    // _dirname for root directory, go up from route folder, start from public, write to json file (overwrite if it existd)
    const writePath = path.join(__dirname, '../', '/public', filepath);
    fs.writeFileSync(writePath, data);
    res.status(200).send(data);
});

router.post('/filedate', (req, res) => {
    const filepath = req.body.filePath;
    const readPath = path.join(__dirname, '../', '/public', filepath);
    fs.stat(readPath, (err, stats) => {
        if (err) {
            return console.log("Error in reading file: " + err);
        }
        res.send(stats.mtime);
    })
})

router.post('/delete_file', (req, res) => {
    const filepath = String(req.body.filePath);
    const deletePath = path.join(__dirname, '../', '/public', filepath);
    if (fs.existsSync(deletePath)) {
        fs.unlink(deletePath, (err) => {
            if (err) {
                res.status(400).send(err);
                return console.log("Could not delete: ", err);
            }
            console.log("File deleted");
            res.status(200).send();
        });
    } else {
        res.status(404).send();
    }
});

const getModels = (uuid, auth) => {
    const headers = {
        'Content-Type': 'application/json'
    }
    headers[auth.header] = auth.token;
    return new Promise((resolve, reject) => {

        request.get({
            url: `${process.env.COMMUNICATOR_SERVICE_API}/models/`,
            headers: headers
        }, function (error, response, body) {
            if (response.statusCode !== 201) {
                console.log(`${response.statusCode} ${response.statusMessage} in models request`);

                resolve(JSON.parse(body));
            } else {
                //console.log(`REQUEST session: ${JSON.parse(body).unique_id}`);
                console.log(`Status Code: ${response && response.statusCode}`);
                //console.log(body);

                if (error !== null) { console.log(`Error: ${error}`); }

                let data = {
                    session: JSON.parse(body).unique_id,
                    endpoint: process.env.COMMUNICATOR_SERVICE_ENDPOINT
                }
                resolve(data);
            }
        });
    });
}

router.post('/models', throttle(throttle_options), async (req, res) => {
    const uuid = req.body.uuid;
    if (req.body.uploaded) {
        req.auth.token = process.env.COMMUNICATOR_SERVICE_UPLOADER_TOKEN;
    }

    modelData = await getModels(uuid, req.auth);

    res.status(200).send(modelData);
});

module.exports = router;
