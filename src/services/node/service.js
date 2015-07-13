module.exports = [ 'nodeFactory', ( nodeFactory ) => {

   var nodes = [];
   var connections = [];

   var selectedNode = null;

   function getSelectedNode() {
      return selectedNode;
   }

   function setSelected( node ) {
      selectedNode = node;
   }

   function clearSelected() {
      selectedNode = null;
   }

   function run() {

      nodes.sort( ( a, b ) => { return a.order - b.order; } );

      nodes.filter( n => { return n.order !== -1; } ).forEach( n => {
         var err = n.compile();
         if ( err ) console.error( `Node order No.${n.order}`, err );
         n.execute();
      } );

   }

   function createEmptyNode() {
      var n = nodeFactory.create( 'Empty' );
      nodes.push( n );
      return n;
   }

   function generateNode() {

      var n;
      
      n = nodeFactory.create( 'Constants' );
      n.addOutput( 'x', 'y', 'z' );
      n._fnstr = 'return { x: 42, y: 33, z: 76 };';
      n.compile();
      nodes.push( n );

      n = nodeFactory.create( 'Vector3' );
      n.addInput( 'u', 'v', 'w' );
      n.addOutput( 'vec3' );
      n._fnstr = 'return { vec3: [ input.u, input.v, input.w ] };';
      n.compile();
      nodes.push( n );

      n = nodeFactory.create( 'Vector3' );
      n.addInput( 's', 't', 'p' );
      n.addOutput( 'vec3' );
      n._fnstr = 'return { vec3: [ input.s, input.t, input.p ] };';
      n.compile();
      nodes.push( n );

      n = nodeFactory.create( 'Dot' );
      n.addInput( 'v1', 'v2' );
      n.addOutput( 'f' );
      n._fnstr = 'return { f: input.v1[0]*input.v2[0]+input.v1[1]*input.v2[1]+input.v1[2]*input.v2[2] };';
      n.compile();
      nodes.push( n );

      n = nodeFactory.create( 'Console' );
      n.addInput( 'log' );
      n._fnstr = 'console.log( input.log );';
      n.compile();
      nodes.push( n );

   }

   function computeTopologicalOrder() {

      var deps = [];
      connections.forEach( pair => {

         var v1 = pair[ 0 ].getParent().uuid;
         var v2 = pair[ 1 ].getParent().uuid;
         deps.push( [ v2, v1 ] );

      } );

      var sorted = TOPOSORT( deps );
      nodes.forEach( n => { n.order = sorted.indexOf( n.uuid ); } );

   }

   function removeConnections( conn ) {

      var rm = [];
      connections.forEach( ( pair, idx ) => {
         if ( conn.uuid === pair[ conn.type ].uuid ) {
            pair[ 0 ].disconnect();
            rm.push( idx );
         }
      } );
      for ( let i = rm.length - 1; i >= 0; i -- ) {
         connections.splice( rm[ i ], 1 );
      }

   }

   function parseFunctionParameters( fnStr ) {
      var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
      var ARGUMENT_NAMES = /([^\s,]+)/g;
      fnStr = fnStr.replace(STRIP_COMMENTS, '');
      var result = fnStr.slice(fnStr.indexOf('(')+1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
      if ( result === null ) result = [];
      return result;
   }

   return {

      nodes,
      connections,
      generateNode,
      computeTopologicalOrder,
      removeConnections,
      clearSelected,
      setSelected,
      getSelectedNode,
      run,
      createEmptyNode

   };

} ];
