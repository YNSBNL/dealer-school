"use strict";

const HAND_RANKS = Object.freeze({
  high_card: 0,
  pair: 1,
  flush: 2,
  straight: 3,
  three_of_a_kind: 4,
  straight_flush: 5,
});

const HAND_LABELS = Object.freeze({
  [HAND_RANKS.high_card]: "high_card",
  [HAND_RANKS.pair]: "pair",
  [HAND_RANKS.flush]: "flush",
  [HAND_RANKS.straight]: "straight",
  [HAND_RANKS.three_of_a_kind]: "three_of_a_kind",
  [HAND_RANKS.straight_flush]: "straight_flush",
});

const CARD_VALUES = Object.freeze({
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
  "7": 7,
  "8": 8,
  "9": 9,
  "10": 10,
  J: 11,
  Q: 12,
  K: 13,
  A: 14,
});

const DEFAULT_RULESET = Object.freeze({
  dealerQualifier: {
    type: "queen_high",
    minHighCard: [12, 6, 4],
  },
  anteBonusEnabled: true,
  pairPlusPaytable: {
    straight_flush: 40,
    three_of_a_kind: 30,
    straight: 6,
    flush: 3,
    pair: 1,
  },
  anteBonusPaytable: {
    straight_flush: 5,
    three_of_a_kind: 4,
    straight: 1,
  },
});

function normalizeRuleset(ruleset = {}) {
  return {
    ...DEFAULT_RULESET,
    ...ruleset,
    dealerQualifier: {
      ...DEFAULT_RULESET.dealerQualifier,
      ...(ruleset.dealerQualifier || {}),
    },
    pairPlusPaytable: {
      ...DEFAULT_RULESET.pairPlusPaytable,
      ...(ruleset.pairPlusPaytable || {}),
    },
    anteBonusPaytable: {
      ...DEFAULT_RULESET.anteBonusPaytable,
      ...(ruleset.anteBonusPaytable || {}),
    },
  };
}

function assertThreeCards(cards) {
  if (!Array.isArray(cards) || cards.length !== 3) {
    throw new Error("Three Card Poker requires exactly 3 cards.");
  }
}

function getCardValue(card) {
  const value = CARD_VALUES[card?.rank];
  if (!value) {
    throw new Error(`Unknown card rank: ${card?.rank}`);
  }
  return value;
}

function compareLexicographically(left, right) {
  const max = Math.max(left.length, right.length);
  for (let i = 0; i < max; i += 1) {
    const a = left[i] || 0;
    const b = right[i] || 0;
    if (a > b) return 1;
    if (a < b) return -1;
  }
  return 0;
}

function getStraightHigh(sortedDesc) {
  const uniqueDesc = [...new Set(sortedDesc)];
  if (uniqueDesc.length !== 3) return null;

  const [a, b, c] = uniqueDesc;
  if (a - 1 === b && b - 1 === c) {
    return a;
  }

  // A-2-3 straight
  if (a === 14 && b === 3 && c === 2) {
    return 3;
  }

  return null;
}

function evalThreeCardHand(cards) {
  assertThreeCards(cards);

  const valuesDesc = cards.map(getCardValue).sort((a, b) => b - a);
  const suits = cards.map((card) => card.suit);
  const counts = new Map();

  valuesDesc.forEach((value) => {
    counts.set(value, (counts.get(value) || 0) + 1);
  });

  const countEntries = [...counts.entries()].sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return b[0] - a[0];
  });

  const isFlush = suits.every((suit) => suit === suits[0]);
  const straightHigh = getStraightHigh(valuesDesc);
  const isStraight = straightHigh !== null;

  let rank = HAND_RANKS.high_card;
  let tiebreaker = [...valuesDesc];

  if (isStraight && isFlush) {
    rank = HAND_RANKS.straight_flush;
    tiebreaker = [straightHigh];
  } else if (countEntries[0][1] === 3) {
    rank = HAND_RANKS.three_of_a_kind;
    tiebreaker = [countEntries[0][0]];
  } else if (isStraight) {
    rank = HAND_RANKS.straight;
    tiebreaker = [straightHigh];
  } else if (isFlush) {
    rank = HAND_RANKS.flush;
    tiebreaker = [...valuesDesc];
  } else if (countEntries[0][1] === 2) {
    const pairValue = countEntries[0][0];
    const kicker = countEntries[1][0];
    rank = HAND_RANKS.pair;
    tiebreaker = [pairValue, kicker];
  }

  return {
    rank,
    label: HAND_LABELS[rank],
    values: valuesDesc,
    tiebreaker,
  };
}

