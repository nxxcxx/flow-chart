module.exports = [ () => {

   var nodes = [];
   var connections = [];

   function generateNode() {

      var inputs = [ 'data', 'x', 'y', 'z', 'w', 'uv', 'mat4', 'vec2', 'color', 'geometry', 'vector3', 'buffer', 'mesh', 'material' ];
      var rndInt = n => { return ~~( Math.random() * n ); };

      var node = {
         title: inputs[ rndInt( inputs.length ) ],
         uuid: UUID(),
         input: genItems(),
         output: genItems(),
         order: -1
      };

      nodes.push( node );

      function genItems() {
         var res = [];
         for ( let i = 0; i < rndInt( 5 ) + 1; i++ ) {
            res.push( { name: inputs[ rndInt( inputs.length ) ], uuid: UUID() } );
         }
         return res;
      }

   }

   function computeExecutionOrder() {

      var deps = [];
      connections.forEach( pair => {

         var v1 = pair[ 0 ].parentUUID;
         var v2 = pair[ 1 ].parentUUID;
         deps.push( [ v2, v1 ] );

      } );

      var sorted = TOPOSORT( deps );
      nodes.forEach( n => { n.order = sorted.indexOf( n.uuid ); } );

   }

   return {

      nodes,
      connections,
      generateNode,
      computeExecutionOrder

   };

} ];
