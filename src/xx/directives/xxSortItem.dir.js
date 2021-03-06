module.exports = [ 'log', ( log ) => {

   function link( $scope, $element, $attrs, $controllers ) {

      var sortCtrl = $controllers[ 0 ];
      var dragCtrl = $controllers[ 1 ];

      $element
      .on( 'mousedown', e => {
         dragCtrl.disableDrag();
         sortCtrl.sorting = true;
         sortCtrl.startSort( $scope.io );
      } )
      .on( 'mouseenter', e => {
         if ( !sortCtrl.sorting ) return;
         sortCtrl.endSort( $scope.io );
      } );

      $( 'body' )
      .on( 'mouseup', e => {
         if ( !sortCtrl.sorting ) return;
         dragCtrl.enableDrag();
         sortCtrl.reset();
         sortCtrl.sorting = false;
      } );

      log.debug( 'Scope', $scope.$id, 'Sortitem', $scope );

   }

   return {

      restrict: 'A',
      require: [ '^xxSortable', '^svgDraggable' ],
      link

   };

} ];
