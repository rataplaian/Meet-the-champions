import { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Link, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../src/context/auth";
import { radius, spacing, useTheme } from "../../src/theme";

export default function SignIn() {
  const { tokens } = useTheme();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("fan@meetchampion.local");
  const [password, setPassword] = useState("demo1234");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setError(null); setLoading(true);
    try { await signIn(email.trim(), password); router.replace("/(tabs)"); }
    catch (e: any) { setError(e.message ?? "Sign-in failed"); }
    finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: tokens.bg }]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.container}>
        <Text style={[styles.brand, { color: tokens.accent }]}>MEET CHAMPION</Text>
        <Text style={[styles.subtitle, { color: tokens.textMuted }]}>Prenota videochiamate 1:1 con i tuoi eroi.</Text>

        <View style={styles.form}>
          <Text style={[styles.label, { color: tokens.textMuted }]}>Email</Text>
          <TextInput
            testID="sign-in-email-input" value={email} onChangeText={setEmail}
            autoCapitalize="none" keyboardType="email-address"
            placeholderTextColor={tokens.textMuted}
            style={[styles.input, { backgroundColor: tokens.surface, borderColor: tokens.border, color: tokens.text }]}
          />
          <Text style={[styles.label, { color: tokens.textMuted }]}>Password</Text>
          <TextInput
            testID="sign-in-password-input" value={password} onChangeText={setPassword}
            secureTextEntry placeholderTextColor={tokens.textMuted}
            style={[styles.input, { backgroundColor: tokens.surface, borderColor: tokens.border, color: tokens.text }]}
          />

          {error && <Text style={{ color: tokens.danger, marginTop: spacing.sm }}>{error}</Text>}

          <TouchableOpacity
            testID="sign-in-submit-button"
            style={[styles.button, { backgroundColor: tokens.primary }, loading && { opacity: 0.6 }]}
            onPress={onSubmit} disabled={loading}
          >
            <Text style={[styles.buttonText, { color: tokens.bg }]}>{loading ? "Accesso…" : "Accedi"}</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={{ color: tokens.textMuted }}>Nuovo qui? </Text>
            <Link href="/(auth)/sign-up" style={[styles.link, { color: tokens.accent }]} testID="sign-in-go-to-signup-link">Crea account</Link>
          </View>

          <View style={[styles.demoBox, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
            <Text style={{ color: tokens.textMuted, fontSize: 12, marginBottom: 4 }}>Demo credenziali (pre-compilate):</Text>
            <Text style={{ color: tokens.text, fontSize: 12, fontFamily: "monospace" }}>fan@meetchampion.local · demo1234</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, padding: spacing.lg, justifyContent: "center" },
  brand: { fontSize: 26, fontWeight: "800", letterSpacing: 4 },
  subtitle: { marginTop: spacing.sm, marginBottom: spacing.xl },
  form: { gap: spacing.sm },
  label: { marginTop: spacing.md, fontSize: 13 },
  input: { borderRadius: radius.md, padding: spacing.md, borderWidth: 1 },
  button: { marginTop: spacing.lg, padding: spacing.md, borderRadius: radius.md, alignItems: "center" },
  buttonText: { fontWeight: "700", fontSize: 16 },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: spacing.lg },
  link: { fontWeight: "700" },
  demoBox: { marginTop: spacing.lg, padding: spacing.md, borderRadius: radius.md, borderWidth: 1 },
});
