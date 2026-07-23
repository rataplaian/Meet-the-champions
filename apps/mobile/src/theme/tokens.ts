// =============================================================================
// Theme tokens — semantic colour keys used across the whole mobile app.
// Any hard-coded colour in a component is a bug: use `useTheme().tokens.xxx`.
// =============================================================================
import type { UserThemePreferences } from "@meet-champion/shared";

export interface ThemeTokens {
  background: {
    primary: string;
    secondary: string;
    elevated: string;
  };
  text: {
    primary: string;
    secondary: string;
    inverse: string;
  };
  action: {
    primary: string;    // main CTAs, selected state
    secondary: string;  // secondary buttons, taps
    success: string;    // confirmations, availability, book buttons
    danger: string;     // errors, cancellations (never customisable)
    accent: string;     // gold / premium accent
  };
  border: {
    default: string;
    highlighted: string;
    premium: string;
  };
  card: {
    background: string;
    border: string;
    glow: string;       // used with shadow / outline
  };
}

// -----------------------------------------------------------------------------
// Immutable safety tokens — never overridden by user themes.
// Reserved semantics: success = green, danger = red, minimum text contrast.
// -----------------------------------------------------------------------------
export const IMMUTABLE_TOKENS = {
  success: "#2ED47A",
  danger: "#F04444",
  textPrimaryLight: "#F7FAFC",
  textSecondaryLight: "#A5B1C2",
  textPrimaryDark: "#0B1220",
  textSecondaryDark: "#3A4556",
} as const;

// -----------------------------------------------------------------------------
// Default palette (fallback when user preferences are missing/invalid).
// -----------------------------------------------------------------------------
export const DEFAULT_PREFERENCES: UserThemePreferences = {
  presetId: "default",
  primaryColor: "#1677FF",
  secondaryColor: "#27C2FF",
  accentColor: "#F5C451",
  borderStyle: "minimal",
  backgroundStyle: "solid",
  glowIntensity: "low",
  patternEnabled: false,
};
