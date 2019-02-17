let fs = require("fs");
const unicodeA = 'a'.charCodeAt();
const unicodeZ = 'z'.charCodeAt();
const unicodeACaps = 'A'.charCodeAt();
const unicodeZCaps = 'Z'.charCodeAt();
const unicode0 = '0'.charCodeAt();
const unicode9 = '9'.charCodeAt();

function isCharLetter(char){
   let unicode = char.charCodeAt(0);
   if(
      (unicode >= unicodeA && unicode <= unicodeZ) ||
      (unicode >= unicodeACaps && unicode <= unicodeZCaps) ||
      char == "_" || char == "."
   )
      return true;
   return false;
}

function isCharNumber(char){
   let unicode = char.charCodeAt(0);
   if(unicode >= unicode0 && unicode <= unicode9)
      return true;
   return false;
}

function isCharWhitespace(char){
   return char == " " || char == "\n" || char == "\t" || char == "\r";
}

class Token{
   constructor(text, line, col){
      this.text = text;
      this.line = line;
      this.col = col;
   }
}

module.exports = class File{
   constructor(){
      this.tokens = [];
      this.currentLine = 1;
      this.currentCol = 1;
      this.isEndOfFile = false;
      if(arguments.length == 0){
         throw("file constructor need an argument");
      }
      else if(arguments.length == 1){
         this.name = arguments[0];
         this.text = fs.readFileSync(this.name, {encoding:"utf8"});
         this.text = this.text.replace(/\r+/g, "");
         this.isEndOfFile = this.text.length == 0;
         this.readAllTokens();
      }
      else throw("invalid arguments to File constructor");
   }

   readToken(){
      if(this.isEndOfFile) return;
      let aux;
      let newLine = this.tokens.length > 0? this.tokens[this.tokens.length - 1].line : this.currentLine;
      let newCol = this.tokens.length > 0? this.tokens[this.tokens.length - 1].col : this.currentCol;
      let tokenText = "";
      for(aux = 0; aux < this.text.length; aux ++){
         if(this.text[aux] == "\n"){
            newLine++;
            newCol = 1;
         }
         else if(isCharWhitespace(this.text[aux])){
            newCol++;
         }
         else if(aux < this.text.length - 1 && this.text[aux] == "/" && this.text[aux + 1] == "/"){
            while(this.text[aux] != "\n" && aux < this.text.length){
               aux ++;
            }
            newLine++;
            newCol = 1;
         }
         else if(aux < this.text.length - 1 && this.text[aux] == "/" && this.text[aux + 1] == "*"){
            while(aux < this.text.length - 1 && (this.text[aux] != "*" || this.text[aux + 1] != "/")){
               if(this.text[aux] == "\n"){
                  newLine++;
                  newCol = 1;
               }
               else
                  newCol ++;
               aux ++;
            }
            aux ++;
         }
         else break;
      }
      this.isEndOfFile = aux >= this.text.length;
      if(this.isEndOfFile){
         this.text = "";
         return;
      }
      if(isCharLetter(this.text[aux])){
         for(; aux < this.text.length; aux ++){
            if(isCharLetter(this.text[aux]) || isCharNumber(this.text[aux])){
               newCol++;
               tokenText += this.text[aux];
            }
            else break;
         }
      }
      else if(isCharNumber(this.text[aux])){
         for(; aux < this.text.length; aux ++){
            if(isCharNumber(this.text[aux])){
               newCol++;
               tokenText += this.text[aux];
            }
            else break;
         }
      }
      else{
         newCol++;
         tokenText += this.text[aux++];
      }
      this.text = this.text.substring(aux, this.text.length);
      this.tokens.push(new Token(tokenText, newLine, newCol));
      this.isEndOfFile = this.text.length == 0;
   }

   readAllTokens(){
      while(!this.isEndOfFile) this.readToken();
   }

   previewToken(){
      let pos = 0;
      if(arguments.length !== 0) pos = arguments[0];
      if(this.tokens.length <= pos) return "";
      return this.tokens[pos].text;
   }

   isNext(arg, pos){
      if(arg.constructor === String)
         return this.previewToken(pos !== undefined? pos : 0) === arg;
      else if(arg.constructor === Number)
         return parseInt(this.previewToken(pos !== undefined? pos : 0)) === arg;
   }

   isNextName(pos){
      return isCharLetter(this.previewToken(pos !== undefined? pos : 0)[0]);
   }

   isNextNumber(pos){
      return isCharNumber(this.previewToken(pos !== undefined? pos : 0)[0]);
   }

   popToken(){
      if(arguments.length == 0){
         while(this.tokens.length == 0){
            if(this.isEndOfFile) return "";
            else readToken();
         }
         let token = this.tokens.shift();
         this.currentLine = token.line;
         this.currentCol = token.col;
         return token.text;
      }
      else
         throw("invalid preview token arguments");
   }

   throwError(text){
      throw(`ERROR AT LINE ${this.currentLine} OF FILE ${this.name}: ${text}`);
   }
}