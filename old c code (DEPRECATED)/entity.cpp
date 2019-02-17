#include<stdio.h>
#include<string>
#include<map>
#include"fileToken.h"
#include"error.h"
#include"entity.h"
#include"assignment.h"

using namespace std;

map<string, Entity*> Entity::allEntities = map<string, Entity*>();

Entity::Entity(FileToken& ft, bool readDefinition, bool isReference){
   inputs = list<Wire*>();
   outputs = list<Wire*>();
   locals = map<string, Wire*>();
   allWires = map<string, Wire*>();
   imports = map<string, Entity*>();
   assignments = list<Assignment*>();
   importReferences = list<Entity*>();

   hasDefinition = false;
   read(ft, readDefinition, isReference);
}

void Entity::read(FileToken& ft, bool readDefinition, bool isReference){
   if(!ft.isNextName()){
      new Error(ft, "invalid entity name", SOFT_ERROR);
      return;
   }
   name = ft.pop();
   if(!ft.isNext("(")){
      new Error(ft, "expected \"(\" after entity name", SOFT_ERROR);
      return;
   }
   delete &ft.pop();
   list<Wire*>* targetList = &inputs;
   while(!ft.isNext(")")){
      Wire* wire = new Wire(ft, isReference);
      if(Error::hasError()) return;
      if(hasWire(wire->name) && !isReference){
         new Error(ft, "cannot insert two wires with the same name", HARD_ERROR);
         return;
      }
      targetList->push_back(wire);
      allWires.insert(pair<string, Wire*>(wire->name, wire));

      while(ft.isNext(","))
         delete &ft.pop();
      if(ft.isNext(";")){
         targetList = &outputs;
         delete &ft.pop();
      }
   }
   delete &ft.pop();
   allEntities.insert(pair<string, Entity*>(name, this));
   if(ft.isNext("{")){
      if(readDefinition)
         this->readDefinition(ft);
   }
}

void Entity::readImport(FileToken& ft){
   if(!ft.isNext("import")){
      new Error(ft, "expected \"import\" keyword", SOFT_ERROR);
      return;
   }
   delete &ft.pop();
   if(!ft.isNextName()){
      new Error(ft, "invalid entity name in import", HARD_ERROR);
      return;
   }
   string& entityName = ft.pop();
   string fileName;
   if(ft.isNext("from")){
      delete &ft.pop();
      if(!ft.isNextName()){
         new Error(ft, "invalid file name in import", HARD_ERROR);
         return;
      }
      fileName = ft.peek();
      delete &ft.pop();
   }
   else{
      fileName = ft.fileName;
   }
   FileToken newFt(fileName);
   while(!newFt.eof()){
      Entity* entity = new Entity(newFt, false);
      if(Error::hasError()) return;
      if(entity->name == entityName){
         imports.insert(pair<string, Entity*>(entityName, entity));
         return;
      }
      if(newFt.isNext(";"))
         delete &newFt.pop();
      else if(newFt.isNext("{")){
         while(!newFt.isNext("}"))
            delete &newFt.pop();
         delete &newFt.pop();
      }
   }
   new Error(ft, "could not find imported entity", HARD_ERROR);
}

void Entity::readLocalDefinition(FileToken& ft){
   if(!ft.isNext("signal")){
      new Error(ft, "expected \"signal\" token", SOFT_ERROR);
      return;
   }
   delete &ft.pop();
   while(!ft.isNext(";")){
      Wire* wire = new Wire(ft, false);
      if(Error::hasError()) return;
      if(hasWire(wire->name)){
         new Error(ft, "cannot insert two wires with the same name", HARD_ERROR);
         return;
      }
      locals.insert(pair<string, Wire*>(wire->name, wire));
      allWires.insert(pair<string, Wire*>(wire->name, wire));

      while(ft.isNext(","))
         delete &ft.pop();
   }
}

bool Entity::hasWire(const string& name){
   return allWires.find(name) != allWires.end();
}

bool Entity::hasWire(const string& name, map<string, Wire*>& m){
   return m.find(name) != m.end();
}

