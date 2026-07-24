// =============================================================================
// Theme presets — decorative colour combinations. Names are generic (no club
// trademarks). Backgrounds/primary/secondary/accent match the specification.
// =============================================================================
import type { ThemePresetId, UserThemePreferences } from "@meet-champion/shared";

export interface ThemePresetDef {
  id: ThemePresetId;
  label: string;
  description: string;
  background: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  primary: string;
  secondary: string;
  accent: string;
}

// The order here is the order shown in the appearance screen.
export const PRESETS: readonly ThemePresetDef[] = [
  {
    id: "default",
    label: "Default Premium",
    description: "Blu notte + blu elettrico + oro",
    background: "#07111F",
    primaryColor: "#1677FF",
    secondaryColor: "#27C2FF",
    accentColor: "#F5C451",
    primary: "#1677FF",
    secondary: "#27C2FF",
    accent: "#F5C451",
  },
  {
    id: "red-black",
    label: "Rosso e Nero",
    description: "Intenso e classico",
    background: "#0C0C0E",
    primaryColor: "#D72638",
    secondaryColor: "#7C101A",
    accentColor: "#F5C451",
    primary: "#D72638",
    secondary: "#7C101A",
    accent: "#F5C451",
  },
  {
    id: "blue-black",
    label: "Blu e Nero",
    description: "Sobrio e potente",
    background: "#080D18",
    primaryColor: "#1455D9",
    secondaryColor: "#050505",
    accentColor: "#27C2FF",
    primary: "#1455D9",
    secondary: "#050505",
    accent: "#27C2FF",
  },
  {
    id: "white-black",
    label: "Bianco e Nero",
    description: "Minimal e senza tempo",
    background: "#101214",
    primaryColor: "#F4F4F4",
    secondaryColor: "#2D3135",
    accentColor: "#BFC6CE",
    primary: "#F4F4F4",
    secondary: "#2D3135",
    accent: "#BFC6CE",
  },
  {
    id: "yellow-red",
    label: "Giallo e Rosso",
    description: "Caldo e mediterraneo",
    background: "#26130E",
    primaryColor: "#F2B705",
    secondaryColor: "#9E1B32",
    accentColor: "#FFE27A",
    primary: "#F2B705",
    secondary: "#9E1B32",
    accent: "#FFE27A",
  },
  {
    id: "royal-blue",
    label: "Blu Reale",
    description: "Elegante e nobile",
    background: "#08142D",
    primaryColor: "#1459E8",
    secondaryColor: "#D9A441",
    accentColor: "#F5C451",
    primary: "#1459E8",
    secondary: "#D9A441",
    accent: "#F5C451",
  },
  {
    id: "sky-blue",
    label: "Azzurro",
    description: "Fresco e luminoso",
    background: "#081925",
    primaryColor: "#42B6E9",
    secondaryColor: "#E9F6FC",
    accentColor: "#F5C451",
    primary: "#42B6E9",
    secondary: "#E9F6FC",
    accent: "#F5C451",
  },
] as const;

export function findPreset(id: ThemePresetId | undefined): ThemePresetDef {
  return PRESETS.find((p) => p.id === id) ?? PRESETS[0]!;
}

export function presetToPreferences(preset: ThemePresetDef): UserThemePreferences {
  return {
    presetId: preset.id,
    primaryColor: preset.primaryColor,
    secondaryColor: preset.secondaryColor,
    accentColor: preset.accentColor,
    borderStyle: "minimal",
    backgroundStyle: "solid",
    glowIntensity: "low",
    patternEnabled: false,
  };
}
