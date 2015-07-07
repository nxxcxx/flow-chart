module.exports = [ () => {

   var nodes = [];
   var connections = [];

   var selectedNode = null;

   function getSelectedNode() {
      // todo fix scope.$apply call too frequently
      return selectedNode;
   }

   function setSelected( node ) {
      selectedNode = node;
   }

   function run() {

      console.log( 'running...' );
      computeTopologicalOrder();
      nodes.sort( ( a, b ) => { return a.order - b.order; } );
      nodes.forEach( n => {

         if ( n.order === -1 ) return;

         if ( n.input.length === 0 ) {
            n.xn.exe();
         } else {
            var inpObj = {};
            n.input.forEach( inp => {
               inpObj[ inp.name ] = getIncomingInputAt( inp.uuid );
            } );
            console.log( n.title, 'input:', inpObj, n.uuid );
            n.xn.exe( inpObj );
         }

      } );
      console.log( '--------------------' );

   }

   function getIncomingInputAt( uuid ) {

      var parentUUID = null;
      var optUUID = null;
      connections.some( pair => {
         if ( pair[ 0 ].uuid === uuid ) {
            parentUUID = pair[ 1 ].parentUUID;
            optUUID = pair[ 1 ].uuid;
            return true;
         }
      } );

      var xnopt = null;
      nodes.some( n => {
         if ( n.uuid === parentUUID ) {
            n.output.some( opt => {
               if ( opt.uuid === optUUID ) {
                  xnopt = n.xn.result()[ opt.name ];
                  return true;
               }
            } );
            return true;
         }
      } );
      if ( xnopt === null ) console.error( 'input not found for:', uuid );
      return xnopt;

   }

   function generateNode() {

      createEmptyNode();

   }

   function parseFunctionParameters( fnStr ) {
      var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
      var ARGUMENT_NAMES = /([^\s,]+)/g;
      fnStr = fnStr.replace(STRIP_COMMENTS, '');
      var result = fnStr.slice(fnStr.indexOf('(')+1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
      if ( result === null ) result = [];
      return result;
   }

   function createEmptyNode() {

      var uuid = UUID();
      var node = {
         title: '',
         uuid: uuid,
         input: [],
         output: [],
         order: -1,
         xn: XN.define( uuid )
      };
      nodes.push( node );

   }

   function xxxxxxxxxx() {
      var uuid = UUID();

      var xn = XN.define( uuid );
      xn.input( 'u', 'v' ).output( 'vec2' ).task( 'return { vec2: [ u, v ] };' );

      var node = {
         title: 'Vector2',
         uuid: uuid,
         input: [ { name: 'u', uuid: UUID() }, { name: 'v', uuid: UUID() } ],
         output: [ { name: 'vec2', uuid: UUID() } ],
         order: -1,
         xn: xn
      };
      nodes.push( node );
   }

   function computeTopologicalOrder() {

      var deps = [];
      connections.forEach( pair => {

         var v1 = pair[ 0 ].parentUUID;
         var v2 = pair[ 1 ].parentUUID;
         deps.push( [ v2, v1 ] );

      } );

      var sorted = TOPOSORT( deps );
      nodes.forEach( n => { n.order = sorted.indexOf( n.uuid ); } );

   }

   function removeConnections( conn ) {

      var rm = [];
      connections.forEach( ( pair, idx ) => {
         if ( conn.uuid === pair[ conn.type ].uuid ) rm.push( idx );
      } );
      for ( let i = rm.length - 1; i >= 0; i -- ) {
         connections.splice( rm[ i ], 1 );
      }

   }

   return {

      nodes,
      connections,
      generateNode,
      computeTopologicalOrder,
      removeConnections,
      selectedNode,
      setSelected,
      getSelectedNode,
      run,
      getIncomingInputAt,

   };

} ];
