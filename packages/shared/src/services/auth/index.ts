// =============================================================================
// Auth service — thin wrapper around supabase.auth.
// Business rules (e.g. role selection at signup) live here so both apps
// behave consistently.
// =============================================================================
import type { SupabaseClient, Session, User } from "@supabase/supabase-js";
import type { UserRole } from "../../types";

export interface SignUpInput {
  email: string;
  password: string;
  displayName: string;
  fullName?: string;
  role?: UserRole;   // 'fan' by default; 'champion' requires later VIP verification
}

export interface AuthService {
  signUp(input: SignUpInput): Promise<{ user: User | null; session: Session | null }>;
  signIn(email: string, password: string): Promise<Session | null>;
  signOut(): Promise<void>;
  getSession(): Promise<Session | null>;
  onAuthStateChange(cb: (session: Session | null) => void): () => void;
}

export function createAuthService(client: SupabaseClient): AuthService {
  return {
    async signUp({ email, password, displayName, fullName, role }) {
      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
            full_name: fullName ?? "",
            role: role ?? "fan",
          },
        },
      });
      if (error) throw error;
      return { user: data.user, session: data.session };
    },
    async signIn(email, password) {
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data.session;
    },
    async signOut() {
      const { error } = await client.auth.signOut();
      if (error) throw error;
    },
    async getSession() {
      const { data } = await client.auth.getSession();
      return data.session;
    },
    onAuthStateChange(cb) {
      const { data } = client.auth.onAuthStateChange((_e, session) => cb(session));
      return () => data.subscription.unsubscribe();
    },
  };
}

export const AUTH_SERVICE_INTERFACE = "AuthService@1.0";
