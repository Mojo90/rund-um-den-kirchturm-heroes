var Crawler = require("crawler");
var linkResultsA = [];
var crawlResults = 0;
var year = 0;

/*function crawlResultPage()  {
  var urls = [{
    href: ""
  }];
  var year = "";
  //console.log(count + ": " + url);
  var resultpagecralwer = Crawler(urls[0].href)
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
      if (crawlResults % 50 == 0) console.log(crawlResults + " page results from cyclists in " + year + " already crawled");
    })
    .on("complete", function() {
      console.log("Sollte fertsch sein");
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

  this.start = function(u, y)  {
    urls = u;
    year = y;
    resultpagecralwer.start();

    for (var i = 1; i < urls.length; i++) {
      var queueItem = resultpagecralwer.processURL(urls[i].href);
      queueItem.custom_var = 'custom';
      resultpagecralwer.queue.add(queueItem, 'force', function(error) {
        if (error) {
          console.log(error);
        }
      });
    }
  };

  this.checkQueue = function() {
    resultpagecralwer.queue.countItems(null, function(error, items) {
      if (error) console.log("Error: " + error);
      console.log("Items length: " + items);
    }, null)
  }
};*/

var c = new Crawler({
  rateLimit: 2000,
  maxConnections: 1,
  // This will be called for each crawled page
  callback: function(error, res, done) {
    if (error) {
      console.log(error);
    } else {
      var $ = res.$;
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
                    "count": crawlResults,
                    "href": "http://rad-net.de" + $(this).attr('href'),
                    "year": year
                  });
                  //console.log($(this).attr('href'));
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
      if (crawlResults % 50 == 0) console.log(crawlResults + " page results from cyclists in " + year + " already crawled");
    }
    done();
  }
});

var checkFinish = function(resolve, amount) {
  console.log(crawlResults + " / " + amount);
  if (crawlResults == amount) {
    resolve(linkResultsA);
  } else  {
    setTimeout(function() {
      checkFinish(resolve, amount);
    }, 30000);
  }
}

async function start(cyclisters, y) {
  return new Promise(async (resolve, reject) => {
    year = y
    var a = [];
    for (var i = 0; i < cyclisters.length; i++) {
      a.push(cyclisters[i].href);
    }
    // Queue a list of URLs
    c.queue(a);
    checkFinish(resolve, cyclisters.length);
  });
}
module.exports = {
  start: start
};
