global.UUID = require( 'uuid' );
global.THROTTLE = require( 'throttle-debounce' ).throttle;
global.TOPOSORT = require( 'toposort' );
global.CJSON = require( 'circular-json' );

angular.module( 'nodeApp', [] )
	.factory( 'nodeService', require( './nodeService' ) )
	.factory( 'nodeFactory', require( './nodeFactory' ) )
	.factory( 'nodeEvent', require( './nodeEvent' ) )
	.controller( 'nodeCtrl', require( './nodeCtrl' ) )
	.directive( 'nodeBox', require( './nodeBox' ) )
	.directive( 'nodeLabel', require( './nodeLabel' ) )
	.directive( 'nodeConnector', require( './nodeConnector' ) )
	.directive( 'nodeLink', require( './nodeLink' ) )
	.directive( 'nodeSortable', require( './nodeSortable' ) )
	.directive( 'nodeSortItem', require( './nodeSortItem' ) )
	.directive( 'nodeSelectable', require( './nodeSelectable' ) )
	.directive( 'svgPannable', require( './svg-pannable' ) )
	.directive( 'svgZoomable', require( './svg-zoomable' ) )
	.directive( 'codeEditor', require( './code-editor' ) )
	.filter( 'cjson', require( './circular-json' ) );
