"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function SignInPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    params.get("error") === "not_admin" ? "You are not an admin." : null,
  );

  const supabase = supabaseBrowser();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return setError(error.message);
    router.replace("/dashboard");
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-xl bg-slate-900 p-8 shadow-xl border border-slate-800">
        <h1 className="text-2xl font-bold text-brand mb-2">Meet Champion · Admin</h1>
        <p className="text-slate-400 text-sm mb-6">Sign in with an admin account.</p>

        <label className="text-sm text-slate-400 mb-1 block">Email</label>
        <input
          data-testid="admin-signin-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 mb-4 focus:outline-none focus:border-brand"
        />

        <label className="text-sm text-slate-400 mb-1 block">Password</label>
        <input
          data-testid="admin-signin-password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 mb-4 focus:outline-none focus:border-brand"
        />

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        <button
          data-testid="admin-signin-submit"
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-brand hover:bg-brand-dark text-slate-900 font-bold py-2 disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
