"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const registrySource = fs.readFileSync(path.join(ROOT, "lib", "game-registry.ts"), "utf8");
const schemaSource = fs.readFileSync(path.join(ROOT, "supabase-schema.sql"), "utf8");
const dashboardSource = fs.readFileSync(path.join(ROOT, "components", "Dashboard.jsx"), "utf8");
const certificationSource = fs.readFileSync(path.join(ROOT, "components", "CertificationPage.jsx"), "utf8");

test("registry exposes the eight product games", () => {
  const ids = [...registrySource.matchAll(/id:\s*"([^"]+)"/g)].map((match) => match[1]);
  const uniqueIds = new Set(ids);

  assert.equal(uniqueIds.size, 8);
  for (const gameId of [
    "roulette",
    "blackjack",
    "baccarat",
    "ultimate-texas",
    "three-card-poker",
    "caribbean-stud",
    "casino-holdem",
    "let-it-ride",
  ]) {
    assert.equal(uniqueIds.has(gameId), true, `Missing ${gameId} in central registry`);
  }
});

test("supabase schema seed stays aligned with the current registry ids", () => {
  for (const gameId of [
    "roulette",
    "blackjack",
    "baccarat",
    "three-card-poker",
    "ultimate-texas",
    "caribbean-stud",
    "casino-holdem",
    "let-it-ride",
  ]) {
    assert.match(schemaSource, new RegExp(`'${gameId}'`));
  }

  for (const legacyId of ["'threecard'", "'ultimate'", "'caribbean'", "'holdem'", "'omaha'", "'sicbo'", "'craps'"]) {
    assert.doesNotMatch(schemaSource, new RegExp(legacyId.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")));
  }
});

test("dashboard and certification depend on shared analytics instead of local mock registries", () => {
  assert.match(dashboardSource, /buildDashboardGames/);
  assert.match(dashboardSource, /buildSkillCards/);
  assert.doesNotMatch(dashboardSource, /GAME_LIBRARY/);

  assert.match(certificationSource, /buildCertificationSnapshot/);
  assert.doesNotMatch(certificationSource, /const CERT_LEVELS/);
});
