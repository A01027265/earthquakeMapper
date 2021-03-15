require('dotenv').config();

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

// Security dependencies
const helmet = require('helmet');
const compression = require('compression');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');

var indexRouter = require('./routes/index');

var app = express();

// Setup helmet middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "img-src": ["'self'", "data:", "https:"],
      "script-src": ["'self'", "https:"]
    }
  }
}));

// Compress responses
app.use(compression());

// Setup body-parser middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ limit: '100kb' }));

// Setup express-rate-limit
app.set('trust proxy', 1);  // Reverse proxy (Heroku)

const limiter = rateLimit({
  windowMS: 1000 * 60 * 10,  // 10 min in ms
  max: 50, // Max requests per 10 min window
  message: 'You have exceeded the 100 requests in 15 minutes limit!',
  headers: true // Send the appropriate headers to the response (X-RateLimit-Limit, X-RateLimit-Remaining, Retry-After)
});

app.use(limiter);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
