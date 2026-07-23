import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../src/context/auth";
import { radius, spacing, useTheme } from "../../src/theme";

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { tokens } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bg, padding: spacing.lg, gap: spacing.md }}>
      <View style={[styles.card, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
        <View style={[styles.avatar, { backgroundColor: tokens.bgElevated, borderColor: tokens.accent }]}>
          <Ionicons name="person" size={40} color={tokens.accent} />
        </View>
        <Text style={[styles.name, { color: tokens.text }]}>{user?.displayName ?? "—"}</Text>
        <Text style={{ color: tokens.textMuted, marginTop: 4 }}>{user?.email}</Text>
        <View style={[styles.roleBadge, { backgroundColor: tokens.primary + "22", borderColor: tokens.primary }]}>
          <Text style={{ color: tokens.primary, fontSize: 11, fontWeight: "700", letterSpacing: 1 }}>
            {(user?.role ?? "fan").toUpperCase()}
          </Text>
        </View>
      </View>

      {user?.role !== "champion" && (
        <TouchableOpacity testID="profile-become-champion"
          onPress={() => router.push("/vip-verify" as never)}
          style={[styles.actionBtn, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
          <Ionicons name="star-outline" size={20} color={tokens.accent} />
          <Text style={[styles.actionText, { color: tokens.text }]}>Diventa un Champion</Text>
          <Ionicons name="chevron-forward" size={18} color={tokens.textMuted} />
        </TouchableOpacity>
      )}

      <TouchableOpacity testID="profile-appearance"
        onPress={() => router.push("/settings/appearance" as never)}
        style={[styles.actionBtn, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
        <Ionicons name="color-palette-outline" size={20} color={tokens.accent} />
        <Text style={[styles.actionText, { color: tokens.text }]}>Aspetto — Tema della tua squadra</Text>
        <Ionicons name="chevron-forward" size={18} color={tokens.textMuted} />
      </TouchableOpacity>

      <TouchableOpacity testID="profile-sign-out" onPress={signOut}
        style={[styles.actionBtn, { backgroundColor: tokens.surface, borderColor: tokens.danger + "44" }]}>
        <Ionicons name="log-out-outline" size={20} color={tokens.danger} />
        <Text style={[styles.actionText, { color: tokens.danger }]}>Esci</Text>
        <View style={{ width: 18 }} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.lg, borderRadius: radius.lg, alignItems: "center", borderWidth: 1 },
  avatar: { width: 84, height: 84, borderRadius: 42, alignItems: "center", justifyContent: "center", borderWidth: 2 },
  name: { fontSize: 22, fontWeight: "800", marginTop: spacing.md },
  roleBadge: { marginTop: spacing.md, paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: 999, borderWidth: 1 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md, borderRadius: radius.md, borderWidth: 1 },
  actionText: { flex: 1, fontWeight: "600" },
});
