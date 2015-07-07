module.exports = [ () => {

   function link( $scope, $element, $attrs ) {

      var textArea = $element[ 0 ];
      var editor = CodeMirror.fromTextArea( textArea, {
         mode: 'javascript',
         lineNumbers: true,
         lineWrapping: true,
         tabSize: 3
      } );

      editor.setSize( '100%', 500 );

      editor.on( 'change', () => {


      } );

   }

   return {

      restrict: 'E',
      replace: true,
      template: '<textarea id="codeEditor"></textarea>',
      link

   };

} ];
