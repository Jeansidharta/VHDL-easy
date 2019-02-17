#ifndef _LIBRARY_WIRE_
#define _LIBRARY_WIRE_

#include<stdio.h>
#include<string>
#include<vector>
#include"error.h"
#include"fileToken.h"

using namespace std;

class Wire{
private:
public:
   string name;
   int start;
   int end;
   bool isConstant;
   list<bool> constants;

   Wire(FileToken& ft, bool isReference);
   void read(FileToken& ft, bool isReference);
   void readConstant(FileToken& ft);
   int size();
   void print();
   void printLine();
   string toVHDLExtensive(string port = "");
   string toVHDLSimple();
};

#endif
