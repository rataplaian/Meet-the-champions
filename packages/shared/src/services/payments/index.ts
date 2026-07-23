// =============================================================================
// Payments service — thin wrapper around the stripe-create-intent edge fn.
// The actual Stripe integration is a server-side detail: the client only ever
// receives a `client_secret` and confirms the intent via @stripe/stripe-react-native
// (mobile) or @stripe/stripe-js (admin/browser).
// =============================================================================
import type { SupabaseClient } from "@supabase/supabase-js";

export interface CreateIntentResult {
  client_secret: string;
  payment_intent_id: string;
}

export interface PaymentsService {
  createIntent(bookingId: string): Promise<CreateIntentResult>;
}

export function createPaymentsService(client: SupabaseClient): PaymentsService {
  return {
    async createIntent(bookingId) {
      const { data, error } = await client.functions.invoke("stripe-create-intent", {
        body: { booking_id: bookingId },
      });
      if (error) throw error;
      return data as CreateIntentResult;
    },
  };
}
