// jshint -W054
module.exports = ( () => {

	var xns = [];

	class XN {

		constructor( id ) {
			this._id = id;
			this._input = [];
			this._output = [];
         this._task = null;
         this._result = {};
		}
		input() {
         this._input = [];
         for ( let i = 0; i < arguments.length; i ++ ) {
            this._input.push( arguments[ i ] );
         }
         return this;
      }
		output() {
         this._output = [];
         for ( let i = 0; i < arguments.length; i ++ ) {
            this._output.push( arguments[ i ] );
         }
         return this;
      }
		task( str ) {
         try {
            this._task = new Function( this._input, str );
         } catch ( e ) {
            console.error( e );
         }
         return this;
      }
		exe( res ) {
         var args = [];
         try {
            this._input.forEach( inp => args.push( res[ inp ] ) );
            this._result = this._task.apply( this, args );
         } catch ( e ) {
            console.error( 'Incomplete input' );
         }
         return this;
      }
		result() {
         return this._result;
      }

	}

	function define( id ) {
		var xn = new XN( id );
		xns.push( xn );
		return xn;
	}

	return {
		define
	};

} )();
