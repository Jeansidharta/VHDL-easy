let Entity = require("./[class]Entity.js");
let Wire = require("./[class]wire.js");
let file = require("./[class]File.js");

module.exports = class VHDLConverter{
   static entityToVHDL(entity){
      let text = "";
      text += `library ieee;\nuse ieee.std_logic_1164.all;\n\nentity ${entity.name} is\n\tport(\n`;
      for(let aux = 0; aux < entity.inputs.length; aux ++){
         text += `\t\t${entity.inputs[aux].name} : in std_logic`;
         if(entity.inputs[aux].size() > 1 || entity.inputs[aux].end > 0)
            text += `_vector(${entity.inputs[aux].end} downto ${entity.inputs[aux].start})`;
         if(aux < entity.inputs.length - 1 || entity.outputs.length > 0)
            text += ";"
         text += "\n";
      }
      for(let aux = 0; aux < entity.outputs.length; aux ++){
         text += `\t\t${entity.outputs[aux].name} : out std_logic`;
         if(entity.outputs[aux].size() > 1 || entity.outputs[aux].end > 0)
            text += `_vector(${entity.outputs[aux].end} downto ${entity.outputs[aux].start})`;
         if(aux < entity.outputs.length - 1)
            text += ";"
         text += "\n";
      }
      text += `\t);\nend ${entity.name};\n\narchitecture ${entity.name}Arc of ${entity.name} is\n\n`;
      let entityImports = Object.entries(entity.imports);
      for(let aux = 0; aux < entityImports.length; aux ++){
         let currentImport = entityImports[aux][1];
         text += `\tcomponent ${currentImport.name} is\n\t\tport(\n`;
         for(let aux = 0; aux < currentImport.inputs.length; aux ++){
            text += `\t\t\t${currentImport.inputs[aux].name} : in std_logic`;
            if(currentImport.inputs[aux].size() > 1 || currentImport.inputs[aux].end > 0)
               text += `_vector(${currentImport.inputs[aux].end} downto ${currentImport.inputs[aux].start});\n`;
            if(aux < currentImport.inputs.length - 1 || currentImport.outputs.length > 0)
               text += ";";
            text += "\n";
         }
         for(let aux = 0; aux < currentImport.outputs.length; aux ++){
            text += `\t\t\t${currentImport.outputs[aux].name} : out std_logic`;
            if(currentImport.outputs[aux].size() > 1 || currentImport.outputs[aux].end > 0)
               text += `_vector(${currentImport.outputs[aux].end} downto ${currentImport.outputs[aux].start});\n`;
            if(aux < currentImport.outputs.length - 1)
               text += ";";
            text += "\n";
         }
         text += `\t\t);\n\tend component;\n\n`;
      }
      if(entity.auxiliar.length > 0){
         text += `\tsignal `;
         for(let aux = 0; aux < entity.auxiliar.length; aux ++){
            if(aux != 0) text += `, `;
            text += `${entity.auxiliar[aux].name} : std_logic`;
            if(entity.auxiliar[aux].size() > 1 || entity.auxiliar[aux].end > 0)
               text += `_vector(${entity.auxiliar[aux].end} downto ${entity.auxiliar[aux].start})`;
         }
         text += `;\n`;
      }
      text += `begin\n`;
      for(let aux = 0; aux < entity.assignments.length; aux ++){
         let leftSide = entity.assignments[aux].leftSide;
         let expression = entity.assignments[aux].expression;
         if(leftSide.size > 1)
            text += `\t${leftSide.name}(${leftSide.end} downto ${leftSide.start}) <= `;
         else
            text += `\t${leftSide.name}(${leftSide.end}) <= `;
         for(let aux1 = 0; aux1 < expression.length; aux1 ++){
            if(expression[aux1] === null){
            }
            else if(expression[aux1].constructor === String)
               text += expression[aux1] + " ";
            else if(expression[aux1].constructor === Number)
               text += expression[aux1] + " ";
            else{
               let wire = expression[aux1];
               if(wire.name == ".constant")
                  text += `\"${wire.value.toString(2)}\"`;
               else{
                  if(wire.size() > 1)
                     text += `${wire.name}(${wire.end} downto ${wire.start}) `;
                  else
                     text += `${wire.name}(${wire.end}) `;
               }
            }
         }
         text += `;\n`;
      }
      text += "\n";
      for(let aux = 0; aux < entity.importCalls.length; aux ++){
         text += `\tG${aux}: ${entity.importCalls[aux].name} port map (`;
         for(let aux1 = 0; aux1 < entity.importCalls[aux].inputs.length; aux1 ++){
            let wire = entity.importCalls[aux].inputs[aux1];
            if(aux1 != 0) text += ", ";
            if(wire.name == ".constant")
               text += `\"${wire.value.toString(2)}\"`;
            else if(wire.size() > 1)
               text += `${wire.name}(${wire.end} downto ${wire.start})`;
            else
               text += `${wire.name}(${wire.end})`;
         }
         for(let aux1 = 0; aux1 < entity.importCalls[aux].outputs.length; aux1 ++){
            let wire = entity.importCalls[aux].outputs[aux1];
            if(aux1 != 0 || entity.importCalls[aux].inputs.length > 0) text += ", ";
            if(wire.name == ".constant")
               text += `\"${wire.value.toString(2)}\"`;
            else if(wire.size() > 1)
               text += `${wire.name}(${wire.end} downto ${wire.start})`;
            else
               text += `${wire.name}(${wire.end})`;
         }
         text += `);\n`;
      }
      text += `end architecture;\n`;
      return text;
   }
}