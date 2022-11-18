const express = require('express');
const router = express.Router();


router.get('/large-factory-with-robots', function (req, res) {
    res.render('demos/large-factory-with-robots', { title: 'Large Factory with Robots | HOOPS Web Viewer' });
});


module.exports = router;
