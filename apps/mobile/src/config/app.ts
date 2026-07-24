import Constants from "expo-constants";
import { createRuntimeConfig } from "./runtime";

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, unknown>;

export const runtimeConfig = createRuntimeConfig(process.env, extra);
export const isDemoMode = runtimeConfig.mode === "demo";
export const canUseRemoteBackend = !runtimeConfig.isDemo && runtimeConfig.isValid;

if (runtimeConfig.serverOnlyPresent.length > 0 && runtimeConfig.diagnosticsEnabled) {
  console.warn(
    `[meet-champion] Server-only environment variables are visible to the mobile app: ${runtimeConfig.serverOnlyPresent.join(", ")}`,
  );
}

