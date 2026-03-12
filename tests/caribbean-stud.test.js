"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  dealerQualifiesAKOrBetter,
  resolveRaise,
  resolveRound,
} = require("../lib/caribbean-stud");

function card(rank, suit) {
  return { rank, suit };
}

function buildState(overrides = {}) {
  return {
    playerHand: [
      card("A", "s"),
      card("A", "d"),
      card("K", "h"),
      card("9", "c"),
      card("4", "s"),
    ],
    dealerHand: [
      card("Q", "h"),
      card("J", "d"),
      card("8", "s"),
      card("6", "c"),
      card("3", "h"),
    ],
    playerAction: "raise",
    folded: false,
    bets: {
      ante: 10,
      raise: 20,
      progressive: 0,
    },
    ...overrides,
  };
}

test("dealer non qualifie", () => {
  const state = buildState({
    dealerHand: [
      card("Q", "h"),
      card("J", "d"),
      card("8", "s"),
      card("6", "c"),
      card("3", "h"),
    ],
  });

  const result = resolveRound(state);

  assert.equal(dealerQualifiesAKOrBetter(state.dealerHand), false);
  assert.equal(result.dealerQualified, false);
  assert.equal(result.outcome, "dealer_not_qualified");
  assert.equal(result.ante.result, "win");
  assert.equal(result.raise.result, "push");
});

test("joueur gagne avec dealer qualifie", () => {
  const state = buildState({
    playerHand: [
      card("K", "s"),
      card("K", "d"),
      card("9", "h"),
      card("7", "c"),
      card("4", "s"),
    ],
    dealerHand: [
      card("A", "h"),
      card("K", "c"),
      card("Q", "d"),
      card("9", "s"),
      card("3", "h"),
    ],
  });

  const result = resolveRound(state);

  assert.equal(result.dealerQualified, true);
  assert.equal(result.outcome, "player_win");
  assert.equal(result.ante.result, "win");
  assert.equal(result.raise.result, "win");
});

test("raise paye selon paytable", () => {
  const state = buildState({
    playerHand: [
      card("Q", "s"),
      card("Q", "d"),
      card("9", "h"),
      card("7", "c"),
      card("4", "s"),
    ],
    dealerHand: [
      card("A", "h"),
      card("K", "c"),
      card("Q", "d"),
      card("8", "s"),
      card("3", "h"),
    ],
  });

  const raise = resolveRaise(
    {
      ...state,
      comparison: 1,
      dealerQualified: true,
    },
    {
      raisePaytable: {
        pair: 2,
      },
    }
  );

  assert.equal(raise.result, "win");
  assert.equal(raise.payoutMultiplier, 2);
  assert.equal(raise.amount, 40);
});

test("fold perd ante uniquement", () => {
  const result = resolveRound(
    buildState({
      playerAction: "fold",
      folded: true,
      bets: {
        ante: 10,
        raise: 0,
        progressive: 0,
      },
    })
  );

  assert.equal(result.outcome, "fold");
  assert.equal(result.ante.result, "lose");
  assert.equal(result.ante.amount, -10);
  assert.equal(result.raise.result, "none");
});
