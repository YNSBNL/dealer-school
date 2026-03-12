import { BLACK_NUMBERS, EUROPEAN_BET_TYPES, RED_NUMBERS } from "./rulesets";
import type { RouletteBet } from "./types";

export function getNumberColor(value: number): "green" | "red" | "black" {
  if (value === 0) return "green";
  if (RED_NUMBERS.includes(value as (typeof RED_NUMBERS)[number])) return "red";
  return "black";
}

export function isWinningBet(bet: RouletteBet, winningNumber: number): boolean {
  switch (bet.type) {
    case "straight":
    case "split":
    case "street":
    case "corner":
    case "sixLine":
    case "dozen":
    case "column":
      return bet.numbers.includes(winningNumber);
    case "red":
      return RED_NUMBERS.includes(winningNumber as (typeof RED_NUMBERS)[number]);
    case "black":
      return BLACK_NUMBERS.includes(winningNumber as (typeof BLACK_NUMBERS)[number]);
    case "even":
      return winningNumber > 0 && winningNumber % 2 === 0;
    case "odd":
      return winningNumber > 0 && winningNumber % 2 === 1;
    case "low":
      return winningNumber >= 1 && winningNumber <= 18;
    case "high":
      return winningNumber >= 19 && winningNumber <= 36;
    default:
      return false;
  }
}

export function calculateTotalPayout(bets: RouletteBet[], winningNumber: number): number {
  return bets.reduce((total, bet) => {
    if (!isWinningBet(bet, winningNumber)) return total;
    return total + bet.amount * EUROPEAN_BET_TYPES[bet.type].payout + bet.amount;
  }, 0);
}

export function getHighlightedNumbers(bets: RouletteBet[], winningNumber: number): Set<number> {
  const highlighted = new Set<number>();

  bets.forEach((bet) => {
    if (!isWinningBet(bet, winningNumber)) return;

    bet.numbers.forEach((value) => highlighted.add(value));
    if (bet.type === "red") RED_NUMBERS.forEach((value) => highlighted.add(value));
    if (bet.type === "black") BLACK_NUMBERS.forEach((value) => highlighted.add(value));
    if (bet.type === "even") for (let value = 2; value <= 36; value += 2) highlighted.add(value);
    if (bet.type === "odd") for (let value = 1; value <= 36; value += 2) highlighted.add(value);
    if (bet.type === "low") for (let value = 1; value <= 18; value += 1) highlighted.add(value);
    if (bet.type === "high") for (let value = 19; value <= 36; value += 1) highlighted.add(value);
  });

  return highlighted;
}

export function getTotalWager(bets: RouletteBet[]): number {
  return bets.reduce((total, bet) => total + bet.amount, 0);
}

export function formatBetNumbers(bet: RouletteBet): string {
  const rule = EUROPEAN_BET_TYPES[bet.type];
  return bet.numbers.length > 0 && bet.numbers.length <= 6 ? bet.numbers.join(", ") : rule.description;
}

