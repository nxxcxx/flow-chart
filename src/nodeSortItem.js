module.exports = [ () => {

   function link( $scope, $element, $attrs, $controllers ) {

      var sortCtrl = $controllers[ 0 ];
      var dragCtrl = $controllers[ 1 ];

      $element
      .on( 'mousedown', e => {
         dragCtrl.disableDrag();
         sortCtrl.sorting = true;
         sortCtrl.startSort( $scope.input ? $scope.input : $scope.output );
      } )
      .on( 'mouseenter', e => {
         sortCtrl.endSort( $scope.input ? $scope.input : $scope.output );
      } );

// todo -> body no!!
      $( 'body' ).on( 'mouseup', e => {
         dragCtrl.enableDrag();
         sortCtrl.reset();
         sortCtrl.sorting = false;
      } );

   }

   return {

      restrict: 'A',
      require: [ '^nodeSortable', '^svgPannable' ],
      link

   };

} ];
