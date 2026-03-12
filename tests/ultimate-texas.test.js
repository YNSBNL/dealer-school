"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  bestFiveOfSeven,
  dealerQualifies,
  resolveBlind,
  resolveFlopDecision,
  resolvePreflopDecision,
  resolveRiverDecision,
  resolveRound,
} = require("../lib/ultimate-texas");

function card(rank, suit) {
  return { rank, suit };
}

function buildState(overrides = {}) {
  return {
    phase: "preflop_decision",
    playerCards: [card("A", "s"), card("K", "s")],
    dealerCards: [card("Q", "h"), card("7", "d")],
    board: [card("J", "s"), card("10", "s"), card("2", "c"), card("3", "d"), card("4", "h")],
    bets: {
      ante: 10,
      blind: 10,
      play: 0,
      trips: 0,
    },
    history: [],
    ...overrides,
  };
}

test("play 4x preflop", () => {
  const next = resolvePreflopDecision(buildState(), { type: "play", multiplier: 4 });

  assert.equal(next.phase, "dealer_reveal");
  assert.equal(next.bets.play, 40);
  assert.equal(next.playMultiplier, 4);
  assert.equal(next.decisionStreet, "preflop");
});

test("play 2x flop", () => {
  const next = resolveFlopDecision(
    buildState({ phase: "flop_decision" }),
    { type: "play", multiplier: 2 }
  );

  assert.equal(next.phase, "dealer_reveal");
  assert.equal(next.bets.play, 20);
  assert.equal(next.decisionStreet, "flop");
});

test("play 1x riviere", () => {
  const next = resolveRiverDecision(
    buildState({ phase: "river_decision" }),
    { type: "play", multiplier: 1 }
  );

  assert.equal(next.phase, "dealer_reveal");
  assert.equal(next.bets.play, 10);
  assert.equal(next.decisionStreet, "river");
});

test("fold riviere", () => {
  const next = resolveRiverDecision(
    buildState({ phase: "river_decision" }),
    { type: "fold" }
  );

  assert.equal(next.phase, "round_closed");
  assert.equal(next.folded, true);
  assert.equal(next.result, "fold");
});

test("dealer non qualifie", () => {
  const state = buildState({
    playerCards: [card("A", "s"), card("K", "d")],
    dealerCards: [card("J", "c"), card("8", "d")],
    board: [card("Q", "h"), card("9", "c"), card("7", "s"), card("5", "d"), card("2", "h")],
    bets: {
      ante: 10,
      blind: 10,
      play: 20,
      trips: 0,
    },
    playerAction: "play",
  });

  const result = resolveRound(state);

  assert.equal(dealerQualifies([...state.dealerCards, ...state.board]), false);
  assert.equal(result.dealerQualified, false);
  assert.equal(result.outcome, "dealer_not_qualified");
  assert.equal(result.ante.result, "push");
  assert.equal(result.play.result, "win");
});

test("blind paye uniquement sur straight ou mieux", () => {
  const pairHand = bestFiveOfSeven([
    card("A", "s"),
    card("A", "d"),
    card("K", "h"),
    card("9", "c"),
    card("4", "s"),
    card("3", "d"),
    card("2", "h"),
  ]);
  const straightHand = bestFiveOfSeven([
    card("A", "s"),
    card("K", "d"),
    card("Q", "h"),
    card("J", "c"),
    card("10", "s"),
    card("3", "d"),
    card("2", "h"),
  ]);

  const pairBlind = resolveBlind(pairHand);
  const straightBlind = resolveBlind(straightHand);

  assert.equal(pairBlind.qualifies, false);
  assert.equal(pairBlind.payoutMultiplier, 0);
  assert.equal(straightBlind.qualifies, true);
  assert.equal(straightBlind.payoutMultiplier, 1);
});
