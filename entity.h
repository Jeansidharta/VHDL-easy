#ifndef _LIBRARY_ENTITY_
#define _LIBRARY_ENTITY_

#include<stdio.h>
#include<string>
#include<map>
#include"wire.h"
#include"fileToken.h"
#include"assignment.h"

using namespace std;

class Entity{
private:
public:
   bool hasDefinition;
   static map<string, Entity*> allEntities;

   string name;
   list<Wire*> inputs;
   list<Wire*> outputs;
   map<string, Wire*> locals;
   map<string, Wire*> allWires;
   map<string, Entity*> imports;
   list<Assignment*> assignments;
   list<Entity*> importReferences;

   Entity(FileToken& ft, bool readDefinition = true, bool isReference = false);
   void read(FileToken& ft, bool readDefinition, bool isReference);
   void readDefinition(FileToken& ft);
   void readImport(FileToken& ft);
   void readLocalDefinition(FileToken& ft);
   void readAssignment(FileToken& ft);
   void readImportCall(FileToken& ft);
   bool hasWire(const string& name);
   bool hasWire(const string& name, map<string, Wire*>& m);
   bool hasWire(const string& wire, list<Wire*>& l);
   Wire* findWire(const string& name);
   Wire* findWire(const string& name, map<string, Wire*>& m);
   Wire* findWire(const string& name, list<Wire*>& l);
   Entity* getImport(const string& entityName);
   bool hasImport(const string& entityName);
   void print();
   bool validateWire(Wire* wireTest);
   string toVHDL();
   string toVHDLPort();
};

#endif
