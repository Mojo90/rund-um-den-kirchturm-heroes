var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
var config = require('./config');
var compression = require('compression');
var timeout = require('connect-timeout')

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(timeout('5s'));
app.use(logger('dev'));
app.use(haltOnTimedout);
app.use(bodyParser.json());
app.use(haltOnTimedout);
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(haltOnTimedout);
app.use(compression());
app.use(haltOnTimedout);
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: config.oneYear
}));
app.use(haltOnTimedout);

/*app.use(session({
    secret: config.secret,
    resave: false,
    saveUninitialized: true,
    duration: config.oneYear,
    cookie: {
        maxAge: config.oneYear,
        secure: false
    }
}));*/

//redirects to https
/*app.use(function(req, res, next) {
    var newURL;

    // If not on HTTPS, or not on the main domain, redirect
    if (config.environment === 'production' &&
        (req.headers['x-forwarded-proto'] !== 'https' || req.headers.host !== config.apiHost)) {

        newURL = ['https://' + config.apiHost, req.url].join('');
        return res.redirect(newURL);
    }

    return next();
});
app.use(haltOnTimedout);*/

app.use('/', require('./routes/index'));
app.use('/api', require('./routes/api'));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});


// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err,
      year: new Date().getFullYear() + ""
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {},
    year: new Date().getFullYear() + ""
  });
});

function haltOnTimedout(req, res, next) {
  if (!req.timedout) next()
}

module.exports = app;
