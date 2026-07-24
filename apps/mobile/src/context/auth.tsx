// =============================================================================
// Auth context — exposes current session/profile to all screens.
// =============================================================================
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { auth, getProfileById, runtimeConfig } from "../services";
import { normalizeStartupError, withTimeout, type StartupError } from "../config";
import type { Profile } from "@meet-champion/shared";
import { ensureSeeded, users as demoUsers, type User as DemoUser } from "../store";

interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  user: DemoUser | null;
  loading: boolean;
  initializationError: StartupError | null;
  refresh: () => Promise<void>;
  retryInitialization: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<DemoUser>;
  signUp: (input: {
    email: string;
    password: string;
    displayName: string;
    role: "fan" | "champion";
  }) => Promise<DemoUser>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function profileToDemoUser(profile: Profile): DemoUser {
  return {
    id: profile.id,
    email: profile.email,
    password: "",
    displayName: profile.display_name ?? profile.full_name ?? profile.email,
    role: profile.role,
    avatarUrl: profile.avatar_url,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [user, setUser] = useState<DemoUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [initializationError, setInitializationError] = useState<StartupError | null>(null);

  const loadProfile = useCallback(async (userId: string) => {
    const data = await withTimeout(
      getProfileById(userId),
      runtimeConfig.bootTimeoutMs,
      "profile.load",
    );
    setProfile(data);
    setUser(data ? profileToDemoUser(data) : null);
  }, []);

  const initialize = useCallback(async () => {
    setLoading(true);
    setInitializationError(null);
    try {
      if (runtimeConfig.isDemo) await ensureSeeded();
      const s = await withTimeout(
        auth.getSession(),
        runtimeConfig.bootTimeoutMs,
        "auth.getSession",
      );
      setSession(s);
      if (s?.user?.id) await loadProfile(s.user.id);
      else {
        setProfile(null);
        setUser(runtimeConfig.isDemo ? await demoUsers.current() : null);
      }
    } catch (error) {
      setSession(null);
      setProfile(null);
      setUser(null);
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
        else {
          setProfile(null);
          setUser(runtimeConfig.isDemo ? await demoUsers.current() : null);
        }
        setInitializationError(null);
      } catch (error) {
        setInitializationError(normalizeStartupError(error, "auth.stateChange"));
      }
    });
    return () => {
      mounted = false;
      off();
    };
  }, [initialize, loadProfile]);

  return (
    <AuthContext.Provider
      value={{
        session,
        profile,
        user,
        loading,
        initializationError,
        refresh: async () => {
          if (session?.user?.id) await loadProfile(session.user.id);
          else if (runtimeConfig.isDemo) setUser(await demoUsers.current());
        },
        retryInitialization: initialize,
        signIn: async (email, password) => {
          const nextSession = await auth.signIn(email, password);
          setSession(nextSession);
          if (nextSession?.user?.id) {
            await loadProfile(nextSession.user.id);
            if (runtimeConfig.isDemo) {
              const current = await demoUsers.current();
              if (current) return current;
            }
          }
          if (runtimeConfig.isDemo) {
            const current = await demoUsers.signIn(email, password);
            setUser(current);
            return current;
          }
          const fallback: DemoUser = {
            id: nextSession?.user?.id ?? "remote-user",
            email,
            password: "",
            displayName: nextSession?.user?.user_metadata?.display_name ?? email,
            role: nextSession?.user?.user_metadata?.role ?? "fan",
          };
          setUser(fallback);
          return fallback;
        },
        signUp: async ({ email, password, displayName, role }) => {
          const result = await auth.signUp({ email, password, displayName, role });
          setSession(result.session);
          if (result.session?.user?.id) await loadProfile(result.session.user.id);
          if (runtimeConfig.isDemo) {
            const current = await demoUsers.current();
            if (current) return current;
            const created = await demoUsers.create({ email, password, displayName, role });
            await demoUsers.signIn(email, password);
            setUser(created);
            return created;
          }
          const fallback: DemoUser = {
            id: result.user?.id ?? "remote-user",
            email,
            password: "",
            displayName,
            role,
          };
          setUser(fallback);
          return fallback;
        },
        signOut: async () => {
          await auth.signOut();
          setSession(null);
          setProfile(null);
          setUser(null);
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
