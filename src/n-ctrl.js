
module.exports = [ '$scope', '$rootScope', ( $scope, $rootScope ) => {

   global.SCOPE = $scope;

   $scope.nodes = [];
   $scope.connection = [];

   $scope.selConn = null;
   $scope.tgtConn = null;

   $scope.generateNode = () => {

      var inputs = [ 'data', 'x', 'y', 'z', 'w', 'uv', 'mat4', 'vec2', 'color', 'geometry', 'vector3', 'buffer', 'mesh', 'material' ];

      function rnd() {
         return inputs[ ~~(Math.random() * inputs.length) ];
      }

      var node = {

         title: rnd(),
         uuid: UUID(),
         input: [ { name: rnd(), uuid: UUID() }, { name: rnd(), uuid: UUID() } , { name: rnd(), uuid: UUID() } ],
         output: [ { name: rnd(), uuid: UUID() }, { name: rnd(), uuid: UUID() } ]

      };

      $scope.nodes.push( node );
      return node;

   };

   $scope.$on( 'startConn', ( e, conn ) => {

      e.stopPropagation();
      $scope.selConn = conn;

   } );

   $scope.$on( 'endConn', ( e, conn ) => {

      e.stopPropagation();
      $scope.tgtConn = conn;

      // register connection
      if ( $scope.selConn !== null && $scope.tgtConn !== null && $scope.selConn.uuid !== $scope.tgtConn.uuid ) {

         var pair = [ $scope.selConn, $scope.tgtConn ];
         // todo dont add dulplicate conn & slef conn
         $scope.connection.push( pair );
         $scope.$apply();

      }

      //reset
      $scope.selConn = null;
      $scope.tgtConn = null;

   } );

} ];
