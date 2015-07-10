// jshint -W054
module.exports = [ () => {

   class Connection {
      constructor( name, parent ) {
         this.uuid = UUID();
         this.name = name;
         this.getParent = () => { return parent; };
      }
   }

   class Input extends Connection {
      constructor( name, parent ) {
         super( name, parent );
         this.type = 0;
         this.dest = null;
         this.available = true;
      }
      connect( io ) {
         this.dest = io;
         this.available = false;
      }
      disconnect() {
         this.dest = null;
         this.available = true;
      }
      getDestData() {
         return this.dest === null ? null : this.dest.data;
      }
   }

   class Output extends Connection {
      constructor( name, parent ) {
         super( name, parent );
         this.type = 1;
         this.data = null;
      }
   }

   class Executable {
      constructor() {
         this._fnstr = '';
         this._task = null;
      }
      compile() {
         try { this._task = new Function( 'input', this._fnstr ); }
         catch ( err ) { return err; }
         return null;
      }
      execute() {
         var inpObj = {};
         if ( this.input.length !== 0 ) {
            this.input.forEach( inp => {
               inpObj[ inp.name ] = inp.getDestData();
            } );
            console.log( inpObj );
         }
         var res = null;
         try { res = this._task.call( null, inpObj ); }
         catch ( e ) { console.error( e ); }
         this.output.forEach( opt => { opt.data = res[ opt.name ]; } );
      }
   }

   class Node extends Executable {
      constructor( name ) {
         super();
         this.uuid = UUID();
         this.name = name;
         this.input = [];
         this.output = [];
         this.order = -1;
         this.updateUI = () => this._ui.update = !this._ui.update;
         this._ui = {
            update: false
         };
      }
      addInput() {
         for ( let i = 0; i < arguments.length; i ++ ) {
            this.input.push( new Input( arguments[ i ], this ) );
         }
      }
      addOutput( name ) {
         for ( let i = 0; i < arguments.length; i ++ ) {
            this.output.push( new Output( arguments[ i ], this ) );
         }
      }
   }

   function create( name ) {
      return new Node( name );
   }

   return {
      create
   };

} ];
