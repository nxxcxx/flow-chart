// jshint -W014

function link( $scope, $element, $attrs ) {

   if ( !$element.attr( 'transform' ) ) {
      $element.attr( 'transform', 'matrix(1,0,0,1,0,0)' );
   }

   var mousehold = false;
   var prevPos = { x: null, y: null };
   var currPos = { x: null, y: null };

   var mat = null;
   var numPattern = /[\d|\.|\+|-]+/g;

   $( '#testSvg' )
   .on( 'mousedown', e => {

      mousehold = true;
      prevPos.x = e.pageX;
      prevPos.y = e.pageY;

      mat = $element.attr( 'transform' );
      mat = mat.match( numPattern ).map( v => parseFloat( v ) );

   } )
   .on( 'mouseup', e => {
      mousehold = false;
   } )
   .on( 'mousemove', e => {

      if ( mousehold ) {

         currPos.x = e.pageX;
         currPos.y = e.pageY;

         var dx = currPos.x - prevPos.x;
         var dy = currPos.y - prevPos.y;

         var newX = mat[ 4 ] + dx;
         var newY = mat[ 5 ] + dy;

         var newMat = `matrix(${mat[0]},${mat[1]},${mat[2]},${mat[3]},${newX},${newY})`;
         $element.attr( 'transform', newMat );

      }

   } );

}

module.exports = () => {

   return {

      restrict: 'A',
      link

   };

};
