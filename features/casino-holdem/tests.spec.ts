import assert from "node:assert/strict";
import test from "node:test";

import { dealerQualifiesPairOf4Plus } from "./engine";
import type { Card } from "./types";

function card(rank: Card["rank"], suit: Card["suit"]): Card {
  return { rank, suit };
}

test("casino holdem dealer must hold pair of fours or better", () => {
  assert.equal(dealerQualifiesPairOf4Plus([card("4", "H"), card("4", "C"), card("K", "S"), card("J", "D"), card("8", "C"), card("3", "H"), card("2", "D")]), true);
});

