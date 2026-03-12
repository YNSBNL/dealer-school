"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const platformAccessSource = fs.readFileSync(path.join(ROOT, "lib", "platform-access.js"), "utf8");
const middlewareSource = fs.readFileSync(path.join(ROOT, "middleware.js"), "utf8");

test("public and private route groups are declared centrally", () => {
  for (const route of ["/", "/catalogue", "/auth/login", "/auth/register", "/auth/callback"]) {
    assert.match(platformAccessSource, new RegExp(route.replace(/\//g, "\\/")));
  }

  for (const route of ["/dashboard", "/profil", "/tuteur", "/certification", "/simulateur"]) {
    assert.match(platformAccessSource, new RegExp(route.replace(/\//g, "\\/")));
  }
});

test("middleware redirects protected routes when auth is unavailable", () => {
  assert.match(middlewareSource, /auth_unavailable/);
  assert.match(middlewareSource, /isPrivateRoute/);
  assert.doesNotMatch(middlewareSource, /x-croupierpro-auth-degraded/);
});
