// =============================================================================
// Edge function: video-token
// Creates a video room + short-lived participant token for a confirmed booking.
// Provider is selected by the VIDEO_PROVIDER env var and dispatched through
// a simple adapter map. Add new providers here without touching booking code.
//
// Env (Daily):    VIDEO_PROVIDER=daily,   DAILY_API_KEY, DAILY_DOMAIN
// Env (Agora):    VIDEO_PROVIDER=agora,   AGORA_APP_ID, AGORA_APP_CERTIFICATE
// Env (Twilio):   VIDEO_PROVIDER=twilio,  TWILIO_ACCOUNT_SID, TWILIO_API_KEY_SID,
//                                         TWILIO_API_KEY_SECRET
// =============================================================================
// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders, errorResponse, jsonResponse, requireEnv } from "../_shared/env.ts";

interface VideoRoomToken {
  room_id: string;
  room_url: string;
  token: string;
  provider: string;
}

interface VideoProviderAdapter {
  createRoomAndToken(bookingId: string, userId: string, isChampion: boolean): Promise<VideoRoomToken>;
}

// -----------------------------------------------------------------------------
// Daily.co adapter — https://docs.daily.co/reference
// -----------------------------------------------------------------------------
const dailyAdapter: VideoProviderAdapter = {
  async createRoomAndToken(bookingId, userId, isChampion) {
    const apiKey = requireEnv("DAILY_API_KEY");
    const domain = requireEnv("DAILY_DOMAIN");
    const roomName = `mc-${bookingId.slice(0, 8)}`;

    // 1. Ensure room exists (idempotent)
    let room = await fetch(`https://api.daily.co/v1/rooms/${roomName}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (room.status === 404) {
      room = await fetch("https://api.daily.co/v1/rooms", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          name: roomName,
          privacy: "private",
          properties: {
            exp: Math.floor(Date.now() / 1000) + 60 * 60 * 4, // 4h expiry
            enable_chat: true,
            enable_screenshare: true,
          },
        }),
      });
    }
    if (!room.ok) throw new Error(`daily_room_error_${room.status}`);

    // 2. Create a meeting token
    const tokenRes = await fetch("https://api.daily.co/v1/meeting-tokens", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        properties: {
          room_name: roomName,
          user_id: userId,
          is_owner: isChampion,
          exp: Math.floor(Date.now() / 1000) + 60 * 60,
        },
      }),
    });
    if (!tokenRes.ok) throw new Error(`daily_token_error_${tokenRes.status}`);
    const tokenBody = await tokenRes.json();

    return {
      room_id: roomName,
      room_url: `https://${domain}/${roomName}`,
      token: tokenBody.token,
      provider: "daily",
    };
  },
};

// Stubs for Agora / Twilio adapters — implement when needed. Their SDKs
// generate tokens on the server without HTTP calls, so no network hit here.
const agoraAdapter: VideoProviderAdapter = {
  createRoomAndToken() {
    throw new Error("agora_adapter_not_implemented");
  },
};
const twilioAdapter: VideoProviderAdapter = {
  createRoomAndToken() {
    throw new Error("twilio_adapter_not_implemented");
  },
};

const adapters: Record<string, VideoProviderAdapter> = {
  daily: dailyAdapter,
  agora: agoraAdapter,
  twilio: twilioAdapter,
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return errorResponse("method_not_allowed", 405);

  const auth = req.headers.get("Authorization");
  if (!auth) return errorResponse("unauthorized", 401);

  const supabaseUrl = requireEnv("SUPABASE_URL");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const provider = (Deno.env.get("VIDEO_PROVIDER") ?? "daily").toLowerCase();

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    global: { headers: { Authorization: auth } },
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
  if (!body.booking_id) return errorResponse("missing_booking_id");

  const admin = createClient(supabaseUrl, serviceRoleKey);
  const { data: booking, error: bErr } = await admin
    .from("bookings")
    .select("*")
    .eq("id", body.booking_id)
    .single();
  if (bErr || !booking) return errorResponse("booking_not_found", 404);
  if (booking.fan_id !== userId && booking.champion_id !== userId)
    return errorResponse("forbidden", 403);
  if (!["confirmed", "in_progress"].includes(booking.status))
    return errorResponse(`invalid_status_${booking.status}`);

  const adapter = adapters[provider];
  if (!adapter) return errorResponse(`unsupported_provider_${provider}`);

  const isChampion = booking.champion_id === userId;
  const result = await adapter.createRoomAndToken(booking.id, userId, isChampion);

  // Persist first time
  if (!booking.video_room_id) {
    await admin.from("bookings")
      .update({
        video_provider: result.provider,
        video_room_id: result.room_id,
        video_room_url: result.room_url,
        status: "in_progress",
      })
      .eq("id", booking.id);
  }

  return jsonResponse(result);
});
