module.exports = [ () => {

   function link( $scope, $element, $attrs, $controllers ) {

      var svgPannableCtrl = $controllers[ 0 ];

      svgPannableCtrl.addDragEvent( () => {

         $scope.$broadcast( 'connectionNeedsUpdate' );
         $scope.$apply();

      } );

      $scope.$on( 'zoomed', ( e, v ) => svgPannableCtrl.scalingFactor = v );

   }

   function controller( $scope, $element, $attrs ) {

      $scope.headerHeight = 20;
      $scope.width = 0;
      $scope.height = 0;
      $scope.rowHeight = 16;
      $scope.connWidth = 10;
      $scope.connHeight = 10;
      $scope.connHeightOffset = 3;
      $scope.labelSpacing = 5;

      this.getHeaderHeight     = () => { return $scope.headerHeight; };
      this.getWidth            = () => { return $scope.width; };
      this.getRowHeight        = () => { return $scope.rowHeight; };
      this.getConnWidth        = () => { return $scope.connWidth; };
      this.getConnHeight       = () => { return $scope.connHeight; };
      this.getConnHeightOffset = () => { return $scope.connHeightOffset; };

      var maxLabelWidth = 0;
      this.setMaxLabelWidth = v => {
         if ( v > maxLabelWidth ) maxLabelWidth = v;
      };

      this.computeWidth = () => {
         $scope.width = ( maxLabelWidth + $scope.connWidth + $scope.labelSpacing * 2.0 ) * 2.0;
      };

      this.computeHeight = () => {
         var maxConn = Math.max( $scope.nodeObject.input.length, $scope.nodeObject.output.length );
         $scope.height = $scope.headerHeight + ( maxConn * $scope.rowHeight );
      };
      this.computeHeight();

   }

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

} ];
