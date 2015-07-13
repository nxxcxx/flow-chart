module.exports = [ function () {

   var debugEnabled = false;
   var debugNamespaces = [];

   this.enableDebug = function () {
      debugEnabled = true;
   };

   this.enableDebugNamespace = function () {
      for ( let i = 0; i < arguments.length; i ++ ) {
         debugNamespaces.push( arguments[ i ] );
      }
   };

   this.$get = () => {

      function debug() {
         if ( !debugEnabled ) return;
         if ( debugNamespaces.indexOf( arguments[ 0 ] ) !== -1 ) {
            console.log.apply( console, arguments );
         }
      }

      return {
         debug
      };

   };

} ];
