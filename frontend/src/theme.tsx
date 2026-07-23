// Small theme system — Default Premium palette. Same design tokens as
// /app/apps/mobile but simplified for the demo app.
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Preset {
  id: string;
  label: string;
  description: string;
  background: string;
  primary: string;
  secondary: string;
  accent: string;
}

export const PRESETS: readonly Preset[] = [
  { id: "default", label: "Default Premium", description: "Blu notte + oro", background: "#07111F", primary: "#1677FF", secondary: "#27C2FF", accent: "#F5C451" },
  { id: "red-black", label: "Rosso e Nero", description: "Intenso e classico", background: "#0C0C0E", primary: "#D72638", secondary: "#7C101A", accent: "#F5C451" },
  { id: "blue-black", label: "Blu e Nero", description: "Sobrio e potente", background: "#080D18", primary: "#1455D9", secondary: "#050505", accent: "#27C2FF" },
  { id: "white-black", label: "Bianco e Nero", description: "Minimal e senza tempo", background: "#101214", primary: "#F4F4F4", secondary: "#2D3135", accent: "#BFC6CE" },
  { id: "yellow-red", label: "Giallo e Rosso", description: "Caldo e mediterraneo", background: "#26130E", primary: "#F2B705", secondary: "#9E1B32", accent: "#FFE27A" },
  { id: "royal-blue", label: "Blu Reale", description: "Elegante e nobile", background: "#08142D", primary: "#1459E8", secondary: "#D9A441", accent: "#F5C451" },
  { id: "sky-blue", label: "Azzurro", description: "Fresco e luminoso", background: "#081925", primary: "#42B6E9", secondary: "#E9F6FC", accent: "#F5C451" },
] as const;

export interface Tokens {
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

function shift(hex: string, amount: number): string {
  const h = hex.replace("#", "").slice(0, 6);
  const n = parseInt(h, 16);
  const clamp = (v: number) => Math.max(0, Math.min(255, v));
  const r = clamp(((n >> 16) & 255) + amount);
  const g = clamp(((n >> 8) & 255) + amount);
  const b = clamp((n & 255) + amount);
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
}

export function buildTokens(preset: Preset): Tokens {
  const isLight = /^#(f|e|d)/i.test(preset.background) === false && parseInt(preset.background.slice(1, 3), 16) > 200;
  return {
    bg: preset.background,
    bgElevated: shift(preset.background, 6),
    surface: shift(preset.background, 14),
    surfaceElevated: shift(preset.background, 22),
    border: shift(preset.background, 28),
    primary: preset.primary,
    secondary: preset.secondary,
    accent: preset.accent,
    text: isLight ? "#0B1220" : "#F7FAFC",
    textMuted: isLight ? "#3A4556" : "#A5B1C2",
    success: "#2ED47A",
    danger: "#F04444",
  };
}

const STORAGE_KEY = "@mc/theme@1";

interface Ctx { preset: Preset; tokens: Tokens; setPreset: (id: string) => Promise<void>; }
const ThemeCtx = createContext<Ctx | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preset, setPresetState] = useState<Preset>(PRESETS[0]);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const found = PRESETS.find((p) => p.id === raw);
          if (found) setPresetState(found);
        }
      } catch {}
    })();
  }, []);

  const setPreset = async (id: string) => {
    const found = PRESETS.find((p) => p.id === id);
    if (!found) return;
    setPresetState(found);
    try { await AsyncStorage.setItem(STORAGE_KEY, id); } catch {}
  };

  const tokens = useMemo(() => buildTokens(preset), [preset]);
  return <ThemeCtx.Provider value={{ preset, tokens, setPreset }}>{children}</ThemeCtx.Provider>;
}

export function useTheme(): Ctx {
  const c = useContext(ThemeCtx);
  if (c) return c;
  const preset = PRESETS[0];
  return { preset, tokens: buildTokens(preset), setPreset: async () => {} };
}

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 } as const;
export const radius = { sm: 8, md: 12, lg: 20, pill: 999 } as const;

export function formatPrice(cents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
}
