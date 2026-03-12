import { CHIP_VALUES, EUROPEAN_BET_TYPES } from "./rulesets";
import { calculateTotalPayout } from "./selectors";
import type { RouletteBet, RouletteBetType, RouletteRound } from "./types";

function randomInt(maxExclusive: number): number {
  return Math.floor(Math.random() * maxExclusive);
}

function randomFrom<T>(values: readonly T[]): T {
  return values[randomInt(values.length)];
}

function getAvailableTypes(difficulty: number): RouletteBetType[] {
  if (difficulty <= 1) {
    return ["straight", "red", "black", "even", "odd"];
  }
  if (difficulty <= 3) {
    return ["straight", "split", "street", "dozen", "column", "red", "black", "even", "odd", "low", "high"];
  }
  return Object.keys(EUROPEAN_BET_TYPES) as RouletteBetType[];
}

function generateNumbers(type: RouletteBetType): number[] {
  switch (type) {
    case "straight":
      return [randomInt(37)];
    case "split": {
      const row = randomInt(3);
      const col = randomInt(11);
      const first = row + col * 3 + 1;
      const second = first + (Math.random() > 0.5 && row < 2 ? 1 : 3);
      return second <= 36 ? [first, second] : [first, first - 1];
    }
    case "street": {
      const col = randomInt(12);
      return [col * 3 + 1, col * 3 + 2, col * 3 + 3];
    }
    case "corner": {
      const row = randomInt(2);
      const col = randomInt(11);
      const base = row + col * 3 + 1;
      return [base, base + 1, base + 3, base + 4];
    }
    case "sixLine": {
      const col = randomInt(11);
      const base = col * 3 + 1;
      return [base, base + 1, base + 2, base + 3, base + 4, base + 5];
    }
    case "dozen": {
      const index = randomInt(3);
      return Array.from({ length: 12 }, (_, offset) => index * 12 + offset + 1);
    }
    case "column": {
      const index = randomInt(3);
      return Array.from({ length: 12 }, (_, offset) => index + 1 + offset * 3);
    }
    default:
      return [];
  }
}

export function generateRandomBets(difficulty: number): RouletteBet[] {
  const types = getAvailableTypes(difficulty);
  const chipPool = CHIP_VALUES.slice(0, Math.min(difficulty + 1, CHIP_VALUES.length));
  const betCount = difficulty <= 1 ? 1 : difficulty <= 3 ? randomInt(2) + 2 : randomInt(3) + 3;

  return Array.from({ length: betCount }, (_, index) => {
    const type = randomFrom(types);
    const chipValue = randomFrom(chipPool);
    return {
      id: `bet-${index}`,
      type,
      amount: chipValue * (randomInt(3) + 1),
      numbers: generateNumbers(type),
    };
  });
}

export function generateWinningNumber(): number {
  return randomInt(37);
}

export function buildRound(difficulty: number): RouletteRound {
  const bets = generateRandomBets(difficulty);
  const winningNumber = generateWinningNumber();
  return {
    bets,
    winningNumber,
    correctAnswer: calculateTotalPayout(bets, winningNumber),
  };
}

