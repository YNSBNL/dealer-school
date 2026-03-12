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
  dealerQualifier: {
    type: "pair_or_better",
    minRank: HAND_RANKS.pair,
  },
  anteOnDealerNotQualify: "push",
  blindPaytable: {
    straight: 1,
    flush: 1.5,
    full_house: 3,
    four_of_a_kind: 10,
    straight_flush: 50,
    royal_flush: 500,
  },
  tripsPaytable: {
    three_of_a_kind: 3,
    straight: 4,
    flush: 7,
    full_house: 8,
    four_of_a_kind: 30,
    straight_flush: 40,
    royal_flush: 50,
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
    blindPaytable: {
      ...DEFAULT_RULESET.blindPaytable,
      ...(ruleset.blindPaytable || {}),
    },
    tripsPaytable: {
      ...DEFAULT_RULESET.tripsPaytable,
      ...(ruleset.tripsPaytable || {}),
    },
  };
}

function assertCards(cards, expected, label) {
  if (!Array.isArray(cards) || cards.length !== expected) {
    throw new Error(`${label} requires exactly ${expected} cards.`);
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

function combinations(cards, size = 5) {
  const result = [];

  function walk(start, current) {
    if (current.length === size) {
      result.push([...current]);
      return;
    }
    for (let index = start; index < cards.length; index += 1) {
      current.push(cards[index]);
      walk(index + 1, current);
      current.pop();
    }
  }

  walk(0, []);
  return result;
}

function getStraightHigh(valuesDesc) {
  const uniqueDesc = [...new Set(valuesDesc)];
  if (uniqueDesc.length < 5) return null;

  for (let index = 0; index <= uniqueDesc.length - 5; index += 1) {
    if (uniqueDesc[index] - uniqueDesc[index + 4] === 4) {
      return uniqueDesc[index];
    }
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
  assertCards(cards, 5, "Five-card hand");

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

function bestFiveOfSeven(cards) {
  assertCards(cards, 7, "Seven-card hand");

  let best = null;
  for (const combo of combinations(cards, 5)) {
    const evaluated = evalFiveCardHand(combo);
    if (!best || compareEvaluatedHands(evaluated, best) > 0) {
      best = evaluated;
    }
  }
  return best;
}

function compareEvaluatedHands(left, right) {
  if (left.rank > right.rank) return 1;
  if (left.rank < right.rank) return -1;
  return compareLexicographically(left.tiebreaker, right.tiebreaker);
}

function compareHands(playerCards, dealerCards) {
  const player = Array.isArray(playerCards) && playerCards.length === 7
    ? bestFiveOfSeven(playerCards)
    : playerCards;
  const dealer = Array.isArray(dealerCards) && dealerCards.length === 7
    ? bestFiveOfSeven(dealerCards)
    : dealerCards;

  return compareEvaluatedHands(player, dealer);
}

function dealerQualifies(hand, ruleset = {}) {
  const resolvedRuleset = normalizeRuleset(ruleset);
  const evaluated = Array.isArray(hand) ? bestFiveOfSeven(hand) : hand;

  if (resolvedRuleset.dealerQualifier.type !== "pair_or_better") {
    throw new Error(`Unsupported dealer qualifier: ${resolvedRuleset.dealerQualifier.type}`);
  }

  return evaluated.rank >= resolvedRuleset.dealerQualifier.minRank;
}

function getLegalActions(state) {
  switch (state.phase) {
    case "preflop_decision":
      return [
        { type: "check" },
        { type: "play", multiplier: 3 },
        { type: "play", multiplier: 4 },
      ];
    case "flop_decision":
      return [
        { type: "check" },
        { type: "play", multiplier: 2 },
      ];
    case "river_decision":
      return [
        { type: "fold" },
        { type: "play", multiplier: 1 },
      ];
    default:
      return [];
  }
}

function isLegalAction(state, action) {
  return getLegalActions(state).some((candidate) => (
    candidate.type === action.type &&
    (candidate.multiplier || null) === (action.multiplier || null)
  ));
}

function withHistory(state, patch, entry) {
  return {
    ...state,
    ...patch,
    history: [...(state.history || []), entry],
  };
}

function resolvePreflopDecision(state, action) {
  if (state.phase !== "preflop_decision") {
    throw new Error("Preflop decision can only be resolved during preflop_decision phase.");
  }
  if (!isLegalAction(state, action)) {
    throw new Error("Illegal preflop action.");
  }

  if (action.type === "check") {
    return withHistory(state, { phase: "reveal_flop" }, { phase: state.phase, action });
  }

  return withHistory(
    state,
    {
      phase: "dealer_reveal",
      bets: {
        ...state.bets,
        play: Number(state.bets.ante || 0) * action.multiplier,
      },
      playerAction: "play",
      playMultiplier: action.multiplier,
      decisionStreet: "preflop",
    },
    { phase: state.phase, action }
  );
}

function resolveFlopDecision(state, action) {
  if (state.phase !== "flop_decision") {
    throw new Error("Flop decision can only be resolved during flop_decision phase.");
  }
  if (!isLegalAction(state, action)) {
    throw new Error("Illegal flop action.");
  }

  if (action.type === "check") {
    return withHistory(state, { phase: "reveal_turn_river" }, { phase: state.phase, action });
  }

  return withHistory(
    state,
    {
      phase: "dealer_reveal",
      bets: {
        ...state.bets,
        play: Number(state.bets.ante || 0) * action.multiplier,
      },
      playerAction: "play",
      playMultiplier: action.multiplier,
      decisionStreet: "flop",
    },
    { phase: state.phase, action }
  );
}

function resolveRiverDecision(state, action) {
  if (state.phase !== "river_decision") {
    throw new Error("River decision can only be resolved during river_decision phase.");
  }
  if (!isLegalAction(state, action)) {
    throw new Error("Illegal river action.");
  }

  if (action.type === "fold") {
    return withHistory(
      state,
      {
        phase: "round_closed",
        playerAction: "fold",
        folded: true,
        result: "fold",
      },
      { phase: state.phase, action }
    );
  }

  return withHistory(
    state,
    {
      phase: "dealer_reveal",
      bets: {
        ...state.bets,
        play: Number(state.bets.ante || 0) * action.multiplier,
      },
      playerAction: "play",
      playMultiplier: action.multiplier,
      decisionStreet: "river",
    },
    { phase: state.phase, action }
  );
}

function resolveBlind(hand, ruleset = {}) {
  const resolvedRuleset = normalizeRuleset(ruleset);
  const evaluated = Array.isArray(hand) ? bestFiveOfSeven(hand) : hand;
  const payoutMultiplier = resolvedRuleset.blindPaytable[evaluated.label] || 0;

  return {
    qualifies: payoutMultiplier > 0,
    hand: evaluated,
    payoutMultiplier,
  };
}

function resolveTrips(hand, ruleset = {}) {
  const resolvedRuleset = normalizeRuleset(ruleset);
  const evaluated = Array.isArray(hand) ? bestFiveOfSeven(hand) : hand;
  const payoutMultiplier = resolvedRuleset.tripsPaytable[evaluated.label] || 0;

  return {
    qualifies: payoutMultiplier > 0,
    hand: evaluated,
    payoutMultiplier,
  };
}

function settlePayout(result, amount, payoutMultiplier) {
  if (result === "win") {
    return { result, payoutMultiplier, amount: amount * payoutMultiplier };
  }
  if (result === "lose") {
    return { result, payoutMultiplier: -1, amount: -amount };
  }
  return { result, payoutMultiplier: 0, amount: 0 };
}

function resolveRound(state, ruleset = {}) {
  const resolvedRuleset = normalizeRuleset(ruleset);
  const ante = Number(state?.bets?.ante || 0);
  const blind = Number(state?.bets?.blind || 0);
  const play = Number(state?.bets?.play || 0);
  const trips = Number(state?.bets?.trips || 0);

  const playerSeven = [...state.playerCards, ...state.board];
  const dealerSeven = [...state.dealerCards, ...state.board];
  const playerHand = bestFiveOfSeven(playerSeven);
  const dealerHand = bestFiveOfSeven(dealerSeven);
  const dealerQualified = dealerQualifies(dealerHand, resolvedRuleset);
  const comparison = compareHands(playerHand, dealerHand);
  const blindOutcome = resolveBlind(playerHand, resolvedRuleset);
  const tripsOutcome = resolveTrips(playerHand, resolvedRuleset);

  if (state.folded || state.playerAction === "fold") {
    return {
      playerHand,
      dealerHand,
      dealerQualified: false,
      comparison: -1,
      outcome: "fold",
      ante: settlePayout("lose", ante, 1),
      blind: settlePayout("lose", blind, 1),
      play: { result: "none", payoutMultiplier: 0, amount: 0 },
      trips: trips > 0
        ? settlePayout(tripsOutcome.qualifies ? "win" : "lose", trips, tripsOutcome.payoutMultiplier)
        : { result: "none", payoutMultiplier: 0, amount: 0 },
    };
  }

  let outcome = "tie";
  let anteResult = { result: "push", payoutMultiplier: 0, amount: 0 };
  let playResult = { result: "push", payoutMultiplier: 0, amount: 0 };
  let blindResult = { result: "push", payoutMultiplier: 0, amount: 0 };

  if (comparison > 0) {
    outcome = dealerQualified ? "player_win" : "dealer_not_qualified";
    anteResult = dealerQualified
      ? settlePayout("win", ante, 1)
      : { result: resolvedRuleset.anteOnDealerNotQualify, payoutMultiplier: 0, amount: 0 };
    playResult = settlePayout("win", play, 1);
    blindResult = blindOutcome.qualifies
      ? settlePayout("win", blind, blindOutcome.payoutMultiplier)
      : { result: "push", payoutMultiplier: 0, amount: 0 };
  } else if (comparison < 0) {
    outcome = "dealer_win";
    anteResult = settlePayout("lose", ante, 1);
    playResult = settlePayout("lose", play, 1);
    blindResult = settlePayout("lose", blind, 1);
  } else {
    outcome = "tie";
    anteResult = { result: "push", payoutMultiplier: 0, amount: 0 };
    playResult = { result: "push", payoutMultiplier: 0, amount: 0 };
    blindResult = { result: "push", payoutMultiplier: 0, amount: 0 };
  }

  const tripsResult = trips > 0
    ? settlePayout(tripsOutcome.qualifies ? "win" : "lose", trips, tripsOutcome.payoutMultiplier)
    : { result: "none", payoutMultiplier: 0, amount: 0 };

  return {
    playerHand,
    dealerHand,
    dealerQualified,
    comparison,
    outcome,
    ante: anteResult,
    play: playResult,
    blind: blindResult,
    trips: tripsResult,
  };
}

module.exports = {
  DEFAULT_RULESET,
  HAND_LABELS,
  HAND_RANKS,
  bestFiveOfSeven,
  compareHands,
  dealerQualifies,
  getLegalActions,
  normalizeRuleset,
  resolveBlind,
  resolveFlopDecision,
  resolvePreflopDecision,
  resolveRiverDecision,
  resolveRound,
  resolveTrips,
};
