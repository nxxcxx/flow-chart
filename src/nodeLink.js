function controller( $scope ) {

	function updateConnection() {

		var off = 5;

		$scope.start = {
			x: $scope.pair[ 0 ].position.left + off,
			y: $scope.pair[ 0 ].position.top + off
		};
		$scope.end = {
			x: $scope.pair[ 1 ].position.left + off,
			y: $scope.pair[ 1 ].position.top + off
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

	$scope.$watch( 'pair', updateConnection, true );

}

module.exports = () => {

	return {

		restrict: 'E',
		replace: true,
		templateNamespace: 'svg',
		template: '<path ng-attr-d="M{{start.x}},{{start.y}} C{{cp1.x}},{{cp1.y}} {{cp2.x}},{{cp2.y}} {{end.x}},{{end.y}}" id="curve"/>',
		scope: {
			pair: '='
		},
		controller

	};

};
