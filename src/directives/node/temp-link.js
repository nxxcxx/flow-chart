module.exports = [ '$rootScope', ( $rootScope ) => {

   function link( $scope, $element, $attrs, $controllers ) {

      // make element click thruable
      $element.css( 'pointer-events', 'none' );

      var panCtrl = $controllers[ 0 ];
      var zoomCtrl = $controllers[ 1 ];
      $scope.active = false;
      $scope.start = { x: 0, y: 0 };
      $scope.cp1 = { x: 0, y: 0 };
      $scope.cp2 = { x: 0, y: 0 };
      $scope.end = { x: 0, y: 0 };

      $rootScope.$on( 'tempLinkStart', ( e, pos ) => {
         $scope.active = true;
         $scope.start.x = pos.left;
         $scope.start.y = pos.top;
         $scope.cp1 = $scope.start;
      } );

      $( 'body' )
      .on( 'mousemove', e => {
         if ( !$scope.active ) return;
         var off =  $( '#nodeCanvas').offset();

         var cx = e.pageX - off.left;
         var cy = e.pageY - off.top;
         var sc = zoomCtrl.scalingFactor;

         var pos = panCtrl.getPosition();
         var ox = pos.x;
         var oy = pos.y;

         $scope.end.x = ( cx - ox ) / sc;
         $scope.end.y = ( cy - oy ) / sc;

         $scope.cp2 = $scope.end;
         $scope.$digest();
      } )
      .on( 'mouseup', e => {
         $scope.active = false;
         $scope.$digest();
      } );

	}

	return {

		restrict: 'E',
		replace: true,
      require: [ '^svgPannable', '^svgZoomable' ],
		templateNamespace: 'svg',
		template: '<path ng-show="active" ng-attr-d="M{{start.x}},{{start.y}} C{{cp1.x}},{{cp1.y}} {{cp2.x}},{{cp2.y}} {{end.x}},{{end.y}}"/>',
		scope: {
			pair: '='
		},
		link

	}

} ];
