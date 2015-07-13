module.exports = [ () => {

	function link( $scope, $element, $attrs ) {

      $scope.type = $attrs.type;
      $scope.ioArray = $scope.nodeObject[ $attrs.type ];

	}

	return {

		restrict: 'E',
		replace: true,
		templateNamespace: 'svg',
		templateUrl: './template/io-col.svg',
		scope: true,
		link

	};

} ];
