import { supabaseServer } from "@/lib/supabase-server";
import dayjs from "dayjs";

export const dynamic = "force-dynamic";

export default async function BookingsPage() {
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("bookings")
    .select("*, fan:profiles!bookings_fan_id_fkey(display_name), champion:profiles!bookings_champion_id_fkey(display_name)")
    .order("scheduled_start", { ascending: false })
    .limit(200);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Bookings</h1>
      <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-800/60 text-slate-400 text-left">
            <tr>
              <th className="p-4">When</th>
              <th className="p-4">Fan</th>
              <th className="p-4">Champion</th>
              <th className="p-4">Amount</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((b: any) => (
              <tr key={b.id} className="border-t border-slate-800">
                <td className="p-4">{dayjs(b.scheduled_start).format("MMM D · HH:mm")}</td>
                <td className="p-4">{b.fan?.display_name ?? "—"}</td>
                <td className="p-4">{b.champion?.display_name ?? "—"}</td>
                <td className="p-4">${(b.price_cents / 100).toFixed(2)}</td>
                <td className="p-4 capitalize">{b.status.replace(/_/g, " ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
