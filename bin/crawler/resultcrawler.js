var Crawler = require("simplecrawler");

var cheerio = require('cheerio');

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
      reject();
    })
    .on("fetchtimeout", function(queueItem, crawlerTimeoutValue) {
      console.log("fetchtimeout:");
      console.dir(crawlerTimeoutValue);
      reject();
    })
    .on("queueerror", function(error, URLData) {
      console.log("queueerror:");
      console.dir(error);
      reject();
    })
    .on("fetchconditionerror", function(queueItem, error) {
      console.log("fetchconditionerror:");
      console.dir(error);
      reject();
    })
    .on("cookieerror", function(queueItem, error, cookie) {
      console.log("cookieerror:");
      console.dir(error);
      reject();
    })
    .on("downloadconditionerror", function(queueItem, error) {
      console.log("downloadconditionerror:");
      console.dir(error);
      reject();
    })
    .on("fetcherror", function(queueItem, response) {
      console.log("fetcherror:");
      console.dir(response);
      reject();
    })
    .on("gziperror", function(queueItem, responseBody, response) {
      console.log("gziperror:");
      console.dir(response);
      reject();
    })
    .on("fetchdataerror", function(queueItem, response) {
      console.log("fetchdataerror:");
      console.dir(response);
      reject();
    })
    .on("robotstxterror", function(error) {
      console.log("robotstxterror:");
      console.dir(error);
      reject();
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

var start = function(year) {
  var newPromise = new Promise(function(resolve, reject) {
    crawlCyclist("https://www.rad-net.de/modules.php?name=Rangliste&saison=" + year + "&rlid=6&pg=1", year, resolve, reject);
  });
  return newPromise;
};

module.exports = {
  start: start
};
