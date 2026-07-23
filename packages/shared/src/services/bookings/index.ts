// =============================================================================
// Bookings service — thin API over the SQL RPC functions.
// The core transactional logic lives in Postgres (see migrations/*_rpc.sql)
// so it is impossible to bypass by editing client code.
// =============================================================================
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Booking } from "../../types";

export interface BookingsService {
  create(input: { championId: string; slotId: string; fanNotes?: string }): Promise<Booking>;
  cancel(bookingId: string, reason?: string): Promise<Booking>;
  getMy(role: "fan" | "champion"): Promise<Booking[]>;
  getById(bookingId: string): Promise<Booking | null>;
  review(bookingId: string, rating: number, comment?: string): Promise<void>;
}

export function createBookingsService(client: SupabaseClient): BookingsService {
  return {
    async create({ championId, slotId, fanNotes }) {
      const { data, error } = await client.rpc("create_booking", {
        p_champion_id: championId,
        p_slot_id: slotId,
        p_fan_notes: fanNotes ?? null,
      });
      if (error) throw error;
      return data as Booking;
    },

    async cancel(bookingId, reason) {
      const { data, error } = await client.rpc("cancel_booking", {
        p_booking_id: bookingId,
        p_reason: reason ?? null,
      });
      if (error) throw error;
      return data as Booking;
    },

    async getMy(role) {
      const { data: userData } = await client.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("unauthenticated");
      const column = role === "fan" ? "fan_id" : "champion_id";
      const { data, error } = await client
        .from("bookings")
        .select("*")
        .eq(column, uid)
        .order("scheduled_start", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Booking[];
    },

    async getById(bookingId) {
      const { data, error } = await client
        .from("bookings")
        .select("*")
        .eq("id", bookingId)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as Booking | null;
    },

    async review(bookingId, rating, comment) {
      const { data: booking } = await client
        .from("bookings").select("champion_id, fan_id").eq("id", bookingId).single();
      if (!booking) throw new Error("booking_not_found");
      const { error } = await client.from("reviews").insert({
        booking_id: bookingId,
        fan_id: booking.fan_id,
        champion_id: booking.champion_id,
        rating,
        comment: comment ?? null,
      });
      if (error) throw error;
    },
  };
}
