import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "../src/context/auth";
import { isDarkBackground, ThemeProvider, useTheme } from "../src/theme";
import { backendReady, runtimeConfig, supabase } from "../src/services";
import { BootScreen } from "../src/components/BootScreen";
import type { UserThemePreferences } from "@meet-champion/shared";
import { OnboardingProvider, useOnboarding } from "../src/context/onboarding";
import { ScreenBackButton } from "../src/components/ScreenBackButton";

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
        headerShown: false,
        headerStyle: { backgroundColor: tokens.bg },
        headerTintColor: tokens.text,
        contentStyle: { backgroundColor: tokens.bg },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Protected guard={!onboarded}>
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={onboarded && !signedIn}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={onboarded && signedIn}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="champion/[id]"
            options={{
              title: "Champion",
              headerShown: true,
              headerLeft: () => <ScreenBackButton fallback="/(tabs)" />,
            }}
          />
          <Stack.Screen
            name="booking/[id]"
            options={{
              title: "Prenotazione",
              headerShown: true,
              headerLeft: () => <ScreenBackButton fallback="/(tabs)/bookings" />,
            }}
          />
          <Stack.Screen name="call/[id]" options={{ title: "Call", headerShown: false }} />
          <Stack.Screen
            name="vip-verify"
            options={{
              title: "Diventa Champion",
              headerShown: true,
              headerLeft: () => <ScreenBackButton fallback="/(tabs)/profile" />,
            }}
          />
          <Stack.Screen
            name="settings/appearance"
            options={{
              title: "Aspetto",
              headerShown: true,
              headerLeft: () => <ScreenBackButton fallback="/(tabs)/profile" />,
            }}
          />
      </Stack.Protected>
    </Stack>
  );
}

export default function Root() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#F3F7FF" }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <ThemedRoot />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function ThemedRoot() {
  const { tokens } = useTheme();
  return (
    <>
      <StatusBar style={isDarkBackground(tokens.bg) ? "light" : "dark"} />
      <OnboardingProvider>
        <AuthProvider>
          <RemoteThemeSync />
          <RootStack />
        </AuthProvider>
      </OnboardingProvider>
    </>
  );
}
