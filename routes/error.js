const express = require('express');
const router = express.Router();

router.get('/too-many-requests', function(req, res, next) {
  res.render('error/too-many-requests', { title: '429 - Too many requests | Tech Soft 3D' });
});

module.exports = router;
