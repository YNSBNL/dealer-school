"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  dealerQualifiesPairOf4Plus,
  resolveRound,
} = require("../lib/casino-holdem");

function card(rank, suit) {
  return { rank, suit };
}

function buildState(overrides = {}) {
  return {
    playerCards: [card("A", "s"), card("K", "s")],
    dealerCards: [card("Q", "h"), card("7", "d")],
    board: [card("J", "s"), card("10", "s"), card("2", "c"), card("3", "d"), card("4", "h")],
    playerAction: "call",
    folded: false,
    bets: {
      ante: 10,
      call: 20,
      bonus: 0,
    },
    ...overrides,
  };
}

test("dealer non qualifie", () => {
  const state = buildState({
    dealerCards: [card("A", "h"), card("K", "c")],
    board: [card("Q", "d"), card("9", "s"), card("7", "h"), card("5", "d"), card("2", "c")],
  });

  const result = resolveRound(state);

  assert.equal(dealerQualifiesPairOf4Plus([...state.dealerCards, ...state.board]), false);
  assert.equal(result.dealerQualified, false);
  assert.equal(result.outcome, "dealer_not_qualified");
});

test("call push si dealer non qualifie", () => {
  const state = buildState({
    dealerCards: [card("A", "h"), card("K", "c")],
    board: [card("Q", "d"), card("9", "s"), card("7", "h"), card("5", "d"), card("2", "c")],
  });

  const result = resolveRound(state);
  assert.equal(result.call.result, "push");
});

test("dealer qualifie et joueur gagnant", () => {
  const state = buildState({
    playerCards: [card("A", "s"), card("A", "d")],
    dealerCards: [card("4", "h"), card("4", "c")],
    board: [card("K", "s"), card("J", "d"), card("8", "c"), card("3", "h"), card("2", "d")],
  });

  const result = resolveRound(state);

  assert.equal(result.dealerQualified, true);
  assert.equal(result.outcome, "player_win");
  assert.equal(result.call.result, "win");
  assert.equal(result.call.amount, 20);
});
