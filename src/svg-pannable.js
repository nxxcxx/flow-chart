module.exports = [ () => {

   function controller( $scope, $element, $attrs ) {

      if ( !$element.attr( 'transform' ) ) {
         $element.attr( 'transform', 'matrix(1,0,0,1,0,0)' );
      }

      var disabled = false;
      var dragging = false;
      var mousehold = false;
      var prevPos = { x: null, y: null };
      var currPos = { x: null, y: null };

      var mat = null;
      var numPattern = /[\d|\.|\+|-]+/g;

      var handler = $attrs.handler ? $attrs.handler : $element;

      var dragEventFn = [];

      $( handler )
      .on( 'mousedown', e => {

         if ( disabled ) return;
         mousehold = true;
         prevPos.x = e.pageX;
         prevPos.y = e.pageY;

         mat = $element.attr( 'transform' );
         mat = mat.match( numPattern ).map( v => parseFloat( v ) );

      } );

      $( 'body' )
      .on( 'mouseup', e => {

         if ( disabled ) return;
         mousehold = false;

      } )
      .on( 'mousemove', e => {

         if ( disabled ) return;
         
         if ( mousehold ) {

            dragging = true;

            currPos.x = e.pageX;
            currPos.y = e.pageY;

            var dx = ( currPos.x - prevPos.x ) / this.scalingFactor;
            var dy = ( currPos.y - prevPos.y ) / this.scalingFactor;

            var newX = mat[ 4 ] + dx;
            var newY = mat[ 5 ] + dy;

            this.position.x = newX;
            this.position.y = newY;

            $element.attr( 'transform', `matrix(${mat[0]},${mat[1]},${mat[2]},${mat[3]},${newX},${newY})` );

            if ( dragEventFn.length ) {
               dragEventFn.forEach( fn => fn() );
            }

         }

      } );

      this.scalingFactor = 1.0;
      this.position = { x: 0, y: 0 };
      this.disableDrag = () => disabled = true;
      this.enableDrag = () => disabled = false;
      this.addDragEvent = fn => {
         dragEventFn.push( fn );
      };

   }

   return {

      restrict: 'A',
      scope: false,
      controller

   };

} ];
