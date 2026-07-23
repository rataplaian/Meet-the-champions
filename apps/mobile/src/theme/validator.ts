// =============================================================================
// Contrast validator + auto-fix for user-picked themes.
// Uses WCAG relative luminance. Aims for a minimum contrast ratio of 4.5:1
// between primary text and background (WCAG AA for normal text).
// =============================================================================
import type { UserThemePreferences } from "@meet-champion/shared";
import { DEFAULT_PREFERENCES, IMMUTABLE_TOKENS } from "./tokens";
import { findPreset } from "./presets";

const HEX_RE = /^#([0-9a-f]{6}|[0-9a-f]{8})$/i;

export function isValidHex(value: unknown): value is string {
  return typeof value === "string" && HEX_RE.test(value);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "").slice(0, 6);
  const num = parseInt(h, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function relativeLuminance({ r, g, b }: { r: number; g: number; b: number }) {
  const srgb = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

export function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hexToRgb(hex1));
  const l2 = relativeLuminance(hexToRgb(hex2));
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

/** True if background is dark enough that white text passes AA. */
export function isDarkBackground(hex: string): boolean {
  return relativeLuminance(hexToRgb(hex)) < 0.5;
}

export interface ValidationResult {
  ok: boolean;
  warnings: string[];
  fixed: UserThemePreferences;
}

/**
 * Validates and auto-fixes a partial UserThemePreferences.
 * Never throws. Always returns a fully-defined preferences object that is
 * safe to use — falls back to the default preset for any invalid field.
 */
export function validateAndFix(
  input: Partial<UserThemePreferences> | null | undefined,
  bg: string,
): ValidationResult {
  const warnings: string[] = [];
  const base = { ...DEFAULT_PREFERENCES, ...(input ?? {}) };

  // Ensure preset id exists
  const preset = findPreset(base.presetId);
  const fixed: UserThemePreferences = { ...base, presetId: preset.id };

  // Validate hex colors — replace invalid ones with preset defaults
  if (!isValidHex(fixed.primaryColor)) {
    warnings.push("Colore principale non valido, ripristinato.");
    fixed.primaryColor = preset.primaryColor;
  }
  if (!isValidHex(fixed.secondaryColor)) {
    warnings.push("Colore secondario non valido, ripristinato.");
    fixed.secondaryColor = preset.secondaryColor;
  }
  if (!isValidHex(fixed.accentColor)) {
    warnings.push("Colore accento non valido, ripristinato.");
    fixed.accentColor = preset.accentColor;
  }

  // Contrast checks against background
  const textOnBg = isDarkBackground(bg)
    ? IMMUTABLE_TOKENS.textPrimaryLight
    : IMMUTABLE_TOKENS.textPrimaryDark;

  const primaryContrast = contrastRatio(fixed.primaryColor, bg);
  if (primaryContrast < 2.5) {
    warnings.push("Colore principale poco leggibile sullo sfondo scelto.");
  }

  // Refuse fully-white on light bg or fully-black on dark bg for the primary
  if (
    isDarkBackground(bg) &&
    relativeLuminance(hexToRgb(fixed.primaryColor)) < 0.05
  ) {
    warnings.push("Il primary è troppo scuro per uno sfondo scuro — corretto.");
    fixed.primaryColor = preset.primaryColor;
  }
  if (
    !isDarkBackground(bg) &&
    relativeLuminance(hexToRgb(fixed.primaryColor)) > 0.95
  ) {
    warnings.push("Il primary è troppo chiaro per uno sfondo chiaro — corretto.");
    fixed.primaryColor = preset.primaryColor;
  }

  // Guarantee text/bg contrast
  if (contrastRatio(textOnBg, bg) < 4.5) {
    warnings.push(
      "Contrasto testo/sfondo insufficiente: verrà usato il tema predefinito.",
    );
    return {
      ok: false,
      warnings,
      fixed: DEFAULT_PREFERENCES,
    };
  }

  // Enum validation
  const validBorders = ["minimal", "glow", "metallic", "gradient"];
  if (!validBorders.includes(fixed.borderStyle)) fixed.borderStyle = "minimal";
  const validBg = ["solid", "gradient", "pattern"];
  if (!validBg.includes(fixed.backgroundStyle)) fixed.backgroundStyle = "solid";
  const validGlow = ["off", "low", "medium"];
  if (!validGlow.includes(fixed.glowIntensity)) fixed.glowIntensity = "low";
  fixed.patternEnabled = Boolean(fixed.patternEnabled);

  return { ok: warnings.length === 0, warnings, fixed };
}
