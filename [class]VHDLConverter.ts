import {Entity} from "./[class]Entity";
import {Wire, WireValue} from "./[class]wire";
import {File} from "./[class]File";
import { join } from "path";

export class VHDLConverter{
   private static wireToVHDL(wire : Wire, options : {context : string}) : string{
      let text : string = "";
      if(wire.isConstant)
         return `"${wire.name}"`;
      if(options.context == "port in" || options.context == "port out"){
         text += `${wire.name} : `;
         if(options.context == "port in")
            text += `in std_logic`
         else 
            text += `out std_logic`
         if(wire.size > 1){
            text += `_vector(${wire.end} downto ${wire.start})`;
         }
      }
      else if(options.context == "definition" || options.context == "declaration"){
         text += `${wire.name} : std_logic`;
         if(wire.size > 1){
            text += `_vector(${wire.end} downto ${wire.start})`;
         }
      }
      else if(options.context == "reference"){
         text += `${wire.name}`;
         if(wire.size > 1){
            text += `(${wire.end} downto ${wire.start})`;
         }
         else if(wire.start != 0){
            text += `(${wire.end})`;
         }
      }
      return text;
   }

   private static generatePort(inputs : Wire[], outputs : Wire[], tabsize : number = 1) : string {
      let text : string = "\t".repeat(tabsize) + "port(\n";
      for(let aux = 0; aux < inputs.length; aux ++){
         text += "\t".repeat(tabsize + 1);
         text += VHDLConverter.wireToVHDL(inputs[aux], {context: "port in"});
         if(aux < inputs.length - 1 || outputs.length > 0)
            text += ";"
         text += "\n";
      }
      for(let aux = 0; aux < outputs.length; aux ++){
         text += "\t".repeat(tabsize + 1);
         text += VHDLConverter.wireToVHDL(outputs[aux], {context: "port out"});
         if(aux < outputs.length - 1)
            text += ";"
         text += "\n";
      }
      return text;
   }

   static entityToVHDL(entity : Entity) : string{
      let text : string = "";
      text += `library ieee;\nuse ieee.std_logic_1164.all;\n\nentity ${entity.name} is\n`;
      text += VHDLConverter.generatePort(entity.inputs, entity.outputs);
      text += `\t);\nend ${entity.name};\n\narchitecture ${entity.name}Arc of ${entity.name} is\n\n`;
      let entityImports = Object.entries(entity.imports);
      for(let aux = 0; aux < entityImports.length; aux ++){
         let currentImport : Entity = entityImports[aux][1];
         text += `\tcomponent ${currentImport.name} is\n`;
         text += VHDLConverter.generatePort(currentImport.inputs, currentImport.outputs, 2);
         text += `\t\t);\n\tend component;\n\n`;
      }
      if(entity.auxiliar.length > 0){
         text += `\tsignal `;
         for(let aux = 0; aux < entity.auxiliar.length; aux ++){
            text += VHDLConverter.wireToVHDL(entity.auxiliar[aux], {context: "declaration"});
            if(aux < entity.auxiliar.length - 1)
               text += ", ";
         }
         text += `;\n`;
      }
      text += `begin\n\n`;
      let allWires : Wire[] = entity.auxiliar.concat(entity.outputs);
      for(let aux = 0; aux < allWires.length; aux ++){
         for(let aux1 = 0; aux1 < allWires[aux].value.length; aux1 ++){
            let expression : (string | Wire)[] = allWires[aux].value[aux1].expression;
            if(expression.length == 0) continue;
            text += `\t`;
            text += VHDLConverter.wireToVHDL(allWires[aux], {context: "reference"});
            text += " <= ";
            for(let aux2 = 0; aux2 < expression.length; aux2 ++){
               let element = expression[aux2];
               if(typeof(element) == "string")
                  text += element;
               else{
                  text += VHDLConverter.wireToVHDL(element, {context:"reference"});
               }
               if(aux2 < expression.length - 1)
                  text += ` `;
            }
            text += `;\n`;
         }
      }
      text += "\n";
      for(let aux = 0; aux < entity.importCalls.length; aux ++){
         text += `\tG${aux}: ${entity.importCalls[aux].name} port map (`;
         for(let aux1 = 0; aux1 < entity.importCalls[aux].inputs.length; aux1 ++){
            let wire : Wire = entity.importCalls[aux].inputs[aux1];
            if(aux1 != 0) text += ", ";
            text += VHDLConverter.wireToVHDL(wire, {context:"reference"});
         }
         for(let aux1 = 0; aux1 < entity.importCalls[aux].outputs.length; aux1 ++){
            let wire : Wire = entity.importCalls[aux].outputs[aux1];
            if(aux1 != 0 || entity.importCalls[aux].inputs.length > 0) text += ", ";
            text += VHDLConverter.wireToVHDL(wire, {context:"reference"});
         }
         text += `);\n`;
      }
      text += `end architecture;\n`;
      return text;
   }
}