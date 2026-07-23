// Shared onboarding state — the onboarding screen writes to it when the user
// completes/skips it, and AuthGate reads it to know when to allow navigation
// past /onboarding. Persisted to AsyncStorage so a fresh cold start still
// respects the previous choice.
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const ONBOARDING_KEY = "@mc/onboarded@1";

interface Ctx {
  ready: boolean;              // async load complete
  onboarded: boolean;
  markDone: () => Promise<void>;
  reset: () => Promise<void>;
}

const OnboardingCtx = createContext<Ctx | null>(null);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [onboarded, setOnboarded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY)
      .then((v) => setOnboarded(v === "1"))
      .finally(() => setReady(true));
  }, []);

  const markDone = useCallback(async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, "1");
    setOnboarded(true);
  }, []);

  const reset = useCallback(async () => {
    await AsyncStorage.removeItem(ONBOARDING_KEY);
    setOnboarded(false);
  }, []);

  return (
    <OnboardingCtx.Provider value={{ ready, onboarded, markDone, reset }}>
      {children}
    </OnboardingCtx.Provider>
  );
}

export function useOnboarding(): Ctx {
  const c = useContext(OnboardingCtx);
  if (!c) throw new Error("useOnboarding requires OnboardingProvider");
  return c;
}
