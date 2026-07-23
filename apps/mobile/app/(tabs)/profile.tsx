import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../src/context/auth";
import { colors, radius, spacing, typography } from "../../src/theme";

export default function ProfileScreen() {
  const { profile, signOut } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={40} color={colors.textMuted} />
        </View>
        <Text style={styles.name}>{profile?.display_name ?? "Anonymous"}</Text>
        <Text style={styles.email}>{profile?.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>{profile?.role?.toUpperCase() ?? "FAN"}</Text>
        </View>
      </View>

      {profile?.role !== "champion" && (
        <TouchableOpacity
          testID="profile-become-champion-button"
          style={styles.actionButton}
          onPress={() => router.push("/vip-verify" as never)}
        >
          <Ionicons name="star-outline" size={20} color={colors.primary} />
          <Text style={styles.actionText}>Become a Champion</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        testID="profile-appearance-button"
        style={styles.actionButton}
        onPress={() => router.push("/settings/appearance" as never)}
      >
        <Ionicons name="color-palette-outline" size={20} color={colors.accent} />
        <Text style={styles.actionText}>Aspetto — Tema della tua squadra</Text>
      </TouchableOpacity>

      <TouchableOpacity
        testID="profile-sign-out-button"
        style={[styles.actionButton, styles.dangerButton]}
        onPress={signOut}
      >
        <Ionicons name="log-out-outline" size={20} color={colors.danger} />
        <Text style={[styles.actionText, { color: colors.danger }]}>Sign out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing.lg, gap: spacing.md },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.bgElevated,
    alignItems: "center", justifyContent: "center",
  },
  name: { ...typography.h2, color: colors.text, marginTop: spacing.md },
  email: { color: colors.textMuted, marginTop: 4 },
  roleBadge: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.primary + "22",
    borderWidth: 1,
    borderColor: colors.primary,
  },
  roleBadgeText: { color: colors.primary, fontSize: 12, fontWeight: "700", letterSpacing: 0.5 },
  actionButton: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionText: { color: colors.text, fontWeight: "600" },
  dangerButton: { borderColor: colors.danger + "44" },
});
