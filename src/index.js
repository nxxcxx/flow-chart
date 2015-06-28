
global.UUID = require( 'uuid' );

global.$ = require( 'jquery' );
require( 'jquery-ui' );


require( 'angular' )
.module( 'flowApp', [] )
.controller( 'nodeCtrl', [ '$scope', ( $scope ) => {

   global.scope = $scope;
   $scope.nodes = [];

   // todo $scope.connection = []; // this defines all connection between nodes


   var inputs = [ 'data', 'x', 'y', 'z', 'w', 'uv', 'mat4', 'vec2', 'color', 'geometry', 'vector3', 'buffer', 'mesh', 'material' ];

   function rnd() {
      return inputs[ ~~(Math.random() * inputs.length) ];
   }

   $scope.generateNode = () => {

      var node = {

         title: rnd(),
         uuid: UUID(),
         input: [ { name: rnd(), uuid: UUID() }, { name: rnd(), uuid: UUID() } , { name: rnd(), uuid: UUID() } ],
         output: [ { name: rnd(), uuid: UUID() }, { name: rnd(), uuid: UUID() } ]

      };

      $scope.nodes.push( node );
      return node;

   };

   $scope.range = n => new Array( n );

} ] )
.directive( 'node', () => {

   return {

      restrict: 'E',
      templateUrl: './template/node.html',
      replace: true,
      scope: {
         nodeObject: '='
      },
      link: ( scope, elem, attr, ctrl ) => {

         $( elem ).draggable();

      },
      controller: ( $scope, $element, $attrs, $transclude ) => {

         $scope.handleDragEvent = eventType => {

            $( $element ).draggable( eventType );
            // console.log( `drag ${eventType}d.` );

         };

      }

   };

} )
.directive( 'sortable', () => {

   return {

      restrict: 'A',
      scope: true,
      link: ( scope, elem, attr, ctrl ) => {

         $( elem ).sortable();

      },
      controller: ( $scope, $element, $attrs, $transclude ) => {

         $scope.handleSortEvent = eventType => {

            $( $element ).sortable( eventType );
            // console.log( `sort ${eventType}d.` );

         };

      }

   };

} )
.directive( 'connector', () => {

   return {

      restrict: 'E',
      scope: {
         uuid: '=',
         notifyDragHandler: '&dragEventHandler',
         notifySortHandler: '&sortEventHandler'
      },
      link: ( scope, elem, attr, ctrl ) => {

         $( elem )
         .on( 'mouseenter', e  => {

            scope.notifyDragHandler( { eventType: 'disable' } );
            scope.notifySortHandler( { eventType: 'disable' } );

         } )
         .on( 'mouseleave', e => {

            scope.notifyDragHandler( { eventType: 'enable' } );
            scope.notifySortHandler( { eventType: 'enable' } );

         } )
         .on( 'mouseover', e => {

            console.log( $(elem).parent().text().trim(), scope.uuid );

         } );

      },
      controller: ( $scope, $element, $attrs, $transclude ) => {


      }

   };

} );
