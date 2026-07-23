// Server-side Supabase client with cookie-based session persistence for the
// Next.js App Router. Uses @supabase/ssr.
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function supabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(url, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from Server Component in some contexts — safe to ignore.
        }
      },
    },
  });
}

/** Service-role client for admin-only operations (bypasses RLS). Use only in server actions. */
export function supabaseAdmin() {
  return createClient(url, serviceRole, { auth: { persistSession: false } });
}
