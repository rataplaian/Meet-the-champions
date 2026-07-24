import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "../src/context/auth";
import { ThemeProvider, useTheme } from "../src/theme";
import { backendReady, runtimeConfig, supabase } from "../src/services";
import { BootScreen } from "../src/components/BootScreen";
import type { UserThemePreferences } from "@meet-champion/shared";
import { OnboardingProvider, useOnboarding } from "../src/context/onboarding";

/** Attaches a supabase-backed sync to the ThemeProvider once the user is logged in. */
function RemoteThemeSync() {
  const { session } = useAuth();
  const { bindRemoteSync } = useTheme();

  useEffect(() => {
    if (!backendReady || !supabase || !session?.user?.id) return;
    const client = supabase;
    const uid = session.user.id;
    const dispose = bindRemoteSync(
      async () => {
        try {
          const { data } = await client
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
          await client
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
  const { session, user, loading, initializationError, retryInitialization } = useAuth();
  const { ready: onboardingReady, onboarded } = useOnboarding();
  const { tokens } = useTheme();
  if (loading || initializationError || !onboardingReady) {
    return (
      <BootScreen
        mode={runtimeConfig.mode}
        error={initializationError}
        diagnosticsEnabled={runtimeConfig.diagnosticsEnabled}
        onRetry={retryInitialization}
      />
    );
  }

  const signedIn = Boolean(session || user);

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: tokens.bg },
        headerTintColor: tokens.text,
        contentStyle: { backgroundColor: tokens.bg },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      {!onboarded ? (
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      ) : !signedIn ? (
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
          <OnboardingProvider>
            <AuthProvider>
              <RemoteThemeSync />
              <RootStack />
            </AuthProvider>
          </OnboardingProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
