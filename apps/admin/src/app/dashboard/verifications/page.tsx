import { supabaseServer } from "@/lib/supabase-server";
import { VerificationRow } from "./row";

export const dynamic = "force-dynamic";

export default async function VerificationsPage() {
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("vip_verifications")
    .select("*, profile:profiles(id, display_name, email)")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">VIP Verifications</h1>
      <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-800/60 text-slate-400 text-left">
            <tr>
              <th className="p-4">User</th>
              <th className="p-4">Status</th>
              <th className="p-4">Submitted</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((v: any) => (
              <VerificationRow key={v.id} v={v} />
            ))}
            {(data ?? []).length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-500">
                  No verifications yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
