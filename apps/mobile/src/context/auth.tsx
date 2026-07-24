// =============================================================================
// Auth context — exposes current session/profile to all screens.
// =============================================================================
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { auth, getProfileById, runtimeConfig } from "../services";
import { normalizeStartupError, withTimeout, type StartupError } from "../config";
import type { Profile } from "@meet-champion/shared";

interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  initializationError: StartupError | null;
  refresh: () => Promise<void>;
  retryInitialization: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [initializationError, setInitializationError] = useState<StartupError | null>(null);

  const loadProfile = useCallback(async (userId: string) => {
    const data = await withTimeout(
      getProfileById(userId),
      runtimeConfig.bootTimeoutMs,
      "profile.load",
    );
    setProfile(data);
  }, []);

  const initialize = useCallback(async () => {
    setLoading(true);
    setInitializationError(null);
    try {
      const s = await withTimeout(
        auth.getSession(),
        runtimeConfig.bootTimeoutMs,
        "auth.getSession",
      );
      setSession(s);
      if (s?.user?.id) await loadProfile(s.user.id);
      else setProfile(null);
    } catch (error) {
      setSession(null);
      setProfile(null);
      setInitializationError(normalizeStartupError(error, "app.initialization"));
    } finally {
      setLoading(false);
    }
  }, [loadProfile]);

  useEffect(() => {
    let mounted = true;
    initialize();
    const off = auth.onAuthStateChange(async (s) => {
      if (!mounted) return;
      setSession(s);
      try {
        if (s?.user?.id) await loadProfile(s.user.id);
        else setProfile(null);
        setInitializationError(null);
      } catch (error) {
        setInitializationError(normalizeStartupError(error, "auth.stateChange"));
      }
    });
    return () => {
      mounted = false;
      off();
    };
  }, [initialize]);

  return (
    <AuthContext.Provider
      value={{
        session,
        profile,
        loading,
        initializationError,
        refresh: async () => {
          if (session?.user?.id) await loadProfile(session.user.id);
        },
        retryInitialization: initialize,
        signOut: async () => {
          await auth.signOut();
          setSession(null);
          setProfile(null);
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
