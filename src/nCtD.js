module.exports = () => {

   return {

      restrict: 'E',
      templateNamespace: 'svg',
      template: '<path ng-attr-d="M{{start.x}},{{start.y}} C{{cp1.x}},{{cp1.y}} {{cp2.x}},{{cp2.y}} {{end.x}},{{end.y}}" id="curve"/>',
      replace: true,
      scope: {
         pair: '='
      },
      controller: ( $scope ) => {

         $scope.updateConnection = () => {

            var off = 5;

            $scope.start = {
               x: $scope.pair[ 0 ].position.left + off,
               y: $scope.pair[ 0 ].position.top + off
            };
            $scope.end = {
               x: $scope.pair[ 1 ].position.left + off,
               y: $scope.pair[ 1 ].position.top + off
            };

            //todo sort inp/opt cp side
            var cpOffset = Math.abs( $scope.start.x - $scope.end.x ) * 0.5;
            // cpOffset = cpOffset < 50 ? 50 : cpOffset * 0.5;

            $scope.cp1 = {
               x: $scope.start.x + cpOffset,
               y: $scope.start.y
            };
            $scope.cp2 = {
               x: $scope.end.x - cpOffset,
               y: $scope.end.y
            };

         };

         $scope.$watch( 'pair', ( newValue, oldValue ) => {

            $scope.updateConnection();

         }, true );

      }

   };

};
