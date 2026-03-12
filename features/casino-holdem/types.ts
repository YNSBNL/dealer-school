export type CardSuit = "S" | "H" | "D" | "C";
export type CardRank = "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K" | "A";

export interface Card {
  rank: CardRank;
  suit: CardSuit;
}

export interface EvaluatedSevenCardHand {
  rank: number;
  label: string;
  tiebreaker: number[];
  values: number[];
}

