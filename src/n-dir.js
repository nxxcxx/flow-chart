
function controller( $scope, $element ) {

   $( $element ).draggable();

   $scope.broadcastUpdateConn = () => {
      setTimeout( () => $scope.$broadcast( 'connectionNeedsUpdate' ), 0 );
   };

   $( $element ).on( 'drag dragstart dragstop', $scope.broadcastUpdateConn );

   this.enableDrag = () => {
      $( $element ).draggable( 'enable' );
      // console.log( 'drag enabled.' );
   };
   this.disableDrag = () => {
      $( $element ).draggable( 'disable' );
      // console.log( 'drag disabled.' );
   };

}

module.exports = () => {

   return {
      restrict: 'E',
      replace: true,
      templateUrl: './template/node.html',
      scope: {
         nodeObject: '='
      },
      controller
   };

};
