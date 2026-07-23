// =============================================================================
// Design tokens — kept intentionally small. Tweak to your brand.
// =============================================================================
export const colors = {
  bg: "#0B0D12",
  bgElevated: "#141821",
  surface: "#1B2030",
  border: "#252B3B",
  primary: "#F5C518",
  primaryDark: "#C89A00",
  text: "#F4F5F7",
  textMuted: "#9AA3B2",
  danger: "#E5484D",
  success: "#3CB371",
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
