function link( $scope, $element, $attrs, $controllers ) {

   var svgPannableCtrl = $controllers[ 0 ];

   svgPannableCtrl.addDragEvent( () => {

      $scope.$broadcast( 'updateConnectionNOW!!' );
      $scope.$apply();

   } );

   $scope.$on( 'zoomed', ( e, v ) => svgPannableCtrl.scalingFactor = v );

}

function controller( $scope, $element, $attrs ) {

   $scope.headerHeight = 20;
   $scope.width = 0;
   $scope.height = 0;
   $scope.rowHeight = 20;
   $scope.connWidth = 10;
   $scope.connHeight = 10;
   $scope.connHeightOffset = 5;
   $scope.labelSpacing = 5;

   this.getHeaderHeight     = () => { return $scope.headerHeight; };
   this.getWidth            = () => { return $scope.width; };
   this.getRowHeight        = () => { return $scope.rowHeight; };
   this.getConnWidth        = () => { return $scope.connWidth; };
   this.getConnHeight       = () => { return $scope.connHeight; };
   this.getConnHeightOffset = () => { return $scope.connHeightOffset; };

   var maxConn = 0;
   this.setMaxConn = n => {
      if ( n > maxConn ) maxConn = n;
   };
   var labelWidth = 0;
   this.setLabelWidth = n => {
      if ( n > labelWidth ) labelWidth = n;
   };

   this.computeWidth = () => {
      $scope.width = ( labelWidth + $scope.connWidth + $scope.labelSpacing * 2.0 ) * 2.0;
   };

   this.computeHeight = () => {
      $scope.height = $scope.headerHeight + ( maxConn * $scope.rowHeight );
   };

}

module.exports = () => {

   return {
      restrict: 'E',
      replace: true,
      require: [ '^svgPannable' ],
      templateNamespace: 'svg',
      templateUrl: './template/node.svg',
      scope: {
         nodeObject: '='
      },
      link,
      controller
   };

};
