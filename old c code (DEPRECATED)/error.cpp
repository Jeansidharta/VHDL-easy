#include<stdio.h>
#include<string>
#include<stdlib.h>
#include<list>
#include"error.h"

using namespace std;

list<Error*> Error::errors = list<Error*>();
bool Error::hasFatalErrorVar = false;

Error::Error(FileToken& ft){
   line = ft.line;
   fileName = ft.fileName;
   errorType = SOFT_ERROR;
   errors.push_back(this);
}

Error::Error(FileToken& ft, const string& message){
   line = ft.line;
   fileName = ft.fileName;
   errorType = SOFT_ERROR;
   this->message = message;
   errors.push_back(this);
}

Error::Error(FileToken& ft, const string& message, int errorType){
   line = ft.line;
   fileName = ft.fileName;
   this->errorType = errorType;
   this->message = message;
   if(errorType == HARD_ERROR)
      hasFatalErrorVar = true;
   errors.push_back(this);
}

Error::Error(FileToken& ft, int errorType){
   line = ft.line;
   fileName = ft.fileName;
   this->errorType = errorType;
   if(errorType == HARD_ERROR)
      hasFatalErrorVar = true;
   errors.push_back(this);
}

void Error::print(){
   printf("ERROR AT LINE %d OF FILE %s: \"%s\"\n", line, fileName.c_str(), message.c_str());
}
