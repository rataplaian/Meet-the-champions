// =============================================================================
// Central client singleton for the mobile app.
// Uses SecureStore (native) / AsyncStorage (web) to persist auth session.
// =============================================================================
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import "react-native-url-polyfill/auto";

import {
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

const extra = Constants.expoConfig?.extra ?? {};

const url =
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? (extra.supabaseUrl as string);
const anonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? (extra.supabaseAnonKey as string);

if (!url || !anonKey) {
  // Fail loud at boot so misconfiguration is obvious.
  console.warn(
    "[meet-champion] Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY",
  );
}

const nativeStorage = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

const authStorage = Platform.OS === "web" ? AsyncStorage : nativeStorage;

export const supabase = createSupabaseClient({
  url: url ?? "",
  anonKey: anonKey ?? "",
  authStorage,
});

export const auth = createAuthService(supabase);
export const champions = createChampionsService(supabase);
export const bookings = createBookingsService(supabase);
export const payments = createPaymentsService(supabase);
export const video = createVideoCallProvider(supabase);
export const email = createEmailService(supabase);
export const storage = createStorageService(supabase);
export const notifications = createNotificationsService(supabase);
