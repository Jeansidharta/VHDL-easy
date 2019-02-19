let fs = require("fs");

import {File} from "./[class]File";
// import {Wire} from "./[class]wire";
import {Entity} from "./[class]Entity";
import {VHDLConverter} from "./[class]VHDLConverter";

function processFile(fileName : string){
   let text : string = "";
   let file : File = new File(fileName);
   while(file.tokens.length > 0){
      text += VHDLConverter.entityToVHDL(new Entity(file, {mode:"definition"}));
      text += "\n\n";
   }
   if(fileName.endsWith(".shdl"))
      fileName = fileName.substring(0, fileName.length - 5);
   fileName += ".vhd";
   fs.writeFileSync(fileName, text);
}

let inputFiles = [];
for(let aux = 2; aux < process.argv.length; aux ++){
   inputFiles.push(process.argv[aux]);
}

for(let aux = 0; aux < inputFiles.length; aux ++){
   processFile(inputFiles[aux]);
}