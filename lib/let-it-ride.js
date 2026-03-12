"use strict";

const HAND_RANKS = Object.freeze({
  high_card: 0,
  pair: 1,
  two_pair: 2,
  three_of_a_kind: 3,
  straight: 4,
  flush: 5,
  full_house: 6,
  four_of_a_kind: 7,
  straight_flush: 8,
  royal_flush: 9,
});

const HAND_LABELS = Object.freeze({
  [HAND_RANKS.high_card]: "high_card",
  [HAND_RANKS.pair]: "pair",
  [HAND_RANKS.two_pair]: "two_pair",
  [HAND_RANKS.three_of_a_kind]: "three_of_a_kind",
  [HAND_RANKS.straight]: "straight",
  [HAND_RANKS.flush]: "flush",
  [HAND_RANKS.full_house]: "full_house",
  [HAND_RANKS.four_of_a_kind]: "four_of_a_kind",
  [HAND_RANKS.straight_flush]: "straight_flush",
  [HAND_RANKS.royal_flush]: "royal_flush",
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
  minQualifyingHand: {
    type: "pair_of_tens_or_better",
    minPairValue: 10,
  },
  mainPaytable: {
    pair: 1,
    two_pair: 2,
    three_of_a_kind: 3,
    straight: 5,
    flush: 8,
    full_house: 11,
    four_of_a_kind: 50,
    straight_flush: 200,
    royal_flush: 1000,
  },
  sideBetsEnabled: true,
  sideBetPaytable: {},
});

function normalizeRuleset(ruleset = {}) {
  return {
    ...DEFAULT_RULESET,
    ...ruleset,
    minQualifyingHand: {
      ...DEFAULT_RULESET.minQualifyingHand,
      ...(ruleset.minQualifyingHand || {}),
    },
    mainPaytable: {
      ...DEFAULT_RULESET.mainPaytable,
      ...(ruleset.mainPaytable || {}),
    },
    sideBetPaytable: {
      ...DEFAULT_RULESET.sideBetPaytable,
      ...(ruleset.sideBetPaytable || {}),
    },
  };
}

function assertFiveCards(cards) {
  if (!Array.isArray(cards) || cards.length !== 5) {
    throw new Error("Let It Ride final hand requires exactly 5 cards.");
  }
}

function getCardValue(card) {
  const value = CARD_VALUES[card?.rank];
  if (!value) {
    throw new Error(`Unknown card rank: ${card?.rank}`);
  }
  return value;
}

function getStraightHigh(valuesDesc) {
  const uniqueDesc = [...new Set(valuesDesc)];
  if (uniqueDesc.length < 5) return null;

  if (uniqueDesc[0] - uniqueDesc[4] === 4) {
    return uniqueDesc[0];
  }

  if (
    uniqueDesc.includes(14) &&
    uniqueDesc.includes(5) &&
    uniqueDesc.includes(4) &&
    uniqueDesc.includes(3) &&
    uniqueDesc.includes(2)
  ) {
    return 5;
  }

  return null;
}

function evalFiveCardHand(cards) {
  assertFiveCards(cards);

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

  if (isStraight && isFlush && straightHigh === 14) {
    rank = HAND_RANKS.royal_flush;
    tiebreaker = [14];
  } else if (isStraight && isFlush) {
    rank = HAND_RANKS.straight_flush;
    tiebreaker = [straightHigh];
  } else if (countEntries[0][1] === 4) {
    rank = HAND_RANKS.four_of_a_kind;
    tiebreaker = [countEntries[0][0], countEntries[1][0]];
  } else if (countEntries[0][1] === 3 && countEntries[1][1] === 2) {
    rank = HAND_RANKS.full_house;
    tiebreaker = [countEntries[0][0], countEntries[1][0]];
  } else if (isFlush) {
    rank = HAND_RANKS.flush;
    tiebreaker = [...valuesDesc];
  } else if (isStraight) {
    rank = HAND_RANKS.straight;
    tiebreaker = [straightHigh];
  } else if (countEntries[0][1] === 3) {
    const kickers = countEntries
      .filter(([, count]) => count === 1)
      .map(([value]) => value)
      .sort((a, b) => b - a);
    rank = HAND_RANKS.three_of_a_kind;
    tiebreaker = [countEntries[0][0], ...kickers];
  } else if (countEntries[0][1] === 2 && countEntries[1][1] === 2) {
    const pairs = countEntries
      .filter(([, count]) => count === 2)
      .map(([value]) => value)
      .sort((a, b) => b - a);
    const kicker = countEntries.find(([, count]) => count === 1)[0];
    rank = HAND_RANKS.two_pair;
    tiebreaker = [...pairs, kicker];
  } else if (countEntries[0][1] === 2) {
    const kickers = countEntries
      .filter(([, count]) => count === 1)
      .map(([value]) => value)
      .sort((a, b) => b - a);
    rank = HAND_RANKS.pair;
    tiebreaker = [countEntries[0][0], ...kickers];
  }

  return {
    rank,
    label: HAND_LABELS[rank],
    tiebreaker,
    cards,
    values: valuesDesc,
  };
}

