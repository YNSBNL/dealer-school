"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const registrySource = fs.readFileSync(path.join(ROOT, "lib", "game-registry.ts"), "utf8");

function getAvailableSimulatorRoutes() {
  const routeMatches = [...registrySource.matchAll(/route:\s*"([^"]+)"/g)].map((match) => match[1]);
  const availabilityMatches = [...registrySource.matchAll(/availability:\s*"([^"]+)"/g)].map((match) => match[1]);
  return routeMatches.filter((route, index) => availabilityMatches[index] === "available" || availabilityMatches[index] === "beta");
}

test("every available game exposes a simulator route file", () => {
  const routes = getAvailableSimulatorRoutes();
  assert.ok(routes.length >= 8);

  for (const route of routes) {
    const segments = route.split("/").filter(Boolean);
    const pagePath = path.join(ROOT, "app", ...segments, "page.jsx");
    assert.equal(fs.existsSync(pagePath), true, `Missing route file for ${route}`);
  }
});

test("simulateur index route exists", () => {
  assert.equal(fs.existsSync(path.join(ROOT, "app", "simulateur", "page.jsx")), true);
});
