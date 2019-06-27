var Crawler = require("simplecrawler");

var cheerio = require('cheerio');
var cyclisters = [];
var firstCrawl = false;

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

var start = function(year) {
  var newPromise = new Promise(function(resolve, reject) {
    startCrawling("https://www.rad-net.de/modules.php?name=Rangliste&saison=" + year + "&rlid=6&pg=1", year, resolve, reject);
  });
  return newPromise;
};

module.exports = {
  start: start
};
