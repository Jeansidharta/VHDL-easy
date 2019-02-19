let fs = require("fs");

const unicodeA: number = 'a'.charCodeAt(0);
const unicodeZ: number = 'z'.charCodeAt(0);
const unicodeACaps: number = 'A'.charCodeAt(0);
const unicodeZCaps: number = 'Z'.charCodeAt(0);
const unicode0: number = '0'.charCodeAt(0);
const unicode9: number = '9'.charCodeAt(0);

function isCharLetter(char: string) : boolean{
   let unicode : number = char.charCodeAt(0);
   return(
      (unicode >= unicodeA && unicode <= unicodeZ) ||
      (unicode >= unicodeACaps && unicode <= unicodeZCaps) ||
      char == "_" || char == "."
   );
}

function isCharNumber(char : string) : boolean{
   let unicode = char.charCodeAt(0);
   return (unicode >= unicode0 && unicode <= unicode9);
}

function isCharWhitespace(char: string) : boolean{
   return char == " " || char == "\n" || char == "\t" || char == "\r";
}

class Token{
   constructor(public text: string, public line: number, public col: number){}
}

//given a filename, this class will read the file, parse it into tokens
//and return each individual token as requested. It is also responsable
//of telling the location of any error.

export class File{

   public tokens: Token[] = [];
   public currentLine: number = 1;
   public currentCol: number = 1;
   public readonly name: string;
   private text: string;
   private lastLine : number = 1;
   private lastCol : number = 1;
   private currentLineText : string = "";

   get isEndOfFile() : boolean{
      return this.text.length == 0;
   }

   constructor(public readonly fileName : string){
      this.name = fileName;
      this.text = fs.readFileSync(this.name, {encoding:"utf8"}).replace(/\r+/g, "");
      while(!this.isEndOfFile) this.readToken();
   }

   private readToken() : void{
      if(this.isEndOfFile) return;
      let aux : number;
      let newLine : number = this.tokens.length > 0? this.tokens[this.tokens.length - 1].line : this.currentLine;
      let newCol : number = this.tokens.length > 0? this.tokens[this.tokens.length - 1].col : this.currentCol;
      let tokenText : string = "";
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
   }

   public previewToken(pos : number = 0) : string{
      if(this.tokens.length <= pos) return "";
      return this.tokens[pos].text;
   }

   isNext(arg : string, pos : number = 0) : boolean{
      return this.previewToken(pos) == arg;
   }

   mustBeNext(arg : string, message : string) : void{
      if(this.previewToken(0) != arg)
         this.throwError(message);
   }

   isNextName(pos : number = 0){
      return isCharLetter(this.previewToken(pos)[0]);
   }

   mustBeNextName(message : string){
      if(!isCharLetter(this.previewToken(0)[0]))
         this.throwError(message);
   }

   isNextNumber(pos : number = 0){
      return isCharNumber(this.previewToken(pos)[0]);
   }

   mustBeNextNumber(message : string){
      if(!isCharNumber(this.previewToken(0)[0]))
         this.throwError(message);
   }

   popToken() : string{
      let token : Token, tokenShift : Token | undefined = this.tokens.shift();
      if(tokenShift === undefined) return "";
      else token = tokenShift;
      this.lastCol = this.currentCol;
      this.lastLine = this.currentLine;
      this.currentLine = token.line;
      this.currentCol = token.col;
      return token.text;
   }

   throwError(text : string) : never{
      throw(`ERROR (${this.lastLine}, ${this.lastCol}) OF FILE ${this.name}: ${text}`);
   }
}