
module.exports = [ '$scope', '$rootScope', ( $scope, $rootScope ) => {

   global.SCOPE = $scope;

   $scope.nodes = [];
   $scope.connection = [];

   $scope.generateNode = () => {

      var inputs = [ 'data', 'x', 'y', 'z', 'w', 'uv', 'mat4', 'vec2', 'color', 'geometry', 'vector3', 'buffer', 'mesh', 'material' ];

      var rndInt = n => { return ~~( Math.random() * n ); };

      var node = {
         title: inputs[ rndInt( inputs.length ) ],
         uuid: UUID(),
         input: genItems(),
         output: genItems()
      };

      $scope.nodes.push( node );

      function genItems() {
         var res = [];
         for ( let i = 0; i < rndInt( 5 ) + 1; i++ ) {
            res.push( { name: inputs[ rndInt( inputs.length ) ], uuid: UUID() } );
         }
         return res;
      }

   };
   $scope.generateNode();

   $scope.NEED_MORE_NODES = n => {
      for( let i = 0; i < n; i ++ ) {
         $scope.generateNode();
         console.log( 1 );
      }
      $scope.$apply();
      console.log( 'done' );
   };

   // store which conn is initiator
   var iniConn = null;
   var endConn = null;
   $scope.$on( 'startConn', ( e, conn ) => {

      e.stopPropagation();
      iniConn = conn;

   } );

   $scope.$on( 'endConn', ( e, conn ) => {

      e.stopPropagation();
      endConn = conn;

      // register connection
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
               $scope.connection.push( pair );
               $scope.$apply();
            } else {
               console.log( 'dupes conn' );
            }

         }

      }

      // reset
      iniConn = null;
      endConn = null;

   } );

   function isDuplicate( src, tgt ) {

      return $scope.connection.some( pair => pair[ 0 ].uuid === src.uuid && pair[ 1 ].uuid === tgt.uuid );

   }

} ];