bool Entity::hasWire(const string& wire, list<Wire*>& l){
   return findWire(wire, l) != NULL;
}

Wire* Entity::findWire(const string& name){
   return findWire(name, allWires);
}

Wire* Entity::findWire(const string& name, map<string, Wire*>& m){
   map<string, Wire*>::iterator i;
   i = m.find(name);
   if(i != m.end()) return i->second;
   return NULL;
}

Wire* Entity::findWire(const string& name, list<Wire*>& l){
   for(list<Wire*>::iterator i = l.begin(); i != l.end(); i ++){
      if((*i)->name == name) return *i;
   }
   return NULL;
}

void Entity::readDefinition(FileToken& ft){
   if(!ft.isNext("{")){
      new Error(ft, "expected \"{\" at entity definition", SOFT_ERROR);
      return;
   }
   delete &ft.pop();
   hasDefinition = true;
   while(!ft.isNext("}")){
      if(ft.isNext("import"))
         readImport(ft);
      else if(ft.isNext("signal"))
         readLocalDefinition(ft);
      else if(ft.isNextName()){
         string name = ft.peek();
         if(hasWire(name)){
            assignments.push_back(new Assignment(ft, inputs, outputs, allWires));
         }
         else if(hasImport(name)){
            readImportCall(ft);
         }
         else{
            new Error(ft, "invalid token", HARD_ERROR);
            return;
         }
      }
      else if(!ft.isNext(";")){
         new Error(ft, "invalid token", HARD_ERROR);
         return;
      }
      if(Error::hasError()) return;
      if(!ft.isNext(";")){
         new Error(ft, "expected \";\" at line end", HARD_ERROR);
         return;
      }
      delete &ft.pop();
   }
   delete &ft.pop();
}

void Entity::print(){
   printf("entity name: %s\nimports:", name.c_str());
   if(imports.size() > 0) printf("\n\n");
   for(map<string, Entity*>::iterator i = imports.begin(); i != imports.end(); i ++){
      i->second->print();
   }
   printf("imports references");
   if(importReferences.size() > 0) printf("\n\n");
   for(list<Entity*>::iterator i = importReferences.begin(); i != importReferences.end(); i ++){
      (*i)->print();
   }
   printf("\ninputs:\n");
   for(list<Wire*>::iterator i = inputs.begin(); i != inputs.end(); i ++){
      (*i)->print();
   }
   printf("outputs:\n");
   for(list<Wire*>::iterator i = outputs.begin(); i != outputs.end(); i ++){
      (*i)->print();
   }
   printf("locals:\n");
   for(map<string, Wire*>::iterator i = locals.begin(); i != locals.end(); i ++){
      i->second->print();
   }
   printf("assignments: ");
   for(list<Assignment*>::iterator i = assignments.begin(); i != assignments.end(); i ++){
      (*i)->print();
   }
   printf("\n");

   if(hasDefinition)
      printf("has definition!\n\n");
}

Entity* Entity::getImport(const string& entityName){
   map<string, Entity*>::iterator i = imports.find(entityName);
   if(i == imports.end()) return NULL;
   return i->second;
}

bool Entity::hasImport(const string& entityName){
   return getImport(entityName) != NULL;
}

bool Entity::validateWire(Wire* wireTest){
   Wire* wire = findWire(wireTest->name);
   if(wire == NULL) return false;
   if(wireTest->start < wire->start || wireTest->start > wire->end || wireTest->end < wire->start || wireTest->end > wire->end)
      return false;
   return true;
}

