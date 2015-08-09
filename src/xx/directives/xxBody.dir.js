module.exports = [ 'log', 'updateLinkEvent', ( log, updateLinkEvent ) => {

   function link( $scope, $element, $attrs, $controllers ) {

      var svgDraggableCtrl = $controllers[ 0 ];
      var svgZoomableCtrl = $controllers[ 1 ];

      svgDraggableCtrl.addDragEvent( () => {

         $scope.$broadcast( 'connectionNeedsUpdate' );
         updateLinkEvent.broadcast();

      } );

      $scope.$on( 'zoomed', ( e, v ) => {
         svgDraggableCtrl.scalingFactor = v;
      } );

      svgDraggableCtrl.scalingFactor = svgZoomableCtrl.scalingFactor;

      log.debug( 'Scope', $scope.$id, 'Node', $scope );

   }

   function controller( $scope, $element, $attrs ) {

      var body = this;

      $scope.headerHeight = 10;
      $scope.width = 0;
      $scope.height = 0;
      $scope.rowHeight = 10;
      $scope.connWidth = 3.5;
      $scope.connHeight = 4;
      $scope.connWidthOffset = -0.5;
      $scope.connHeightOffset = 3;
      $scope.labelSpacing = 2;

      $scope.numInput = $scope.nodeObject.input.length;
      $scope.numOutput = $scope.nodeObject.output.length;

      this.getHeaderHeight     = () => { return $scope.headerHeight; };
      this.getWidth            = () => { return $scope.width; };
      this.getRowHeight        = () => { return $scope.rowHeight; };
      this.getConnWidth        = () => { return $scope.connWidth; };
      this.getConnHeight       = () => { return $scope.connHeight; };
      this.getConnHeightOffset = () => { return $scope.connHeightOffset; };

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

      function updateUI() {
         $scope.numInput = $scope.nodeObject.input.length;
         $scope.numOutput = $scope.nodeObject.output.length;

         computedHeaderWidth = 0;
         maxComputedInputWidth = 0;
         maxComputedOutputWidth = 0;
         $scope.$broadcast( 'requestLabelWidth', requestLabelWidth );
         computeWidth();
         computeHeight();
         $scope.$broadcast( 'connectionNeedsUpdate' );
      }

      $scope.$watch( () => { return $scope.nodeObject._ui.update; }, updateUI );
      
   }

   return {

      restrict: 'E',
      replace: true,
      require: [ '^svgDraggable', '^svgZoomable' ],
      templateNamespace: 'svg',
      templateUrl: './src/xx/template/xxBody.html',
      link,
      controller,
      controllerAs: 'body'

   };

} ];