function canPullBet(state, betSlot) {
  if (betSlot === "bet1") {
    return state.phase === "decision_1" && state.bets.bet1Active !== false;
  }
  if (betSlot === "bet2") {
    return state.phase === "decision_2" && state.bets.bet2Active !== false;
  }
  return false;
}

function resolvePulledBets(state) {
  const baseBet = Number(state?.bets?.baseBet || 0);
  return {
    returned: {
      bet1: state?.bets?.bet1Active === false ? baseBet : 0,
      bet2: state?.bets?.bet2Active === false ? baseBet : 0,
    },
    activeBets: {
      bet1: state?.bets?.bet1Active === false ? 0 : baseBet,
      bet2: state?.bets?.bet2Active === false ? 0 : baseBet,
      baseBet,
    },
  };
}

function qualifiesMainHand(hand, ruleset = {}) {
  const resolvedRuleset = normalizeRuleset(ruleset);
  const evaluated = Array.isArray(hand) ? evalFiveCardHand(hand) : hand;

  if (resolvedRuleset.minQualifyingHand.type !== "pair_of_tens_or_better") {
    throw new Error(`Unsupported Let It Ride qualifier: ${resolvedRuleset.minQualifyingHand.type}`);
  }

  if (evaluated.rank > HAND_RANKS.pair) {
    return true;
  }
  if (evaluated.rank < HAND_RANKS.pair) {
    return false;
  }

  return evaluated.tiebreaker[0] >= resolvedRuleset.minQualifyingHand.minPairValue;
}

function resolveMainBets(finalHand, activeBets, ruleset = {}) {
  const resolvedRuleset = normalizeRuleset(ruleset);
  const evaluated = Array.isArray(finalHand) ? evalFiveCardHand(finalHand) : finalHand;
  const totalActive = Number(activeBets.bet1 || 0) + Number(activeBets.bet2 || 0) + Number(activeBets.baseBet || 0);
  const qualifies = qualifiesMainHand(evaluated, resolvedRuleset);

  if (!qualifies) {
    return {
      hand: evaluated,
      qualifies: false,
      payoutMultiplier: -1,
      amount: -totalActive,
    };
  }

  const payoutMultiplier = resolvedRuleset.mainPaytable[evaluated.label] || 0;
  return {
    hand: evaluated,
    qualifies: true,
    payoutMultiplier,
    amount: totalActive * payoutMultiplier,
  };
}

function resolveSideBets(state, ruleset = {}) {
  const resolvedRuleset = normalizeRuleset(ruleset);
  const sideBets = state?.bets?.sideBets || {};
  const finalHand = state.finalHandResult || evalFiveCardHand([...state.playerCards, ...state.communityCards]);

  if (!resolvedRuleset.sideBetsEnabled || !Object.keys(sideBets).length) {
    return {};
  }

  const result = {};
  for (const [name, amount] of Object.entries(sideBets)) {
    const betAmount = Number(amount || 0);
    if (!betAmount) {
      result[name] = { result: "none", payoutMultiplier: 0, amount: 0 };
      continue;
    }

    const paytable = resolvedRuleset.sideBetPaytable[name] || {};
    const payoutMultiplier = paytable[finalHand.label] || 0;
    result[name] = payoutMultiplier
      ? { result: "win", payoutMultiplier, amount: betAmount * payoutMultiplier }
      : { result: "lose", payoutMultiplier: -1, amount: -betAmount };
  }

  return result;
}

module.exports = {
  DEFAULT_RULESET,
  HAND_LABELS,
  HAND_RANKS,
  canPullBet,
  evalFiveCardHand,
  normalizeRuleset,
  resolveMainBets,
  resolvePulledBets,
  resolveSideBets,
};
