module.exports = [ '$timeout', ( $timeout ) => {

   function link( $scope, $element, $attrs, $controllers ) {

      var svgPannableCtrl = $controllers[ 0 ];

      svgPannableCtrl.addDragEvent( () => {

         $scope.$broadcast( 'connectionNeedsUpdate' );
         $scope.$apply();

      } );

      $scope.$on( 'zoomed', ( e, v ) => {
         svgPannableCtrl.scalingFactor = v;
      } );

   }

   function controller( $scope, $element, $attrs ) {

      $scope.headerHeight = 16;
      $scope.width = 0;
      $scope.height = 0;
      $scope.rowHeight = 16;
      $scope.connWidth = 10;
      $scope.connHeight = 10;
      $scope.connWidthOffset = 0;
      $scope.connHeightOffset = 3;
      $scope.labelSpacing = 5;

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

      var maxLabelWidth = 0;
      function setMaxLabelWidth( v ) {
         if ( v > maxLabelWidth ) maxLabelWidth = v;
      }

      function computeWidth() {
         $scope.width = ( maxLabelWidth + $scope.connWidth + $scope.labelSpacing * 2.0 );
         if ( $scope.numInput === 0 || $scope.numOutput === 0 ) $scope.width += 20;
         else $scope.width *= 2.0;
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

         maxLabelWidth = 0;
         $scope.$broadcast( 'requestLabelWidth', setMaxLabelWidth );
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
