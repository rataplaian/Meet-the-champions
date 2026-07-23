import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { LogBox } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useIconFonts } from "@/src/hooks/use-icon-fonts";
import { AuthProvider, useAuth } from "../src/context/auth";
import { ThemeProvider, useTheme } from "../src/theme";
import { ONBOARDING_KEY } from "./onboarding";

LogBox.ignoreAllLogs(true);
SplashScreen.preventAutoHideAsync();

function AuthGate() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then((v) => setOnboarded(v === "1"));
  }, []);

  useEffect(() => {
    if (loading || onboarded === null) return;
    const first = segments[0];
    const inAuth = first === "(auth)";
    const inOnboarding = first === "onboarding";
    if (!onboarded) {
      if (!inOnboarding) router.replace("/onboarding");
      return;
    }
    if (!user && !inAuth) router.replace("/(auth)/sign-in");
    else if (user && (inAuth || inOnboarding)) router.replace("/(tabs)");
  }, [user, loading, segments, router, onboarded]);

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

export default function RootLayout() {
  const [loaded, error] = useIconFonts();

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#07111F" }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <ThemeProvider>
          <AuthProvider>
            <AuthGate />
            <InnerStack />
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
