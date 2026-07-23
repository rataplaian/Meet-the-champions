// =============================================================================
// Edge function: send-email
// Provider-agnostic email sender. Selects provider via EMAIL_PROVIDER env.
//
// Body: { to: string | string[], subject: string, html?: string, text?: string,
//         template?: 'booking_confirmed' | 'vip_approved' | ...,
//         template_data?: Record<string, unknown> }
// =============================================================================
// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, errorResponse, jsonResponse, requireEnv } from "../_shared/env.ts";

interface EmailAdapter {
  send(payload: {
    to: string[];
    from: string;
    subject: string;
    html: string;
    text?: string;
  }): Promise<{ id: string }>;
}

// -----------------------------------------------------------------------------
// Resend adapter — https://resend.com/docs
// -----------------------------------------------------------------------------
const resendAdapter: EmailAdapter = {
  async send({ to, from, subject, html, text }) {
    const apiKey = requireEnv("RESEND_API_KEY");
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, html, text }),
    });
    if (!res.ok) throw new Error(`resend_error_${res.status}_${await res.text()}`);
    const body = await res.json();
    return { id: body.id };
  },
};

const sendgridAdapter: EmailAdapter = {
  async send() {
    throw new Error("sendgrid_adapter_not_implemented");
  },
};

const adapters: Record<string, EmailAdapter> = {
  resend: resendAdapter,
  sendgrid: sendgridAdapter,
};

// -----------------------------------------------------------------------------
// Minimal template registry. Extend with more templates as needed. Keeping
// templates as tiny inline HTML strings avoids pulling a heavy template engine
// into the edge runtime; for anything richer, move to MJML compiled at build.
// -----------------------------------------------------------------------------
function renderTemplate(name: string, data: Record<string, unknown>): { subject: string; html: string; text: string } {
  switch (name) {
    case "booking_confirmed":
      return {
        subject: "Your Meet Champion call is confirmed",
        html: `<h2>See you soon!</h2><p>Your call with <b>${data.champion_name ?? ''}</b> is confirmed for <b>${data.when ?? ''}</b>.</p>`,
        text: `Your call with ${data.champion_name ?? ''} is confirmed for ${data.when ?? ''}.`,
      };
    case "vip_approved":
      return {
        subject: "You are a verified Champion",
        html: `<h2>Welcome, Champion!</h2><p>Your VIP verification was approved. You can start receiving bookings now.</p>`,
        text: `Your VIP verification was approved. You can start receiving bookings now.`,
      };
    default:
      return { subject: "Meet Champion", html: "", text: "" };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return errorResponse("method_not_allowed", 405);

  const provider = (Deno.env.get("EMAIL_PROVIDER") ?? "resend").toLowerCase();
  const from = Deno.env.get("EMAIL_FROM") ?? "Meet Champion <noreply@example.com>";

  const adapter = adapters[provider];
  if (!adapter) return errorResponse(`unsupported_email_provider_${provider}`);

  let body: any;
  try { body = await req.json(); } catch { return errorResponse("invalid_json"); }

  const to: string[] = Array.isArray(body.to) ? body.to : [body.to];
  let { subject, html, text } = body;

  if (body.template) {
    const rendered = renderTemplate(body.template, body.template_data ?? {});
    subject = subject ?? rendered.subject;
    html = html ?? rendered.html;
    text = text ?? rendered.text;
  }
  if (!subject || (!html && !text)) return errorResponse("missing_content");

  const result = await adapter.send({ to, from, subject, html: html ?? "", text });
  return jsonResponse({ id: result.id });
});
