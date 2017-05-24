var express = require('express');
var config = require('../config');
var router = express.Router();

router.get('/', function(req, res, next) {
  res.render('index', {
    page: "/",
    year: new Date().getFullYear() + ""
  });
});

module.exports = router;
