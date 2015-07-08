module.exports = [ 'nodeService', ( nodeService ) => {

   function link( $scope, $element, $attrs, $controllers ) {

      $element.on( 'click', () => {
         nodeService.setSelected( $scope.nodeObject );
         $scope.$apply();
      } );

      $scope.$watch( nodeService.getSelectedNode, n => {
         if ( n ) $scope.isSelected = n.uuid === $scope.nodeObject.uuid;
      } );

   }

   return {

      restrict: 'A',
      link

   };

} ];