function compareThreeCardHands(playerCards, dealerCards) {
  const player = Array.isArray(playerCards) && playerCards.length === 3 && playerCards[0]?.rank
    ? evalThreeCardHand(playerCards)
    : playerCards;
  const dealer = Array.isArray(dealerCards) && dealerCards.length === 3 && dealerCards[0]?.rank
    ? evalThreeCardHand(dealerCards)
    : dealerCards;

  if (player.rank > dealer.rank) return 1;
  if (player.rank < dealer.rank) return -1;
  return compareLexicographically(player.tiebreaker, dealer.tiebreaker);
}

function dealerQualifies(hand, ruleset = {}) {
  const resolvedRuleset = normalizeRuleset(ruleset);
  const evaluated = Array.isArray(hand) ? evalThreeCardHand(hand) : hand;

  if (evaluated.rank >= HAND_RANKS.pair) {
    return true;
  }

  if (resolvedRuleset.dealerQualifier.type !== "queen_high") {
    throw new Error(`Unsupported dealer qualifier: ${resolvedRuleset.dealerQualifier.type}`);
  }

  return compareLexicographically(
    evaluated.tiebreaker,
    resolvedRuleset.dealerQualifier.minHighCard
  ) >= 0;
}

function resolvePairPlus(hand, ruleset = {}) {
  const resolvedRuleset = normalizeRuleset(ruleset);
  const evaluated = evalThreeCardHand(hand);
  const payoutMultiplier = resolvedRuleset.pairPlusPaytable[evaluated.label] || 0;

  return {
    qualifies: payoutMultiplier > 0,
    hand: evaluated,
    payoutMultiplier,
  };
}

function resolveAnteBonus(hand, ruleset = {}) {
  const resolvedRuleset = normalizeRuleset(ruleset);
  const evaluated = evalThreeCardHand(hand);
  const payoutMultiplier = resolvedRuleset.anteBonusEnabled
    ? (resolvedRuleset.anteBonusPaytable[evaluated.label] || 0)
    : 0;

  return {
    qualifies: payoutMultiplier > 0,
    hand: evaluated,
    payoutMultiplier,
  };
}

function resolveAntePlay(state, ruleset = {}) {
  const resolvedRuleset = normalizeRuleset(ruleset);
  const playerHand = evalThreeCardHand(state.playerHand);
  const dealerHand = evalThreeCardHand(state.dealerHand);
  const ante = Number(state?.bets?.ante || 0);
  const play = Number(state?.bets?.play || 0);
  const playerAction = state.playerAction || (play > 0 ? "play" : "fold");

  if (playerAction === "fold") {
    return {
      playerHand,
      dealerHand,
      dealerQualified: false,
      comparison: -1,
      outcome: "fold",
      ante: { result: "lose", payoutMultiplier: -1, amount: -ante },
      play: { result: "none", payoutMultiplier: 0, amount: 0 },
    };
  }

  const qualified = dealerQualifies(dealerHand, resolvedRuleset);
  const comparison = compareThreeCardHands(playerHand, dealerHand);

  if (!qualified) {
    return {
      playerHand,
      dealerHand,
      dealerQualified: false,
      comparison,
      outcome: "dealer_not_qualified",
      ante: { result: "win", payoutMultiplier: 1, amount: ante },
      play: { result: "push", payoutMultiplier: 0, amount: 0 },
    };
  }

  if (comparison > 0) {
    return {
      playerHand,
      dealerHand,
      dealerQualified: true,
      comparison,
      outcome: "player_win",
      ante: { result: "win", payoutMultiplier: 1, amount: ante },
      play: { result: "win", payoutMultiplier: 1, amount: play },
    };
  }

  if (comparison < 0) {
    return {
      playerHand,
      dealerHand,
      dealerQualified: true,
      comparison,
      outcome: "dealer_win",
      ante: { result: "lose", payoutMultiplier: -1, amount: -ante },
      play: { result: "lose", payoutMultiplier: -1, amount: -play },
    };
  }

  return {
    playerHand,
    dealerHand,
    dealerQualified: true,
    comparison: 0,
    outcome: "tie",
    ante: { result: "push", payoutMultiplier: 0, amount: 0 },
    play: { result: "push", payoutMultiplier: 0, amount: 0 },
  };
}

module.exports = {
  DEFAULT_RULESET,
  HAND_LABELS,
  HAND_RANKS,
  compareThreeCardHands,
  dealerQualifies,
  evalThreeCardHand,
  normalizeRuleset,
  resolveAnteBonus,
  resolveAntePlay,
  resolvePairPlus,
};
