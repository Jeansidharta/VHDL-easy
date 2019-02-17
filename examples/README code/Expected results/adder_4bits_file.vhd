library ieee;
use ieee.std_logic_1164.all;

entity Adder_4bits is
	port(
		A : in std_logic_vector(3 downto 0);
		B : in std_logic_vector(3 downto 0);
		out : out std_logic_vector(3 downto 0);
		overflow : out std_logic
	);
end Adder_4bits;

architecture Adder_4bitsArc of Adder_4bits is

	component FullAdder is
		port(
			A : in std_logic;
			B : in std_logic;
			carry_in : in std_logic;
			out : out std_logic;
			carry_out : out std_logic
		);
	end component;

	signal carries : std_logic_vector(2 downto 0);
begin

	G0: FullAdder port map (A(0), B(0), "0", out(0), carries(0));
	G1: FullAdder port map (A(1), B(1), carries(0), out(1), carries(1));
	G2: FullAdder port map (A(2), B(2), carries(1), out(2), carries(2));
	G3: FullAdder port map (A(3), B(3), carries(2), out(3), overflow(0));
end architecture;


