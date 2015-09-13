var gulp = require('gulp');
var source = require('vinyl-source-stream'); // Used to stream bundle for further handling
var browserify = require('browserify');
var watchify = require('watchify');
var reactify = require('reactify'); 
var uglify = require('gulp-uglify');
var streamify = require('gulp-streamify');
var plumber = require('gulp-plumber');
var colors  = require('colors');

var myBaseDir = '/app/src';      // Location of your source file
var uiSource = 'ui.js';          // The name of your main target file to be browserified
var uiDest = '/app/htdocs/js/';  // Destination for the bundle

gulp.task('browserify', function() {

	var bundler = browserify({
		entries: [uiSource], // Only need initial file, browserify finds the deps
		transform: [reactify], // We want to convert JSX to normal javascript
		debug: true,
		list: true,
		basedir: myBaseDir,
		cache: {}, packageCache: {}, fullPaths: true // Requirement of watchify
	});
	
	var watcher	= watchify(bundler, { verbose: true });

	// Return a watcher task
	var createStart = Date.now();
	
	watcher
	.on('log', console.error)
	// Update when files update
	
	.on('update', function () { 
		var updateStart = Date.now();
		watcher.bundle()
		.on('error', handleErrors) // Create new bundle that uses the cache for high performance
		.pipe(plumber())
		.pipe(source('ui.js'))
    .pipe(streamify(uglify()))
		.pipe(gulp.dest(uiDest))
		.on('end', function() {
        console.log('- Finished %s in %s s \007', uiSource, sec(Date.now() - updateStart));
    });
		
	})
	
	// Create the bundle when starting the task
	
	.bundle()
	.on('error', handleErrors)
	.pipe(plumber())
	.on('log', console.error)
	.pipe(source(uiSource))
  .pipe(streamify(uglify()))
	.pipe(gulp.dest(uiDest))
	.on('end', function() {
		console.log('+ Built Initial Browserify Bundle in %s s \007', sec(Date.now() - createStart));
	});	
	
	return watcher;
	
});

// Just running the two tasks
gulp.task('default', ['browserify']);


function handleErrors (err) {
	console.log(" Error ".bold.bgRed.yellow + " " + err.toString() +"\007\007");
	this.emit("end");
};

function sec(msec) {

	return Math.floor(msec/100) / 10;

}
