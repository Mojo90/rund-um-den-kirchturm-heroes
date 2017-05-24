var gulp = require('gulp');
var minify = require('gulp-minify');
var concat = require('gulp-concat');
var sass = require('gulp-sass');
var cleanCSS = require('gulp-clean-css');
var plumber = require('gulp-plumber');
var notify = require("gulp-notify");
var pug = require('gulp-pug');

var paths = {
  js: './views/js/**/*',
  css: './views/scss/**/*',
  pug: './app/**/*.pug',
  fonts: './public/fonts/*'
};

var onError = function(err) {
        notify.onError({
                    title:    "Gulp-Failure",
                    message:  "Error: <%= error.message %>",
                    sound:    "Beep"
                })(err);

        this.emit('end');
    };

var gulp_src = gulp.src;
gulp.src = function() {
  return gulp_src.apply(gulp, arguments)
  .pipe(plumber({errorHandler: onError}));
};

gulp.task('css', function () {
  return gulp.src('./views/scss/main.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(cleanCSS({compatibility: 'ie8'}))
    .pipe(gulp.dest('./public/css'));
});

gulp.task('js', function() {
  // place code for your default task here
  gulp.src([
    './views/js/libs/*.js',
    './views/js/own/*.js',
    './views/js/main.js',
  ])
    .pipe(concat('main.js'))
    .pipe(minify({
        ext:{
            src:'-debug.js',
            min:'.js'
        }//,
        //exclude: ['tasks'],
        //ignoreFiles: ['.combo.js', '-min.js']
    }))
    .pipe(gulp.dest('./public/js'))
});

gulp.task('pug', function () {
  return gulp.src([
  	'./app/*.pug',
  	'./app/**/*.pug'], {base: "./"})
  .pipe(pug({
    // Your options in here.
  }))
  .pipe(gulp.dest("./"))
});

gulp.task('watch', function() {
  gulp.watch(paths.js, ['js']);
  gulp.watch(paths.css, ['css']);
  gulp.watch(paths.pug, ['pug']);
});

gulp.task('default', ['css', 'js', 'pug', 'watch']);
