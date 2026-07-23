// =============================================================================
// Champions service — queries champion catalog and profiles.
// =============================================================================
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AvailabilitySlot, ChampionListItem, ChampionProfile, Profile } from "../../types";

export interface ChampionsService {
  list(opts?: { category?: string; limit?: number; offset?: number }): Promise<ChampionListItem[]>;
  getById(profileId: string): Promise<(ChampionProfile & { profile: Profile }) | null>;
  availableSlots(championId: string): Promise<AvailabilitySlot[]>;
  upsertMyChampionProfile(input: Partial<ChampionProfile>): Promise<ChampionProfile>;
  addAvailability(startsAt: string, endsAt: string): Promise<AvailabilitySlot>;
  deleteAvailability(slotId: string): Promise<void>;
}

export function createChampionsService(client: SupabaseClient): ChampionsService {
  return {
    async list({ category, limit = 20, offset = 0 } = {}) {
      const { data, error } = await client.rpc("list_champions", {
        p_category: category ?? null,
        p_limit: limit,
        p_offset: offset,
      });
      if (error) throw error;
      return (data ?? []) as ChampionListItem[];
    },

    async getById(profileId) {
      const { data, error } = await client
        .from("champion_profiles")
        .select("*, profile:profiles(*)")
        .eq("profile_id", profileId)
        .maybeSingle();
      if (error) throw error;
      return (data as any) ?? null;
    },

    async availableSlots(championId) {
      const { data, error } = await client
        .from("availability_slots")
        .select("*")
        .eq("champion_id", championId)
        .eq("is_booked", false)
        .gt("starts_at", new Date().toISOString())
        .order("starts_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as AvailabilitySlot[];
    },

    async upsertMyChampionProfile(input) {
      const { data: userData } = await client.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("unauthenticated");
      const { data, error } = await client
        .from("champion_profiles")
        .upsert({ ...input, profile_id: uid })
        .select("*")
        .single();
      if (error) throw error;
      return data as ChampionProfile;
    },

    async addAvailability(startsAt, endsAt) {
      const { data: userData } = await client.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("unauthenticated");
      const { data, error } = await client
        .from("availability_slots")
        .insert({ champion_id: uid, starts_at: startsAt, ends_at: endsAt })
        .select("*")
        .single();
      if (error) throw error;
      return data as AvailabilitySlot;
    },

    async deleteAvailability(slotId) {
      const { error } = await client.from("availability_slots").delete().eq("id", slotId);
      if (error) throw error;
    },
  };
}
