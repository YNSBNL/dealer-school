import * as legacy from "@/lib/casino-holdem";
import { createShuffledDeck, drawCards } from "@/lib/card-utils";
import type { Card, EvaluatedSevenCardHand } from "./types";
export const normalizeRuleset = legacy.normalizeRuleset as (ruleset?: object) => object;
export const bestFiveOfSeven = legacy.bestFiveOfSeven as (cards: Card[]) => EvaluatedSevenCardHand;
export const dealerQualifiesPairOf4Plus = legacy.dealerQualifiesPairOf4Plus as (hand: Card[] | EvaluatedSevenCardHand, ruleset?: object) => boolean;
export const resolveRound = legacy.resolveRound as (state: object, ruleset?: object) => Record<string, unknown>;
export function buildTrainingRound() {
  const deck = createShuffledDeck();
  const playerCards = drawCards(deck, 2) as Card[];
  const dealerCards = drawCards(deck, 2) as Card[];
  const board = drawCards(deck, 5) as Card[];
  const state = { playerCards, dealerCards, board, playerAction: "call", folded: false, bets: { ante: 10, call: 20, bonus: 0 } };
  return { ...state, result: resolveRound(state) };
}
