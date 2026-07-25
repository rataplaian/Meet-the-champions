// =============================================================================
// ThemeProvider — resolves the active theme tokens for the whole mobile app.
//
// Contract (must not be broken):
//   - The provider MUST never throw. If loading fails, fall back to default.
//   - The provider MUST not delay first paint waiting for a network round-trip:
//     it renders default synchronously, then swaps in the persisted theme
//     when async storage returns, then optionally syncs to Supabase.
//   - Feature code MUST call `useTheme()` only for decorative styling.
// =============================================================================
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { UserThemePreferences } from "@meet-champion/shared";

import { DEFAULT_PREFERENCES, IMMUTABLE_TOKENS } from "./tokens";
import { findPreset, presetToPreferences } from "./presets";
import { validateAndFix, isDarkBackground } from "./validator";

// Version 2 resets old device-only dark selections so the demo starts with
// the same bright default on web and native. New selections still persist.
const STORAGE_KEY = "@meet-champion/theme@2";

// -----------------------------------------------------------------------------
// Build ThemeTokens from a set of preferences.
// -----------------------------------------------------------------------------
export interface LegacyFlatThemeTokens {
  bg: string;
  bgElevated: string;
  surface: string;
  surfaceElevated: string;
  border: string;
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  textMuted: string;
  success: string;
  danger: string;
}

export function buildTokens(prefs: UserThemePreferences): LegacyFlatThemeTokens {
  const preset = findPreset(prefs.presetId);
  const isDark = isDarkBackground(preset.background);
  const bg = isDark ? shift(preset.background, 10) : preset.background;

  return {
    bg,
    bgElevated: shift(bg, isDark ? 14 : -6),
    surface: shift(bg, isDark ? 18 : 14),
    surfaceElevated: shift(bg, isDark ? 28 : 24),
    border: shift(bg, isDark ? 34 : -24),
    primary: prefs.primaryColor,
    secondary: prefs.secondaryColor,
    accent: prefs.accentColor,
    text: isDark ? IMMUTABLE_TOKENS.textPrimaryLight : IMMUTABLE_TOKENS.textPrimaryDark,
    textMuted: isDark ? IMMUTABLE_TOKENS.textSecondaryLight : IMMUTABLE_TOKENS.textSecondaryDark,
    success: IMMUTABLE_TOKENS.success,
    danger: IMMUTABLE_TOKENS.danger,
  };
}

/** Small helper: lightens/darkens a hex by an amount (0-255). */
function shift(hex: string, amount: number): string {
  const h = hex.replace("#", "").slice(0, 6);
  const num = parseInt(h, 16);
  let r = (num >> 16) & 255;
  let g = (num >> 8) & 255;
  let b = num & 255;
  r = clamp(r + amount);
  g = clamp(g + amount);
  b = clamp(b + amount);
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
}
function clamp(v: number) {
  return Math.max(0, Math.min(255, v));
}

// -----------------------------------------------------------------------------
// Context
// -----------------------------------------------------------------------------
interface ThemeContextValue {
  preferences: UserThemePreferences;
  preset: ReturnType<typeof findPreset>;
  tokens: LegacyFlatThemeTokens;
  loading: boolean;
  setPreset: (id: string) => Promise<void>;
  updatePreferences: (patch: Partial<UserThemePreferences>) => Promise<void>;
  reset: () => Promise<void>;
  /** Optional: attach a supabase-backed sync (called by app root when signed in). */
  bindRemoteSync: (
    load: () => Promise<UserThemePreferences | null>,
    save: (prefs: UserThemePreferences) => Promise<void>,
  ) => () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<UserThemePreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [remoteSave, setRemoteSave] = useState<
    ((prefs: UserThemePreferences) => Promise<void>) | null
  >(null);

  // 1. Load from AsyncStorage on mount (fast path)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw && mounted) {
          const parsed = JSON.parse(raw);
          const preset = findPreset(parsed?.presetId);
          const { fixed } = validateAndFix(parsed, preset.background);
          setPreferences(fixed);
        }
      } catch {
        // Silent fallback — never block the app for a theme.
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const persist = useCallback(
    async (next: UserThemePreferences) => {
      setPreferences(next);
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore storage errors — in-memory is still active
      }
      if (remoteSave) {
        try {
          await remoteSave(next);
        } catch {
          // Ignore remote sync errors — the user still sees the change locally.
        }
      }
    },
    [remoteSave],
  );

  const setPreset = useCallback(
    async (id: string) => {
      const preset = findPreset(id as any);
      await persist(presetToPreferences(preset));
    },
    [persist],
  );

  const updatePreferences = useCallback(
    async (patch: Partial<UserThemePreferences>) => {
      const merged = { ...preferences, ...patch };
      const preset = findPreset(merged.presetId);
      const { fixed } = validateAndFix(merged, preset.background);
      // Any hand-crafted change makes this a "custom" preset.
      if (patch.presetId === undefined) fixed.presetId = "custom";
      await persist(fixed);
    },
    [preferences, persist],
  );

  const reset = useCallback(async () => {
    await persist(DEFAULT_PREFERENCES);
  }, [persist]);

  const bindRemoteSync = useCallback<ThemeContextValue["bindRemoteSync"]>(
    (load, save) => {
      let cancelled = false;
      setRemoteSave(() => save);
      (async () => {
        try {
          const remote = await load();
          if (!cancelled && remote) {
            const preset = findPreset(remote.presetId);
            const { fixed } = validateAndFix(remote, preset.background);
            setPreferences(fixed);
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(fixed));
          }
        } catch {
          // No-op — offline / no row yet.
        }
      })();
      return () => {
        cancelled = true;
        setRemoteSave(null);
      };
    },
    [],
  );

  const tokens = useMemo(() => buildTokens(preferences), [preferences]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      preferences,
      preset: findPreset(preferences.presetId),
      tokens,
      loading,
      setPreset,
      updatePreferences,
      reset,
      bindRemoteSync,
    }),
    [preferences, tokens, loading, setPreset, updatePreferences, reset, bindRemoteSync],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    // Safe fallback — never throw for a decorative concern.
    const prefs = DEFAULT_PREFERENCES;
    return {
      preferences: prefs,
      preset: findPreset(prefs.presetId),
      tokens: buildTokens(prefs),
      loading: false,
      setPreset: async () => {},
      updatePreferences: async () => {},
      reset: async () => {},
      bindRemoteSync: () => () => {},
    };
  }
  return ctx;
}
