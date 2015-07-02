module.exports = [ () => {

   function link( $scope, $element, $attrs, $controllers ) {

      var dragCtrl = $controllers[ 0 ];
      var nodeCtrl = $controllers[ 1 ];
      var sortCtrl = $controllers[ 2 ];

      $element
      .on( 'mouseenter', e  => {
         dragCtrl.disableDrag();
         sortCtrl.disableSort();
      } )
      .on( 'mouseleave', e => {
         dragCtrl.enableDrag();
         sortCtrl.enableSort();
      } )
      .on( 'mousedown', e => {
         startConn();
      } )
      .on( 'mouseup', e => {
         endConn();
      } );

      var io = $scope.input ? $scope.input : $scope.output;
      var conn = {};
      conn.uuid = io.uuid;
      conn.name = io.name;
      conn.type = $scope.input ? 0 : 1;
      conn.parentUUID = $scope.parentUuid;

      updateConn();

      $scope.$on( 'connectionNeedsUpdate', () => {
         updateConn();
      } );

      function updateConn() {
         var yOff = parseInt( $attrs.index ) * nodeCtrl.getRowHeight() + nodeCtrl.getHeaderHeight() + nodeCtrl.getConnHeightOffset() + nodeCtrl.getConnHeight() * 0.5;

         conn.position = {
            left: dragCtrl.position.x + ( conn.type ? nodeCtrl.getWidth() : 0 ),
            top: dragCtrl.position.y + yOff
         };
      }
      function startConn() {
         $scope.$emit( 'startConn', conn );
      }
      function endConn() {
         $scope.$emit( 'endConn', conn );
      }

   }

   return {

      restrict: 'AE',
      require: [ '^svgPannable', '^nodeBox', '^nodeSortable' ],
      scope: {
         parentUuid: '@',
         input: '=',
         output: '='
      },
      link

   };

} ];
