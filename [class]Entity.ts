import {File} from "./[class]File";
import {Wire, WireValue} from "./[class]wire";
import { read } from "fs";

interface Imports{
   [entityName : string] : Entity
}

interface EntityOptions{
   mode: string
}

export class Entity{
   inputs : Wire[] = [];
   outputs : Wire[] = [];
   auxiliar : Wire[] = [];
   imports : Imports = {};
   importCalls : Entity[] = [];
   name : string = "";

   private static entities : Entity;

   constructor(file : File, options : EntityOptions){
      let isReference;
      if(options.mode === "reference") isReference = true;
      else if(options.mode === "declaration" || options.mode === "definition") isReference = false;
      else throw("invalid mode option");
      this.read(file, isReference);
      if(!isReference)
         this.define(file);
   }

   private read(file : File, isReference : boolean) : void{
      file.mustBeNextName("invalid entity name");
      this.name = file.popToken();
      file.mustBeNext("(", "expected \"(\" after entity name");
      file.popToken();
      while(file.isNext(",")) file.popToken();
      let isReadingOutputs = false;
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
            if(newWire.isConstant)
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

   retrieveInputWire(wireName : string) : Wire | null{
      for(let aux = 0; aux < this.inputs.length; aux ++)
         if(this.inputs[aux].name == wireName) return this.inputs[aux];
      return null;
   }

   retrieveOutputWire(wireName : string) : Wire | null{
      for(let aux = 0; aux < this.outputs.length; aux ++)
         if(this.outputs[aux].name == wireName) return this.outputs[aux];
      return null;
   }

   retrieveAuxiliarWire(wireName : string) : Wire | null{
      for(let aux = 0; aux < this.auxiliar.length; aux ++)
         if(this.auxiliar[aux].name == wireName) return this.auxiliar[aux];
      return null;
   }

   hasInput(wireName : string) : boolean{return this.retrieveInputWire(wireName) !== null;}
   hasOutput(wireName : string) : boolean{return this.retrieveOutputWire(wireName) !== null;}
   hasAuxiliar(wireName : string) : boolean{return this.retrieveAuxiliarWire(wireName) !== null;}
   hasWire(wireName : string) : boolean{
      return this.hasInput(wireName) || this.hasOutput(wireName) || this.hasAuxiliar(wireName);
   }

   importEntity(importName : string, importFileName : string) : void{
      let file : File = new File(importFileName);
      let bracketCount : number = 0;
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
            let importEntity : Entity = new Entity(file, {mode:"definition"});
            this.imports[importEntity.name] = importEntity;
            return;
         }
         else file.popToken();
      }
      file.throwError("could not find import entity");
   }

   private defineImport(file : File) : void{
      file.popToken();
      file.mustBeNextName("expected import name");
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

   private defineSignal(file : File){
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

   private defineImportReference(file : File) : void{
      //previously imported entity
      let referenceEntity : Entity = this.imports[file.previewToken()];
      //entity that was just read
      let readEntity : Entity = new Entity(file, {mode:"reference"});
      if(!file.isNext(";")) file.throwError("expected \";\"");
      file.popToken();

      //verify both entites have the same ammount of input/output
      if(referenceEntity.inputs.length != readEntity.inputs.length)
         file.throwError("incompatible input length");
      if(referenceEntity.outputs.length != readEntity.outputs.length)
         file.throwError("incompatible output length");

      //verify all of the read entity's input wires validity
      for(let aux = 0; aux < readEntity.inputs.length; aux ++){
         //verrify the correct wire size
         if(readEntity.inputs[aux].size != referenceEntity.inputs[aux].size)
            file.throwError("incompatible size of correspondent input wires");
         //verify that output-designed wire was referenced
         if(this.hasOutput(readEntity.inputs[aux].name))
            file.throwError("cannot use output wire in right side operation");
         if( //verify the wire was previously declared
            !this.hasInput(readEntity.inputs[aux].name) &&
            !this.hasAuxiliar(readEntity.inputs[aux].name) &&
            !readEntity.inputs[aux].isConstant
         ) file.throwError("wire not previously declared");
      }

      //verify all of the read entity's output wires validity
      for(let aux = 0; aux < readEntity.outputs.length; aux ++){
         //verrify the correct wire size
         if(readEntity.outputs[aux].size != referenceEntity.outputs[aux].size)
            file.throwError("incompatible size of correspondent output wires");
         //verify that input-designed wire was referenced
         if(this.hasInput(readEntity.outputs[aux].name))
            file.throwError("cannot use input wire in left side operation");
         //no constant wire allowed at the output
         if(readEntity.outputs[aux].isConstant)
            file.throwError("cannot write to constant wire");

         let referenceOutput : Wire;
         {//verify the output wire was already declared
            let buffer : Wire | null = this.retrieveOutputWire(readEntity.outputs[aux].name);
            if(buffer === null)
               buffer = this.retrieveAuxiliarWire(readEntity.outputs[aux].name);
            if(buffer === null){
               file.throwError("wire not previously declared");
               return;
            }
            else referenceOutput = buffer;
         }
         if(referenceOutput.hasValueAt(readEntity.outputs[aux].start, readEntity.outputs[aux].end))
            file.throwError("wire assignment overlap");
         referenceOutput.value.push({
            start :readEntity.outputs[aux].start,
            end : readEntity.outputs[aux].end,
            expression: []
         });
      }
      this.importCalls.push(readEntity);
   }

   private defineAssignment(file : File) : void{
      let leftSide : Wire = new Wire(file, {mode:"reference"});
      let leftSideReference : Wire;

      {//verify the left side was declared
         let buffer = this.retrieveOutputWire(leftSide.name);
         if(buffer === null){
            buffer = this.retrieveAuxiliarWire(leftSide.name);
            if(buffer === null){
               file.throwError("left side of assignment not declared");
               return;
            }
         }
         leftSideReference = buffer;
      }

      //must have an equal sign to at assignment
      file.mustBeNext("=", "expected \"=\" at wire assignment");
      file.popToken();

      //verify the left side's dimensions are correct
      if(!leftSideReference.containsAllWireRange(leftSide.start, leftSide.end))
         file.throwError("referencing left side wire out of declared bounds");

      //the given portion of the assigned wire must not have been already assigned
      for(let aux = 0; aux < leftSideReference.value.length; aux ++){
         if(leftSide.containsSomeWireRange(
            leftSideReference.value[aux].start,
            leftSideReference.value[aux].end)
         )
            file.throwError("wire assignments overlap");
      }

      //start reading the right side of the assignment
      let assignment : WireValue = {start: leftSide.start, end:leftSide.end, expression:[]};
      let parenthesisCount : number = 0;
      let wasLastWire : boolean = false;
      let isWaitingWire : boolean = true;
      while(!file.isNext(";")){ //read till reach a comma
         if(file.isNext("not")){
            assignment.expression.push(file.popToken());
            wasLastWire = false;
            isWaitingWire = true;
         }
         else if(
            file.isNext("and") || file.isNext("or") || file.isNext("xor") ||
            file.isNext("nand") || file.isNext("nor") || file.isNext("band") ||
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
            if(parenthesisCount < 0)
               file.throwError("closed parenthesis with no match");
         }
         else{ //if this point was reached, it's only possible to be a wire
            let readWire = new Wire(file, {mode:"reference"});

            //if the wire is not a constant, it must be verified
            if(!readWire.isConstant){
               //cannot read from output wire
               if(this.hasOutput(readWire.name))
                  file.throwError("cannot read from output wire");

               let referenceWire : Wire;
               {//verify the wire was already declared
                  let buffer = this.retrieveInputWire(readWire.name);
                  if(buffer === null){
                     buffer = this.retrieveAuxiliarWire(readWire.name);
                     if(buffer === null){
                        file.throwError("wire not previously declared");
                        return;
                     }
                  }
                  referenceWire = buffer;
               }
               //verify the wire's bounds are correct
               if(!referenceWire.containsAllWireRange(readWire.start, readWire.end))
                  file.throwError("referencing right side wire out of declared bounds");
            }
            //verify the wire has the same size as the left side
            if(readWire.size != leftSide.size)
               file.throwError("left side and right side wires mismatch sizes");
            assignment.expression.push(readWire);
            wasLastWire = true;
            isWaitingWire = false;
         }
      }
      if(isWaitingWire)
         file.throwError("expecting wire after operator");
      if(parenthesisCount != 0) //unclosed parenthesis
         file.throwError("unclosed parenthesis");
      file.popToken();
      leftSideReference.value.push(assignment);
   }

   define(file : File){
      file.mustBeNext("{", "expected \"{\" at entity definition");
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