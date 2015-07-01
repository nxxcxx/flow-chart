
function link( $scope, $element, $attrs, $controllers ) {

   var svgPannableCtrl = $controllers[ 0 ];
   var nodeBoxCtrl = $controllers[ 1 ];

   $element
   .on( 'mouseenter', e  => {
      svgPannableCtrl.disableDrag();
   } )
   .on( 'mouseleave', e => {
      svgPannableCtrl.enableDrag();
   } )
   .on( 'mousedown', e => {
      $scope.startConn();
   } )
   .on( 'mouseup', e => {
      $scope.endConn();
   } );


   var temp = $scope.input ? $scope.input : $scope.output;
   var conn = {};
   conn.uuid = temp.uuid;
   conn.name = temp.name;
   conn.type = $scope.input ? 0 : 1;
   conn.parentUUID = $scope.parentNode.uuid;

   nodeBoxCtrl.setMaxConn( parseInt( $attrs.index ) + 1 );
   nodeBoxCtrl.computeHeight();


   updateConn();
   function updateConn() {
      
      var yOff = parseInt( $attrs.index ) * nodeBoxCtrl.getRowHeight() +
      nodeBoxCtrl.getHeaderHeight() + nodeBoxCtrl.getConnHeightOffset() + nodeBoxCtrl.getConnHeight() * 0.5;

      conn.position = {
         left: svgPannableCtrl.position.x + ( conn.type ? nodeBoxCtrl.getWidth() : 0 ),
         top: svgPannableCtrl.position.y + yOff
      };

   }
   $scope.startConn = () => {

      updateConn();
      $scope.$emit( 'startConn', conn );

   };

   $scope.endConn = () => {

      updateConn();
      $scope.$emit( 'endConn', conn );

   };

   $scope.$on( 'updateConnectionNOW!!', () => {
      updateConn();
   } );

}

module.exports = () => {

   return {

      restrict: 'AE',
      require: [ '^svgPannable', '^nodeBox' ],
      scope: {
         parentNode: '=',
         input: '=',
         output: '='
      },
      link

   };

};
