#include<stdio.h>
#include<string>
#include<list>
#include<map>
#include"assignment.h"
#include"error.h"
#include"wire.h"
#include"fileToken.h"

using namespace std;

enum{
   WIRE,
   GATE,
   PARENTHESIS_OPEN,
   PARENTHESIS_CLOSE
};

Assignment::Assignment(FileToken& ft, list<Wire*>& inputs, list<Wire*>& outputs, map<string, Wire*>& locals){
   wires = list<pair<Wire*, char>>();
   gates = list<int>();
   read(ft, inputs, outputs, locals);
}

Wire* Assignment::getWire(map<string, Wire*> m, string wireName){
   map<string, Wire*>::iterator i = m.find(wireName);
   if(i == m.end())
      return NULL;
   return i->second;
}

Wire* Assignment::getWire(list<Wire*> l, string wireName){
   for(list<Wire*>::iterator i = l.begin(); i != l.end(); i ++){
      if((*i)->name == wireName) return *i;
   }
   return NULL;
}

bool Assignment::hasWire(map<string, Wire*> m, string wireName){
   return getWire(m, wireName) != NULL;
}

bool Assignment::hasWire(list<Wire*> l, string wireName){
   return getWire(l, wireName) != NULL;
}

void Assignment::read(FileToken& ft, list<Wire*>& inputs, list<Wire*>& outputs, map<string, Wire*>& allWires){
   left = new Wire(ft, true);
   if(Error::hasError()) return;
   if(left->isConstant){
      new Error(ft, "left wire of assignment cannot be constant", HARD_ERROR);
      return;
   }
   if(hasWire(inputs, left->name)){
      new Error(ft, "cannot write to input", HARD_ERROR);
      return;
   }
   if(!ft.isNext("=")){
      new Error(ft, "expected \"=\" at assignment", HARD_ERROR);
      return;
   }
   delete &ft.pop();
   int parenthesisCount = 0;
   int lastToken = GATE;
   bool needWire = true;
   while(!ft.isNext(";")){
      string& token = ft.peek();
      int gate = getGate(token);
      if(gate != NULL_GATE){
         if(lastToken == WIRE || lastToken == PARENTHESIS_CLOSE){
            if(gate == NOT_GATE){
               new Error(ft, "not gate was used as a binary operator", HARD_ERROR);
               return;
            }
         }
         else if(lastToken == GATE || lastToken == PARENTHESIS_OPEN){
            if(gate != NOT_GATE){
               new Error(ft, "two binary gates in sequence", HARD_ERROR);
               return;
            }
            wires.push_back(pair<Wire*, char>(NULL, 0));
         }
         needWire = true;
         lastToken = GATE;
         gates.push_back(gate);
         delete &ft.pop();
      }
      else if(token == "("){
         parenthesisCount++;
         wires.push_back(pair<Wire*, char>(NULL, '('));
         gates.push_back(NULL_GATE);
         lastToken = PARENTHESIS_OPEN;
         delete &ft.pop();
         needWire = true;
      }
      else if(token == ")"){
         parenthesisCount--;
         if(parenthesisCount < 0){
            new Error(ft, "finishing unopened parenthesis", HARD_ERROR);
            return;
         }
         wires.push_back(pair<Wire*, char>(NULL, ')'));
         gates.push_back(NULL_GATE);
         lastToken = PARENTHESIS_CLOSE;
         delete &ft.pop();
      }
      else{
         Wire* ref = new Wire(ft, true);
         if(Error::hasError()) return;
         Wire* wire = getWire(allWires, ref->name);
         if(wire == NULL && !ref->isConstant){
            new Error(ft, "invalid wire");
            return;
         }
         if(!needWire){
            new Error(ft, "wire not needed", HARD_ERROR);
            return;
         }
         if(hasWire(outputs, ref->name)){
            new Error(ft, "cannot read from output wire", HARD_ERROR);
            return;
         }
         if(wire != NULL)
         if(ref->start < wire->start || ref->start > wire->end || ref->end > wire->end || ref->end < wire->start){
            new Error(ft, "invalid wire size reference", HARD_ERROR);
            return;
         }
         if(ref->size() != left->size()){
            new Error(ft, "incompatible wire size in assignment", HARD_ERROR);
            return;
         }
         wires.push_back(pair<Wire*, char>(ref, 0));
         lastToken = WIRE;
         needWire = false;
      }
   }
   if(parenthesisCount > 0){
      new Error(ft, "unclosed parenthesis", HARD_ERROR);
      return;
   }
   if(needWire){
      new Error(ft, "Gate left hanging", HARD_ERROR);
      return;
   }
   while(wires.size() < gates.size()){
      wires.push_back(pair<Wire*, char>(NULL, 0));
   }
   while(gates.size() < wires.size()){
      gates.push_back(NULL_GATE);
   }
}

void Assignment::print(){
   left->printLine();
   printf(" = ");
   list<pair<Wire*, char>>::iterator wireIterator = wires.begin();
   list<int>::iterator gateIterator = gates.begin();
   for(;wireIterator != wires.end(); wireIterator++, gateIterator++){
      if(wireIterator->first == NULL){
         if(wireIterator->second != 0){
            printf("%c", wireIterator->second);
         }
      }
      else{
         wireIterator->first->printLine();
         printf(" ");
      }
      if(*gateIterator != NULL_GATE){
         printf("%s ", nameGate(*gateIterator).c_str());
      }
   }
}

string Assignment::toVHDL(){
   string vhdl = string();
   vhdl += left->toVHDLSimple();
   vhdl += " <= ";
   list<pair<Wire*, char>>::iterator wireIterator = wires.begin();
   list<int>::iterator gateIterator = gates.begin();
   for(;wireIterator != wires.end(); wireIterator++, gateIterator++){
      if(wireIterator->first == NULL){
         if(wireIterator->second != 0){
            vhdl += wireIterator->second;
            vhdl += " ";
         }
      }
      else{
         vhdl += wireIterator->first->toVHDLSimple();
         vhdl += " ";
      }
      if(*gateIterator != NULL_GATE){
         vhdl += nameGate(*gateIterator);
         vhdl += " ";
      }
   }
   return vhdl;
}
