module.exports = [ '$timeout', ( $timeout ) => {

   function link( $scope, $element ) {

      $scope.$on( 'requestLabelWidth', ( e, setMaxLabelWidth ) => {
         setMaxLabelWidth( $element[ 0 ].getComputedTextLength() );
      } );

      $timeout( () => {
         if ( $scope.$last ) $scope.nodeObject.updateUI();
      } );

   }

   return {

      restrict: 'A',
      link

   };

} ];
