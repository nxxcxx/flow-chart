
module.exports = [ 'log', '$scope', 'nodeService', ( log, $scope, nodeService ) => {

   global.SCOPE = $scope;
   $scope.nodeService = nodeService;

   $scope.run = () => {
      nodeService.run();
      $scope.$apply();
   };

   // todo add / remove input, when add/remove input run apply this scope!
   // webaudio

   log.debug( 'Scope', $scope.$id, 'nodeCtrl', $scope );

} ];
