module.exports = [ '$rootScope', 'nodeService', 'nodeEvent', ( $rootScope, nodeService, nodeEvent ) => {

   function link( $scope, $element, $attrs, $controllers ) {

      var nodeCtrl = $controllers[ 0 ];
      var dragCtrl = $controllers[ 1 ];
      var sortCtrl = $controllers[ 2 ];

      $element
      .on( 'mousedown', e => {
         dragCtrl.disableDrag();
         sortCtrl.disableSort();
         nodeEvent.startConnection( $scope.io );
         $rootScope.$broadcast( 'tempLinkStart', $scope.io.position );
      } )
      .on( 'mouseenter', e => {

      } )
      .on( 'mouseleave', e => {
         dragCtrl.enableDrag();
         sortCtrl.enableSort();

      } )
      .on( 'mouseup', e => {
         nodeEvent.endConnection( $scope.io );
      } )
      .on( 'dblclick', e => {
         nodeService.removeConnections( $scope.io );
         nodeService.computeTopologicalOrder();
         $scope.$apply();
      } );

      computePosition();

      $scope.$on( 'connectionNeedsUpdate', () => {
         computePosition();
      } );

      function computePosition() {
         var yOff = parseInt( $attrs.index ) * nodeCtrl.getRowHeight() + nodeCtrl.getHeaderHeight() + nodeCtrl.getConnHeightOffset() + nodeCtrl.getConnHeight() * 0.5;
         $scope.io.position = {
            left: dragCtrl.position.x + ( $scope.io.type ? nodeCtrl.getWidth() - 0.5 : 0 + 0.5 ),
            top: dragCtrl.position.y + yOff
         };
      }

   }

   return {

      restrict: 'AE',
      require: [ '^nodeModule', '^svgPannable', '^nodeSortable' ],
      scope: {
         io: '='
      },
      link

   };

} ];
