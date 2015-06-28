'use strict';

var budo = require( 'budo' );
var babelify = require( 'babelify' );
var chalk = require( 'chalk' );

budo( './src/index.js', {

	host: '0.0.0.0',
	port: 3000,
	live: true,
	transform: babelify,
	serve: 'bundle.js'

} )
.watch( [] )
.on( 'connect', function ( event ) {

   console.log( chalk.green( '► server running on ' + event.uri ) );

} );
