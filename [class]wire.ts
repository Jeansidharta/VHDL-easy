import {File} from "./[class]File";
import { addListener } from "cluster";

interface WireOptions{
   mode: string
}

export interface WireValue{
   start : number,
   end : number,
   expression : (string | Wire)[]
}

export class Wire{
   public value : WireValue[] = [];

   public start : number = 0;
   public end : number = 0;
   public name : string = "";

   public constantValue : number = -1;
   public isConstant : boolean = false;

   constructor(file: File, options: WireOptions){
      let isReference : boolean;
      if(options.mode === "reference") isReference = true;
      else if(options.mode === "declaration" || options.mode === "definition") isReference = false;
      else throw("invalid mode option");

      this.read(file, isReference);
   }

   private read(file : File, isReference : boolean) : void{
      if(file.isNextNumber()){
         this.name = file.popToken();
         for(let aux = 0; aux < this.name.length; aux ++){
            if(this.name[aux] != "0" && this.name[aux] != "1")
               file.throwError("invalid number base");
         }
         this.isConstant = true;
         this.constantValue = parseInt(this.name, 2);
         return;
      }
      file.mustBeNextName("invalid wire name");
      this.name = file.popToken();
      if(!file.isNext("[")) return;
      file.popToken();
      file.mustBeNextNumber("invalid start size");
      this.start = parseInt(file.popToken());
      if(this.start < 0) file.throwError("not allowed negative sizes");
      if(file.isNext("to")){
         file.popToken();
         file.mustBeNextNumber("invalid end size");
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
            if(this.end < 0)
               file.throwError("not allowed null sizes at declaration");
         }
      }
      file.mustBeNext("]","expected \"]\" at end of wire reference");
      file.popToken();
      if(this.end < this.start){
         let buffer = this.end;
         this.end = this.start;
         this.start = buffer;
      }
   }

   get size() : number{
      if(this.isConstant)
         return this.name.length;
      return this.end - this.start + 1;
   }

   hasValueAt(start : number, end : number) : boolean{
      for(let aux1 = 0; aux1 < this.value.length; aux1 ++){
         if(
            (start >= this.value[aux1].start &&
            start <= this.value[aux1].end) ||
            (end >= this.value[aux1].start &&
            end <= this.value[aux1].end)
         ) return true;
      }
      return false;
   }

   containsWireIndex(index : number) : boolean{
      return(
         index >= this.start && index <= this.end
      );
   }

   containsSomeWireRange(start : number, end : number) : boolean{
      return this.containsWireIndex(start) || this.containsWireIndex(end);
   }

   containsAllWireRange(start : number, end : number) : boolean{
      return this.containsWireIndex(start) && this.containsWireIndex(end);
   }
}