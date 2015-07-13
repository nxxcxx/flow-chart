global.UUID = require( 'uuid' );
global.THROTTLE = require( 'throttle-debounce' ).throttle;
global.TOPOSORT = require( 'toposort' );
global.CJSON = require( 'circular-json' );

angular.module( 'nodeApp', [] )
	.provider( 'log', require( './provider/logProvider' ) )
	.factory( 'nodeService', require( './services/node/service' ) )
	.factory( 'nodeFactory', require( './services/node/factory' ) )
	.factory( 'nodeEvent', require( './services/node/event' ) )
	.factory( 'CM', require( './services/cm-service' ) )
	.controller( 'nodeCtrl', require( './controllers/nodeCtrl' ) )
	.directive( 'nodeModule', require( './directives/node/module' ) )
	.directive( 'nodeCol', require( './directives/node/io-col' ) )
	.directive( 'nodeLabel', require( './directives/node/label' ) )
	.directive( 'nodeConnector', require( './directives/node/connector' ) )
	.directive( 'nodeLink', require( './directives/node/link' ) )
	.directive( 'nodeTempLink', require( './directives/node/temp-link' ) )
	.directive( 'nodeSortable', require( './directives/node/sortable' ) )
	.directive( 'nodeSortItem', require( './directives/node/sortitem' ) )
	.directive( 'nodeSelectable', require( './directives/node/selectable' ) )
	.directive( 'svgPannable', require( './directives/svg-pannable' ) )
	.directive( 'svgZoomable', require( './directives/svg-zoomable' ) )
	.directive( 'codeMirror', require( './directives/codeMirror' ) )
	.filter( 'cjson', require( './filters/cjson' ) )
	.config( [ 'logProvider', ( logProvider ) => {

		logProvider.enableDebug();
		logProvider.enableDebugNamespace( 'Scope' );

	} ] )
	;
