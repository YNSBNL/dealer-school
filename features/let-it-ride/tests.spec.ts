import assert from "node:assert/strict";
import test from "node:test";

import { canPullBet } from "./engine";

test("let it ride exposes pull decision rules", () => {
  assert.equal(canPullBet({ phase: "decision_1", bets: { bet1Active: true } }, "bet1"), true);
});
