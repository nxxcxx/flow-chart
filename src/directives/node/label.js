module.exports = [ 'log', '$timeout', ( log, $timeout ) => {

   function link( $scope, $element, $attrs ) {

      $scope.$on( 'requestLabelWidth', ( e, setMaxLabelWidth ) => {
         setMaxLabelWidth( $attrs.nodeLabel , $element[ 0 ].getComputedTextLength() );
      } );

      $timeout( () => {
         if ( $scope.$last ) $scope.nodeObject.updateUI();
      } );

      log.debug( 'Scope', $scope.$id, 'Label', $attrs.nodeLabel, $scope );

   }

   return {

      restrict: 'A',
      link

   };

} ];
