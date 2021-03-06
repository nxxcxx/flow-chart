module.exports = [ 'updateLinkEvent', ( updateLinkEvent ) => {

	function link( $scope ) {

		function updateConnection() {

			$scope.start = {
				x: $scope.pair[ 0 ].position.left,
				y: $scope.pair[ 0 ].position.top
			};
			$scope.end = {
				x: $scope.pair[ 1 ].position.left,
				y: $scope.pair[ 1 ].position.top
			};

			var cpOffset = Math.abs( $scope.start.x - $scope.end.x ) * 0.5;

			$scope.cp1 = {
				x: $scope.start.x - cpOffset,
				y: $scope.start.y
			};
			$scope.cp2 = {
				x: $scope.end.x + cpOffset,
				y: $scope.end.y
			};

		}

		function watcher() { return [ $scope.pair[ 0 ].position, $scope.pair[ 1 ].position ]; }
		$scope.$watch( watcher, updateConnection, true );

		updateLinkEvent.listen( () => {
			$scope.$digest();
		} );

	}

	return {

		restrict: 'E',
		replace: true,
		templateNamespace: 'svg',
		template: '<path ng-attr-d="M{{start.x}},{{start.y}} C{{cp1.x}},{{cp1.y}} {{cp2.x}},{{cp2.y}} {{end.x}},{{end.y}}"/>',
		scope: true,
		link

	};

} ];
