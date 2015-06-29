
function link( $scope, $element, $attrs, $controller ) {

   var nodeDirCtrl = $controller[ 0 ];
   var nodeSortCtrl = $controller[ 1 ];

   $( $element )
   .on( 'mouseenter', e  => {
      nodeDirCtrl.disableDrag();
      nodeSortCtrl.disableSort();
   } )
   .on( 'mouseleave', e => {
      nodeDirCtrl.enableDrag();
      nodeSortCtrl.enableSort();
   } )
   .on( 'mousedown', e => {
      $scope.startConn();
   } )
   .on( 'mouseup', e => {
      $scope.endConn();
   } );

   var conn = {};
   updateConn();
   function updateConn() {

      conn.name = $( $element ).parent().text().trim();
      conn.uuid = $scope.uuid;
      conn.position = $( $element ).offset();

   }

   $scope.startConn = () => {

      updateConn();
      $scope.$emit( 'startConn', conn );

   };

   $scope.endConn = () => {

      updateConn();
      $scope.$emit( 'endConn', conn );

   };

   $scope.$on( 'connectionNeedsUpdate', () => {

      updateConn();
      $scope.$apply();

   } );

}

module.exports = () => {

   return {

      restrict: 'E',
      require: [ '^node', '^sortable' ],  // todo change name to nodeContainer? & nodeItem?
      scope: {
         uuid: '='
      },
      link

   };

};
