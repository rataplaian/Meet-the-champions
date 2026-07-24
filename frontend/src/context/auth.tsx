import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { users as usersStore, User, ensureSeeded } from "../store";

interface AuthCtx {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<User>;
  signUp: (input: {
    email: string;
    password: string;
    displayName: string;
    role: "fan" | "champion";
  }) => Promise<User>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const u = await usersStore.current();
    setUser(u);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await ensureSeeded();
        await refresh();
      } catch {
        /* even on catastrophic seed failure we must let the UI mount */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    // Absolute safety net: never leave `loading:true` for more than 5s.
    const kill = setTimeout(() => { if (!cancelled) setLoading(false); }, 5000);
    return () => { cancelled = true; clearTimeout(kill); };
  }, [refresh]);

  const signIn = async (email: string, password: string) => {
    const u = await usersStore.signIn(email, password);
    setUser(u);
    return u;
  };

  const signUp = async ({ email, password, displayName, role }: {
    email: string; password: string; displayName: string; role: "fan" | "champion";
  }) => {
    const u = await usersStore.create({ email, password, displayName, role });
    const signed = await usersStore.signIn(email, password);
    setUser(signed);
    return u;
  };

  const signOut = async () => {
    await usersStore.signOut();
    setUser(null);
  };

  return (
    <Ctx.Provider value={{ user, loading, signIn, signUp, signOut, refresh }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth(): AuthCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth requires AuthProvider");
  return c;
}
