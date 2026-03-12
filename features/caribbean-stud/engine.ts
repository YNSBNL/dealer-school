import * as legacy from "@/lib/caribbean-stud";
import { createShuffledDeck, drawCards } from "@/lib/card-utils";
import type { Card, EvaluatedFiveCardHand } from "./types";

export const normalizeRuleset = legacy.normalizeRuleset as (ruleset?: object) => object;
export const bestFive = legacy.bestFive as (cards: Card[]) => EvaluatedFiveCardHand;
export const compareFiveCardHands = legacy.compareFiveCardHands as (left: Card[] | EvaluatedFiveCardHand, right: Card[] | EvaluatedFiveCardHand) => number;
export const dealerQualifiesAKOrBetter = legacy.dealerQualifiesAKOrBetter as (hand: Card[] | EvaluatedFiveCardHand) => boolean;
export const resolveAnte = legacy.resolveAnte as (state: object) => Record<string, unknown>;
export const resolveRaise = legacy.resolveRaise as (state: object, ruleset?: object) => Record<string, unknown>;
export const resolveProgressive = legacy.resolveProgressive as (state: object, ruleset?: object) => Record<string, unknown>;
export const resolveRound = legacy.resolveRound as (state: object, ruleset?: object) => Record<string, unknown>;

export function buildTrainingRound() {
  const deck = createShuffledDeck();
  const playerHand = drawCards(deck, 5) as Card[];
  const dealerHand = drawCards(deck, 5) as Card[];
  const state = {
    playerHand,
    dealerHand,
    playerAction: "raise",
    folded: false,
    bets: { ante: 10, raise: 20, progressive: 0 },
  };

  return {
    ...state,
    result: resolveRound(state),
  };
}
