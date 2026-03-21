"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const authUtilsSource = fs.readFileSync(path.join(ROOT, "lib", "auth-utils.js"), "utf8");
const registerSource = fs.readFileSync(path.join(ROOT, "app", "auth", "register", "page.jsx"), "utf8");
const loginSource = fs.readFileSync(path.join(ROOT, "app", "auth", "login", "page.jsx"), "utf8");
const envExampleSource = fs.readFileSync(path.join(ROOT, ".env.local.example"), "utf8");

test("auth utils expose a dedicated email callback builder", () => {
  assert.match(authUtilsSource, /export function buildEmailRedirectUrl/);
  assert.match(authUtilsSource, /NEXT_PUBLIC_SITE_URL|PUBLIC_SITE_URL/);
  assert.match(authUtilsSource, /auth\/callback\?next=/);
});

test("auth utils map rate limits and smtp authorization errors to actionable messages", () => {
  assert.match(authUtilsSource, /rate_limit|security purposes/);
  assert.match(authUtilsSource, /email_address_not_authorized/);
  assert.match(authUtilsSource, /Authentication > URL Configuration/);
});

test("login and register pages rely on shared Supabase auth error mapping", () => {
  assert.match(registerSource, /getSupabaseAuthErrorMessage/);
  assert.match(registerSource, /buildEmailRedirectUrl/);
  assert.match(loginSource, /getSupabaseAuthErrorMessage/);
});

test("environment example documents the public site url for auth callbacks", () => {
  assert.match(envExampleSource, /NEXT_PUBLIC_SITE_URL=/);
});
