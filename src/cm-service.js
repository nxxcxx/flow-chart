module.exports = [ () => {

   var instance = null;

   function getInstance() {
      return instance;
   }

   function create( textarea, opts ) {
      instance = CodeMirror.fromTextArea( textarea, opts );
      return instance;
   }

   return {
      getInstance,
      create
   };

} ];
