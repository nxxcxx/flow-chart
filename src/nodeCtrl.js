
module.exports = [ '$scope', '$rootScope', 'nodeService', ( $scope, $rootScope, nodeService ) => {

   global.SCOPE = $scope;
   $scope.nodeService = nodeService;

} ];
