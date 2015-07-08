module.exports = [ 'nodeService', ( nodeService ) => {

   function link( $scope, $element, $attrs, $controllers ) {

      $element.on( 'click', () => {
         nodeService.setSelected( $scope.nodeObject );
         $scope.$apply();
      } );

   }

   return {

      restrict: 'A',
      link

   };

} ];
