import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "../src/context/auth";
import { ThemeProvider, useTheme } from "../src/theme";
import { supabase } from "../src/services";
import type { UserThemePreferences } from "@meet-champion/shared";

/** Attaches a supabase-backed sync to the ThemeProvider once the user is logged in. */
function RemoteThemeSync() {
  const { session } = useAuth();
  const { bindRemoteSync } = useTheme();

  useEffect(() => {
    if (!session?.user?.id) return;
    const uid = session.user.id;
    const dispose = bindRemoteSync(
      async () => {
        try {
          const { data } = await supabase
            .from("profiles")
            .select("theme_preferences")
            .eq("id", uid)
            .maybeSingle();
          return (data?.theme_preferences ?? null) as UserThemePreferences | null;
        } catch {
          return null;
        }
      },
      async (prefs) => {
        try {
          await supabase
            .from("profiles")
            .update({ theme_preferences: prefs })
            .eq("id", uid);
        } catch {
          /* offline / permission error — silent */
        }
      },
    );
    return dispose;
  }, [session?.user?.id, bindRemoteSync]);

  return null;
}

function RootStack() {
  const { session, loading } = useAuth();
  const { tokens } = useTheme();
  if (loading) return null;
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: tokens.background.primary },
        headerTintColor: tokens.text.primary,
        contentStyle: { backgroundColor: tokens.background.primary },
        headerShadowVisible: false,
      }}
    >
      {!session ? (
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      ) : (
        <>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="champion/[id]" options={{ title: "Champion" }} />
          <Stack.Screen name="booking/[id]" options={{ title: "Booking" }} />
          <Stack.Screen name="call/[id]" options={{ title: "Call", headerShown: false }} />
          <Stack.Screen name="vip-verify" options={{ title: "Become a Champion" }} />
          <Stack.Screen name="settings/appearance" options={{ title: "Aspetto" }} />
        </>
      )}
    </Stack>
  );
}

export default function Root() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#07111F" }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <ThemeProvider>
          <AuthProvider>
            <RemoteThemeSync />
            <RootStack />
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
