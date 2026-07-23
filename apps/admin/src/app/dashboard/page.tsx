import { supabaseServer } from "@/lib/supabase-server";

async function stats() {
  const supabase = await supabaseServer();
  const [{ count: fansCount }, { count: championsCount }, { count: pendingVips }, { count: bookingsCount }, { data: revRows }] =
    await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "fan"),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "champion"),
      supabase.from("vip_verifications").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("bookings").select("*", { count: "exact", head: true }),
      supabase.from("payments").select("amount_cents").eq("status", "succeeded"),
    ]);
  const revenue = (revRows ?? []).reduce((s, r: any) => s + (r.amount_cents ?? 0), 0);
  return { fansCount: fansCount ?? 0, championsCount: championsCount ?? 0, pendingVips: pendingVips ?? 0, bookingsCount: bookingsCount ?? 0, revenue };
}

export default async function DashboardHome() {
  const s = await stats();
  const cards = [
    { label: "Fans", value: s.fansCount },
    { label: "Champions", value: s.championsCount },
    { label: "Pending VIPs", value: s.pendingVips, highlight: true },
    { label: "Bookings", value: s.bookingsCount },
    { label: "Gross revenue", value: `$${(s.revenue / 100).toFixed(2)}` },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className={`rounded-xl border p-6 ${c.highlight ? "border-brand bg-brand/10" : "border-slate-800 bg-slate-900"}`}
          >
            <div className="text-slate-400 text-sm">{c.label}</div>
            <div className="text-3xl font-bold mt-2">{c.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
