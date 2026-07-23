import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../src/theme";

export default function TabsLayout() {
  const { tokens } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: tokens.bg },
        headerTintColor: tokens.text,
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: "800", letterSpacing: 1 },
        tabBarStyle: { backgroundColor: tokens.bgElevated, borderTopColor: tokens.border },
        tabBarActiveTintColor: tokens.primary,
        tabBarInactiveTintColor: tokens.textMuted,
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Champions",
        tabBarIcon: ({ color, size }) => <Ionicons name="compass-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="bookings" options={{ title: "Prenotazioni",
        tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: "Profilo",
        tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} /> }} />
    </Tabs>
  );
}
