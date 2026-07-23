// =============================================================================
// Notifications service — combines in-app records (public.notifications) with
// a pluggable push transport. Push is disabled by default; the mobile app
// wires it in via Expo Push Notifications.
// =============================================================================
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Notification } from "../../types";

export interface PushTransport {
  register(userId: string, expoPushToken: string): Promise<void>;
}

export interface NotificationsService {
  list(): Promise<Notification[]>;
  markRead(id: string): Promise<void>;
  markAllRead(): Promise<void>;
  registerPushToken(token: string): Promise<void>;
}

export function createNotificationsService(client: SupabaseClient): NotificationsService {
  return {
    async list() {
      const { data, error } = await client
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as Notification[];
    },
    async markRead(id) {
      const { error } = await client
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    async markAllRead() {
      const { data: userData } = await client.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("unauthenticated");
      const { error } = await client
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("profile_id", uid)
        .is("read_at", null);
      if (error) throw error;
    },
    async registerPushToken(token) {
      const { data: userData } = await client.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("unauthenticated");
      const { error } = await client
        .from("profiles")
        .update({ push_token: token })
        .eq("id", uid);
      if (error) throw error;
    },
  };
}
