
module.exports = [ '$scope', 'nodeService', 'nodeFactory', ( $scope, nodeService, nodeFactory ) => {

   global.SCOPE = $scope;

   global.nf = nodeFactory;

   $scope.nodeService = nodeService;

   $scope.run = () => {

      nodeService.run();
      $scope.$apply();

   };

   // handle user interaction with connector
      var iniConn = null;
      var endConn = null;
      $scope.$on( 'startConn', ( e, conn ) => {

         e.stopPropagation();
         iniConn = conn;

      } );

      $scope.$on( 'endConn', ( e, conn ) => {

         e.stopPropagation();
         endConn = conn;

         // register conn
         if (
            iniConn !== null && endConn !== null &&
            iniConn.uuid !== endConn.uuid &&
            iniConn.parentUUID !== endConn.parentUUID
         ) {

            if ( iniConn.type !== endConn.type ) {

               var pair = [];
               pair[ iniConn.type ] = iniConn;
               pair[ endConn.type ] = endConn;

               if ( !isDuplicate( pair[ 0 ], pair[ 1 ] ) ) {
                  nodeService.connections.push( pair );
                  nodeService.computeTopologicalOrder();
                  $scope.$apply();
               }

            }

         }

         // reset
         iniConn = null;
         endConn = null;

      } );

      function isDuplicate( src, tgt ) {
         return nodeService.connections.some( pair => pair[ 0 ].uuid === src.uuid && pair[ 1 ].uuid === tgt.uuid );
      }
   //

} ];
