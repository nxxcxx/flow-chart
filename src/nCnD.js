module.exports = () => {

   return {

      restrict: 'E',
      scope: {
         uuid: '=',
         notifyDragHandler: '&dragEventHandler',
         notifySortHandler: '&sortEventHandler'
      },
      link: ( scope, elem, attr, ctrl ) => {

         $( elem )
         .on( 'mouseenter', e  => {

            scope.notifyDragHandler( { eventType: 'disable' } );
            scope.notifySortHandler( { eventType: 'disable' } );

         } )
         .on( 'mouseleave', e => {

            scope.notifyDragHandler( { eventType: 'enable' } );
            scope.notifySortHandler( { eventType: 'enable' } );

         } )
         .on( 'mouseover', e => {



         } )
         .on( 'mousedown', e => {

            scope.startConn();

         } )
         .on( 'mouseup', e => {

            scope.endConn();

         } );

      },
      controller: ( $scope, $element, $attrs, $transclude ) => {

         $scope.updateConn = () => {

            $scope.conn = {

               name: $( $element ).parent().text().trim(),
               uuid: $scope.uuid,
               position: $( $element ).offset()

            };

         };

         $scope.startConn = () => {

            $scope.updateConn();
            $scope.$emit( 'startConn', $scope.conn );

         };

         $scope.endConn = () => {

            $scope.updateConn();
            $scope.$emit( 'endConn', $scope.conn );

         };

         $scope.$on( 'connectionNeedsUpdate', ( e, node ) => {

            $scope.updateConn();
            $scope.$emit( 'updateConnArray', $scope.conn );

         } );

      }

   };

};
