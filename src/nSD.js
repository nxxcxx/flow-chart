module.exports = () => {

   return {

      restrict: 'A',
      scope: true,
      link: ( scope, elem, attr, ctrl ) => {

         $( elem ).sortable();

         $( elem ).on( 'sort sortupdate sortstop', e => {

            setTimeout( () => scope.$emit( 'sortUpdate' ), 0 );

         } );

      },
      controller: ( $scope, $element, $attrs, $transclude ) => {

         $scope.handleSortEvent = eventType => {

            $( $element ).sortable( eventType );
            // console.log( `sort ${eventType}d.` );

         };

      }

   };

};
