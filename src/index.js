global.UUID = require( 'uuid' );
global.THROTTLE = require( 'throttle-debounce' ).throttle;
global.TOPOSORT = require( 'toposort' );
global.CJSON = require( 'circular-json' );

angular.module( 'nodeApp', [] )
	.filter( 'cjson', require( './common/cjson.filter' ) )
	.provider( 'log', require( './common/log.provider' ) )

	.service( 'updateLinkEvent', require( './blackbox/services/events/updateLinkEvent' ) )

	.factory( 'nodeService', require( './blackbox/services/service' ) )
	.factory( 'nodeFactory', require( './blackbox/services/factory' ) )
	.factory( 'nodeEvent', require( './blackbox/services/event' ) )

	.factory( 'CM', require( './cm-service' ) )
	.factory( 'CTXM', require( './ctxm-service' ) )
	.controller( 'nodeCtrl', require( './blackbox/controllers/BlackBox.ctrl' ) )

	.directive( 'xxBody', require( './blackbox/directives/xxBody.dir' ) )
	.directive( 'xxInterface', require( './blackbox/directives/xxInterface.dir' ) )
	.directive( 'xxLabel', require( './blackbox/directives/xxLabel.dir' ) )
	.directive( 'xxConnector', require( './blackbox/directives/xxConnector.dir' ) )
	.directive( 'xxLink', require( './blackbox/directives/xxLink.dir' ) )
	.directive( 'xxTempLink', require( './blackbox/directives/xxTempLink.dir' ) )
	.directive( 'xxSortable', require( './blackbox/directives/xxSortable.dir' ) )
	.directive( 'xxSortItem', require( './blackbox/directives/xxSortItem.dir' ) )
	.directive( 'xxSelectable', require( './blackbox/directives/xxSelectable.dir' ) )
	.directive( 'svgDraggable', require( './blackbox/directives/svgDraggable.dir' ) )
	.directive( 'svgZoomable', require( './blackbox/directives/svgZoomable.dir' ) )

	.directive( 'codeMirror', require( './codeMirror' ) )
	.directive( 'contextMenu', require( './ctxm' ) )

	.config( [ 'logProvider', ( logProvider ) => {

		logProvider.enableDebug();
		// logProvider.enableDebugNamespace( 'Scope' );

	} ] )
	;
