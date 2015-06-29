module.exports = () => {

   return {

      restrict: 'E',
      templateUrl: './template/node.html',
      replace: true,
      scope: {
         nodeObject: '='
      },
      link: ( scope, elem, attr, ctrl ) => {

         $( elem ).draggable( {
            // zIndex: 100
            // refreshPositions: true
            // grid: [ 10, 10 ]
         } );

      },
      controller: ( $scope, $element, $attrs, $transclude ) => {

         var dragging = false;

         $scope.handleDragEvent = eventType => {

            $( $element ).draggable( eventType );
            // console.log( `drag ${eventType}d.` );

         };

         // updateConnection on drag

         $( $element ).on( 'drag dragstart dragstop', e => {
            // setTimeout hack to fix connector position not update properly
            // why? http://stackoverflow.com/questions/779379/why-is-settimeoutfn-0-sometimes-useful
            setTimeout( () => $scope.$broadcast( 'connectionNeedsUpdate', $scope.nodeObject ), 0 );
         } );

         $scope.$on( 'sortUpdate', e => {

            setTimeout( () => $scope.$broadcast( 'connectionNeedsUpdate', $scope.nodeObject ), 0 );
            e.stopPropagation();

         } );

      }

   };

};
