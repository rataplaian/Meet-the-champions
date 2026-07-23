// =============================================================================
// Legacy design tokens — kept for backwards compatibility with existing
// screens. New code should use `useTheme().tokens` for anything colour-related.
// The `colors` object here is derived from the Default Premium preset so the
// current visual identity matches the new theme system out of the box.
// =============================================================================
export * from "./tokens";
export * from "./presets";
export * from "./validator";
export { ThemeProvider, useTheme, buildTokens } from "./context";

// --- Static tokens (still used by many existing screens) ---
export const colors = {
  bg: "#07111F",
  bgElevated: "#0C1B2A",
  surface: "#122638",
  surfaceElevated: "#183247",
  border: "#284258",
  primary: "#1677FF",
  primaryDark: "#1455D9",
  secondary: "#27C2FF",
  accent: "#F5C451",
  accentDark: "#B98728",
  text: "#F7FAFC",
  textMuted: "#A5B1C2",
  danger: "#F04444",
  success: "#2ED47A",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 20,
  pill: 999,
} as const;

export const typography = {
  h1: { fontSize: 30, fontWeight: "700" as const, letterSpacing: -0.5 },
  h2: { fontSize: 22, fontWeight: "700" as const },
  h3: { fontSize: 18, fontWeight: "600" as const },
  body: { fontSize: 15, fontWeight: "400" as const },
  small: { fontSize: 13, fontWeight: "400" as const },
} as const;

export function formatPrice(cents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
}
