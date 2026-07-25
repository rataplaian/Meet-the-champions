import { useState, useCallback } from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../../src/context/auth";
import { radius, spacing, useTheme } from "../../src/theme";
import { bookings as bStore } from "../../src/store";
import { hap } from "../../src/utils/haptics";
import { useOnboarding } from "../../src/context/onboarding";

const USER_SETTINGS_BACKGROUND = require("../../assets/images/user-settings-bg.jpg");

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { tokens } = useTheme();
  const { reset: resetOnboarding } = useOnboarding();
  const [stats, setStats] = useState({ upcoming: 0, past: 0, total: 0 });
  const panelColor = tokens.surface + "F2";
  const signOutLabel = user?.role === "champion"
    ? "Esci dall'account Champion"
    : "Esci dall'account utente";

  const loadStats = useCallback(async () => {
    if (!user) return;
    const list = await bStore.listForUser(user.id, user.role === "champion" ? "champion" : "fan");
    const now = Date.now();
    let up = 0, pa = 0;
    for (const b of list) {
      const end = new Date(b.scheduledStart).getTime() + b.durationMinutes * 60_000;
      const isPast =
        end < now || b.status === "completed" || b.status === "cancelled" || b.status === "refunded";
      if (isPast) pa++; else up++;
    }
    setStats({ upcoming: up, past: pa, total: list.length });
  }, [user]);

  useFocusEffect(useCallback(() => { loadStats(); }, [loadStats]));

  return (
    <View style={styles.screen}>
      <Image
        source={USER_SETTINGS_BACKGROUND}
        resizeMode="cover"
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={["#02071111", "#02071122", "#02071155"]}
        locations={[0, 0.5, 1]}
        style={[StyleSheet.absoluteFill, styles.noPointerEvents]}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
      {/* Profile card with gradient border */}
      <LinearGradient
        colors={[tokens.accent + "aa", tokens.primary + "aa"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: radius.lg, padding: 2 }}
      >
        <View style={[styles.card, { backgroundColor: panelColor }]}>
          <View style={[styles.avatar, { backgroundColor: tokens.bgElevated, borderColor: tokens.accent }]}>
            <Ionicons name="person" size={40} color={tokens.accent} />
          </View>
          <Text style={[styles.name, { color: tokens.text }]}>{user?.displayName ?? "—"}</Text>
          <Text style={{ color: tokens.textMuted, marginTop: 4 }}>{user?.email}</Text>
          <View style={[styles.roleBadge, { backgroundColor: tokens.primary + "22", borderColor: tokens.primary }]}>
            <Text style={{ color: tokens.primary, fontSize: 11, fontWeight: "700", letterSpacing: 1 }}>
              {(user?.role === "fan" ? "UTENTE" : (user?.role ?? "fan")).toUpperCase()}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Stats */}
      <View style={styles.statsRow}>
        <StatBox label="Prossime" value={stats.upcoming} color={tokens.accent} tokens={tokens} panelColor={panelColor} />
        <StatBox label="Passate" value={stats.past} color={tokens.primary} tokens={tokens} panelColor={panelColor} />
        <StatBox label="Totale" value={stats.total} color="#2ED47A" tokens={tokens} panelColor={panelColor} />
      </View>

      <TouchableOpacity testID="profile-appearance"
        onPress={() => { hap.light(); router.push("/settings/appearance" as never); }}
        style={[styles.actionBtn, { backgroundColor: panelColor, borderColor: tokens.border }]}>
        <Ionicons name="color-palette-outline" size={20} color={tokens.accent} />
        <Text style={[styles.actionText, { color: tokens.text }]}>Aspetto — Tema della tua squadra</Text>
        <Ionicons name="chevron-forward" size={18} color={tokens.textMuted} />
      </TouchableOpacity>

      <TouchableOpacity testID="profile-onboarding"
        onPress={async () => {
          hap.light();
          await resetOnboarding();
          router.replace("/onboarding" as never);
        }}
        style={[styles.actionBtn, { backgroundColor: panelColor, borderColor: tokens.border }]}>
        <Ionicons name="sparkles-outline" size={20} color={tokens.primary} />
        <Text style={[styles.actionText, { color: tokens.text }]}>Rivedi introduzione</Text>
        <Ionicons name="chevron-forward" size={18} color={tokens.textMuted} />
      </TouchableOpacity>

      <TouchableOpacity testID="profile-sign-out"
        onPress={async () => {
          hap.warning();
          await signOut();
          router.replace("/(auth)/sign-in" as never);
        }}
        style={[styles.actionBtn, { backgroundColor: panelColor, borderColor: tokens.danger + "44" }]}>
        <Ionicons name="log-out-outline" size={20} color={tokens.danger} />
        <Text style={[styles.actionText, { color: tokens.danger }]}>{signOutLabel}</Text>
        <View style={{ width: 18 }} />
      </TouchableOpacity>

      <Text style={styles.footer}>
        Meet Champion · Demo v1.0
      </Text>
      </ScrollView>
    </View>
  );
}

function StatBox({ label, value, color, tokens, panelColor }: any) {
  return (
    <View style={[styles.stat, { backgroundColor: panelColor, borderColor: tokens.border }]}>
      <Text style={{ color, fontSize: 26, fontWeight: "900" }}>{value}</Text>
      <Text style={{ color: tokens.textMuted, fontSize: 11, letterSpacing: 1, fontWeight: "700", marginTop: 2 }}>
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#061023",
  },
  scroll: {
    flex: 1,
    backgroundColor: "transparent",
  },
  content: {
    flexGrow: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  noPointerEvents: {
    pointerEvents: "none",
  },
  card: { padding: spacing.lg, borderRadius: radius.lg - 2, alignItems: "center" },
  avatar: { width: 84, height: 84, borderRadius: 42, alignItems: "center", justifyContent: "center", borderWidth: 2 },
  name: { fontSize: 22, fontWeight: "800", marginTop: spacing.md },
  roleBadge: { marginTop: spacing.md, paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: 999, borderWidth: 1 },
  statsRow: { flexDirection: "row", gap: 10 },
  stat: {
    flex: 1,
    padding: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: "center",
  },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md, borderRadius: radius.md, borderWidth: 1 },
  actionText: { flex: 1, fontWeight: "600" },
  footer: {
    color: "#D5DEEB",
    textAlign: "center",
    fontSize: 11,
    marginTop: "auto",
    opacity: 0.78,
    textShadowColor: "#000000",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
