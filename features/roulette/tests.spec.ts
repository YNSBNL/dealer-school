import assert from "node:assert/strict";
import test from "node:test";
import { buildRound } from "./engine";
import { calculateTotalPayout, getNumberColor, isWinningBet } from "./selectors";
import type { RouletteBet } from "./types";
test("roulette color mapping keeps zero green", () => { assert.equal(getNumberColor(0), "green"); });
test("roulette straight bet pays 35:1 plus stake", () => { const bet: RouletteBet = { id: "1", type: "straight", amount: 10, numbers: [7] }; assert.equal(isWinningBet(bet, 7), true); assert.equal(calculateTotalPayout([bet], 7), 360); });
test("roulette round returns deterministic payload shape", () => { const round = buildRound(2); assert.equal(Array.isArray(round.bets), true); });
