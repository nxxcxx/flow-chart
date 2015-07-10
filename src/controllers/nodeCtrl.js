
module.exports = [ '$scope', '$rootScope', 'nodeService', 'CM', ( $scope, $rootScope, nodeService, CM ) => {

   global.SCOPE = $scope;
   $scope.nodeService = nodeService;
   $scope.CM = CM;

   $scope.run = () => {
      nodeService.run();
      $scope.$apply();
   };

} ];
