import { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Link, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../src/context/auth";
import { radius, spacing, useTheme } from "../../src/theme";

export default function SignUp() {
  const { tokens } = useTheme();
  const { signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<"fan" | "champion">("fan");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setError(null); setLoading(true);
    try {
      if (password.length < 6) throw new Error("Password minima 6 caratteri.");
      if (!displayName.trim()) throw new Error("Nome obbligatorio.");
      await signUp({ email: email.trim(), password, displayName: displayName.trim(), role });
      router.replace(role === "champion" ? "/vip-verify" : "/(tabs)");
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.bg }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.container}>
        <Text style={[styles.title, { color: tokens.text }]}>Crea account</Text>

        <Text style={[styles.label, { color: tokens.textMuted }]}>Nome</Text>
        <TextInput value={displayName} onChangeText={setDisplayName} placeholder="il tuo nome"
          placeholderTextColor={tokens.textMuted} testID="sign-up-name-input"
          style={[styles.input, { backgroundColor: tokens.surface, borderColor: tokens.border, color: tokens.text }]} />

        <Text style={[styles.label, { color: tokens.textMuted }]}>Email</Text>
        <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address"
          placeholder="you@example.com" placeholderTextColor={tokens.textMuted} testID="sign-up-email-input"
          style={[styles.input, { backgroundColor: tokens.surface, borderColor: tokens.border, color: tokens.text }]} />

        <Text style={[styles.label, { color: tokens.textMuted }]}>Password</Text>
        <TextInput value={password} onChangeText={setPassword} secureTextEntry
          placeholder="min 6 caratteri" placeholderTextColor={tokens.textMuted} testID="sign-up-password-input"
          style={[styles.input, { backgroundColor: tokens.surface, borderColor: tokens.border, color: tokens.text }]} />

        <Text style={[styles.label, { color: tokens.textMuted }]}>Voglio</Text>
        <View style={styles.roleRow}>
          {(["fan", "champion"] as const).map((r) => (
            <TouchableOpacity key={r} testID={`sign-up-role-${r}`} onPress={() => setRole(r)}
              style={[styles.roleChip, { backgroundColor: tokens.surface, borderColor: role === r ? tokens.primary : tokens.border }]}>
              <Text style={{ color: role === r ? tokens.primary : tokens.textMuted, fontWeight: role === r ? "700" : "400" }}>
                {r === "fan" ? "Prenotare champions" : "Essere un Champion"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {error && <Text style={{ color: tokens.danger, marginTop: spacing.sm }}>{error}</Text>}

        <TouchableOpacity testID="sign-up-submit-button" onPress={onSubmit} disabled={loading}
          style={[styles.button, { backgroundColor: tokens.primary }, loading && { opacity: 0.6 }]}>
          <Text style={[styles.buttonText, { color: tokens.bg }]}>{loading ? "Creazione…" : "Registrati"}</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={{ color: tokens.textMuted }}>Hai già un account? </Text>
          <Link href="/(auth)/sign-in" style={{ color: tokens.accent, fontWeight: "700" }}>Accedi</Link>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg, justifyContent: "center" },
  title: { fontSize: 28, fontWeight: "800", marginBottom: spacing.lg },
  label: { marginTop: spacing.md, fontSize: 13 },
  input: { borderRadius: radius.md, padding: spacing.md, borderWidth: 1, marginTop: 4 },
  roleRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  roleChip: { flex: 1, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, alignItems: "center" },
  button: { marginTop: spacing.lg, padding: spacing.md, borderRadius: radius.md, alignItems: "center" },
  buttonText: { fontWeight: "700", fontSize: 16 },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: spacing.lg },
});
