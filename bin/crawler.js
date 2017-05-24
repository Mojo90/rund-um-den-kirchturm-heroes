#! /app/.heroku/node/bin/node

var Crawler = require("simplecrawler");
var pg = require('pg');
var config = require('../config');

var cheerio = require('cheerio');
var pool = require('../db/db');
var cyclisters = [];
var crawlingCountCyclists = 0;
var alreadyCrawling = false;

var fromYear = parseInt(config.crawlFromYear);
var toYear = parseInt(config.crawlToYear);
var maxDurchlaeufe = 0;
var bisherigeDurchlaeufe = 0;

var startCrawling = function(year) {
  var crawler = Crawler("https://www.rad-net.de/modules.php?name=Rangliste&saison=" + year + "&rlid=6&pg=1")
    .on("fetchcomplete", function(queueItem, responseBuffer, response) {

      var $ = cheerio.load(responseBuffer);

      var trs = $('tr').html(); //.split("\n");
      var cyclists = $(trs).find('td[align="left"] a').parent().parent();
      $(cyclists).each(function() {
        var cyclist = {};
        $(this).find('td').each(function(i, el) {
          if (i == 3) {
            cyclist.firstname = $(this).text();
          }
          if (i == 2) {
            cyclist.lastname = $(this).text();
            cyclist.href = "http://www.rad-net.de/" + $(this).find('a').attr("href");
          }
          if (i == 4) {
            cyclist.club = $(this).text();
          }
          if (i == 5) {
            cyclist.team = $(this).text();
          }
        });
        if (cyclist.firstname || ''.length > 0 && cyclist.lastname || ''.length > 0) cyclisters.push(cyclist);
      });
    })
    .on("complete", function() {
      console.log("Start crawling " + cyclisters.length + " cyclists for " + year);
      for (var i = 0; i < cyclisters.length; i++) {
        crawlCyclist(i, cyclisters[i].href, year);
      }
    })
    .on("fetchclienterror", function(queueItem, error) {
      console.error("Error: " + error);
    })
    .on("fetchtimeout", function(queueItem, crawlerTimeoutValue) {
      console.error("Timedout after " + crawlerTimeoutValue);
    })
    .on("queueerror", function(error, URLData) {
      console.error("Could not add to queue: " + error);
    });

  crawler.decodeResponses = true;
  crawler.addFetchCondition(function(queueItem, referrerQueueItem, callback) {
    callback(null, queueItem.path.match(/^(?=.*name=Rangliste)(?!.*menuid=)(?!.*print=).*/i));
  });
  setTimeout(function() {
    if (alreadyCrawling) {
      startCrawling(year);
    } else {
      alreadyCrawling = true;
      crawler.start();
      console.log("Start crawling year " + year);
    }
  }, 50);
};

var crawlCyclist = function(count, url, year) {
  url = url + "&saisonpl=" + year + "&mode=pl";
  var cyclistcrawler = Crawler(url)
    .on("fetchcomplete", function(queueItem, responseBuffer, response) {
      //console.log(count + ": It was a resource of type %s", response.headers['content-type'] + ". Url: " + url);

      var $ = cheerio.load(responseBuffer);

      var rows = $("tr[bgcolor='#000066']").parent();
      var breakForKlasse = false;
      $(rows).each(function() {
        $(this).find('tr').each(function(i, el) {
          $(this).find('td').each(function(i, el) {
            if (breakForKlasse && (cyclisters[count].klasse || "").length == 0) {
              var klasse = $(this).text();
              cyclisters[count].klasse = klasse;
            }
            if ($(this).text().indexOf("Klasse") > -1) {
              breakForKlasse = true;
            }
          });
        });
      });

      if (!cyclisters[count].klasse) {
        $(rows).each(function() {
          $(this).find('tr').each(function(i, el) {
            $(this).find('td').each(function(i, el) {
              if (breakForKlasse && (cyclisters[count].klasse || "").length == 0) {
                var klasse = getKlasse($(this).text(), year);
                cyclisters[count].klasse = klasse;
              }
              if ($(this).text().indexOf("Teams") > -1) {
                breakForKlasse = true;
              }
            });
          });
        });
      }

      //console.log("Klasse: " + cyclisters[count].klasse);
      cyclisters[count].results = [];
      var rows = $("tr[bgcolor='#E9E9E9']").parent();
      $(rows).each(function() {
        $(this).find('tr').each(function(i, el) {
          var event = {};
          $(this).find('td').each(function(i, el) {
            if (i == 0) {
              event.date = $(this).text();
            }
            if (i == 1) {
              event.city = $(this).text();
            }
            if (i == 2) {
              event.name = $(this).text();
            }
            if (i == 3) {
              event.place = $(this).text();
            }
            if (i == 4) {
              event.kategorie = $(this).text();
            }
            if (i == 5) {
              event.type = $(this).text();
            }
            if (i == 6) {
              event.points = $(this).text();
            }
          });
          if (event.date.indexOf("Datum") == -1) cyclisters[count].results.push(event);
        });
      });

      crawlingCountCyclists++;

      if (crawlingCountCyclists == cyclisters.length) {
        console.log("Successfully crawled " + cyclisters.length + " cyclists in year " + year + ".");
        saveData(cyclisters, year);
        cyclisters = [];
        crawlingCountCyclists = 0;
        alreadyCrawling = false;
      }
    })
    .on("fetchclienterror", function(queueItem, error) {
      console.error("Error: " + error);
    })
    .on("fetchtimeout", function(queueItem, crawlerTimeoutValue) {
      console.error("Timedout after " + crawlerTimeoutValue);
    })
    .on("queueerror", function(error, URLData) {
      console.error("Could not add to queue: " + error);
    });

  cyclistcrawler.decodeResponses = true;
  cyclistcrawler.maxDepth = 1;
  setTimeout(function() {
    cyclistcrawler.start();
    if (count % 200 == 0) console.log(count + " cyclists already crawled");
  }, count * 150);
};

var getKlasse = function(text, year) {
  var klasse = "";
  if (text.includes(year)) {
    klasse = text.split(year);
    klasse = klasse[1].split(")");
    klasse = klasse[0].split("(")[1];
  }
  return klasse;
};

var saveData = function(cyclists, year) {
  console.log("Start saving");
  var con = new pg.Client(require('../db/db'));
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
    bisherigeDurchlaeufe++;
    if (maxDurchlaeufe == bisherigeDurchlaeufe) {
      console.log("Crawled everything what needed.");
      finishProcess();
    }
  });
};

var finishProcess = function() {
  process.exit();
}

var crawler = function() {
  for (var i = fromYear; i <= toYear; i++) {
    maxDurchlaeufe++;
    startCrawling(i);
  }
}

crawler();
