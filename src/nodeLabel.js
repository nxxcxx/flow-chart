module.exports = [ '$timeout', ( $timeout ) => {

   function link( $scope, $element, $attrs, $controllers ) {

      var nodeCtrl = $controllers[ 0 ];

      $timeout( () => {

         nodeCtrl.setMaxLabelWidth( $element[ 0 ].getComputedTextLength() );
         if ( $scope.$last ) {
            nodeCtrl.computeWidth();
            $scope.$broadcast( 'connectionNeedsUpdate' );
         }

      } );

   }

   return {

      restrict: 'A',
      require: [ '^nodeBox' ],
      link

   };

} ];
