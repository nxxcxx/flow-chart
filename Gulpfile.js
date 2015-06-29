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

var customOpts = {
	entries: [ './src/index.js' ],
	debug: true
};
var opts = assign( {}, watchify.args, customOpts );
var br = watchify( browserify( opts ) );
br.transform( babelify );
br.on( 'update', bundle );
br.on( 'log', gutil.log );

gulp.task( 'bundle', bundle );

function bundle() {

	return br.bundle()
		.on( 'error', gutil.log.bind( gutil, 'Browserify Error' ) )
		.pipe( source( 'app.js' ) )
		.pipe( buffer() )
		.pipe( gulp.dest( './build' ) );

}

// gulp serve -> start bundle( browserify & watchify & babelify ) -> watch bundle -> reload browser
gulp.task( 'serve', [ 'bundle' ], function () {

   // init browser-sync
   browserSync.init( {

      files: [ './css/*' ],
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

   // init watch task
	gulp.watch( [ './build/*', 'template/*' ], browserSync.reload );

} );
