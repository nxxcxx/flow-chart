
module.exports = [ 'log', '$scope', '$rootScope', 'nodeService', 'CM', ( log, $scope, $rootScope, nodeService, CM ) => {

   global.SCOPE = $scope;
   $scope.nodeService = nodeService;
   $scope.CM = CM;

   $scope.run = () => {
      nodeService.run();
      $scope.$apply();
   };
   
   // todo add / remove input, when add/remove input run apply this scope!
   // webaudio

} ];
