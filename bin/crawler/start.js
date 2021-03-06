var config = require('../../config');
var fromYear = parseInt(config.crawlFromYear);
var toYear = parseInt(config.crawlToYear);

async function start() {
  for (var i = fromYear; i <= toYear; i++) {
    var year = i;
    console.log("Start crawling " + year + " year.");

    var pageCrawler = require('./pagecrawler.js');
    var resultPageCrawler = require('./resultpagecrawler.js');
    var resultCrawler = require('./resultcrawler.js');
    var saveToDB = require('./saveToDB.js');

    var pageCrawlerResult;

    await pageCrawler.start(year).then(function(result) {
        console.log("Crawled " + result.length + " cyclists for year " + year);
        pageCrawlerResult = result;
        if (result.length == 0) {
          console.log("End as no result could be crawled.");
          process.exit();
        }
        return resultPageCrawler.start(result, year);
      })
      .then(function(result) {
        console.log("Crawled " + result.length + " result pages for year " + year);
        return resultCrawler.start(result, pageCrawlerResult, year);
      })
      .then(function(result) {
        console.log("Crawled " + result.length + " results for year " + year);
        return saveToDB.start(result, year);
      });

    console.log("Finished crawling " + year + " year.");
  }
  console.log("Complete crawling finished - uff ;)...");
  process.exit();
}

start();

process.stdin.resume(); //so the program will not close instantly

function exitHandler(options, exitCode) {
  if (options.cleanup) console.log('clean');
  if (exitCode || exitCode === 0) console.log(exitCode);
  if (options.exit) process.exit();
}

//do something when app is closing
process.on('exit', exitHandler.bind(null, {
  cleanup: true
}));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {
  exit: true
}));

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, {
  exit: true
}));
process.on('SIGUSR2', exitHandler.bind(null, {
  exit: true
}));

//catches uncaught exceptions
process.on('uncaughtException', function(err) {
  console.error((new Date).toUTCString() + ' uncaughtException:', err.message)
  console.error(err.stack)
  //process.exit(1)
});

process.on('unhandledRejection', (reason, p) => {
  console.log("Unhandled Rejection at: Promise ", p, " reason: ", reason);
  // application specific logging, throwing an error, or other logic here
});
