global.UUID = require( 'uuid' );
global.THROTTLE = require( 'throttle-debounce' ).throttle;

angular.module( 'nodeApp', [] )
	.controller( 'nodeCtrl', require( './nodeCtrl' ) )
	.directive( 'nodeBox', require( './nodeBox' ) )
	.directive( 'nodeLabel', require( './nodeLabel' ) )
	.directive( 'nodeConnector', require( './nodeConnector' ) )
	.directive( 'nodeLink', require( './nodeLink' ) )
	.directive( 'nodeSortable', require( './nodeSortable' ) )
	.directive( 'nodeSortItem', require( './nodeSortItem' ) )
	.directive( 'svgPannable', require( './svg-pannable' ) )
	.directive( 'svgZoomable', require( './svg-zoomable' ) );
