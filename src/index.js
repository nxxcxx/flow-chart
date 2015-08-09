global.UUID     = require( 'uuid' );
global.TOPOSORT = require( 'toposort' );
global.CJSON = require( 'circular-json' );

angular.module( 'nodeApp', [
	'common',
	'xx',
	'codeMirror',
	'contextMenu'
] ).config( [ 'logProvider', ( logProvider ) => {
	logProvider.enableDebug();
	// logProvider.enableDebugNamespace( 'Scope' );
} ] );

angular.module( 'xx', [] )
	.factory( 'nodeService'    , require( './xx/services/xxService' ) )
	.factory( 'nodeFactory'    , require( './xx/services/xxFactory' ) )
	.factory( 'nodeEvent'      , require( './xx/services/xxEvent' ) )
	.service( 'updateLinkEvent', require( './xx/services/events/updateLinkEvent' ) )
	.controller( 'xxCtrl'      , require( './xx/controllers/xx.ctrl' ) )
	.directive( 'xxBody'       , require( './xx/directives/xxBody.dir' ) )
	.directive( 'xxInterface'  , require( './xx/directives/xxInterface.dir' ) )
	.directive( 'xxLabel'      , require( './xx/directives/xxLabel.dir' ) )
	.directive( 'xxConnector'  , require( './xx/directives/xxConnector.dir' ) )
	.directive( 'xxLink'       , require( './xx/directives/xxLink.dir' ) )
	.directive( 'xxTempLink'   , require( './xx/directives/xxTempLink.dir' ) )
	.directive( 'xxSortable'   , require( './xx/directives/xxSortable.dir' ) )
	.directive( 'xxSortItem'   , require( './xx/directives/xxSortItem.dir' ) )
	.directive( 'xxSelectable' , require( './xx/directives/xxSelectable.dir' ) )
	.directive( 'svgDraggable' , require( './xx/directives/svgDraggable.dir' ) )
	.directive( 'svgZoomable'  , require( './xx/directives/svgZoomable.dir' ) );

angular.module( 'common', [] )
	.filter( 'cjson', require( './common/cjson.filter' ) )
	.provider( 'log', require( './common/log.provider' ) );

angular.module( 'codeMirror', [] )
	.factory( 'CM', require( './codeMirror.service' ) )
	.directive( 'codeMirror', require( './codeMirror.dir' ) );

angular.module( 'contextMenu', [] )
	.factory( 'CTXM', require( './contextMenu.service' ) )
	.directive( 'contextMenu', require( './contextMenu.dir' ) );
