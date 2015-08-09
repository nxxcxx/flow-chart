module.exports = [ 'log', '$timeout', '$rootScope', ( log, $timeout, $rootScope ) => {

   function link( $scope, $element, $attrs ) {

      $scope.$on( 'requestLabelWidth', ( e, setMaxLabelWidth ) => {
         setMaxLabelWidth( $attrs.xxLabel , $element[ 0 ].getComputedTextLength() );
      } );

      $timeout( () => {
         if ( $scope.$last ) $scope.nodeObject.updateUI();
      } );

      log.debug( 'Scope', $scope.$id, 'Label', $attrs.xxLabel, $scope );


      $element.on( 'contextmenu', e => {

         e.preventDefault();

         if ( $scope.io ) {
            e.stopPropagation();
            var m = [
               { name: 'Log Label Name', fn: () => console.log( $scope.io.name ) },
               { name: 'Log Scope', fn: () => console.log( $scope ) }
            ];
            $rootScope.$broadcast( 'menu.open', { event: e, menu: m } );
         }

      } );

      // $element.attachContextMenuService( [contextMenu] )

   }

   return {

      restrict: 'A',
      link

   };

} ];
