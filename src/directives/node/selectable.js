module.exports = [ 'nodeService', 'CM', ( nodeService, CM ) => {

   function link( $scope, $element, $attrs, $controllers ) {

      $element.on( 'click', () => {
         nodeService.setSelected( $scope.nodeObject );
         CM.getInstance().setValue( $scope.nodeObject._fnstr );
         $scope.$apply();
      } );

      $scope.$watch( nodeService.getSelectedNode, n => {
         if ( n ) $scope.isSelected = n.uuid === $scope.nodeObject.uuid;
         else $scope.isSelected = false;
      } );

   }

   return {

      restrict: 'A',
      link

   };

} ];
