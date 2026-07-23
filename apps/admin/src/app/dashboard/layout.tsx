import { redirect } from "next/navigation";
import Link from "next/link";
import { supabaseServer } from "@/lib/supabase-server";

async function requireAdmin() {
  const supabase = await supabaseServer();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/sign-in");
  const { data: profile } = await supabase
    .from("profiles").select("role, display_name").eq("id", userData.user.id).maybeSingle();
  if (profile?.role !== "admin") redirect("/sign-in?error=not_admin");
  return { supabase, user: userData.user, profile };
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireAdmin();
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-slate-900 border-r border-slate-800 p-6">
        <h2 className="text-brand font-bold text-lg mb-8">Meet Champion</h2>
        <nav className="flex flex-col gap-2 text-sm">
          <Link className="hover:text-brand" href="/dashboard">Dashboard</Link>
          <Link className="hover:text-brand" href="/dashboard/verifications">VIP Verifications</Link>
          <Link className="hover:text-brand" href="/dashboard/champions">Champions</Link>
          <Link className="hover:text-brand" href="/dashboard/bookings">Bookings</Link>
          <Link className="hover:text-brand" href="/dashboard/payments">Payments</Link>
        </nav>
        <div className="mt-10 text-slate-500 text-xs">
          Logged in as<br />
          <span className="text-slate-200">{profile?.display_name}</span>
        </div>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
