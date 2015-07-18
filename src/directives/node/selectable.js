module.exports = [ 'log', 'nodeService', 'CM', ( log, nodeService, CM ) => {

   function link( $scope, $element, $attrs, $controllers ) {

      $element.on( 'click', e => {
         nodeService.setSelected( $scope.nodeObject );
         CM.getInstance().setValue( $scope.nodeObject._fnstr );
         $scope.$apply();
      } );

      $scope.$watch( nodeService.getSelectedNode, n => {
         if ( n ) $scope.isSelected = n.uuid === $scope.nodeObject.uuid;
         else $scope.isSelected = false;
      } );

      log.debug( 'Scope', $scope.$id, 'Selectable', $scope );

   }

   return {

      restrict: 'A',
      link

   };

} ];
