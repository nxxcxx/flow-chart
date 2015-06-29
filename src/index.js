global.UUID = require( 'uuid' );

global.$ = require( 'jquery' );
require( 'jquery-ui' );

require( 'angular' ).module( 'nodeApp', [] )
	.controller( 'nodeCtrl', require( './n-ctrl' ) )
	.directive( 'node', require( './n-dir' ) )
	.directive( 'sortable', require( './n-sort-dir' ) )
	.directive( 'connector', require( './n-connector-dir' ) )
	.directive( 'connection', require( './n-connection-dir' ) );
