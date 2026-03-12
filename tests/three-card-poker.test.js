"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  compareThreeCardHands,
  dealerQualifies,
  evalThreeCardHand,
  resolveAnteBonus,
  resolveAntePlay,
  resolvePairPlus,
} = require("../lib/three-card-poker");

function card(rank, suit) {
  return { rank, suit };
}

test("dealer non qualifie: ante gagne, play push", () => {
  const result = resolveAntePlay({
    playerHand: [card("K", "♠"), card("9", "♦"), card("4", "♣")],
    dealerHand: [card("J", "♠"), card("9", "♥"), card("4", "♦")],
    playerAction: "play",
    bets: { ante: 10, play: 10 },
  });

  assert.equal(result.dealerQualified, false);
  assert.equal(result.outcome, "dealer_not_qualified");
  assert.deepEqual(result.ante, { result: "win", payoutMultiplier: 1, amount: 10 });
  assert.deepEqual(result.play, { result: "push", payoutMultiplier: 0, amount: 0 });
});

test("pair plus est independant de la qualification dealer", () => {
  const playerHand = [card("9", "♠"), card("9", "♥"), card("2", "♦")];
  const dealerHand = [card("J", "♣"), card("7", "♦"), card("3", "♠")];

  const antePlay = resolveAntePlay({
    playerHand,
    dealerHand,
    playerAction: "play",
    bets: { ante: 10, play: 10, pairPlus: 5 },
  });
  const pairPlus = resolvePairPlus(playerHand);

  assert.equal(dealerQualifies(dealerHand), false);
  assert.equal(antePlay.dealerQualified, false);
  assert.equal(pairPlus.qualifies, true);
  assert.equal(pairPlus.hand.label, "pair");
  assert.equal(pairPlus.payoutMultiplier, 1);
});

test("straight bat flush en three card poker", () => {
  const straight = evalThreeCardHand([
    card("7", "♠"),
    card("6", "♦"),
    card("5", "♣"),
  ]);
  const flush = evalThreeCardHand([
    card("K", "♥"),
    card("9", "♥"),
    card("2", "♥"),
  ]);

  assert.equal(straight.label, "straight");
  assert.equal(flush.label, "flush");
  assert.equal(compareThreeCardHands(straight, flush), 1);
});

test("egalite exacte: ante et play push", () => {
  const result = resolveAntePlay({
    playerHand: [card("Q", "♠"), card("9", "♦"), card("4", "♣")],
    dealerHand: [card("Q", "♥"), card("9", "♣"), card("4", "♦")],
    playerAction: "play",
    bets: { ante: 15, play: 15 },
  });

  assert.equal(result.dealerQualified, true);
  assert.equal(result.outcome, "tie");
  assert.deepEqual(result.ante, { result: "push", payoutMultiplier: 0, amount: 0 });
  assert.deepEqual(result.play, { result: "push", payoutMultiplier: 0, amount: 0 });
});

test("ante bonus est resolu independamment du dealer si active par le ruleset", () => {
  const anteBonus = resolveAnteBonus(
    [card("A", "♠"), card("K", "♠"), card("Q", "♠")],
    { anteBonusEnabled: true }
  );

  assert.equal(anteBonus.qualifies, true);
  assert.equal(anteBonus.hand.label, "straight_flush");
  assert.equal(anteBonus.payoutMultiplier, 5);
});
