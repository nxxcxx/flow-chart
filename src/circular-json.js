module.exports = [ () => {

   return input => {
      return CJSON.stringify( input, null, 2 );
   };

} ];
