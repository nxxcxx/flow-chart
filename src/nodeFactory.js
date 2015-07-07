module.exports = [ () => {

   class Connection {

      constructor( name ) {
         this.uuid = UUID();
         this.name = name;
      }

   }

   class Input extends Connection {

      constructor( name ) {
         super( name );
         this.type = 0;
      }

   }

   class Output extends Connection {

      constructor( name ) {
         super( name );
         this.type = 1;
      }

   }

   class Node {

      constructor( name ) {
         this.uuid = UUID();
         this.name = name;
         this.input = [];
         this.output = [];
      }

      addInput( name ) {
         this.input.push( new Input( name ) );
      }

      addOutput( name ) {
         this.output.push( new Output( name ) );
      }

   }

   function create() {

      return new Node();

   }

   return {

      create

   };

} ];
