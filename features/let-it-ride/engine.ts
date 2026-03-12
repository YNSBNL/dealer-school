import * as legacy from "@/lib/let-it-ride";
import { createShuffledDeck, drawCards } from "@/lib/card-utils";
import type { Card, EvaluatedLetItRideHand } from "./types";

export const normalizeRuleset = legacy.normalizeRuleset as (ruleset?: object) => object;
export const evalFiveCardHand = legacy.evalFiveCardHand as (cards: Card[]) => EvaluatedLetItRideHand;
export const canPullBet = legacy.canPullBet as (state: object, slot: string) => boolean;
export const resolvePulledBets = legacy.resolvePulledBets as (state: object) => Record<string, unknown>;
export const resolveMainBets = legacy.resolveMainBets as (cards: Card[] | EvaluatedLetItRideHand, activeBets: object, ruleset?: object) => Record<string, unknown>;
export const resolveSideBets = legacy.resolveSideBets as (state: object, ruleset?: object) => Record<string, unknown>;

export function buildTrainingRound() {
  const deck = createShuffledDeck();
  const playerCards = drawCards(deck, 3) as Card[];
  const communityCards = drawCards(deck, 2) as Card[];
  const activeBets = { bet1: 10, bet2: 10, baseBet: 10 };

  return {
    playerCards,
    communityCards,
    activeBets,
    result: resolveMainBets([...playerCards, ...communityCards], activeBets),
  };
}
