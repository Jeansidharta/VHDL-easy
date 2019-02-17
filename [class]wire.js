let File = require("./[class]File.js");
module.exports = class Wire{
   constructor(){
      this.value = [];
      this.start = 0;
      this.end = 0;
      if(arguments.length === 0){
         throw("Wire constructor need an argument");
      }
      else if(arguments.length == 2){
         let isReference;
         let options = arguments[1];
         if(options.mode !== undefined){
            if(options.mode === "reference") isReference = true;
            else if(options.mode === "declaration" || options.mode === "definition") isReference = false;
            else throw("invalid mode option");
         }
         else throw("wire mode must be specified");

         if(arguments[0].constructor != File)
            throw("invalid argument type");
         //argument is of type File
         this.read(arguments[0], isReference);
      }
      else if(arguments.length == 3){
         this.name = arguments[0];
         this.start = arguments[1];
         this.end = arguments[2];
      }
      else throw("invalid wire constructor arguments");
   }

   read(file, isReference){
      if(file.isNextNumber()){
         let numberText = file.popToken();
         for(let aux = 0; aux < numberText.length; aux ++){
            if(numberText[aux] != "0" && numberText[aux] != "1")
               file.throwError("invalid number base");
         }
         this.name = ".constant";
         this.start = 0;
         this.end = numberText.length-1;
         let number = parseInt(numberText, 2);
         this.value = number;
         return;
      }
      if(!file.isNextName())
         file.throwError("invalid wire name");
      this.name = file.popToken();
      if(!file.isNext("[")) return;
      file.popToken();
      if(!file.isNextNumber()) file.throwError("invalid start size");
      this.start = parseInt(file.popToken());
      if(this.start < 0) file.throwError("not allowed negative sizes");
      if(file.isNext("to")){
         file.popToken();
         if(!file.isNextNumber()) file.throwError("invalid end size");
         this.end = parseInt(file.popToken());
         if(this.end < 0) file.throwError("not allowed negative sizes");
      }
      else{
         if(isReference){
            this.end = this.start;
         }
         else{
            this.end = this.start - 1;
            this.start = 0;
            if(this.end < 0) file.throwError("not allowed null sizes at declaration");
         }
      }
      if(!file.isNext("]")) file.throwError("expected \"]\" at end of wire reference");
      file.popToken();
      if(this.end < this.start){
         let buffer = this.end;
         this.end = this.start;
         this.start = buffer;
      }
   }

   size(){
      return this.end - this.start + 1;
   }
}