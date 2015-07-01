
module.exports = [ '$timeout', ( $timeout ) => {

   function link( $scope, $element, $attrs, $controllers ) {

      var nodeBoxCtrl = $controllers[ 0 ];

      $timeout( () => {
         nodeBoxCtrl.setLabelWidth( $element[ 0 ].getComputedTextLength() );
         nodeBoxCtrl.computeWidth();
      } );

   }

   return {

      restrict: 'A',
      require: [ '^nodeBox' ],
      link

   };

} ];
