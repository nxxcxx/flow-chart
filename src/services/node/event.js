module.exports = [ '$rootScope', 'nodeService', ( $rootScope, nodeService ) => {

   var iniConn = null;

   function startConnection( conn ) {
      iniConn = conn;
   }

   function endConnection( endConn ) {

      if ( validateConnection( iniConn, endConn ) ) {

         var pair = [];
         pair[ iniConn.type ] = iniConn;
         pair[ endConn.type ] = endConn;

         if ( !isCyclic( pair ) ) {
            if ( !isDuplicate( pair[ 0 ], pair[ 1 ] ) ) {

               if ( !pair[ 0 ].available ) {
                  nodeService.removeConnections( pair[ 0 ] );
               }

               pair[ 0 ].connect( pair[ 1 ] );
               nodeService.connections.push( pair );
               nodeService.computeTopologicalOrder();
               $rootScope.$apply();

            } else {
               console.log( 'Duplicated pair.' );
            }
         } else {
            console.log( 'Cyclic dependency.' );
         }

      }

      resetConn();

   }

   function resetConn() {
      iniConn = null;
   }

   function validateConnection( a, b ) {

      return (
         a !== null && b !== null &&
         a.getParent().uuid !== b.getParent().uuid &&
         a.type !== b.type
      );

   }

   function isDuplicate( inp, opt ) {
      return nodeService.connections.some( pair => pair[ 0 ].uuid === inp.uuid && pair[ 1 ].uuid === opt.uuid );
   }

   function isCyclic( pair ) {
      var tmp = nodeService.connections.slice();
      tmp.push( pair );
      try {
         nodeService.topoSort( tmp );
      } catch ( e ) {
         return true;
      }
      return false;
   }

   return {

      startConnection,
      endConnection

   };

} ];
