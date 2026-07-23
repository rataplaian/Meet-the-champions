// =============================================================================
// Video call provider interface — the booking system depends on THIS interface,
// never on a specific SDK. The server-side implementation lives in
// supabase/functions/video-token. On the client we only need to know the
// room URL + token; each provider ships its own React Native component.
// =============================================================================
import type { SupabaseClient } from "@supabase/supabase-js";

export interface VideoRoom {
  room_id: string;
  room_url: string;
  token: string;
  provider: "daily" | "agora" | "twilio" | string;
}

export interface VideoCallProvider {
  /** Ensures a room exists for the booking and returns a token for the caller. */
  getRoomForBooking(bookingId: string): Promise<VideoRoom>;
}

/** Default provider — talks to the `video-token` edge function. */
export function createVideoCallProvider(client: SupabaseClient): VideoCallProvider {
  return {
    async getRoomForBooking(bookingId) {
      const { data, error } = await client.functions.invoke("video-token", {
        body: { booking_id: bookingId },
      });
      if (error) throw error;
      return data as VideoRoom;
    },
  };
}
