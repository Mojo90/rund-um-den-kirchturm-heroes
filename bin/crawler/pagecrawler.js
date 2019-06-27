var Crawler = require("simplecrawler");
var pg = require('pg');

var cheerio = require('cheerio');
var pool = require('../../db/db');
var cyclisters = [];
var crawlingCountCyclists = 0;
var alreadyCrawling = false;


var firstCrawl = false;
var linkResultsA = [];

var startCrawling = function(url, year, resolve, reject) {
  var crawler = Crawler(url)
    .on("fetchcomplete", function(queueItem, responseBody, response) {
      $ = cheerio.load(responseBody);
      var cyclists = $('td[align="left"] a font.detail').parent().parent().parent();

      /*var trs = $('tr').html(); //.split("\n");
      var cyclists = $(responseBuffer.toString()).find('td[align="left"] font[class="fname"]').parent().parent();
      console.log("Cyclists: ");
      console.log(cyclists);
      */
      $(cyclists).each(function() {
        var cyclist = {};
        var th = $(this);
        th.find('a').each(function(i, el) {
          if (i == 0) {
            cyclist.lastname = $(this).text();
            cyclist.href = "http://www.rad-net.de/" + th.find('a[href]').attr("href");
          }
        });

        th.find('font.detail').each(function(i, el) {
          if (i == 2) {
            cyclist.firstname = $(this).text();
          }
          if (i == 3) {
            cyclist.club = $(this).text();
          }
          if (i == 4) {
            cyclist.team = $(this).text();
          }
        });

        if (cyclist.firstname || ''.length > 0 && cyclist.lastname || ''.length > 0) cyclisters.push(cyclist);
      });
      //console.log("Page ended with Cyclisters length: " + cyclisters.length + "and url: " + queueItem.url);
    })
    .on("complete", function() {
      //console.log("Start crawling " + cyclisters.length + " cyclists for " + year);
      /*for (var i = 0; i < cyclisters.length; i++) {
        //console.log("Crawling " + cyclisters[i].href);
        crawlResultPage(i, cyclisters[i].href, year);
      }*/
      resolve(cyclisters);
    })
    .on("fetchclienterror", function(queueItem, error) {
      console.error("Error: " + error);
      reject();
    })
    .on("fetchtimeout", function(queueItem, crawlerTimeoutValue) {
      console.error("Timedout after " + crawlerTimeoutValue);
      reject();
    })
    .on("queueerror", function(error, URLData) {
      console.error("Could not add to queue: " + error);
      reject();
    })
    .on("fetchconditionerror", function(queueItem, error) {
      console.error("Error: " + error);
      reject();
    })
    .on("cookieerror", function(queueItem, error, cookie) {
      console.error("Error: " + error);
      reject();
    })
    .on("downloadconditionerror", function(queueItem, error) {
      console.error("Error: " + error);
      reject();
    })
    .on("fetcherror", function(queueItem, response) {
      console.error("Error: " + response);
      reject();
    })
    .on("gziperror", function(queueItem, responseBody, response) {
      console.error("Error: " + response);
      reject();
    })
    .on("fetchdataerror", function(queueItem, response) {
      console.error("Error: " + response);
      reject();
    })
    .on("robotstxterror", function(error) {
      console.error("Error: " + error);
      reject();
    })
    .on("fetch404", function(queueItem, responseBuffer) {
      console.error("fetch404: ", queueItem.url);
      reject();
    });



  crawler.decodeResponses = true;
  //crawler.maxDepth = 1;
  crawler.addFetchCondition(function(queueItem) {
    //console.dir(queueItem);
    //console.dir(queueItem.referrer.match(/^https:\/\/www\.rad-net\.de\/modules\.php\?name=Rangliste&saison=\d{4}&rlid=6&pg=1$/i));
    if (!firstCrawl) {
      firstCrawl = true;
      return true;
    }
    if (!queueItem.path.match(/name=Rangliste(?:(?!ranglisten).)*disziplinen*(?:(?!rangliste).)*ranglisten*(?:(?!rangliste).)*uebersicht.htm/i)) return false;
    //console.log("Condition: " + queueItem.path);
    //console.log("Result: " + queueItem.path.match(/name=Rangliste(?:(?!ranglisten).)*disziplinen*(?:(?!rangliste).)*ranglisten*(?:(?!rangliste).)*uebersicht.htm/i));
    return true;
  });
  /*(function(queueItem, referrerQueueItem, callback) {
      callback(null, queueItem.path.match());
    });*/

  crawler.start();
};

