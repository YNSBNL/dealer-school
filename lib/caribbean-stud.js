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
  raisePaytable: {
    pair: 1,
    two_pair: 2,
    three_of_a_kind: 3,
    straight: 4,
    flush: 5,
    full_house: 7,
    four_of_a_kind: 20,
    straight_flush: 50,
    royal_flush: 100,
  },
  progressiveEnabled: true,
  progressivePaytable: {
    flush: 50,
    full_house: 100,
    four_of_a_kind: 500,
    straight_flush: 2500,
    royal_flush: 5000,
  },
});

function normalizeRuleset(ruleset = {}) {
  return {
    ...DEFAULT_RULESET,
    ...ruleset,
    raisePaytable: {
      ...DEFAULT_RULESET.raisePaytable,
      ...(ruleset.raisePaytable || {}),
    },
    progressivePaytable: {
      ...DEFAULT_RULESET.progressivePaytable,
      ...(ruleset.progressivePaytable || {}),
    },
  };
}

function assertFiveCards(cards, label) {
  if (!Array.isArray(cards) || cards.length !== 5) {
    throw new Error(`${label} requires exactly 5 cards.`);
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

function bestFive(cards) {
  assertFiveCards(cards, "Caribbean Stud hand");

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
    values: valuesDesc,
    cards,
  };
}

function compareFiveCardHands(playerCards, dealerCards) {
  const player = Array.isArray(playerCards) ? bestFive(playerCards) : playerCards;
  const dealer = Array.isArray(dealerCards) ? bestFive(dealerCards) : dealerCards;

  if (player.rank > dealer.rank) return 1;
  if (player.rank < dealer.rank) return -1;
  return compareLexicographically(player.tiebreaker, dealer.tiebreaker);
}

function dealerQualifiesAKOrBetter(hand) {
  const evaluated = Array.isArray(hand) ? bestFive(hand) : hand;
  if (evaluated.rank >= HAND_RANKS.pair) {
    return true;
  }
  return compareLexicographically(evaluated.tiebreaker, [14, 13, 0, 0, 0]) >= 0;
}

function resolveAnte(state) {
  const ante = Number(state?.bets?.ante || 0);
  if (state.folded || state.playerAction === "fold") {
    return { result: "lose", payoutMultiplier: -1, amount: -ante };
  }
  if (!state.dealerQualified) {
    return { result: "win", payoutMultiplier: 1, amount: ante };
  }
  if (state.comparison > 0) {
    return { result: "win", payoutMultiplier: 1, amount: ante };
  }
  if (state.comparison < 0) {
    return { result: "lose", payoutMultiplier: -1, amount: -ante };
  }
  return { result: "push", payoutMultiplier: 0, amount: 0 };
}

function resolveRaise(state, ruleset = {}) {
  const resolvedRuleset = normalizeRuleset(ruleset);
  const raise = Number(state?.bets?.raise || 0);
  const playerHand = state.playerHandResult || bestFive(state.playerHand);

  if (!raise) {
    return { result: "none", payoutMultiplier: 0, amount: 0 };
  }
  if (!state.dealerQualified) {
    return { result: "push", payoutMultiplier: 0, amount: 0 };
  }
  if (state.comparison < 0) {
    return { result: "lose", payoutMultiplier: -1, amount: -raise };
  }
  if (state.comparison === 0) {
    return { result: "push", payoutMultiplier: 0, amount: 0 };
  }

  const payoutMultiplier = resolvedRuleset.raisePaytable[playerHand.label] || 1;
  return { result: "win", payoutMultiplier, amount: raise * payoutMultiplier };
}

function resolveProgressive(state, ruleset = {}) {
  const resolvedRuleset = normalizeRuleset(ruleset);
  const progressive = Number(state?.bets?.progressive || 0);
  const playerHand = state.playerHandResult || bestFive(state.playerHand);

  if (!resolvedRuleset.progressiveEnabled || !progressive) {
    return { result: "none", payoutMultiplier: 0, amount: 0 };
  }

  const payoutMultiplier = resolvedRuleset.progressivePaytable[playerHand.label] || 0;
  if (!payoutMultiplier) {
    return { result: "lose", payoutMultiplier: -1, amount: -progressive };
  }
  return { result: "win", payoutMultiplier, amount: progressive * payoutMultiplier };
}

function resolveRound(state, ruleset = {}) {
  const playerHand = bestFive(state.playerHand);
  const dealerHand = bestFive(state.dealerHand);
  const comparison = compareFiveCardHands(playerHand, dealerHand);
  const dealerQualified = dealerQualifiesAKOrBetter(dealerHand);

  const resolutionState = {
    ...state,
    playerHandResult: playerHand,
    dealerHandResult: dealerHand,
    comparison,
    dealerQualified,
  };

  if (state.folded || state.playerAction === "fold") {
    return {
      playerHand,
      dealerHand,
      comparison: -1,
      dealerQualified: false,
      outcome: "fold",
      ante: resolveAnte({ ...resolutionState, comparison: -1, dealerQualified: false }),
      raise: { result: "none", payoutMultiplier: 0, amount: 0 },
      progressive: resolveProgressive(resolutionState, ruleset),
    };
  }

  let outcome = "tie";
  if (!dealerQualified) {
    outcome = "dealer_not_qualified";
  } else if (comparison > 0) {
    outcome = "player_win";
  } else if (comparison < 0) {
    outcome = "dealer_win";
  }

  return {
    playerHand,
    dealerHand,
    comparison,
    dealerQualified,
    outcome,
    ante: resolveAnte(resolutionState, ruleset),
    raise: resolveRaise(resolutionState, ruleset),
    progressive: resolveProgressive(resolutionState, ruleset),
  };
}

module.exports = {
  DEFAULT_RULESET,
  HAND_LABELS,
  HAND_RANKS,
  bestFive,
  compareFiveCardHands,
  dealerQualifiesAKOrBetter,
  normalizeRuleset,
  resolveAnte,
  resolveProgressive,
  resolveRaise,
  resolveRound,
};
