module.exports = [ '$timeout', ( $timeout ) => {

   function link( $scope, $element, $attrs, $controllers ) {

      var svgPannableCtrl = $controllers[ 0 ];
      var svgZoomableCtrl = $controllers[ 1 ];

      svgPannableCtrl.addDragEvent( () => {

         $scope.$broadcast( 'connectionNeedsUpdate' );
         $scope.$apply();

      } );

      $scope.$on( 'zoomed', ( e, v ) => {
         svgPannableCtrl.scalingFactor = v;
      } );

      svgPannableCtrl.scalingFactor = svgZoomableCtrl.scalingFactor;

   }

   function controller( $scope, $element, $attrs ) {

      $scope.headerHeight = 10;
      $scope.width = 0;
      $scope.height = 0;
      $scope.rowHeight = 10;
      $scope.connWidth = 5;
      $scope.connHeight = 5;
      $scope.connWidthOffset = 0.5;
      $scope.connHeightOffset = 2.5;
      $scope.labelSpacing = 2;

      $scope.numInput = $scope.nodeObject.input.length;
      $scope.numOutput = $scope.nodeObject.output.length;
      $scope.offsetInput = 0;
      $scope.offsetOutput = 0;

      this.getHeaderHeight     = () => { return $scope.headerHeight; };
      this.getWidth            = () => { return $scope.width; };
      this.getRowHeight        = () => { return $scope.rowHeight; };
      this.getConnWidth        = () => { return $scope.connWidth; };
      this.getConnHeight       = () => { return $scope.connHeight; };
      this.getConnHeightOffset = () => { return $scope.connHeightOffset; };
      this.getOffsetInput      = () => { return $scope.offsetInput; };
      this.getOffsetOutput     = () => { return $scope.offsetOutput; };

      var computedHeaderWidth = 0;
      var maxComputedInputWidth = 0;
      var maxComputedOutputWidth = 0;
      function requestLabelWidth( type, v ) {
         if ( type === 'header' ) computedHeaderWidth = v;
         else if ( type === 'input' && v > maxComputedInputWidth ) maxComputedInputWidth = v;
         else if ( type === 'output' && v > maxComputedOutputWidth ) maxComputedOutputWidth = v;
      }

      function computeWidth() {
         var maxBodyWidth = 5 + maxComputedInputWidth + maxComputedOutputWidth + ( $scope.connWidth + $scope.labelSpacing ) * 2.0;
         var headerWidth = computedHeaderWidth + 15;
         $scope.width = Math.max( headerWidth, maxBodyWidth );
      }

      function computeHeight() {
         var maxConn = Math.max( $scope.nodeObject.input.length, $scope.nodeObject.output.length );
         $scope.height = $scope.headerHeight + ( maxConn * $scope.rowHeight );
      }

      function computeVerticalOffsetIO() {
         $scope.offsetInput = ( ($scope.height - $scope.headerHeight) * 0.5 ) - ( $scope.numInput * $scope.rowHeight ) * 0.5;
         $scope.offsetOutput = ( ($scope.height - $scope.headerHeight) * 0.5 ) - ( $scope.numOutput * $scope.rowHeight ) * 0.5;
      }

      function updateUI() {
         $scope.numInput = $scope.nodeObject.input.length;
         $scope.numOutput = $scope.nodeObject.output.length;
         $scope.offsetInput = 0;
         $scope.offsetOutput = 0;

         computedHeaderWidth = 0;
         maxComputedInputWidth = 0;
         maxComputedOutputWidth = 0;
         $scope.$broadcast( 'requestLabelWidth', requestLabelWidth );
         computeWidth();
         computeHeight();
         // computeVerticalOffsetIO();
         $scope.$broadcast( 'connectionNeedsUpdate' );
      }

      $scope.$watch( () => { return $scope.nodeObject._ui.update; }, updateUI );

   }

   return {
      restrict: 'E',
      replace: true,
      require: [ '^svgPannable', '^svgZoomable' ],
      templateNamespace: 'svg',
      templateUrl: './template/node.svg',
      scope: {
         nodeObject: '='
      },
      link,
      controller
   };

} ];
