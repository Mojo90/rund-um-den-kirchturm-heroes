var Crawler = require("simplecrawler");
var cheerio = require('cheerio');
var linkResultsA = [];
var crawlResults = 0;

var crawlResultPage = function(count, url, year)  {
  //console.log(count + ": " + url);
  var resultpagecralwer = Crawler(url)
    .on("fetchcomplete", function(queueItem, responseBuffer, response) {
      //console.log(count + ": It was a resource of type %s", response.headers['content-type'] + ". Url: " + url);

      var $ = cheerio.load(responseBuffer.toString());
      var rows = $("tr[bgcolor='#000066']").parent();
      var breakForPlatzierung = false;
      $(rows).each(function() {
        $(this).find('tr').each(function(i, el) {
          $(this).find('td').each(function(i, el) {
            //console.log("Break is: " + breakForPlatzierung);
            if (breakForPlatzierung) {
              $(this).find('a').each(function(i, el) {
                if ($(this).attr('href').indexOf("saisonpl%3D" + year) > -1) {
                  //console.log("Pushed to linkResultsA");
                  linkResultsA.push({
                    "count": count,
                    "href": $(this).attr('href'),
                    "year": year
                  });
                }
              });
            }
            if ($(this).text().indexOf("Platzierungen in ") > -1) {
              breakForPlatzierung = true;
            }
          });
        });
      });
      crawlResults++;
    })
    .on("complete", function() {
      if (count % 50 == 0) console.log(count + " page results from cyclists in " + year + " already crawled");
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
  resultpagecralwer.start();
};

var checkFinish = function(resolve, amount) {
  if (crawlResults == amount) {
    resolve(linkResultsA);
  } else  {
    setTimeout(function() {
      checkFinish(resolve, amount);
    }, 500);
  }
}

var doTimeout = function(count, href, year)  {
  setTimeout(function() {
    crawlResultPage(count, href, year);
  }, count * 1000);
}

async function start(cyclisters, year) {
  return new Promise(async (resolve, reject) => {
    for (var i = 0; i < cyclisters.length; i++) {
      //console.log("Crawling " + cyclisters[i].href);
      doTimeout(i, cyclisters[i].href, year);
    }
    checkFinish(resolve, cyclisters.length - 1);
  });
}
module.exports = {
  start: start
};
