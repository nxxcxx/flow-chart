
function link( $scope, $element ) {

   $element.sortable( {
   } );
   $element.on( 'sort sortupdate sortstop', $scope.broadcastUpdateConn );

}

function controller( $scope, $element ) {

   this.enableSort = () => {
      $element.sortable( 'enable' );
      // console.log( 'sort enabled.' );
   };
   this.disableSort = () => {
      $element.sortable( 'disable' );
      // console.log( 'sort disabled.' );
   };

}

module.exports = () => {

   return {

      restrict: 'A',
      scope: true,
      link,
      controller

   };

};
