export type RouletteBetType =
  | "straight"
  | "split"
  | "street"
  | "corner"
  | "sixLine"
  | "dozen"
  | "column"
  | "red"
  | "black"
  | "even"
  | "odd"
  | "low"
  | "high";

export interface RouletteBetDefinition {
  name: string;
  payout: number;
  description: string;
}

export interface RouletteBet {
  id: string;
  type: RouletteBetType;
  amount: number;
  numbers: number[];
}

export interface RouletteRound {
  bets: RouletteBet[];
  winningNumber: number;
  correctAnswer: number;
}

