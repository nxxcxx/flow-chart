module.exports = [ 'nodeService', 'nodeEvent', ( nodeService, nodeEvent ) => {

   function link( $scope, $element, $attrs, $controllers ) {

      var nodeCtrl = $controllers[ 0 ];
      var dragCtrl = $controllers[ 1 ];
      var sortCtrl = $controllers[ 2 ];

      $element
      .on( 'mousedown', e => {
         dragCtrl.disableDrag();
         sortCtrl.disableSort();
         nodeEvent.startConnection( $scope.io );
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


      updateConn();

      $scope.$on( 'connectionNeedsUpdate', () => {
         updateConn();
      } );

      function updateConn() {
         var yOff = parseInt( $attrs.index ) * nodeCtrl.getRowHeight() + nodeCtrl.getHeaderHeight() + nodeCtrl.getConnHeightOffset() + nodeCtrl.getConnHeight() * 0.5;
         yOff += $scope.io.type === 0 ? nodeCtrl.getOffsetInput() : nodeCtrl.getOffsetOutput();
         $scope.io.position = {
            left: dragCtrl.position.x + ( $scope.io.type ? nodeCtrl.getWidth() : 0 ),
            top: dragCtrl.position.y + yOff
         };
      }

   }

   return {

      restrict: 'AE',
      require: [ '^nodeBox', '^svgPannable', '^nodeSortable' ],
      scope: {
         io: '='
      },
      link

   };

} ];