var crawlResultPage = function(count, url, year)  {
  console.log(url);
  var resultpagecralwer = Crawler(url)
    .on("fetchcomplete", function(queueItem, responseBuffer, response) {
      //console.log(count + ": It was a resource of type %s", response.headers['content-type'] + ". Url: " + url);

      var $ = cheerio.load(responseBuffer.toString());
      var rows = $("tr[bgcolor='#000066']").parent();
      var breakForPlatzierung = false;
      $(rows).each(function() {
        $(this).find('tr').each(function(i, el) {
          $(this).find('td').each(function(i, el) {
            if (breakForPlatzierung) {
              $(this).find('a').each(function(i, el) {
                if ($(this).attr('href').indexOf("saisonpl%3D" + year) > -1) {
                  linkResultsA.push({
                    "count": count,
                    "href": $(this).attr('href'),
                    "year": year
                  });
                  return false;
                }
              });
            }
            if ($(this).text().indexOf("Platzierungen in ") > -1) {
              breakForPlatzierung = true;
            }
          });
        });
      });

      crawlingCountCyclists++;

      if (crawlingCountCyclists == cyclisters.length) {
        console.log("Successfully crawled results page from" + cyclisters.length + " cyclists in year " + year + ".");
        for (var i = 0; i < linkResultsA.length; i++) {
          crawlCyclist(linkResultsA[i].count, linkResultsA[i].href, linkResultsA[i].year)
        }
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
    })
    .on("fetchconditionerror", function(queueItem, error) {
      console.error("Error: " + error);
    })
    .on("cookieerror", function(queueItem, error, cookie) {
      console.error("Error: " + error);
    })
    .on("downloadconditionerror", function(queueItem, error) {
      console.error("Error: " + error);
    })
    .on("fetcherror", function(queueItem, response) {
      console.error("Error: " + response);
    })
    .on("gziperror", function(queueItem, responseBody, response) {
      console.error("Error: " + response);
    })
    .on("fetchdataerror", function(queueItem, response) {
      console.error("Error: " + response);
    })
    .on("robotstxterror", function(error) {
      console.error("Error: " + error);
    });


  resultpagecralwer.decodeResponses = true;
  resultpagecralwer.maxDepth = 1;
  setTimeout(function() {
    resultpagecralwer.start();
    if (count % 200 == 0) console.log(count + " page results from cyclists already crawled");
  }, count * 300);
};

var crawlCyclist = function(count, url, year) {
  url = "https://rad-net.de" + url;
  console.log(count + ": " + url);
  var cyclistcrawler = Crawler(url)
    .on("fetchcomplete", function(queueItem, responseBuffer, response) {
      //console.log(count + ": It was a resource of type %s", response.headers['content-type'] + ". Url: " + url);

      var $ = cheerio.load(responseBuffer.toString());
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
      console.log("fetchclienterror:");
      console.dir(error);
    })
    .on("fetchtimeout", function(queueItem, crawlerTimeoutValue) {
      console.log("fetchtimeout:");
      console.dir(crawlerTimeoutValue);
    })
    .on("queueerror", function(error, URLData) {
      console.log("queueerror:");
      console.dir(error);
    })
    .on("fetchconditionerror", function(queueItem, error) {
      console.log("fetchconditionerror:");
      console.dir(error);
    })
    .on("cookieerror", function(queueItem, error, cookie) {
      console.log("cookieerror:");
      console.dir(error);
    })
    .on("downloadconditionerror", function(queueItem, error) {
      console.log("downloadconditionerror:");
      console.dir(error);
    })
    .on("fetcherror", function(queueItem, response) {
      console.log("fetcherror:");
      console.dir(response);
    })
    .on("gziperror", function(queueItem, responseBody, response) {
      console.log("gziperror:");
      console.dir(response);
    })
    .on("fetchdataerror", function(queueItem, response) {
      console.log("fetchdataerror:");
      console.dir(response);
    })
    .on("robotstxterror", function(error) {
      console.log("robotstxterror:");
      console.dir(error);
    });


  cyclistcrawler.decodeResponses = true;
  cyclistcrawler.maxDepth = 1;
  setTimeout(function() {
    cyclistcrawler.start();
    if (count % 200 == 0) console.log(count + " cyclists already crawled");
  }, count * 300);
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
    /*if (maxDurchlaeufe == bisherigeDurchlaeufe) {
      console.log("Crawled everything what needed.");
      finishProcess();
    }*/
  });
};

var finishProcess = function() {
  process.exit();
}

var start = function(year) {
  var newPromise = new Promise(function(resolve, reject) {
    startCrawling("https://www.rad-net.de/modules.php?name=Rangliste&saison=" + year + "&rlid=6&pg=1", year, resolve, reject);
  });
  return newPromise;
};

module.exports = {
  start: start
};
