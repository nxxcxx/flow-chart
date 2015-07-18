module.exports = [ 'log', '$rootScope', 'nodeService', 'nodeEvent', ( log, $rootScope, nodeService, nodeEvent ) => {

   function link( $scope, $element, $attrs, $controllers ) {

      var nodeCtrl = $controllers[ 0 ];
      var dragCtrl = $controllers[ 1 ];
      var sortCtrl = $controllers[ 2 ];

      $scope.hover = false;
      $scope.linking = false;

      $element
      .on( 'mousedown', e => {
         dragCtrl.disableDrag();
         sortCtrl.disableSort();
         nodeEvent.startConnection( $scope.io );
         $rootScope.$broadcast( 'tempLinkStart', $scope.io.position );
         $scope.linking = true;
         $scope.$digest();
      } )
      .on( 'mouseenter', e => {
         $scope.hover = true;
         $scope.$digest();
      } )
      .on( 'mouseleave', e => {
         dragCtrl.enableDrag();
         sortCtrl.enableSort();
         $scope.hover = false;
         $scope.$digest();
      } )
      .on( 'mouseup', e => {
         nodeEvent.endConnection( $scope.io );
         $scope.$digest();
      } )
      .on( 'dblclick', e => {
         nodeService.removeConnections( $scope.io );
         nodeService.computeTopologicalOrder();
         $scope.$apply();
      } );

      $( 'body' )
      .on( 'mouseup', e => {
         if ( !$scope.linking ) return;
         $scope.linking = false;
         $scope.$digest();
      } );

      computePosition();

      $scope.$on( 'connectionNeedsUpdate', () => {
         computePosition();
      } );

      function computePosition() {
         var yOff = parseInt( $attrs.index ) * $scope.rowHeight + nodeCtrl.getHeaderHeight() + nodeCtrl.getConnHeightOffset() + nodeCtrl.getConnHeight() * 0.5;
         if ( !$scope.io.position ) $scope.io.position = {};
         $scope.io.position.left = dragCtrl.position.x + ( $scope.io.type ? nodeCtrl.getWidth() - 0.5 : 0 + 0.5 );
         $scope.io.position.top = dragCtrl.position.y + yOff;
      }

      log.debug( 'Scope', $scope.$id, 'Connector', $scope );

   }

   return {

      restrict: 'E',
      replace: true,
      require: [ '^xxBody', '^svgDraggable', '^xxSortable' ],
      templateNamespace: 'svg',
      templateUrl: './src/xx/template/xxConnector.html',
      link

   };

} ];
