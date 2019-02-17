let Wire = require("./[class]wire.js");
let File = require("./[class]File.js");
                       
module.exports = class Entity{
   constructor(){
      this.inputs = [];
      this.outputs = [];
      this.auxiliar = [];
      this.imports = {};
      this.importCalls = [];
      this.assignments = [];
      if(arguments.length == 2){
         let options = arguments[1];
         let file = arguments[0];
         let isReference;
         if(options.mode !== undefined){
            if(options.mode === "reference") isReference = true;
            else if(options.mode === "declaration" || options.mode === "definition") isReference = false;
            else throw("invalid mode option");
         }
         else throw("entity mode must be specified");
         if(file.constructor != File)
            throw("invalid argument type");
         this.read(file, isReference);
         if(!isReference)
            this.define(file);
      }
      else throw("invlaid entity arguments");
   }

   read(file, isReference){
      let isReadingOutputs = false;
      if(!file.isNextName())
         file.throwError("invalid entity name");
      this.name = file.popToken();
      if(!file.isNext("("))
         file.throwError("expected \"(\" after entity name");
      file.popToken();
      while(file.isNext(",")) file.popToken();
      while(!file.isNext(")")){
         if(file.isNext(";")){
            if(isReadingOutputs)
               file.throwError("unexpected duplicated \";\"");
            isReadingOutputs = true;
            file.popToken();
            continue;
         }
         let newWire = new Wire(file, {mode:(isReference?"reference":"declaration")});
         if(!isReference){
            if(this.hasWire(newWire.name))
               file.throwError("wire already declared");
            if(newWire.name == ".constant")
               file.throwError("cannot use constant wire at entity definition");
         }
         if(isReadingOutputs)
            this.outputs.push(newWire);
         else
            this.inputs.push(newWire);
         if(!file.isNext(",") && !file.isNext(";") && !file.isNext(")"))
            file.throwError("expected \",\" separator");
         while(file.isNext(",")) file.popToken();
      }
      file.popToken();
   }

   retrieveInputWire(wireName){
      for(let aux = 0; aux < this.inputs.length; aux ++)
         if(this.inputs[aux].name == wireName) return this.inputs[aux];
      return null;
   }

   retrieveOutputWire(wireName){
      for(let aux = 0; aux < this.outputs.length; aux ++)
         if(this.outputs[aux].name == wireName) return this.outputs[aux];
      return null;
   }

   retrieveAuxiliarWire(wireName){
      for(let aux = 0; aux < this.auxiliar.length; aux ++)
         if(this.auxiliar[aux].name == wireName) return this.auxiliar[aux];
      return null;
   }

   hasInput(wireName){return this.retrieveInputWire(wireName) !== null;}
   hasOutput(wireName){return this.retrieveOutputWire(wireName) !== null;}
   hasAuxiliar(wireName){return this.retrieveAuxiliarWire(wireName) !== null;}
   hasWire(wireName){
      return this.hasInput(wireName) || this.hasOutput(wireName) || this.hasAuxiliar(wireName);
   }

   importEntity(importName, importFileName){
      let file = new File(importFileName);
      let bracketCount = 0;
      while(file.tokens.length > 0){
         if(file.isNext("{")){
            bracketCount ++;
            file.popToken();
         }
         else if(file.isNext("}")){
            bracketCount --;
            file.popToken();
         }
         else if(file.isNext(importName) && bracketCount == 0){
            let importEntity = new Entity(file, {mode:"definition"});
            this.imports[importEntity.name] = importEntity;
            return;
         }
         else file.popToken();
      }
      file.throwError("could not find import entity");
   }

   defineImport(file){
      file.popToken();
      if(!file.isNextName())
         file.throwError("expected import name");
      if(this.hasWire(file.previewToken()))
         file.throwError("cannot declare import with same name as wire");
      if(this.imports[file.previewToken()] !== undefined)
         file.throwError("import already imported");
      let importName = file.popToken();
      let fileName = file.name;
      if(file.isNext("from")){
         file.popToken();
         if(!file.isNextName())
            file.throwError("expected import file name");
         fileName = file.popToken();
      }
      if(!file.isNext(";"))
         file.throwError("expected \";\"");
      file.popToken();
      this.importEntity(importName, fileName);
   }

   defineSignal(file){
      file.popToken();
      while(!file.isNext(";")){
         while(file.isNext(",")) file.popToken();
         let wire = new Wire(file, {mode:"definition"});
         if(this.hasWire(wire.name))
            file.throwError("wire already declared");
         if(this.imports[wire.name] !== undefined)
            file.throwError("wire and import have the same name");
         this.auxiliar.push(wire);
      }
      file.popToken();
   }

   defineImportReference(file){
      let definedEntity = this.imports[file.previewToken()];
      let referenceEntity = new Entity(file, {mode:"reference"});
      if(!file.isNext(";")) file.throwError("expected \";\"");
      file.popToken();
      if(definedEntity.inputs.length != referenceEntity.inputs.length)
         file.throwError("incompatible input length");
      if(definedEntity.outputs.length != referenceEntity.outputs.length)
         file.throwError("incompatible output length");
      for(let aux = 0; aux < referenceEntity.inputs.length; aux ++){
         if(referenceEntity.inputs[aux].size() != definedEntity.inputs[aux].size())
            file.throwError("incompatible size of correspondent input wires");
         if(this.hasOutput(referenceEntity.inputs[aux].name))
            file.throwError("cannot use output wire in right side operation");
         if(
            !this.hasInput(referenceEntity.inputs[aux].name) &&
            !this.hasAuxiliar(referenceEntity.inputs[aux].name) &&
            !referenceEntity.inputs[aux].name == ".constant"
         )
            file.throwError("wire not previously declared");
      }
      for(let aux = 0; aux < referenceEntity.outputs.length; aux ++){
         if(referenceEntity.outputs[aux].size() != definedEntity.outputs[aux].size())
            file.throwError("incompatible size of correspondent output wires");
         if(this.hasInput(referenceEntity.outputs[aux].name))
            file.throwError("cannot use input wire in left side operation");
         if(referenceEntity.outputs[aux].name == ".constant")
            file.throwError("cannot write to constant wire");
         let realOutput = this.retrieveOutputWire(referenceEntity.outputs[aux].name);
         if(realOutput === null)
            realOutput = this.retrieveAuxiliarWire(referenceEntity.outputs[aux].name);
         if(realOutput === null)
            file.throwError("wire not previously declared");
         for(let aux1 = 0; aux1 < realOutput.value.length; aux1 ++){
            if(
               (referenceEntity.outputs[aux].start >= realOutput.value[aux1].leftSide.start &&
               referenceEntity.outputs[aux].start <= realOutput.value[aux1].leftSide.end) ||
               (referenceEntity.outputs[aux].end >= realOutput.value[aux1].leftSide.start &&
               referenceEntity.outputs[aux].end <= realOutput.value[aux1].leftSide.end)
            )
            file.throwError("wire assignment overlap");
         }
         realOutput.value.push({leftSide:referenceEntity.outputs[aux], expression: null});
      }
      this.importCalls.push(referenceEntity);
   }

   defineAssignment(file){
      let leftSide = new Wire(file, {mode:"reference"});
      let realLeftSide = this.retrieveOutputWire(leftSide.name);
      if(realLeftSide === null)
         realLeftSide = this.retrieveAuxiliarWire(leftSide.name);
      if(!file.isNext("="))
         file.throwError("expected \"=\" at wire assignment");
      file.popToken();
      if(
         leftSide.start < realLeftSide.start ||
         leftSide.start > realLeftSide.end ||
         leftSide.end < realLeftSide.start || 
         leftSide.end > realLeftSide.end
      )
         file.throwError("referencing left side wire out of declared bounds");
      for(let aux = 0; aux < realLeftSide.value.length; aux ++){
         if(
            (leftSide.start >= realLeftSide.value[aux].leftSide.start &&
            leftSide.start <= realLeftSide.value[aux].leftSide.end) || 
            (leftSide.end >= realLeftSide.value[aux].leftSide.start &&
            leftSide.end <= realLeftSide.value[aux].leftSide.end)
         )
            file.throwError("wire assignments overlap");
      }
      let assignment = {leftSide: leftSide, expression:[]};
      let parenthesisCount = 0;
      let wasLastWire = false;
      let isWaitingWire = true;
      while(!file.isNext(";")){
         if(file.isNext("not")){
            assignment.expression.push(file.popToken());
            wasLastWire = false;
            isWaitingWire = true;
         }
         else if(
            file.isNext("and") ||
            file.isNext("or") ||
            file.isNext("xor") ||
            file.isNext("nand") ||
            file.isNext("nor") ||
            file.isNext("band") ||
            file.isNext("bor")
         ){
            if(!wasLastWire)
               file.throwError("expected wire before binary operation");
            assignment.expression.push(file.popToken());
            isWaitingWire = true;
            wasLastWire = false;
         }
         else if(file.isNext("(")){
            assignment.expression.push(file.popToken());
            wasLastWire = false;
            isWaitingWire = true;
            parenthesisCount++;
         }
         else if(file.isNext(")")){
            assignment.expression.push(file.popToken());
            wasLastWire = true;
            isWaitingWire = false;
            parenthesisCount--;
         }
         else{
            let referenceWire = new Wire(file, {mode:"reference"});

            if(referenceWire.name != ".constant"){
               if(this.hasOutput(referenceWire.name))
                  file.throwError("cannot read from output wire");
               let realWire = this.retrieveInputWire(referenceWire.name);
               if(realWire === null) realWire = this.retrieveAuxiliarWire(referenceWire.name);
               if(realWire === null)
                  file.throwError("wire not previously declared");
               if(
                  referenceWire.start < realWire.start ||
                  referenceWire.start > realWire.end ||
                  referenceWire.end < realWire.start ||
                  referenceWire.end > realWire.end
               ) file.throwError("referencing right side wire out of declared bounds");
            }
            if(referenceWire.size() != leftSide.size())
               file.throwError("left side and right side wires mismatch sizes");
            assignment.expression.push(referenceWire);
            wasLastWire = true;
            isWaitingWire = false;
         }
      }
      if(isWaitingWire)
         file.throwError("expecting wire after operator");
      if(parenthesisCount != 0)
         file.throwError("parenthesis count mismatch");
      file.popToken();
      realLeftSide.value.push(assignment);
      this.assignments.push(assignment);
   }

   define(file){
      if(!file.isNext("{"))
         file.throwError("expected \"{\" at entity definition");
      file.popToken();
      while(!file.isNext("}")){
         if(file.isNext("import"))
            this.defineImport(file);
         else if(file.isNext("signal"))
            this.defineSignal(file);
         else if(file.isNextName()){
            if(this.imports[file.previewToken()] !== undefined)
               this.defineImportReference(file);
            else if(this.hasOutput(file.previewToken()) || this.hasAuxiliar(file.previewToken()))
               this.defineAssignment(file);
            else if(this.hasInput(file.previewToken()))
               file.throwError("cannot write to input wire");
            else if(file.isNextNumber())
               file.throwError("cannot write to constant wire");
            else file.throwError("unknown token");
         }
         else{
            file.throwError("unexpected command");
         }
      }
      file.popToken();
   }
}