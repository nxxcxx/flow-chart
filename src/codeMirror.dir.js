module.exports = [ 'CM', 'nodeService', ( CM, nodeService ) => {

   function link( $scope, $element, $attrs ) {

      var cm = CM.create( $element[ 0 ], {
         mode: 'javascript',
         theme: 'elegant',
         lineNumbers: true,
         lineWrapping: true,
         tabSize: 3
      } );

      cm.setSize( '100%', 300 );
      cm.on( 'change', () => {
         var node = nodeService.getSelectedNode();
         if ( node ) {
            node._fnstr = cm.getValue();
            cm.clearHistory();
         }
      } );

   }

   return {

      restrict: 'E',
      replace: true,
      template: '<textarea></textarea>',
      link

   };

} ];
