"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  canPullBet,
  resolveMainBets,
  resolvePulledBets,
} = require("../lib/let-it-ride");

function card(rank, suit) {
  return { rank, suit };
}

function buildState(overrides = {}) {
  return {
    phase: "decision_1",
    playerCards: [card("10", "s"), card("10", "d"), card("4", "h")],
    communityCards: [card("7", "c"), card("2", "s")],
    bets: {
      baseBet: 10,
      bet1Active: true,
      bet2Active: true,
      sideBets: {},
    },
    ...overrides,
  };
}

test("retrait de la premiere mise", () => {
  const state = buildState({
    bets: {
      baseBet: 10,
      bet1Active: false,
      bet2Active: true,
      sideBets: {},
    },
  });

  assert.equal(canPullBet(buildState(), "bet1"), true);
  const result = resolvePulledBets(state);

  assert.equal(result.returned.bet1, 10);
  assert.equal(result.activeBets.bet1, 0);
  assert.equal(result.activeBets.bet2, 10);
  assert.equal(result.activeBets.baseBet, 10);
});

test("retrait de la deuxieme mise", () => {
  const decisionState = buildState({
    phase: "decision_2",
  });
  const pulledState = buildState({
    phase: "decision_2",
    bets: {
      baseBet: 10,
      bet1Active: true,
      bet2Active: false,
      sideBets: {},
    },
  });

  assert.equal(canPullBet(decisionState, "bet2"), true);
  const result = resolvePulledBets(pulledState);

  assert.equal(result.returned.bet2, 10);
  assert.equal(result.activeBets.bet1, 10);
  assert.equal(result.activeBets.bet2, 0);
  assert.equal(result.activeBets.baseBet, 10);
});

test("paiement pair of 10s or better", () => {
  const result = resolveMainBets(
    [
      card("10", "s"),
      card("10", "d"),
      card("4", "h"),
      card("7", "c"),
      card("2", "s"),
    ],
    { bet1: 10, bet2: 10, baseBet: 10 }
  );

  assert.equal(result.qualifies, true);
  assert.equal(result.hand.label, "pair");
  assert.equal(result.payoutMultiplier, 1);
  assert.equal(result.amount, 30);
});

test("perte si main inferieure", () => {
  const result = resolveMainBets(
    [
      card("9", "s"),
      card("8", "d"),
      card("4", "h"),
      card("7", "c"),
      card("2", "s"),
    ],
    { bet1: 10, bet2: 10, baseBet: 10 }
  );

  assert.equal(result.qualifies, false);
  assert.equal(result.amount, -30);
});
