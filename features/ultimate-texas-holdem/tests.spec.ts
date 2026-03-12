import assert from "node:assert/strict";
import test from "node:test";

import { bestSeven, calculatePayout, compareHands, dealerQualifies } from "./engine";
import type { Card, UltimatePlayer } from "./types";

function card(rank: Card["rank"], suit: Card["suit"]): Card {
  return { rank, suit, id: `${rank}${suit}` };
}

test("ultimate texas dealer qualifies with at least a pair", () => {
  const hand = bestSeven([card("A", "S"), card("A", "H"), card("K", "D"), card("9", "C"), card("4", "S"), card("3", "D"), card("2", "H")]);
  assert.equal(dealerQualifies(hand), true);
});

test("ultimate texas compares stronger hands correctly", () => {
  const straight = bestSeven([card("A", "S"), card("K", "D"), card("Q", "H"), card("J", "C"), card("10", "S"), card("3", "D"), card("2", "H")]);
  const pair = bestSeven([card("A", "S"), card("A", "D"), card("K", "H"), card("9", "C"), card("4", "S"), card("3", "D"), card("2", "H")]);
  assert.equal(compareHands(straight!, pair!), 1);
});

test("ultimate texas payout includes bonus and blind", () => {
  const player: UltimatePlayer = {
    active: true,
    cards: [card("A", "S"), card("K", "S")],
    miser: 10,
    blind: 10,
    bonus: 5,
    jouer: 40,
    jouerMult: 4,
    progressive: false,
    folded: false,
    result: null,
    payout: 0,
    eval: null,
    progressiveWin: 0,
  };
  const board = [card("Q", "S"), card("J", "S"), card("10", "S"), card("3", "D"), card("2", "H")];
  const playerEval = bestSeven([...player.cards, ...board])!;
  const dealerEval = bestSeven([card("Q", "H"), card("Q", "D"), ...board])!;
  const payout = calculatePayout(player, playerEval, dealerEval, true, board, 10000);
  assert.equal(payout.payAmount > 0, true);
});
