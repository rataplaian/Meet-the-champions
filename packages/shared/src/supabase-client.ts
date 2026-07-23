// =============================================================================
// Supabase client factory — used by both apps/mobile and apps/admin.
// Each app passes its own env-derived URL + anon key.
// =============================================================================
import { createClient, SupabaseClient } from "@supabase/supabase-js";

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  /** Optional custom storage adapter (used on mobile to persist auth). */
  authStorage?: {
    getItem: (key: string) => Promise<string | null> | string | null;
    setItem: (key: string, value: string) => Promise<void> | void;
    removeItem: (key: string) => Promise<void> | void;
  };
  /** Whether the client should auto-refresh & persist sessions. */
  persistSession?: boolean;
}

export function createSupabaseClient(config: SupabaseConfig): SupabaseClient {
  return createClient(config.url, config.anonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: config.persistSession ?? true,
      detectSessionInUrl: true,
      storage: config.authStorage as never, // supabase-js accepts any storage-like
    },
  });
}
