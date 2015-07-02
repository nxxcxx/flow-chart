module.exports = [ () => {

   function controller( $scope, $element, $attrs ) {

      var curr = null;
      var tgt = null;

      this.sorting = false;
      var disabled = false;

      this.reset = () => {
         curr = null;
         tgt = null;
      };

      this.startSort = n => {
         if ( disabled ) return;
         curr = n;
         console.log( 'start sort', curr );
      };

      this.endSort = n => {
         if ( disabled || !this.sorting ) return;

         tgt = n;
         console.log( 'end sort', tgt );
         if ( curr !== null && tgt !== null && curr !== tgt ) {
            console.log( 'swapping:', curr.name, tgt.name );
            swapRow( curr, tgt );
         }
      };

      this.disableSort = () => { disabled = true; };
      this.enableSort = () => { disabled = false; };

      function swapRow( curr, tgt ) {

         var t1;
         var t2;
         var io = null;
         $scope.nodeObject.input.forEach( ( inp, idx ) => {
            if ( inp.uuid === curr.uuid ) {
               t1 = idx;
               io = 0;
            }
         } );
         $scope.nodeObject.output.forEach( ( inp, idx ) => {
            if ( inp.uuid === curr.uuid ){
               t1 = idx;
               io = 1;
            }
         } );

         $scope.nodeObject.input.forEach( ( inp, idx ) => {
            if ( inp.uuid === tgt.uuid ) {
               t2 = idx;
            }
         } );
         $scope.nodeObject.output.forEach( ( inp, idx ) => {
            if ( inp.uuid === tgt.uuid ){
               t2 = idx;
            }
         } );

         //swap
         if ( io === 0 ) {
            var temp = $scope.nodeObject.input[ t1 ];
            $scope.nodeObject.input[ t1 ] = $scope.nodeObject.input[ t2 ];
            $scope.nodeObject.input[ t2 ] = temp;
         } else {
            var temp = $scope.nodeObject.output[ t1 ];
            $scope.nodeObject.output[ t1 ] = $scope.nodeObject.output[ t2 ];
            $scope.nodeObject.output[ t2 ] = temp;
         }

// todo fix this mess
         $scope.$digest();
         $scope.$broadcast( 'connectionNeedsUpdate' );
         $scope.$apply();

      }

   }

   return {
      restrict: 'A',
      controller
   };

} ];
