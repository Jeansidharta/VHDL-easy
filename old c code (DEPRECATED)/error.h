#ifndef _LIBRAR_ERROR_
#define _LIBRAR_ERROR_

#include<stdio.h>
#include<list>
#include<string>
#include"fileToken.h"

enum{
   NO_ERROR,
   SOFT_ERROR,
   HARD_ERROR
};

class Error{
private:
public:
   static list<Error*> errors;
   static bool hasFatalErrorVar;
   static bool hasFatalError(){
      return hasFatalErrorVar;
   }
   static bool hasError(){
      return errors.size() > 0;
   }
   static bool pop(){
      errors.pop_back();
   }
   static bool applyError(){
      list<Error*>::iterator i;
      for(i = errors.begin(); i != errors.end(); i ++){
         (*i)->print();
      }
      exit(-1);
   }

   string message;
   string fileName;
   int line;
   int errorType;
   Error(FileToken& ft);
   Error(FileToken& ft, const string& message);
   Error(FileToken& ft, const string& message, int errorType);
   Error(FileToken& ft, int errorType);
   void print();
};

#endif
