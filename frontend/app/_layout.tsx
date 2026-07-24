import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { LogBox } from "react-native";

import { useIconFonts } from "@/src/hooks/use-icon-fonts";
import { AuthProvider, useAuth } from "../src/context/auth";
import { ThemeProvider, useTheme } from "../src/theme";
import { OnboardingProvider, useOnboarding } from "../src/context/onboarding";

LogBox.ignoreAllLogs(true);
// Hide splash immediately — we render our own content beneath. This is
// critical for Expo Go on flaky mobile networks where the icon-font CDN can
// stall and leave the user staring at the splash forever.
SplashScreen.hideAsync().catch(() => {});

function AuthGate() {
  const { user, loading } = useAuth();
  const { ready, onboarded } = useOnboarding();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading || !ready) return;
    const first = segments[0];
    const inAuth = first === "(auth)";
    const inOnboarding = first === "onboarding";
    if (!onboarded) {
      if (!inOnboarding) router.replace("/onboarding");
      return;
    }
    if (!user && !inAuth) router.replace("/(auth)/sign-in");
    else if (user && (inAuth || inOnboarding)) router.replace("/(tabs)");
  }, [user, loading, ready, onboarded, segments, router]);

  return null;
}

function InnerStack() {
  const { tokens } = useTheme();
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
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="champion/[id]" options={{ title: "Champion" }} />
      <Stack.Screen name="booking/[id]" options={{ title: "Booking" }} />
      <Stack.Screen name="call/[id]" options={{ headerShown: false, animation: "fade" }} />
      <Stack.Screen name="settings/appearance" options={{ title: "Aspetto" }} />
      <Stack.Screen name="vip-verify" options={{ title: "Diventa Champion" }} />
    </Stack>
  );
}

// -----------------------------------------------------------------------------
// Font-safe boot: never block the UI on CDN font downloads. We give the icon
// font loader up to 4 s and then mount the app anyway. Ionicons will
// re-render once the font arrives.
// -----------------------------------------------------------------------------
function useSafeBoot(): boolean {
  const [loaded, error] = useIconFonts();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 4000);
    return () => clearTimeout(t);
  }, []);

  return loaded || !!error || timedOut;
}

export default function RootLayout() {
  const canMount = useSafeBoot();

  useEffect(() => {
    if (canMount) SplashScreen.hideAsync().catch(() => {});
  }, [canMount]);

  // Render the full tree as soon as either fonts are ready OR the 4s escape
  // hatch kicks in. This prevents users from being stuck on the splash / a
  // stalled network from blocking the whole app.
  if (!canMount) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#07111F" }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <ThemeProvider>
          <OnboardingProvider>
            <AuthProvider>
              <AuthGate />
              <InnerStack />
            </AuthProvider>
          </OnboardingProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
