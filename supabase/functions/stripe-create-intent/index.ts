// =============================================================================
// Edge function: stripe-create-intent
// Creates a Stripe PaymentIntent for a pending booking and returns the
// client_secret so the mobile app can confirm the payment.
//
// Auth: requires a valid user JWT (fan who created the booking).
// Env:  STRIPE_SECRET_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// =============================================================================
// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@16.9.0?target=deno";
import {
  corsHeaders,
  errorResponse,
  jsonResponse,
  requireEnv,
} from "../_shared/env.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return errorResponse("method_not_allowed", 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return errorResponse("unauthorized", 401);

  const supabaseUrl = requireEnv("SUPABASE_URL");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const stripeSecret = requireEnv("STRIPE_SECRET_KEY");

  const stripe = new Stripe(stripeSecret, { apiVersion: "2024-06-20" });

  // Client bound to the user's JWT — obeys RLS
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) return errorResponse("unauthorized", 401);
  const userId = userData.user.id;

  let body: { booking_id?: string };
  try {
    body = await req.json();
  } catch {
    return errorResponse("invalid_json");
  }
  const bookingId = body.booking_id;
  if (!bookingId) return errorResponse("missing booking_id");

  // Service-role client to bypass RLS on payments table
  const admin = createClient(supabaseUrl, serviceRoleKey);

  const { data: booking, error: bErr } = await admin
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .single();
  if (bErr || !booking) return errorResponse("booking_not_found", 404);
  if (booking.fan_id !== userId) return errorResponse("forbidden", 403);
  if (booking.status !== "pending_payment")
    return errorResponse(`invalid_status_${booking.status}`);

  // Get or create Stripe customer
  const { data: profile } = await admin
    .from("profiles")
    .select("stripe_customer_id, email, display_name")
    .eq("id", userId)
    .single();
  let customerId = profile?.stripe_customer_id ?? null;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: profile?.email,
      name: profile?.display_name ?? undefined,
      metadata: { profile_id: userId },
    });
    customerId = customer.id;
    await admin
      .from("profiles")
      .update({ stripe_customer_id: customerId })
      .eq("id", userId);
  }

  // Create payment intent
  const intent = await stripe.paymentIntents.create({
    amount: booking.price_cents,
    currency: booking.currency.toLowerCase(),
    customer: customerId,
    metadata: {
      booking_id: bookingId,
      fan_id: userId,
      champion_id: booking.champion_id,
    },
    automatic_payment_methods: { enabled: true },
    application_fee_amount: booking.platform_fee_cents || undefined,
  });

  // Upsert payments row
  await admin.from("payments").upsert(
    {
      booking_id: bookingId,
      fan_id: userId,
      stripe_payment_intent_id: intent.id,
      amount_cents: booking.price_cents,
      platform_fee_cents: booking.platform_fee_cents,
      currency: booking.currency,
      status: intent.status,
    },
    { onConflict: "stripe_payment_intent_id" },
  );

  return jsonResponse({
    client_secret: intent.client_secret,
    payment_intent_id: intent.id,
  });
});
