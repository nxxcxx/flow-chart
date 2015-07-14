module.exports = [ '$rootScope', function ( $rootScope ) {

   this.broadcast = () => $rootScope.$broadcast( 'linkNeedsUpdate' );
   this.listen = callback => $rootScope.$on( 'linkNeedsUpdate', callback );

} ];
