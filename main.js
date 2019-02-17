let File = require("./[class]File.js");
let fs = require("fs");
let Wire = require("./[class]wire.js");
let Entity = require("./[class]Entity.js");
let VHDLConverter = require("./[class]VHDLConverter.js");
function processFile(fileName){
   let text = "";
   file = new File(fileName);
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