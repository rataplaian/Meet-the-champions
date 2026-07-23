// =============================================================================
// Auth context — exposes current session/profile to all screens.
// =============================================================================
import React, { createContext, useContext, useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase, auth } from "../services";
import type { Profile } from "@meet-champion/shared";

interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (userId: string) => {
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    setProfile((data ?? null) as Profile | null);
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      const s = await auth.getSession();
      if (!mounted) return;
      setSession(s);
      if (s?.user?.id) await loadProfile(s.user.id);
      setLoading(false);
    })();
    const off = auth.onAuthStateChange(async (s) => {
      setSession(s);
      if (s?.user?.id) await loadProfile(s.user.id);
      else setProfile(null);
    });
    return () => {
      mounted = false;
      off();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        profile,
        loading,
        refresh: async () => session?.user?.id && loadProfile(session.user.id),
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
