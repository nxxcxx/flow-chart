global.UUID = require( 'uuid' );

angular.module( 'nodeApp', [] )
	.controller( 'nodeCtrl', require( './nodeCtrl' ) )
	.directive( 'nodeBox', require( './nodeBox' ) )
	.directive( 'nodeItem', require( './nodeItem' ) )
	.directive( 'nodeConnector', require( './nodeConnector' ) )
	.directive( 'nodeLink', require( './nodeLink' ) )
	.directive( 'svgPannable', require( './svg-pannable' ) )
	.directive( 'svgZoomable', require( './svg-zoomable' ) )
	;
