import { supabaseServer } from "@/lib/supabase-server";
import dayjs from "dayjs";

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("payments")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Payments</h1>
      <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-800/60 text-slate-400 text-left">
            <tr>
              <th className="p-4">Created</th>
              <th className="p-4">Amount</th>
              <th className="p-4">Fee</th>
              <th className="p-4">Currency</th>
              <th className="p-4">Status</th>
              <th className="p-4">Stripe PI</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((p: any) => (
              <tr key={p.id} className="border-t border-slate-800">
                <td className="p-4">{dayjs(p.created_at).format("MMM D · HH:mm")}</td>
                <td className="p-4">${(p.amount_cents / 100).toFixed(2)}</td>
                <td className="p-4">${(p.platform_fee_cents / 100).toFixed(2)}</td>
                <td className="p-4 uppercase">{p.currency}</td>
                <td className="p-4 capitalize">{p.status.replace(/_/g, " ")}</td>
                <td className="p-4 font-mono text-xs">{p.stripe_payment_intent_id ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
