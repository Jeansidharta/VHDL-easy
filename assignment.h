#ifndef _LIBRARY_ASSIGNMENT_
#define _LIBRARY_ASSIGNMENT_

#include<stdio.h>
#include<string>
#include<list>
#include<map>
#include"error.h"
#include"wire.h"
#include"fileToken.h"

using namespace std;

enum{
   NULL_GATE,
   AND_GATE,
   OR_GATE,
   NOT_GATE,
   XOR_GATE,
   NOR_GATE,
   NAND_GATE,
   BAND_GATE,
   BOR_GATE
};

class Assignment{
private:
   Wire* getWire(map<string, Wire*> m, string wireName);
   Wire* getWire(list<Wire*> l, string wireName);
   bool hasWire(map<string, Wire*> m, string wireName);
   bool hasWire(list<Wire*> l, string wireName);
public:
   Wire* left;
   list<pair<Wire*, char>> wires;
   list<int> gates;

   static bool isGate(const string& str){
      return getGate(str) != NULL_GATE;
   }
   static int getGate(const string& str){
      if(str == "or") return OR_GATE;
      if(str == "and") return AND_GATE;
      if(str == "xor") return XOR_GATE;
      if(str == "nor") return NOR_GATE;
      if(str == "bor") return BOR_GATE;
      if(str == "band") return BAND_GATE;
      if(str == "not") return NOT_GATE;
      if(str == "nand") return NAND_GATE;
      return NULL_GATE;
   }
   static const string nameGate(int gate){
      if(gate == OR_GATE) return "or";
      if(gate == AND_GATE) return "and";
      if(gate == XOR_GATE) return "xor";
      if(gate == NOR_GATE) return "nor";
      if(gate == BOR_GATE) return "bor";
      if(gate == BAND_GATE) return "band";
      if(gate == NOT_GATE) return "not";
      if(gate == NAND_GATE) return "nand";
      return "undefined";
   }

   Assignment(FileToken& ft, list<Wire*>& inputs, list<Wire*>& outputs, map<string, Wire*>& allWires);
   void read(FileToken& ft, list<Wire*>& inputs, list<Wire*>& outputs, map<string, Wire*>& allWires);
   void print();
   string toVHDL();
};

#endif
