global.UUID = require( 'uuid' );
global.THROTTLE = require( 'throttle-debounce' ).throttle;
global.TOPOSORT = require( 'toposort' );

angular.module( 'nodeApp', [] )
	.factory( 'nodeFactory', require( './nodeFactory' ) )
	.controller( 'nodeCtrl', require( './nodeCtrl' ) )
	.directive( 'nodeBox', require( './nodeBox' ) )
	.directive( 'nodeLabel', require( './nodeLabel' ) )
	.directive( 'nodeConnector', require( './nodeConnector' ) )
	.directive( 'nodeLink', require( './nodeLink' ) )
	.directive( 'nodeSortable', require( './nodeSortable' ) )
	.directive( 'nodeSortItem', require( './nodeSortItem' ) )
	.directive( 'svgPannable', require( './svg-pannable' ) )
	.directive( 'svgZoomable', require( './svg-zoomable' ) );
