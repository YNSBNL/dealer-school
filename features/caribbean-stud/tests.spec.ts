import assert from "node:assert/strict";
import test from "node:test";
import { dealerQualifiesAKOrBetter } from "./engine";
import type { Card } from "./types";
function card(rank: Card["rank"], suit: Card["suit"]): Card { return { rank, suit }; }
test("caribbean stud dealer qualifier rejects queen-high", () => {
  assert.equal(dealerQualifiesAKOrBetter([card("Q", "H"), card("J", "D"), card("8", "S"), card("6", "C"), card("3", "H")]), false);
});
