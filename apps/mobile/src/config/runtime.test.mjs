import test from "node:test";
import assert from "node:assert/strict";
import {
  createConfigError,
  createRuntimeConfig,
  normalizeAppMode,
  withTimeout,
} from "./runtime.js";

test("demo mode initializes without Supabase or Stripe variables", () => {
  const config = createRuntimeConfig({ EXPO_PUBLIC_APP_MODE: "demo" });

  assert.equal(config.mode, "demo");
  assert.equal(config.isValid, true);
  assert.deepEqual(config.missing, []);
  assert.deepEqual(config.requiredKeys, []);
});

test("development mode reports missing backend configuration", () => {
  const config = createRuntimeConfig(
    { EXPO_PUBLIC_APP_MODE: "development" },
    {
      supabaseUrl: "$EXPO_PUBLIC_SUPABASE_URL",
      supabaseAnonKey: "$EXPO_PUBLIC_SUPABASE_ANON_KEY",
      stripePublicKey: "$EXPO_PUBLIC_STRIPE_PUBLIC_KEY",
    },
  );

  assert.equal(config.mode, "development");
  assert.equal(config.isValid, false);
  assert.deepEqual(config.missing, [
    "EXPO_PUBLIC_SUPABASE_URL",
    "EXPO_PUBLIC_SUPABASE_ANON_KEY",
    "EXPO_PUBLIC_STRIPE_PUBLIC_KEY",
  ]);
  assert.match(createConfigError(config).message, /development mode/);
});

test("production mode never silently falls back to demo", () => {
  const config = createRuntimeConfig({ NODE_ENV: "production" });

  assert.equal(config.mode, "production");
  assert.equal(config.isDemo, false);
  assert.equal(config.isValid, false);
});

test("invalid app mode normalizes by environment", () => {
  assert.equal(normalizeAppMode("preview", "development"), "development");
  assert.equal(normalizeAppMode("preview", "production"), "production");
});

test("startup timeout rejects instead of waiting forever", async () => {
  await assert.rejects(
    withTimeout(new Promise(() => {}), 5, "auth.getSession"),
    /auth\.getSession timed out/,
  );
});
