import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Link, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth } from "../../src/services";
import { colors, radius, spacing, typography } from "../../src/theme";
import type { UserRole } from "@meet-champion/shared";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<UserRole>("fan");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      await auth.signUp({ email: email.trim(), password, displayName, role });
      router.replace(role === "champion" ? "/vip-verify" : "/(tabs)");
    } catch (e: any) {
      setError(e.message ?? "Sign-up failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.container}
      >
        <Text style={styles.title}>Create your account</Text>

        <Text style={styles.label}>Display name</Text>
        <TextInput
          testID="sign-up-name-input"
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="your.username"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          testID="sign-up-email-input"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="you@example.com"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          testID="sign-up-password-input"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="8+ characters"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />

        <Text style={[styles.label, { marginTop: spacing.md }]}>I want to</Text>
        <View style={styles.roleRow}>
          {(["fan", "champion"] as UserRole[]).map((r) => (
            <TouchableOpacity
              key={r}
              testID={`sign-up-role-${r}-chip`}
              onPress={() => setRole(r)}
              style={[
                styles.roleChip,
                role === r && { borderColor: colors.primary, backgroundColor: colors.primary + "22" },
              ]}
            >
              <Text
                style={[
                  styles.roleChipText,
                  role === r && { color: colors.primary, fontWeight: "700" },
                ]}
              >
                {r === "fan" ? "Book champions" : "Become a Champion"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity
          testID="sign-up-submit-button"
          style={[styles.button, loading && { opacity: 0.6 }]}
          onPress={onSubmit}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? "Creating…" : "Sign up"}</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.muted}>Already have an account? </Text>
          <Link href="/(auth)/sign-in" style={styles.link} testID="sign-up-go-to-signin-link">
            Sign in
          </Link>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, padding: spacing.lg, justifyContent: "center" },
  title: { ...typography.h1, color: colors.text, marginBottom: spacing.lg },
  label: { color: colors.textMuted, marginTop: spacing.md, ...typography.small },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    color: colors.text,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  roleRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  roleChip: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
  },
  roleChipText: { color: colors.textMuted },
  button: {
    backgroundColor: colors.primary,
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: "center",
  },
  buttonText: { color: colors.bg, fontWeight: "700", fontSize: 16 },
  error: { color: colors.danger, marginTop: spacing.sm },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: spacing.lg },
  muted: { color: colors.textMuted },
  link: { color: colors.primary, fontWeight: "600" },
});
