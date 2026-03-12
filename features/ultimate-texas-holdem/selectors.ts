import { HAND_NAMES, SUIT_COLORS, SUIT_SYMBOLS } from "./rulesets";
import type { Card, CardSuit, HandEvaluation } from "./types";

export function toSuitSymbol(suit: CardSuit): string {
  return SUIT_SYMBOLS[suit];
}

export function toSuitColor(suit: CardSuit): string {
  return SUIT_COLORS[suit];
}

export function getHandLabel(hand: HandEvaluation | null): string {
  if (!hand) return "";
  return HAND_NAMES[hand.rank] ?? "Main inconnue";
}

export function serializeCard(card: Card): string {
  return `${card.rank}${card.suit}`;
}

