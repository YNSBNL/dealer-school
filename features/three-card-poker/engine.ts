import * as legacy from "@/lib/three-card-poker";
import { createShuffledDeck, drawCards } from "@/lib/card-utils";
import type { Card, EvaluatedThreeCardHand } from "./types";

export const normalizeRuleset = legacy.normalizeRuleset as (ruleset?: object) => object;
export const evalThreeCardHand = legacy.evalThreeCardHand as (cards: Card[]) => EvaluatedThreeCardHand;
export const compareThreeCardHands = legacy.compareThreeCardHands as (left: Card[] | EvaluatedThreeCardHand, right: Card[] | EvaluatedThreeCardHand) => number;
export const dealerQualifies = legacy.dealerQualifies as (hand: Card[] | EvaluatedThreeCardHand, ruleset?: object) => boolean;
export const resolvePairPlus = legacy.resolvePairPlus as (hand: Card[], ruleset?: object) => { qualifies: boolean; hand: EvaluatedThreeCardHand; payoutMultiplier: number };
export const resolveAnteBonus = legacy.resolveAnteBonus as (hand: Card[], ruleset?: object) => { qualifies: boolean; hand: EvaluatedThreeCardHand; payoutMultiplier: number };
export const resolveAntePlay = legacy.resolveAntePlay as (state: object, ruleset?: object) => Record<string, unknown>;

export function buildTrainingRound() {
  const deck = createShuffledDeck();
  const playerHand = drawCards(deck, 3) as Card[];
  const dealerHand = drawCards(deck, 3) as Card[];
  const state = { playerHand, dealerHand, playerAction: "play", bets: { ante: 10, play: 10, pairPlus: 5 } };
  return { ...state, result: resolveAntePlay(state), pairPlus: resolvePairPlus(playerHand), anteBonus: resolveAnteBonus(playerHand) };
}
