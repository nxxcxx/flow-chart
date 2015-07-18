module.exports = [ 'CTXM', '$rootScope', ( CTXM, $rootScope ) => {

   function controller( $scope, $element, $attrs ) {

      var handler = $( $attrs.handler );

      $( '#nodeCanvas' ).on( 'contextmenu', e => {
         e.preventDefault();
      } );
      $( 'body' ).on( 'mousedown', e => {
         close();
      } );

      $element.on( 'mousedown', e => {
         // stop bubbling up to body so it doesnt clost before ng click
         e.stopPropagation();
      } )
      .on( 'click', e => {
         close();
      } )
      .on( 'contextmenu', e => e.preventDefault() );

      /* example
      $scope.menu = [
         { name: 'Add Input', fn: () => console.log( 'Add Input' ) },
      ];
      */

      $rootScope.$on( 'menu.open', ( broadCastEvent, data ) => {
         open( data.event, data.menu );
      } );

      function open( e, menu ) {
         $scope.menu = menu;
         $element.css( { top: e.clientY, left: e.clientX } );
         $scope.active = true;
         $scope.$digest();
      }
      function close () {
         if ( !$scope.active ) return;
         $scope.active = false;
         $scope.$digest();
      }

   }

   return {

      restrict: 'E',
      replace: true,
      scope: {},
      templateUrl: './src/contextMenu.html',
      controller

   };

} ];
