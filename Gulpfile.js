'use strict';

var browserSync = require( 'browser-sync' ).create();
var watchify = require( 'watchify' );
var browserify = require( 'browserify' );
var babelify = require( 'babelify' );
var gulp = require( 'gulp' );
var gutil = require( 'gulp-util' );
var source = require( 'vinyl-source-stream' );
var buffer = require( 'vinyl-buffer' );
var assign = require( 'lodash.assign' );
var sass = require( 'gulp-sass' );

var customOpts = {
	entries: [ './src/index.js' ],
	debug: true
};
var opts = assign( {}, watchify.args, customOpts );
var br = watchify( browserify( opts ) );
br.transform( babelify );
br.on( 'update', bundle );
br.on( 'log', gutil.log );

function bundle() {

	return br.bundle()
		.on( 'error', gutil.log.bind( gutil, 'Browserify Error' ) )
		.pipe( source( 'app.js' ) )
		.pipe( buffer() )
		.pipe( gulp.dest( './build' ) );

}

gulp.task( 'bundle', bundle );

gulp.task( 'serve', [ 'bundle', 'sass' ], function () {

	browserSync.init( {

		files: [ './css/*.css' ],
		injectChanges: true,
		server: {
			baseDir: '.',
			index: 'index.html'
		},
		port: 3000,
		ui: false,
		open: false,
		reloadOnRestart: true

	} );

	gulp.watch( [ 'index.html', './build/*', 'template/*' ], browserSync.reload );
	gulp.watch( [ './css/*.sass' ], [ 'sass' ] );

} );

gulp.task( 'sass', function () {

	gulp.src( './css/*.sass' )
		.pipe( sass().on( 'error', sass.logError ) )
		.pipe( gulp.dest( './css' ) );

} );
