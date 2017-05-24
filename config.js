var config = {};

config.environment = process.env.environment || config.defaultEnvironment;

config.oneYear = 365 * 24 * 60 * 60 * 1000;
config.oneDay = 24 * 60 * 60 * 1000;

module.exports = config;
