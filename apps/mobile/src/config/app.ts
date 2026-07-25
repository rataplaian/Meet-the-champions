import Constants from "expo-constants";
import { createRuntimeConfig } from "./runtime";

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, unknown>;

const publicEnv = {
  EXPO_PUBLIC_APP_MODE: process.env.EXPO_PUBLIC_APP_MODE,
  EXPO_PUBLIC_BOOT_TIMEOUT_MS: process.env.EXPO_PUBLIC_BOOT_TIMEOUT_MS,
  EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  EXPO_PUBLIC_STRIPE_PUBLIC_KEY: process.env.EXPO_PUBLIC_STRIPE_PUBLIC_KEY,
  NODE_ENV: process.env.NODE_ENV,
};

export const runtimeConfig = createRuntimeConfig(publicEnv, extra);
export const isDemoMode = runtimeConfig.mode === "demo";
export const canUseRemoteBackend = !runtimeConfig.isDemo && runtimeConfig.isValid;

if (runtimeConfig.serverOnlyPresent.length > 0 && runtimeConfig.diagnosticsEnabled) {
  console.warn(
    `[meet-champion] Server-only environment variables are visible to the mobile app: ${runtimeConfig.serverOnlyPresent.join(", ")}`,
  );
}
