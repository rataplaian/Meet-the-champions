// =============================================================================
// Edge function: admin-verify-vip
// Approve or reject a VIP verification submission. Admin-only.
// Body: { verification_id: string, decision: 'approved'|'rejected', notes?: string }
// =============================================================================
// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders, errorResponse, jsonResponse, requireEnv } from "../_shared/env.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return errorResponse("method_not_allowed", 405);

  const auth = req.headers.get("Authorization");
  if (!auth) return errorResponse("unauthorized", 401);

  const supabaseUrl = requireEnv("SUPABASE_URL");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    global: { headers: { Authorization: auth } },
  });
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return errorResponse("unauthorized", 401);

  const admin = createClient(supabaseUrl, serviceRoleKey);
  const { data: profile } = await admin.from("profiles")
    .select("role").eq("id", userData.user.id).single();
  if (profile?.role !== "admin") return errorResponse("forbidden", 403);

  let body: any;
  try { body = await req.json(); } catch { return errorResponse("invalid_json"); }
  const { verification_id, decision, notes } = body;
  if (!verification_id || !["approved", "rejected"].includes(decision))
    return errorResponse("invalid_body");

  const { data: verification, error: vErr } = await admin.from("vip_verifications")
    .update({
      status: decision,
      reviewed_by: userData.user.id,
      review_notes: notes ?? null,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", verification_id)
    .select("*")
    .single();
  if (vErr || !verification) return errorResponse("verification_not_found", 404);

  await admin.from("champion_profiles").update({
    verification_status: decision,
    verification_notes: notes ?? null,
    verified_at: decision === "approved" ? new Date().toISOString() : null,
    verified_by: userData.user.id,
  }).eq("profile_id", verification.profile_id);

  await admin.from("audit_log").insert({
    actor_id: userData.user.id,
    action: `vip.${decision}`,
    entity_type: "vip_verification",
    entity_id: verification_id,
    metadata: { notes },
  });

  await admin.from("notifications").insert({
    profile_id: verification.profile_id,
    type: decision === "approved" ? "vip_approved" : "vip_rejected",
    title: decision === "approved" ? "You are verified!" : "VIP verification update",
    body: notes ?? (decision === "approved"
      ? "You can now start receiving bookings."
      : "Please review the notes and resubmit."),
  });

  return jsonResponse({ ok: true, verification });
});
