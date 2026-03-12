import { BLIND_PAYTABLE, BONUS_PAYTABLE, PROGRESSIVE_PAYTABLE, RANKS, RANK_VALUES, SUITS } from "./rulesets";
import type { Card, CardRank, CardSuit, DealtUltimateRound, HandEvaluation, PayoutResult, TablePreset, UltimatePlayer } from "./types";

function randomInt(maxExclusive: number): number {
  return Math.floor(Math.random() * maxExclusive);
}

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ rank, suit, id: `${rank}${suit}-${deck.length}` });
    }
  }
  for (let index = deck.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(index + 1);
    [deck[index], deck[swapIndex]] = [deck[swapIndex], deck[index]];
  }
  return deck;
}

function combinations(cards: Card[], size = 5): Card[][] {
  const result: Card[][] = [];
  function walk(start: number, current: Card[]) {
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

function evaluateFiveCards(cards: Card[]): HandEvaluation {
  const values = cards.map((card) => RANK_VALUES[card.rank]).sort((left, right) => right - left);
  const suits = cards.map((card) => card.suit);
  const flush = suits.every((suit) => suit === suits[0]);
  const unique = Array.from(new Set(values)).sort((left, right) => right - left);
  let straight = false;
  let straightHigh = 0;

  if (unique.length >= 5) {
    for (let index = 0; index <= unique.length - 5; index += 1) {
      if (unique[index] - unique[index + 4] === 4) {
        straight = true;
        straightHigh = unique[index];
        break;
      }
    }
    if (!straight && unique.includes(14) && unique.includes(5) && unique.includes(4) && unique.includes(3) && unique.includes(2)) {
      straight = true;
      straightHigh = 5;
    }
  }

  const counts = new Map<number, number>();
  values.forEach((value) => counts.set(value, (counts.get(value) || 0) + 1));
  const groups = Array.from(counts.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((left, right) => right.count - left.count || right.value - left.value);

  if (flush && straight && straightHigh === 14) return { rank: 9, k: [14] };
  if (flush && straight) return { rank: 8, k: [straightHigh] };
  if (groups[0]?.count === 4) return { rank: 7, k: [groups[0].value, groups[1].value] };
  if (groups[0]?.count === 3 && groups[1]?.count === 2) return { rank: 6, k: [groups[0].value, groups[1].value] };
  if (flush) return { rank: 5, k: values.slice(0, 5) };
  if (straight) return { rank: 4, k: [straightHigh] };
  if (groups[0]?.count === 3) {
    const kickers = groups.filter((group) => group.count === 1).map((group) => group.value).sort((left, right) => right - left);
    return { rank: 3, k: [groups[0].value, ...kickers.slice(0, 2)] };
  }
  if (groups[0]?.count === 2 && groups[1]?.count === 2) {
    const kicker = groups.find((group) => group.count === 1)?.value ?? 0;
    return { rank: 2, k: [Math.max(groups[0].value, groups[1].value), Math.min(groups[0].value, groups[1].value), kicker] };
  }
  if (groups[0]?.count === 2) {
    const kickers = groups.filter((group) => group.count === 1).map((group) => group.value).sort((left, right) => right - left);
    return { rank: 1, k: [groups[0].value, ...kickers.slice(0, 3)] };
  }
  return { rank: 0, k: values.slice(0, 5) };
}

export function compareHands(left: HandEvaluation, right: HandEvaluation): number {
  if (left.rank !== right.rank) return left.rank - right.rank;
  const maxLength = Math.max(left.k.length, right.k.length);
  for (let index = 0; index < maxLength; index += 1) {
    const a = left.k[index] ?? 0;
    const b = right.k[index] ?? 0;
    if (a !== b) return a - b;
  }
  return 0;
}

export function bestSeven(cards: Card[]): HandEvaluation | null {
  if (cards.length < 5) return null;
  let best: HandEvaluation | null = null;
  for (const combo of combinations(cards, 5)) {
    const current = evaluateFiveCards(combo);
    if (!best || compareHands(current, best) > 0) {
      best = current;
    }
  }
  return best;
}

export function dealerQualifies(hand: HandEvaluation | null): boolean {
  return Boolean(hand && hand.rank >= 1);
}

function blindQualifies(playerCards: Card[], board: Card[], handRank: number): boolean {
  if (handRank < 4) return false;
  const boardHand = bestSeven(board);
  const fullHand = bestSeven([...board, ...playerCards]);
  const boardHasRank = Boolean(boardHand && boardHand.rank >= handRank);
  const fullHasRank = Boolean(fullHand && fullHand.rank >= handRank);

  if (fullHasRank && !boardHasRank) return true;
  if (boardHasRank && fullHasRank && (fullHand?.rank ?? 0) > (boardHand?.rank ?? 0)) return true;
  if (boardHasRank) return false;
  return fullHasRank;
}

export function calculatePayout(player: UltimatePlayer, playerEval: HandEvaluation, dealerEval: HandEvaluation, dealerIsQualified: boolean, board: Card[], jackpot: number): PayoutResult {
  const comparison = compareHands(playerEval, dealerEval);
  const bonusPay = player.bonus > 0 ? player.bonus * (BONUS_PAYTABLE[playerEval.rank] || 0) : 0;
  const progressiveRule = player.progressive ? PROGRESSIVE_PAYTABLE[playerEval.rank] : 0;
  const progPay = progressiveRule === "jackpot" ? jackpot : typeof progressiveRule === "number" ? progressiveRule : 0;

  let mainPay = 0;
  const result: "win" | "lose" | "push" = comparison > 0 ? "win" : comparison < 0 ? "lose" : "push";
  if (comparison > 0) {
    const blindMultiplier = blindQualifies(player.cards, board, playerEval.rank) ? BLIND_PAYTABLE[playerEval.rank] || 0 : 0;
    mainPay = player.jouer + (dealerIsQualified ? player.miser : 0) + Math.floor(player.blind * blindMultiplier);
  }

  return {
    payAmount: mainPay + bonusPay + progPay,
    result,
    bonusPay,
    progPay,
    mainPay,
  };
}

export function dealRound(table: TablePreset, difficulty: number): DealtUltimateRound {
  const deck = createDeck();
  let index = 0;
  const players: UltimatePlayer[] = [];

  for (let seat = 0; seat < 7; seat += 1) {
    const cards = [deck[index++], deck[index++]];
    const baseBet = Math.min(table.min * (1 + randomInt(Math.min(4, Math.floor(table.max / table.min)))), table.max);
    const normalizedBase = Math.round(baseBet / table.step) * table.step || table.min;
    const withBets = difficulty >= 2;
    const jouerMult = withBets ? 1 + randomInt(4) : 0;
    players.push({
      active: true,
      cards,
      miser: withBets ? normalizedBase : 0,
      blind: withBets ? normalizedBase : 0,
      bonus: withBets && Math.random() > 0.4 ? table.min : 0,
      jouer: withBets ? normalizedBase * jouerMult : 0,
      jouerMult,
      progressive: withBets && Math.random() > 0.5,
      folded: false,
      result: null,
      payout: 0,
      eval: null,
      progressiveWin: 0,
    });
  }

  return {
    dealerCards: [deck[index++], deck[index++]],
    board: [deck[index++], deck[index++], deck[index++], deck[index++], deck[index++]],
    players,
    jackpotIncrement: difficulty >= 2 ? players.filter((player) => player.progressive).length * 5 : 0,
  };
}
