var config = {};

config.defaultEnvironment = "development";
config.defaultApiHost = "/";

config.environment = process.env.environment || config.defaultEnvironment;
config.apiHost = process.env.apiHost || config.defaultApiHost;

config.oneYear = 365 * 24 * 60 * 60 * 1000;
config.oneDay = 24 * 60 * 60 * 1000;

config.crawlFromYear = process.env.CRAWLER_FROM_YEAR || "2005";
config.crawlToYear = process.env.CRAWLER_TO_YEAR || "2017";

module.exports = config;
