module.exports = [ 'log', ( log ) => {

	function link( $scope, $element, $attrs ) {

      $scope.type = $attrs.type;
      $scope.ioArray = $scope.nodeObject[ $attrs.type ];

      log.debug( 'Scope', $scope.$id, 'IOCol', $attrs.type, $scope );

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
