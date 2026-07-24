// Small test scaffold to prove the shared package types compile.
// Run with `npm test` at the repo root.
import { describe, it, expect } from "vitest";
import type { Booking, ChampionListItem } from "../types";

describe("shared types", () => {
  it("has consistent Booking shape", () => {
    const b: Booking = {
      id: "b1",
      fan_id: "u1",
      champion_id: "c1",
      slot_id: "s1",
      scheduled_start: new Date().toISOString(),
      scheduled_end: new Date().toISOString(),
      duration_minutes: 15,
      price_cents: 4900,
      platform_fee_cents: 735,
      currency: "USD",
      status: "pending_payment",
      video_provider: null,
      video_room_id: null,
      video_room_url: null,
      fan_notes: null,
      cancellation_reason: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    expect(b.status).toBe("pending_payment");
  });

  it("ChampionListItem lists rate in cents", () => {
    const c: ChampionListItem = {
      profile_id: "c1",
      display_name: "Marta",
      avatar_url: null,
      headline: "Train like an Olympian",
      category: "athlete",
      hourly_rate_cents: 4900,
      currency: "USD",
      call_duration_minutes: 15,
      rating_average: 4.8,
      rating_count: 42,
      total_calls: 100,
      languages: ["en", "it"],
      birth_year: 1986,
      last_team: "Orlando Pride",
    };
    expect(c.hourly_rate_cents).toBeGreaterThan(0);
  });
});
