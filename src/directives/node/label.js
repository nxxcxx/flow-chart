module.exports = [ 'log', '$timeout', '$rootScope', ( log, $timeout, $rootScope ) => {

   function link( $scope, $element, $attrs ) {

      $scope.$on( 'requestLabelWidth', ( e, setMaxLabelWidth ) => {
         setMaxLabelWidth( $attrs.nodeLabel , $element[ 0 ].getComputedTextLength() );
      } );

      $timeout( () => {
         if ( $scope.$last ) $scope.nodeObject.updateUI();
      } );

      log.debug( 'Scope', $scope.$id, 'Label', $attrs.nodeLabel, $scope );


      $element.on( 'contextmenu', e => {

         if ( $scope.io && e.target === $element[ 0 ] ) {
            var m = [
               { name: 'Log Label Name', fn: () => console.log( $scope.io.name ) },
               { name: 'Log Scope', fn: () => console.log( $scope ) }
            ];
            $rootScope.$broadcast( 'menu.open', { event: e, menu: m } );
         }

      } );

   }

   return {

      restrict: 'A',
      link

   };

} ];
