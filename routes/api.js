var config = require('../config');
var express = require('express');
var pg = require('pg');
var router = express.Router();

router.get('/cyclists', function(req, res, next) {
  var year = req.query.year;
  var con = new pg.Client(require('../db/db'));
  con.connect();
  con.query("select * from cyclists_" + year, function(err, result) {
    if (err) {
      res.status(400).send({
        status: "error",
        error: err
      });
    } else {
      if (result && result.rows) {
        res.send({
          status: "success",
          results: result.rows
        });
      } else {
        res.status(400).send({
          status: "error",
          error: "no results"
        });
      }
    }
    con.end();
  });
});

module.exports = router;
