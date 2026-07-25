// =============================================================================
// Central client singleton for the mobile app.
// Uses SecureStore (native) / AsyncStorage (web) to persist auth session.
// =============================================================================
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import "react-native-url-polyfill/auto";
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  type AuthService,
  type BookingsService,
  type ChampionsService,
  type EmailService,
  type NotificationsService,
  type PaymentsService,
  type Profile,
  type StorageService,
  type VideoCallProvider,
  createAuthService,
  createBookingsService,
  createChampionsService,
  createEmailService,
  createNotificationsService,
  createPaymentsService,
  createStorageService,
  createSupabaseClient,
  createVideoCallProvider,
} from "@meet-champion/shared";
import { runtimeConfig } from "../config";
import {
  demoAuth,
  demoBookings,
  demoChampions,
  demoEmail,
  demoNotifications,
  demoPayments,
  demoStorage,
  demoVideo,
  getDemoProfileByIdAsync,
  updateDemoProfileById,
} from "./demo";

const extra = Constants.expoConfig?.extra ?? {};

const url =
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? (extra.supabaseUrl as string);
const anonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? (extra.supabaseAnonKey as string);

if (!runtimeConfig.isValid && runtimeConfig.diagnosticsEnabled) {
  console.warn(
    `[meet-champion] Missing mobile configuration for ${runtimeConfig.mode}: ${runtimeConfig.missing.join(", ")}`,
  );
}

const nativeStorage = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

const authStorage = Platform.OS === "web" ? AsyncStorage : nativeStorage;

function configError() {
  return new Error(
    `Missing ${runtimeConfig.missing.join(", ")} for ${runtimeConfig.mode} mode. Set EXPO_PUBLIC_APP_MODE=demo to preview without backend credentials.`,
  );
}

function unavailable<T extends object>(name: string): T {
  return new Proxy(
    {},
    {
      get() {
        throw new Error(`${name} is unavailable. ${configError().message}`);
      },
    },
  ) as T;
}

function createConfiguredSupabase() {
  if (runtimeConfig.isDemo || !runtimeConfig.isValid) return null;
  return createSupabaseClient({
    url: url ?? "",
    anonKey: anonKey ?? "",
    authStorage,
  });
}

export const supabase: SupabaseClient | null = createConfiguredSupabase();
export const backendReady = Boolean(supabase);
export { runtimeConfig };

export const auth: AuthService = runtimeConfig.isDemo
  ? demoAuth
  : supabase
    ? createAuthService(supabase)
    : {
        async signUp() {
          throw configError();
        },
        async signIn() {
          throw configError();
        },
        async signOut() {},
        async getSession() {
          throw configError();
        },
        onAuthStateChange() {
          return () => {};
        },
      };

export const champions: ChampionsService = runtimeConfig.isDemo
  ? demoChampions
  : supabase
    ? createChampionsService(supabase)
    : unavailable("champions");

export const bookings: BookingsService = runtimeConfig.isDemo
  ? demoBookings
  : supabase
    ? createBookingsService(supabase)
    : unavailable("bookings");

export const payments: PaymentsService = runtimeConfig.isDemo
  ? demoPayments
  : supabase
    ? createPaymentsService(supabase)
    : unavailable("payments");

export const video: VideoCallProvider = runtimeConfig.isDemo
  ? demoVideo
  : supabase
    ? createVideoCallProvider(supabase)
    : unavailable("video");

export const email: EmailService = runtimeConfig.isDemo
  ? demoEmail
  : supabase
    ? createEmailService(supabase)
    : unavailable("email");

export const storage: StorageService = runtimeConfig.isDemo
  ? demoStorage
  : supabase
    ? createStorageService(supabase)
    : unavailable("storage");

export const notifications: NotificationsService = runtimeConfig.isDemo
  ? demoNotifications
  : supabase
    ? createNotificationsService(supabase)
    : unavailable("notifications");

export async function getProfileById(userId: string): Promise<Profile | null> {
  if (runtimeConfig.isDemo) return getDemoProfileByIdAsync(userId);
  if (!supabase) throw configError();
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  return (data ?? null) as Profile | null;
}

export async function updateProfileById(
  userId: string,
  patch: { displayName: string; avatarUrl: string | null },
): Promise<Profile> {
  if (runtimeConfig.isDemo) return updateDemoProfileById(userId, patch);
  if (!supabase) throw configError();

  const { data, error } = await supabase
    .from("profiles")
    .update({
      display_name: patch.displayName,
      full_name: patch.displayName,
      avatar_url: patch.avatarUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select("*")
    .single();

  if (error) throw error;
  return data as Profile;
}
