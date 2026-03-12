import type { RouletteBetDefinition, RouletteBetType } from "./types";

export const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36] as const;
export const BLACK_NUMBERS = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35] as const;

export const EUROPEAN_BET_TYPES: Record<RouletteBetType, RouletteBetDefinition> = {
  straight: { name: "Plein", payout: 35, description: "Un seul numéro" },
  split: { name: "Cheval", payout: 17, description: "2 numéros adjacents" },
  street: { name: "Transversale", payout: 11, description: "3 numéros en ligne" },
  corner: { name: "Carré", payout: 8, description: "4 numéros en carré" },
  sixLine: { name: "Sixain", payout: 5, description: "6 numéros sur deux lignes" },
  dozen: { name: "Douzaine", payout: 2, description: "12 numéros" },
  column: { name: "Colonne", payout: 2, description: "12 numéros" },
  red: { name: "Rouge", payout: 1, description: "18 numéros rouges" },
  black: { name: "Noir", payout: 1, description: "18 numéros noirs" },
  even: { name: "Pair", payout: 1, description: "Numéros pairs" },
  odd: { name: "Impair", payout: 1, description: "Numéros impairs" },
  low: { name: "Manque (1-18)", payout: 1, description: "1 à 18" },
  high: { name: "Passe (19-36)", payout: 1, description: "19 à 36" },
};

export const CHIP_VALUES = [1, 5, 10, 25, 100] as const;
export const CHIP_COLORS: Record<number, string> = { 1: "#FFFFFF", 5: "#E53935", 10: "#1565C0", 25: "#2E7D46", 100: "#1A1A1A" };
export const CHIP_TEXT: Record<number, string> = { 1: "#333", 5: "#FFF", 10: "#FFF", 25: "#FFF", 100: "#C9A84C" };

export const ROULETTE_ROWS = [
  [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36],
  [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
  [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34],
] as const;

