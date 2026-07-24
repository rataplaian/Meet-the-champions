import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, typography } from "../theme";
import type { StartupError } from "../config";

interface BootScreenProps {
  mode: string;
  error?: StartupError | null;
  diagnosticsEnabled?: boolean;
  onRetry?: () => void;
}

export function BootScreen({ mode, error, diagnosticsEnabled, onRetry }: BootScreenProps) {
  const hasError = Boolean(error);

  return (
    <View style={styles.container} testID={hasError ? "boot-error-screen" : "boot-loading-screen"}>
      <View style={styles.logoMark}>
        <Ionicons name="star" size={36} color={colors.accent} />
      </View>
      <Text style={styles.brand}>Meet Champion</Text>
      <Text style={styles.mode}>{mode.toUpperCase()} PREVIEW</Text>

      {hasError ? (
        <View style={styles.panel}>
          <Text style={styles.title}>Startup needs attention</Text>
          <Text style={styles.body}>{error?.message}</Text>
          {diagnosticsEnabled && error?.step ? (
            <Text style={styles.diagnostics}>Step: {error.step}</Text>
          ) : null}
          {onRetry ? (
            <TouchableOpacity testID="boot-retry-button" style={styles.button} onPress={onRetry}>
              <Ionicons name="refresh" size={18} color={colors.bg} />
              <Text style={styles.buttonText}>Retry</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={colors.accent} />
          <Text style={styles.body}>Preparing your preview...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
    padding: spacing.lg,
  },
  logoMark: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.accent + "66",
    marginBottom: spacing.md,
  },
  brand: { ...typography.h1, color: colors.text, textAlign: "center" },
  mode: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: "800",
    marginTop: spacing.xs,
    letterSpacing: 1,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  panel: {
    width: "100%",
    maxWidth: 420,
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { ...typography.h3, color: colors.text, marginBottom: spacing.sm },
  body: { color: colors.textMuted, lineHeight: 20 },
  diagnostics: {
    color: colors.accent,
    marginTop: spacing.md,
    fontSize: 12,
  },
  button: {
    marginTop: spacing.lg,
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  buttonText: { color: colors.bg, fontWeight: "800" },
});
