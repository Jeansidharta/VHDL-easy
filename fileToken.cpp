#include<stdio.h>
#include<fstream>
#include<list>
#include<string>
#include"fileToken.h"

static bool isSpace(char c){
   return c == '\n' || c == ' ' || c == '\t';
}

static bool isChar(char c){
   return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c == '_';
}

static bool isDigit(char c){
   return c >= '0' && c <= '9';
}

FileToken::FileToken(char* fileNameString){
   fileName = std::string(fileNameString);
   stream.open(fileNameString);
   line = 0;
   lineBuffer = 1;
   isLineStart = true;
}

FileToken::FileToken(string fileNameString){
   fileName = fileNameString;
   stream.open(fileName.c_str());
   line = 0;
   lineBuffer = 0;
   isLineStart = true;
}

string* FileToken::extractToken(){
   string* token = new string();
   char c;
   int size = 0;

   if(lineBuffer > 0){
      line += lineBuffer;
      lineBuffer = 0;
      isLineStart = true;
   }
   else isLineStart = false;

   stream.get(c);
   while(isSpace(c) && !stream.eof()){
      if(c == '\n') line++;
      stream.get(c);
   }
   if(isChar(c)) while(isChar(c) || isDigit(c)){
      *token += c;
      stream.get(c);
   }
   else if(isDigit(c)) while(isDigit(c)){
      *token += c;
      stream.get(c);
   }
   else if(!stream.eof()){
      *token += c;
      stream.get(c);
   }
   while(isSpace(c) && !stream.eof()){
      if(c == '\n') lineBuffer++;
      stream.get(c);
   }
   if(!stream.eof()){
      stream.seekg(-1, ios_base::cur);
   }
   return token;
}

string& FileToken::peek(int index){
   if(tokens.size() <= index){
      tokens.push_back(extractToken());
   }
   int aux = 0;
   list<string*>::iterator i = tokens.begin();
   for(; aux < index; aux ++, i ++);
   return **i;
}

string& FileToken::peek(){
   if(tokens.size() == 0){
      tokens.push_back(extractToken());
   }
   return *tokens.front();
}

string& FileToken::pop(){
   if(tokens.size() == 0){
      return *extractToken();
   }
   string* token = tokens.back();
   tokens.pop_back();
   return *token;
}

bool FileToken::eof(){
   return stream.eof();
}

bool FileToken::isNext(const string& str){
   return peek() == str;
}

bool FileToken::isNextName(){
   return isChar(peek().c_str()[0]);
}
bool FileToken::isNextNumber(){
   return isDigit(peek().c_str()[0]);
}
