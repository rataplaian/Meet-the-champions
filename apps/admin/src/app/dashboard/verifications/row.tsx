"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";
import dayjs from "dayjs";

export function VerificationRow({ v }: { v: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState<null | "approved" | "rejected">(null);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  const decide = async (decision: "approved" | "rejected") => {
    setLoading(decision);
    setError(null);
    const supabase = supabaseBrowser();
    const { error } = await supabase.functions.invoke("admin-verify-vip", {
      body: { verification_id: v.id, decision, notes },
    });
    setLoading(null);
    if (error) return setError(error.message);
    router.refresh();
  };

  return (
    <tr className="border-t border-slate-800 align-top">
      <td className="p-4">
        <div className="font-medium">{v.profile?.display_name ?? "—"}</div>
        <div className="text-slate-500 text-xs">{v.profile?.email}</div>
      </td>
      <td className="p-4">
        <span
          data-testid={`verification-status-${v.id}`}
          className={`px-2 py-1 rounded-full text-xs uppercase ${
            v.status === "approved" ? "bg-green-800 text-green-100"
            : v.status === "rejected" ? "bg-red-800 text-red-100"
            : "bg-slate-700 text-slate-200"}`}
        >
          {v.status}
        </span>
      </td>
      <td className="p-4 text-slate-400">
        {dayjs(v.created_at).format("MMM D, HH:mm")}
      </td>
      <td className="p-4">
        {v.status === "pending" ? (
          <div className="flex flex-col gap-2 items-end">
            <textarea
              placeholder="Review notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-64 rounded bg-slate-800 border border-slate-700 p-2 text-xs"
              rows={2}
            />
            <div className="flex gap-2">
              <button
                data-testid={`verification-reject-${v.id}`}
                onClick={() => decide("rejected")}
                disabled={loading !== null}
                className="px-3 py-1 rounded bg-red-700 hover:bg-red-600 text-white text-xs"
              >
                {loading === "rejected" ? "…" : "Reject"}
              </button>
              <button
                data-testid={`verification-approve-${v.id}`}
                onClick={() => decide("approved")}
                disabled={loading !== null}
                className="px-3 py-1 rounded bg-green-700 hover:bg-green-600 text-white text-xs"
              >
                {loading === "approved" ? "…" : "Approve"}
              </button>
            </div>
            {error && <span className="text-red-400 text-xs">{error}</span>}
          </div>
        ) : (
          <span className="text-slate-500 text-xs">—</span>
        )}
      </td>
    </tr>
  );
}
