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
      };

      this.endSort = n => {
         if ( disabled || !this.sorting ) return;
         tgt = n;
         if ( curr !== null && tgt !== null && curr !== tgt ) {
            swapRow( curr, tgt );
         }
      };

      this.disableSort = () => { disabled = true; };
      this.enableSort = () => { disabled = false; };

      function swapRow( curr, tgt ) {

         var type = curr.type === 0 ? 'input' : 'output';
         var t1 = $scope.nodeObject[ type ].indexOf( tgt );
         var t2 = $scope.nodeObject[ type ].indexOf( curr );

         $scope.nodeObject[ type ][ t1 ] = curr;
         $scope.nodeObject[ type ][ t2 ] = tgt;

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
