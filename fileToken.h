#ifndef _LIBRARY_FILETOKEN_
#define _LIBRARY_FILETOKEN_

#include<fstream>
#include<list>
#include<string>

using namespace std;

class FileToken{
private:
public:
   ifstream stream;
   string fileName;
   list<string*> tokens;
   int lineBuffer;
   string* extractToken();
   int line;
   bool isLineStart;

   FileToken(char* name);
   FileToken(string name);
   string& peek();
   string& peek(int index);
   string& pop();
   bool isNext(const string& str);
   bool isNextName();
   bool isNextNumber();
   bool eof();
};

#endif
