module.exports = [ '$timeout', ( $timeout ) => {

   function link( $scope, $element, $attrs, $controllers ) {

      var nodeCtrl = $controllers[ 0 ];

      $timeout( () => {

         nodeCtrl.setMaxLabelWidth( $element[ 0 ].getComputedTextLength() );
         nodeCtrl.computeWidth();
         $scope.$broadcast( 'connectionNeedsUpdate' );

      } );

      $scope.$watch( () => {
         return $element[ 0 ].getComputedTextLength();
      }, v => {
         nodeCtrl.setMaxLabelWidth( v );
         nodeCtrl.computeWidth();
         $scope.$broadcast( 'connectionNeedsUpdate' );
      }, true );

   }

   return {

      restrict: 'A',
      require: [ '^nodeBox' ],
      link

   };

} ];
