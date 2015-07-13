module.exports = [ () => {

	function link( $scope, $element, $attrs ) {

      $scope.type = $attrs.type;
      $scope.ioArray = $scope.nodeObject[ $attrs.type ];

      console.log( $scope.$id, 'IOCol', $attrs.type, $scope );

	}

	return {

		restrict: 'E',
		replace: true,
		templateNamespace: 'svg',
		templateUrl: './template/io-col.html',
		scope: true,
		link

	};

} ];
