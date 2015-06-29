global.UUID = require( 'uuid' );
global.$ = require( 'jquery' );
require( 'jquery-ui' );

require( 'angular' )
	.module( 'flowApp', [] )
	.controller( 'nodeCtrl', require( './nC' ) )
	.directive( 'node', require( './nD' ) )
	.directive( 'sortable', require( './nSD' ) )
	.directive( 'connector', require( './nCnD' ) )
	.directive( 'connection', require( './nCtD' ) )
   ;
