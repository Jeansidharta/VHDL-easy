# Simple Hardware Description Language

## Overview

SHDL (Simple hardware Description language) is an extremely low-level hardware language with a C like syntax. It was made to work only with basic logic gates and user-made modules. SHDL's greatest feature is it's compact syntax when compared with the more traditional languages (VHDL and verilog). It was heavily inspired in VHDL's logic and C's syntax.

The code presented will turn all SHDL code in VHDL-equivalent, to be used in a proper interpreter.

## How to use

This code was intended to be used with nodejs. Simply run `npm main.js FILES_TO_RUN` replacing "FILES TO RUN" with a list of filenames you want to run. This will generateone .shdl file for every given file.

## Components

The language is composed of three main components:

1. Wires: connect blocks and logic gates to each-other to transfer electrical signals.
2. Logic gates: manipulates electrical signals.
3. Blocks: user-defined group of connected wires and logic gates, with some wires defined as block inputs and block outputs. Can be freely copied into other blocks.

## Actions

There are four main actions:

1. Declare wire
2. Assign logic to wire
3. Import another block
4. Instantiate imported block

## Hello World
Since we can't print in hardware, I'll start demonstrating the language by using a Full adder.

```
//save this in a file named full_adder_file.shdl
FullAdder(A, B, carry_in; out, carry_out){
   out = A xor B xor carry_in;
   carry_out = (A and B) or (A and carry_in) or (B and carry_in);
}
```

The first thing we must do is create a block, since everything in this language is done inside blocks. The formula to create one is `BlockName ( InputWiresList ; OutputWiresList )`. So, the first line of the code creates a block named "FullAdder", with "A", "B" and "carry_in" as input wires, and "out" and "carry_out" as outputs.

The second and third line are both assignments. They simply assign some logic of many wires and logic gates to a single wire.

Now we have a block named "FullAdder" that performs the addition of two bits with a carry. To demonstrate the rest of the features, I will create another block to perform a 4-bit addition using the FullAdder.

```
//save this in a file named adder_4bits_file.shdl
Adder_4bits(A[4], B[4]; out[4], overflow){
   import FullAdder from full_adder_file.shdl;
   signal carries[3];

   FullAdder(A[0], B[0],     0     ; out[0], carries[0]);
   FullAdder(A[1], B[1], carries[0]; out[1], carries[1]);
   FullAdder(A[2], B[2], carries[1]; out[2], carries[2]);
   FullAdder(A[3], B[3], carries[2]; out[3], overflow);
}
```

In the first line, we again create a new block named "Adder_4bits", but this time by declaring buses (wire arrays) as arguments. They behave much like in any other language, with each index being an idividual wire. In this case, we created two input buses named "A" and "B", both containing four wires. They will represent the numbers to be added in binary. As output, we have a four-sized bus named "out", which will be the result, along with a single bit to signify an overflow.

Note that you can access individual sections of the bus with the following syntax: `BUS_NAME[START to END]`, e.g. `carries[1 to 2]` (start and end are inclusive)

In the second line, we declare the intent of using another block by typing the keyword "import". The syntax is `import BLOCK_NAME from FILE_NAME;` if the block is in another file, and `import BLOCK_NAME;` if the block is in the current file.

The third line is a wire declaration, that specifies auxiliar wires to be used. In this case, we are declaring a wire array named "carries" os size 3.

The remaining lines are import instantiations, which uses the previously imported block. To instantiate an imported block, the syntax is `BLOCK_NAME(INPUT_WIRES_LIST; OUTPUT_WIRES_LIST);`. This will create a copy of the imported block and connect the INPUT_WIRES_LIST and OUTPUT_WIRES_LIST to it's corresponding inputs and outputs. In this case, we are doing an addition using four full adders. One thing to note is that you can use a constant value (in binary) to replace any wire that would not be written into, as exemplified by the zero in the fourth line, e.g. `carries[0 to 2] = 101;`

## Examples

Each example in the folder has an individual readme file with complete instructions in how to run. Every single one of them was tested, and should be working in any machine.