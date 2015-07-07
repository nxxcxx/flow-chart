module.exports = [ 'nodeFactory', ( nodeFactory ) => {

   function link( $scope, $element, $attrs, $controllers ) {

      $element.on( 'click', () => {
         nodeFactory.setSelected( $scope.nodeObject );
         $scope.$apply();
      } );

   }

   return {

      restrict: 'A',
      link

   };

} ];
