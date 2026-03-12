export type CardSuit = "S" | "H" | "D" | "C";
export type CardRank = "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K" | "A";

export interface Card {
  id: string;
  rank: CardRank;
  suit: CardSuit;
}

export interface TablePreset {
  id: number;
  min: number;
  max: number;
  step: number;
}

export interface HandEvaluation {
  rank: number;
  k: number[];
}

export interface UltimatePlayer {
  active: boolean;
  cards: Card[];
  miser: number;
  blind: number;
  bonus: number;
  jouer: number;
  jouerMult: number;
  progressive: boolean;
  folded: boolean;
  result: string | null;
  payout: number;
  eval: HandEvaluation | null;
  progressiveWin: number;
  bonusPay?: number;
  progPay?: number;
}

export interface DealtUltimateRound {
  dealerCards: Card[];
  board: Card[];
  players: UltimatePlayer[];
  jackpotIncrement: number;
}

export interface PayoutResult {
  payAmount: number;
  result: "win" | "lose" | "push";
  bonusPay: number;
  progPay: number;
  mainPay: number;
}