void Entity::readImportCall(FileToken& ft){
   Entity* ref = new Entity(ft, false, true);
   if(Error::hasError()) return;
   Entity* import = getImport(ref->name);
   if(import == NULL){
      new Error(ft, "import call without import", HARD_ERROR);
      return;
   }
   if(ref->inputs.size() != import->inputs.size()){
      new Error(ft, "unmatching import inputs length", HARD_ERROR);
      return;
   }
   if(ref->outputs.size() != import->outputs.size()){
      new Error(ft, "unmatching import outputs length", HARD_ERROR);
      return;
   }
   list<Wire*>::iterator i = ref->inputs.begin();
   list<Wire*>::iterator j = import->inputs.begin();
   for(;i != ref->inputs.end(); i ++, j++){
      if((*i)->size() != (*j)->size()){
         new Error(ft, "unmatching input wire size in import", HARD_ERROR);
         return;
      }
      if(!((*i)->isConstant) && !validateWire(*i)){
         new Error(ft, "unexisting or incorrect input wire at import", HARD_ERROR);
         return;
      }
      else if(hasWire((*i)->name, outputs)){
         new Error(ft, "cannot read from output to import", HARD_ERROR);
         return;
      }
   }
   i = ref->outputs.begin();
   j = import->outputs.begin();
   for(;i != ref->outputs.end(); i ++, j++){
      if((*i)->size() != (*j)->size()){
         new Error(ft, "unmatching output wire size in import", HARD_ERROR);
         return;
      }
      if(!validateWire(*i)){
         new Error(ft, "unexisting input wire at import", HARD_ERROR);
         return;
      }
      else if(hasWire((*i)->name, inputs)){
         new Error(ft, "cannot write to input from import", HARD_ERROR);
         return;
      }
   }
   importReferences.push_back(ref);
}

string Entity::toVHDLPort(){
   string vhdl = string();
   vhdl += "\tPORT(\n";
   for(list<Wire*>::iterator i = inputs.begin(); i != inputs.end(); i ++){
      vhdl += "\t\t";
      vhdl += (*i)->toVHDLExtensive("IN");
      vhdl += ";\n";
   }
   for(list<Wire*>::iterator i = outputs.begin(); i != outputs.end(); i ++){
      vhdl += "\t\t";
      vhdl += (*i)->toVHDLExtensive("OUT");
      vhdl += ";\n";
   }
   vhdl += "\t);\n";
   return vhdl;
}

string Entity::toVHDL(){
   string vhdl = string();
   vhdl += "LIBRARY IEEE;\nUSE IEEE.STD_LOGIC_1664.all;\n\n\nENTITY ";
   vhdl += name;
   vhdl += " IS\n";
   vhdl += toVHDLPort();
   vhdl += "END ";
   vhdl += name;
   vhdl += ";\n\nARCHITECTURE ";
   vhdl += name;
   vhdl += "ARC OF ";
   vhdl += name;
   vhdl += " IS\n\n";
   for(map<string, Entity*>::iterator i = imports.begin(); i != imports.end(); i ++){
      vhdl += "COMPONENT ";
      vhdl += i->second->name;
      vhdl += "\n";
      vhdl += i->second->toVHDLPort();
      vhdl += "END COMPONENT\n\n";
   }
   for(map<string, Wire*>::iterator i = locals.begin(); i != locals.end(); i ++){
      vhdl += "SIGNAL ";
      vhdl += i->second->toVHDLExtensive();
      vhdl += ";\n";
   }
   vhdl += "\nBEGIN\n\n";
   for(list<Assignment*>::iterator i = assignments.begin(); i != assignments.end(); i ++){
      vhdl += "\t";
      vhdl += (*i)->toVHDL();
      vhdl += ";\n";
   }

   int counter = 0;
   for(list<Entity*>::iterator i = importReferences.begin(); i != importReferences.end(); i ++){
      vhdl += "\tG";
      vhdl += to_string(counter++);
      vhdl += ": ";
      vhdl += (*i)->name;
      vhdl += " PORT MAP (";
      for(list<Wire*>::iterator j = (*i)->inputs.begin(); j != (*i)->inputs.end(); j ++){
         vhdl += (*j)->toVHDLSimple();
         if(++j != (*i)->inputs.end())
            vhdl += ", ";
         --j;
      }
      if((*i)->inputs.size() > 0)
         vhdl += ", ";
      for(list<Wire*>::iterator j = (*i)->outputs.begin(); j != (*i)->outputs.end(); j ++){
         vhdl += (*j)->toVHDLSimple();
         if(++j != (*i)->outputs.end())
            vhdl += ", ";
         --j;
      }
      vhdl += ");\n";
   }
   vhdl += "END ARCHITECTURE;";
   return vhdl;
}
