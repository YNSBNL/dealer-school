import assert from "node:assert/strict";
import test from "node:test";

import { compareThreeCardHands, evalThreeCardHand } from "./engine";
import type { Card } from "./types";

function card(rank: Card["rank"], suit: Card["suit"]): Card {
  return { rank, suit };
}

test("three card poker keeps straight above flush", () => {
  const straight = evalThreeCardHand([card("7", "S"), card("6", "D"), card("5", "C")]);
  const flush = evalThreeCardHand([card("K", "H"), card("9", "H"), card("2", "H")]);
  assert.equal(compareThreeCardHands(straight, flush), 1);
});

