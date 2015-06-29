module.exports = [ '$scope', '$rootScope', ( $scope, $rootScope ) => {

   global.scope = $scope;
   $scope.nodes = [];

   $scope.selConn = null;
   $scope.tgtConn = null;

   $scope.connection = [];

   var inputs = [ 'data', 'x', 'y', 'z', 'w', 'uv', 'mat4', 'vec2', 'color', 'geometry', 'vector3', 'buffer', 'mesh', 'material' ];

   function rnd() {
      return inputs[ ~~(Math.random() * inputs.length) ];
   }

   $scope.generateNode = () => {

      var node = {

         title: rnd(),
         uuid: UUID(),
         input: [ { name: rnd(), uuid: UUID() }, { name: rnd(), uuid: UUID() } , { name: rnd(), uuid: UUID() } ],
         output: [ { name: rnd(), uuid: UUID() }, { name: rnd(), uuid: UUID() } ]

      };

      $scope.nodes.push( node );
      return node;

   };

   $scope.$on( 'startConn', ( e, data ) => {

      $scope.selConn = data;
      e.stopPropagation();

   } );
   $scope.$on( 'endConn', ( e, data ) => {

      $scope.tgtConn = data;

      if ( $scope.selConn !== null && $scope.tgtConn !== null && $scope.selConn.uuid !== $scope.tgtConn.uuid ) {

         var pair = [ $scope.selConn, $scope.tgtConn ];
         // console.log( pair );
         // todo dont add dulplicate conn
         $scope.connection.push( pair );
         $scope.$apply();

      }

      //reset
      $scope.selConn = null;
      $scope.tgtConn = null;
      e.stopPropagation();

   } );

   $scope.$on( 'updateConnArray', ( e, conn ) => {

      $scope.connection.forEach( pair => {

         if ( conn.uuid === pair[ 0 ].uuid ) {

            pair[ 0 ] = conn;
            $scope.$apply();

         }
         if ( conn.uuid === pair[ 1 ].uuid ) {

            pair[ 1 ] = conn;
            $scope.$apply();

         }

      } );

   } );

   $scope.range = n => new Array( n );

} ];
