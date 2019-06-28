var pg = require('pg');

var saveData = function(cyclists, year) {
  console.log("Start saving");
  var con = new pg.Client(require('../../db/db'));
  con.connect();
  var query = con.query("drop table if exists cyclists_" + year);
  query.on('end', function() {
    console.log("Dropped table 'cyclists_" + year + "'")
  });
  con.query("create table cyclists_" + year + "(id serial, firstname text, lastname text, club text, team text, klasse text, results text, href text, last_updated text)").on('end', function() {
    console.log("Created table 'cyclists_" + year + "'");
  });
  cyclists.map(function(cyclist) {
    var q = "insert into cyclists_" + year + "(firstname, lastname, club, team, klasse, results, href, last_updated) values('" + (cyclist.firstname || "").replace(/'/g, '\'\'') + "', '" + (cyclist.lastname || "").replace(/'/g, '\'\'') + "', '" + (cyclist.club || "").replace(/'/g, '\'\'') + "', '" + (cyclist.team || "").replace(/'/g, '\'\'') + "', '" + (cyclist.klasse || "").replace(/'/g, '\'\'') + "', '" + JSON.stringify(cyclist.results || {}).replace(/'/g, '\'\'') + "', '" + JSON.stringify(cyclist.href || {}).replace(/'/g, '\'\'') + "', '" + (new Date().toString() || "").replace(/'/g, '\'\'') + "')";
    //console.log(q);
    return con.query(q);
  }).pop().on('end', function() {
    console.log("Inserted " + cyclists.length + " cyclists in year " + year + ".");
    con.end();
    resolve();
  });
};

var start = function(cyclists, year) {
  var newPromise = new Promise(function(resolve, reject) {
    saveData(cyclists, year, resolve, reject);
  });
  return newPromise;
};

module.exports = {
  start: start
};
