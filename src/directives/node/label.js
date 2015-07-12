module.exports = [ '$timeout', ( $timeout ) => {

   function link( $scope, $element, $attrs ) {

      $scope.$on( 'requestLabelWidth', ( e, setMaxLabelWidth ) => {
         setMaxLabelWidth( $attrs.nodeLabel , $element[ 0 ].getComputedTextLength() );
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
