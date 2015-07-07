
module.exports = [ '$scope', 'nodeFactory', ( $scope, nodeFactory ) => {

   global.SCOPE = $scope;

   $scope.nodeFactory = nodeFactory;

   $scope.run = () => {

      nodeFactory.run();
      $scope.$apply();

   };

   // $scope.NEED_MORE_NODES = n => {
   //    for( let i = 0; i < n; i ++ ) {
   //       nodeFactory.generateNode();
   //       console.log( 1 );
   //    }
   //    $scope.$apply();
   // };

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
                  nodeFactory.connections.push( pair );
                  nodeFactory.computeTopologicalOrder();
                  $scope.$apply();
               }

            }

         }

         // reset
         iniConn = null;
         endConn = null;

      } );

      function isDuplicate( src, tgt ) {

         return nodeFactory.connections.some( pair => pair[ 0 ].uuid === src.uuid && pair[ 1 ].uuid === tgt.uuid );

      }
   //

} ];
