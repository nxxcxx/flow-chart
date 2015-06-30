// jshint -W014

function link( $scope, $element, $attrs ) {

   if ( !$element.attr( 'transform' ) ) {
      $element.attr( 'transform', 'matrix(1,0,0,1,0,0)' );
   }

   var numPattern = /[\d|\.|\+|-]+/g;

   $( '#testSvg' )
   .on( 'mousewheel', e => {

      e.preventDefault();
      var mat = $element.attr( 'transform' ).match( numPattern ).map( v => parseFloat( v ) );

      var gain = 2.0
      , minz = 0.1
      , maxz = 10.0
      , dd = gain * Math.sign( e.originalEvent.wheelDeltaY ) * 0.1

      , ss = mat[ 0 ] + ( mat[ 0 ] * dd )
      , sd = ss / mat[ 0 ]
      , ox = e.pageX
      , oy = e.pageY
      , cx = mat[ 4 ]
      , cy = mat[ 5 ]
      , xx = sd * ( cx - ox ) + ox
      , yy = sd * ( cy - oy ) + oy
      ;

      if ( ss < minz || ss > maxz ) return;

      var newMat = `matrix(${ss},${mat[1]},${mat[2]},${ss},${xx},${yy})`;
      $element.attr( 'transform', newMat );

   } );

}

module.exports = () => {

   return {

      restrict: 'A',
      link

   };

};
