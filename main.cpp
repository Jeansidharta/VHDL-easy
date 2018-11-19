#include<stdio.h>
#include<string>
#include<map>
#include<list>
#include"wire.h"
#include"entity.h"

int main(int argc, char** argv){
   if(argc != 2){
      printf("invalid arguments\n");
      return -1;
   }
   FileToken ft = FileToken(argv[1]);
   Entity* entity;
   entity = new Entity(ft);
   if(Error::hasError())
      Error::applyError();
   entity->print();
   string vhdl = entity->toVHDL();
   FILE* destiny = fopen("vhdl", "w");
   fprintf(destiny, "%s", vhdl.c_str());
}
