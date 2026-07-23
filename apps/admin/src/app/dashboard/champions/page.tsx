import { supabaseServer } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function ChampionsPage() {
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("champion_profiles")
    .select("*, profile:profiles(id, display_name, email, is_active)")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Champions</h1>
      <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-800/60 text-slate-400 text-left">
            <tr>
              <th className="p-4">Name</th>
              <th className="p-4">Category</th>
              <th className="p-4">Rate</th>
              <th className="p-4">Verification</th>
              <th className="p-4">Calls</th>
              <th className="p-4">Rating</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((c: any) => (
              <tr key={c.profile_id} className="border-t border-slate-800">
                <td className="p-4">
                  <div className="font-medium">{c.profile?.display_name}</div>
                  <div className="text-slate-500 text-xs">{c.profile?.email}</div>
                </td>
                <td className="p-4 capitalize">{c.category}</td>
                <td className="p-4">${(c.hourly_rate_cents / 100).toFixed(2)}</td>
                <td className="p-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs uppercase ${
                      c.verification_status === "approved" ? "bg-green-800 text-green-100"
                      : c.verification_status === "rejected" ? "bg-red-800 text-red-100"
                      : "bg-slate-700 text-slate-200"}`}
                  >
                    {c.verification_status}
                  </span>
                </td>
                <td className="p-4">{c.total_calls}</td>
                <td className="p-4">{c.rating_average ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
