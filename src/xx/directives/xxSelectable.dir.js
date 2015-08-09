module.exports = [ 'log', 'nodeService', 'CM', '$rootScope', ( log, nodeService, CM, $rootScope ) => {

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

      $element.on( 'contextmenu', e => {

         e.stopPropagation();
         e.preventDefault();

         var m = [
            { name: 'Log Scope', fn: () => console.log( $scope ) }
         ];
         $rootScope.$broadcast( 'menu.open', { event: e, menu: m } );

      } );

   }

   return {

      restrict: 'A',
      link

   };

} ];
