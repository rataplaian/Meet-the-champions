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

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      await auth.signIn(email.trim(), password);
      router.replace("/(tabs)");
    } catch (e: any) {
      setError(e.message ?? "Sign-in failed");
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
        <View style={styles.header}>
          <Text style={styles.brand}>Meet Champion</Text>
          <Text style={styles.subtitle}>Book 1:1 video calls with your heroes.</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            testID="sign-in-email-input"
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
            testID="sign-in-password-input"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
          />

          {error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity
            testID="sign-in-submit-button"
            style={[styles.button, loading && { opacity: 0.6 }]}
            onPress={onSubmit}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? "Signing in…" : "Sign in"}</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.muted}>New here? </Text>
            <Link href="/(auth)/sign-up" style={styles.link} testID="sign-in-go-to-signup-link">
              Create an account
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, padding: spacing.lg, justifyContent: "center" },
  header: { marginBottom: spacing.xl },
  brand: { ...typography.h1, color: colors.primary },
  subtitle: { ...typography.body, color: colors.textMuted, marginTop: spacing.sm },
  form: { gap: spacing.sm },
  label: { color: colors.textMuted, marginTop: spacing.md, ...typography.small },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    color: colors.text,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
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
