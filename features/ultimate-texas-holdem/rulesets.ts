import type { CardRank, CardSuit, TablePreset } from "./types";

export const SUITS: CardSuit[] = ["S", "H", "D", "C"];
export const RANKS: CardRank[] = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
export const RANK_VALUES: Record<CardRank, number> = {
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
  "7": 7,
  "8": 8,
  "9": 9,
  "10": 10,
  J: 11,
  Q: 12,
  K: 13,
  A: 14,
};
export const SUIT_SYMBOLS: Record<CardSuit, string> = { S: "♠", H: "♥", D: "♦", C: "♣" };
export const SUIT_COLORS: Record<CardSuit, string> = { S: "#1a1a1a", H: "#C62828", D: "#C62828", C: "#1a1a1a" };
export const HAND_NAMES: Record<number, string> = {
  0: "Carte haute",
  1: "Paire",
  2: "Deux paires",
  3: "Brelan",
  4: "Suite",
  5: "Couleur",
  6: "Full",
  7: "Carré",
  8: "Quinte flush",
  9: "Quinte flush royale",
};
export const ALL_HANDS = Object.values(HAND_NAMES);
export const BONUS_PAYTABLE: Record<number, number> = { 3: 3, 4: 4, 5: 7, 6: 8, 7: 30, 8: 40, 9: 50 };
export const BLIND_PAYTABLE: Record<number, number> = { 4: 1, 5: 1.5, 6: 3, 7: 10, 8: 50, 9: 500 };
export const PROGRESSIVE_PAYTABLE: Record<number, number | "jackpot"> = { 6: 50, 7: 500, 8: 1500, 9: "jackpot" };
export const TABLES: TablePreset[] = [
  { id: 1, min: 5, max: 100, step: 5 },
  { id: 2, min: 10, max: 200, step: 10 },
  { id: 3, min: 20, max: 400, step: 10 },
];
export const SEATS = ["Place 1", "Place 2", "Place 3", "Place 4", "Place 5", "Place 6", "Place 7"] as const;

