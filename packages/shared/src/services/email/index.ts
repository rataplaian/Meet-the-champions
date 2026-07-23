// =============================================================================
// Email service — client-side shim that invokes the `send-email` edge fn.
// Server picks the actual provider (Resend / SendGrid / SMTP).
// =============================================================================
import type { SupabaseClient } from "@supabase/supabase-js";

export interface EmailPayload {
  to: string | string[];
  subject?: string;
  html?: string;
  text?: string;
  template?: string;
  template_data?: Record<string, unknown>;
}

export interface EmailService {
  send(payload: EmailPayload): Promise<{ id: string }>;
}

export function createEmailService(client: SupabaseClient): EmailService {
  return {
    async send(payload) {
      const { data, error } = await client.functions.invoke("send-email", { body: payload });
      if (error) throw error;
      return data as { id: string };
    },
  };
}
