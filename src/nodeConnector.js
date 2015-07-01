
function link( $scope, $element, $attrs, $controller ) {

   var nodeDirCtrl = $controller[ 0 ];
   var nodeSortCtrl = $controller[ 1 ];

   $element
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

   var conn = $scope.input ? $scope.input : $scope.output;
   conn.type = $scope.input ? 0 : 1;
   conn.parentUUID = $scope.parentNode.uuid;

   updateConn();
   function updateConn() {

      conn.position = $element.offset();
      conn.position.left -= $( '#nodeCanvas' ).offset().left;
      conn.position.top -= $( '#nodeCanvas' ).offset().top;

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
      require: [ '^nodeBox', '^nodeItem' ],
      scope: {
         parentNode: '=',
         input: '=',
         output: '='
      },
      link

   };

};

// todo chop directive
