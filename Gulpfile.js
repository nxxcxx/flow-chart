'use strict';

var browserSync = require( 'browser-sync' ).create();
var gulp = require( 'gulp' );
var $ = require( 'gulp-load-plugins' )();
var browserify = require( 'browserify' );
var source = require( 'vinyl-source-stream' );
var buffer = require( 'vinyl-buffer' );
var babelify = require( 'babelify' );

gulp.task( 'browserify', function() {

   var br = browserify( {

      entries: './src/index.js',
      debuf: true,
      transform: [ babelify ]

   } );

   return br.bundle()
      .pipe( source( 'app.js' ) )
      .pipe( buffer() )
      .pipe( $.sourcemaps.init( { loadMaps: true } ) )

      .pipe( $.sourcemaps.write( '.' ) )
      .pipe( gulp.dest( './build/' ) );

} );

gulp.task( 'serve', [ 'browserify' ], function () {

	initBrowserSync();
	initWatchTask();

} );

gulp.task( 'reload', [ 'browserify' ], function () {

	browserSync.reload();

} );

function initWatchTask() {

	gulp.watch( [ './index.html', './src/*.js', './css/*.css' ], [ 'reload' ] );

}

function initBrowserSync() {

	browserSync.init( {

		server: {
			baseDir: '.',
			index: 'index.html'
		},

		ui: false,
		open: false,
		reloadOnRestart: true

	} );

}

function onError( err ) {

	$.util.log( $.util.colors.red( err ) );
	$.util.beep();

}


// gulp.task( 'build:partials', function () {
//
// 	return gulp
// 		.src( config.partialsSrc )
// 		.pipe( $.plumber( { errorHandler: onError } ) )
// 		.pipe( $.cached( 'partials' ) )
// 		.pipe( $.debug( { title: 'partials:cached' } ) )
// 		.pipe( $.if( config.jshint, $.jshint() ) )
// 		.pipe( $.if( config.jshint, $.jshint.reporter( 'jshint-stylish' ) ) )
// 		.pipe( $.sourcemaps.init() )
// 		.pipe( $.if( config.babel, $.babel() ) )
// 		.pipe( $.if( config.uglify, $.uglify() ) )
// 		.pipe( $.wrap( '//source: <%= file.relative %>\n<%= contents %>' ) )
// 		.pipe( $.remember( 'partials' ) )
// 		.pipe( $.debug( { title: 'partials:remembered' } ) )
// 		.pipe( $.concatUtil( 'app.min.js', { process: removeUseStrict } ) )
// 		.pipe( $.concatUtil.header('"use strict"\n') )
// 		.pipe( $.sourcemaps.write( '.' ) )
// 		.pipe( gulp.dest( config.partialsDest ) );
//
// } );
