const APP_MODES = ["demo", "development", "production"];
const SERVER_ONLY_KEYS = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
];

function readValue(env, extra, key, extraKey) {
  const envValue = env[key];
  const extraValue = extra[extraKey];
  if (isUsableValue(envValue)) return envValue;
  if (isUsableValue(extraValue)) return String(extraValue);
  return "";
}

function isUsableValue(value) {
  if (typeof value !== "string") return value !== undefined && value !== null;
  const trimmed = value.trim();
  return Boolean(trimmed) && !trimmed.startsWith("$EXPO_PUBLIC_");
}

function normalizeAppMode(value, nodeEnv) {
  if (APP_MODES.includes(value)) return value;
  return nodeEnv === "production" ? "production" : "development";
}

function createRuntimeConfig(env = {}, extra = {}) {
  const mode = normalizeAppMode(
    readValue(env, extra, "EXPO_PUBLIC_APP_MODE", "appMode"),
    env.NODE_ENV,
  );
  const values = {
    supabaseUrl: readValue(env, extra, "EXPO_PUBLIC_SUPABASE_URL", "supabaseUrl"),
    supabaseAnonKey: readValue(
      env,
      extra,
      "EXPO_PUBLIC_SUPABASE_ANON_KEY",
      "supabaseAnonKey",
    ),
    stripePublicKey: readValue(
      env,
      extra,
      "EXPO_PUBLIC_STRIPE_PUBLIC_KEY",
      "stripePublicKey",
    ),
  };
  const requiredKeys =
    mode === "demo"
      ? []
      : [
          "EXPO_PUBLIC_SUPABASE_URL",
          "EXPO_PUBLIC_SUPABASE_ANON_KEY",
          "EXPO_PUBLIC_STRIPE_PUBLIC_KEY",
        ];
  const missing = requiredKeys.filter(
    (key) => !isUsableValue(env[key]) && !isUsableValue(extra[toExtraKey(key)]),
  );
  const serverOnlyPresent = SERVER_ONLY_KEYS.filter((key) => Boolean(env[key]));

  return {
    mode,
    isDemo: mode === "demo",
    isDevelopment: mode === "development",
    isProduction: mode === "production",
    bootTimeoutMs: Number(env.EXPO_PUBLIC_BOOT_TIMEOUT_MS || extra.bootTimeoutMs || 5000),
    diagnosticsEnabled: mode !== "production",
    values,
    requiredKeys,
    missing,
    serverOnlyPresent,
    isValid: missing.length === 0,
  };
}

function toExtraKey(publicKey) {
  return publicKey
    .replace(/^EXPO_PUBLIC_/, "")
    .toLowerCase()
    .replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function createConfigError(config) {
  const missing = config.missing.join(", ");
  return new Error(
    `Mobile configuration is incomplete for ${config.mode} mode. Missing: ${missing}`,
  );
}

function normalizeStartupError(error, step) {
  if (error instanceof Error) {
    return {
      step,
      message: error.message,
      stack: error.stack,
      canRetry: true,
    };
  }
  return {
    step,
    message: String(error || "Unknown startup error"),
    canRetry: true,
  };
}

function withTimeout(promise, timeoutMs, step) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${step} timed out after ${timeoutMs}ms`)), timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

module.exports = {
  APP_MODES,
  SERVER_ONLY_KEYS,
  createConfigError,
  createRuntimeConfig,
  normalizeAppMode,
  normalizeStartupError,
  withTimeout,
};
