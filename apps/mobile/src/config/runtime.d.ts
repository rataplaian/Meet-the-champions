export type AppMode = "demo" | "development" | "production";

export interface RuntimeValues {
  supabaseUrl: string;
  supabaseAnonKey: string;
  stripePublicKey: string;
}

export interface RuntimeConfig {
  mode: AppMode;
  isDemo: boolean;
  isDevelopment: boolean;
  isProduction: boolean;
  bootTimeoutMs: number;
  diagnosticsEnabled: boolean;
  values: RuntimeValues;
  requiredKeys: string[];
  missing: string[];
  serverOnlyPresent: string[];
  isValid: boolean;
}

export interface StartupError {
  step: string;
  message: string;
  stack?: string;
  canRetry: boolean;
}

export const APP_MODES: AppMode[];
export const SERVER_ONLY_KEYS: string[];
export function createConfigError(config: RuntimeConfig): Error;
export function createRuntimeConfig(
  env?: Record<string, string | undefined>,
  extra?: Record<string, unknown>,
): RuntimeConfig;
export function normalizeAppMode(value?: string, nodeEnv?: string): AppMode;
export function normalizeStartupError(error: unknown, step: string): StartupError;
export function withTimeout<T>(promise: Promise<T>, timeoutMs: number, step: string): Promise<T>;
