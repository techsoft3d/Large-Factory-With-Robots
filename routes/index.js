const express = require('express');
const router = express.Router();

router.get('/', function(req, res, next) {
    res.render('index', { title: 'Communicator Demos | Tech Soft 3D' });
});

router.get('/health', (req, res, next) => {
	return res.status(200).send();
});

router.get('/demos.html', function(req, res, next) {
    res.render('index', { title: 'Communicator Demos | Tech Soft 3D' });
});

module.exports = router;
