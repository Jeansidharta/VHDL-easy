library ieee;
use ieee.std_logic_1164.all;

entity FullAdder is
	port(
		A : in std_logic;
		B : in std_logic;
		carry_in : in std_logic;
		out : out std_logic;
		carry_out : out std_logic
	);
end FullAdder;

architecture FullAdderArc of FullAdder is

begin
	out(0) <= A(0) xor B(0) xor carry_in(0) ;
	carry_out(0) <= ( A(0) and B(0) ) or ( A(0) and carry_in(0) ) or ( B(0) and carry_in(0) ) ;

end architecture;


