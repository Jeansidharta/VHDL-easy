#include<stdio.h>
#include<string>
#include<vector>
#include"error.h"
#include"wire.h"
#include"fileToken.h"

using namespace std;

Wire::Wire(FileToken& ft, bool isReference){
   isConstant = false;
   start = 0;
   end = 0;
   if(isReference)
      read(ft, true);
   else
      read(ft, false);
}

void Wire::read(FileToken& ft, bool isReference){
   if(!ft.isNextName()){
      if(!ft.isNextNumber() || !isReference){
         new Error(ft, "Invalid wire name", SOFT_ERROR);
         return;
      }
      readConstant(ft);
      return;
   }
   name = ft.pop();
   if(!ft.isNext("[")){
      return;
   }
   delete &ft.pop();
   if(!ft.isNextNumber()){
      new Error(ft, "invalid wire first size", HARD_ERROR);
      return;
   }
   start = stoi(ft.peek());
   delete &ft.pop();
   if(!ft.isNext("to")){
      end = start;
      if(!isReference){
         start = 0;
         if(end == 0){
            new Error(ft, "cannot create a zero-sized wire", HARD_ERROR);
            return;
         }
         end--;
      }
   }
   else{
      delete &ft.pop();
      if(!ft.isNextNumber()){
         new Error(ft, "invalid wire second size", HARD_ERROR);
         return;
      }
      end = stoi(ft.peek());
      delete &ft.pop();
      if(end < start){
         int aux = start;
         start = end;
         end = aux;
      }
   }
   if(!ft.isNext("]")){
      new Error(ft, "Expecpted \"]\"", HARD_ERROR);
      return;
   }
   delete &ft.pop();
}

int Wire::size(){
   return end - start + 1;
}

void Wire::readConstant(FileToken& ft){
   isConstant = true;
   name = "";
   string number = ft.peek();
   for(string::iterator i = number.begin(); i != number.end(); i++){
      if(*i == '1'){
         constants.push_front(true);
      }
      else if(*i == '0'){
         constants.push_front(false);
      }
      else{
         new Error(ft, "constants must be in binary", HARD_ERROR);
         return;
      }
   }
   start = 0;
   end = number.size() - 1;
   delete &ft.pop();
}

void Wire::print(){
   if(isConstant){
      printf("wire constant: ");
      for(list<bool>::reverse_iterator i = constants.rbegin(); i != constants.rend(); i ++){
         if(*i) printf("1");
         else printf("0");
      }
      printf("\n");
      return;
   }
   printf("wire name: %s\tstart: %d\tend: %d\n", name.c_str(), start, end);
}

void Wire::printLine(){
   if(isConstant){
      for(list<bool>::iterator i = constants.begin(); i != constants.end(); i ++){
         if(*i)
            printf("1");
         else
            printf("0");
      }
   }
   else if(start == 0 && end == 0)
      printf("%s", name.c_str());
   else if(start != end)
      printf("%s[%d to %d]", name.c_str(), start, end);
   else{
      printf("%s[%d]", name.c_str(), start);
   }
}

string Wire::toVHDLExtensive(string port){
   string vhdl = string();
   vhdl += name;
   vhdl += ": ";
   vhdl += port;
   vhdl += " ";
   if(start != 0 && end != 0){
      vhdl += "STD_LOGIC_VECTOR(";
      vhdl += to_string(start);
      vhdl += " DOWNTO ";
      vhdl += to_string(end);
      vhdl += ")";
   }
   else{
      vhdl += "STD_LOGIC";
   }
   return vhdl;
}

string Wire::toVHDLSimple(){
   string vhdl = string();
   if(isConstant){
      vhdl += "\"";
      for(list<bool>::iterator i = constants.begin(); i != constants.end(); i ++){
         if(*i)
            vhdl += "1";
         else
            vhdl += "0";
      }
      vhdl += "\"";
      return vhdl;
   }
   vhdl += name;
   if(start != 0 || end != 0){
      vhdl += "(";
      if(start == end){
         vhdl += to_string(start);
      }
      else{
         vhdl += to_string(start);
         vhdl += " DOWNTO ";
         vhdl += to_string(end);
      }
      vhdl += ")";
   }
   return vhdl;
}
