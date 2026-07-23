// =============================================================================
// Edge function: stripe-webhook
// Handles Stripe events (payment succeeded/failed) and updates bookings.
// Set the endpoint in Stripe dashboard to:
//   https://<project-ref>.supabase.co/functions/v1/stripe-webhook
// Env: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET,
//      SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// =============================================================================
// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@16.9.0?target=deno";
import { errorResponse, jsonResponse, requireEnv } from "../_shared/env.ts";

serve(async (req) => {
  if (req.method !== "POST") return errorResponse("method_not_allowed", 405);

  const stripeSecret = requireEnv("STRIPE_SECRET_KEY");
  const webhookSecret = requireEnv("STRIPE_WEBHOOK_SECRET");
  const supabaseUrl = requireEnv("SUPABASE_URL");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

  const stripe = new Stripe(stripeSecret, { apiVersion: "2024-06-20" });
  const admin = createClient(supabaseUrl, serviceRoleKey);

  const signature = req.headers.get("stripe-signature");
  if (!signature) return errorResponse("missing_signature", 400);

  const rawBody = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);
  } catch (err) {
    return errorResponse(`invalid_signature: ${(err as Error).message}`, 400);
  }

  const bookingId = (event.data.object as any)?.metadata?.booking_id as string | undefined;

  switch (event.type) {
    case "payment_intent.succeeded": {
      const pi = event.data.object as Stripe.PaymentIntent;
      await admin
        .from("payments")
        .update({
          status: "succeeded",
          stripe_charge_id: pi.latest_charge as string,
          raw_stripe_event: event as unknown as Record<string, unknown>,
        })
        .eq("stripe_payment_intent_id", pi.id);

      if (bookingId) {
        await admin.from("bookings")
          .update({ status: "confirmed" })
          .eq("id", bookingId);

        // Insert notification for both fan and champion
        const { data: booking } = await admin
          .from("bookings").select("fan_id, champion_id, scheduled_start").eq("id", bookingId).single();
        if (booking) {
          await admin.from("notifications").insert([
            {
              profile_id: booking.fan_id,
              type: "booking_confirmed",
              title: "Booking confirmed",
              body: "Your call is confirmed. See you soon!",
              data: { booking_id: bookingId },
            },
            {
              profile_id: booking.champion_id,
              type: "booking_received",
              title: "New booking",
              body: "You have a new confirmed booking.",
              data: { booking_id: bookingId },
            },
          ]);
        }
      }
      break;
    }
    case "payment_intent.payment_failed":
    case "payment_intent.canceled": {
      const pi = event.data.object as Stripe.PaymentIntent;
      await admin.from("payments")
        .update({ status: event.type === "payment_intent.canceled" ? "canceled" : "failed",
                  raw_stripe_event: event as unknown as Record<string, unknown> })
        .eq("stripe_payment_intent_id", pi.id);

      if (bookingId) {
        const { data: booking } = await admin
          .from("bookings").select("slot_id").eq("id", bookingId).single();
        if (booking?.slot_id) {
          await admin.from("availability_slots")
            .update({ is_booked: false }).eq("id", booking.slot_id);
        }
        await admin.from("bookings")
          .update({ status: "cancelled", cancellation_reason: "payment_failed" })
          .eq("id", bookingId);
      }
      break;
    }
    case "charge.refunded": {
      const charge = event.data.object as Stripe.Charge;
      const pi = charge.payment_intent as string;
      await admin.from("payments")
        .update({ status: "refunded",
                  raw_stripe_event: event as unknown as Record<string, unknown> })
        .eq("stripe_payment_intent_id", pi);
      if (bookingId) {
        await admin.from("bookings").update({ status: "refunded" }).eq("id", bookingId);
      }
      break;
    }
    default:
      // Unhandled event — acknowledge to stop retries
      break;
  }

  return jsonResponse({ received: true });
});
