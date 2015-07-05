module.exports = [ () => {

   function link( $scope, $element, $attrs, $controllers ) {

      var sortCtrl = $controllers[ 0 ];
      var dragCtrl = $controllers[ 1 ];

      var desc = {
         type: $scope.input ? 0 : 1,
         io: $scope.input ? $scope.input : $scope.output
      };

      $element
      .on( 'mousedown', e => {
         dragCtrl.disableDrag();
         sortCtrl.sorting = true;
         sortCtrl.startSort( desc );
      } )
      .on( 'mouseenter', e => {
         if ( !sortCtrl.sorting ) return;
         sortCtrl.endSort( desc );
      } );

      $( 'body' )
      .on( 'mouseup', e => {
         if ( !sortCtrl.sorting ) return;
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
