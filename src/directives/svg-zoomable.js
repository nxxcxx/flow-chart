// jshint -W014
module.exports = [ () => {

   function link( $scope, $element, $attrs ) {

      if ( !$element.attr( 'transform' ) ) {
         $element.attr( 'transform', 'matrix(1,0,0,1,0,0)' );
      }

      var numPattern = /[\d|\.|\+|-]+/g;

      var handler = $( $attrs.handler );
      handler
      .on( 'mousewheel', e => {

         e.preventDefault();
         var mat = $element.attr( 'transform' ).match( numPattern ).map( v => parseFloat( v ) );
         var gain = 2.0
         , minz = 0.25
         , maxz = 10.0
         , dd = gain * Math.sign( e.originalEvent.wheelDeltaY ) * 0.1

         , ss = mat[ 0 ] + ( mat[ 0 ] * dd )
         , sd = ss / mat[ 0 ]
         , ox = e.pageX - handler.offset().left
         , oy = e.pageY - handler.offset().top
         , cx = mat[ 4 ]
         , cy = mat[ 5 ]
         , xx = sd * ( cx - ox ) + ox
         , yy = sd * ( cy - oy ) + oy
         ;

         if ( ss < minz || ss > maxz ) return;

         $scope.$broadcast( 'zoomed', ss );

         // var gridSize = ~~( ss * 25.0 );
         // $( '.view.right' ).css( 'background-size', `${gridSize}px ${gridSize}px` );

         $element.attr( 'transform', `matrix(${ss},${mat[1]},${mat[2]},${ss},${xx},${yy})` );

      } );

   }

   return {

      restrict: 'A',
      link

   };

} ];
