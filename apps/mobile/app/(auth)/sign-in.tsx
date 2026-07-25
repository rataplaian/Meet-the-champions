// =============================================================================
// Auth landing — royal-blue jersey background, golden CHAMPION hero,
// then either the Fan flow (default) or the Champion flow.
// =============================================================================
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator, useWindowDimensions } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../src/context/auth";
import { radius, spacing } from "../../src/theme";
import { JerseyBackground } from "../../src/components/JerseyBackground";
import { hap } from "../../src/utils/haptics";

export default function SignIn() {
  const params = useLocalSearchParams<{ type?: string }>();
  const isChampion = params.type === "champion";
  const { signIn, signUp } = useAuth();
  const { height: SCREEN_H } = useWindowDimensions();
  // Image is portrait 941×1672 (aspect ≈0.563). When "contain"-fitted to full
  // screen height, only the LOWER portion of the artwork is jersey texture — so
  // we push the form to sit in that lower band beneath the "MEET THE CHAMPION"
  // text + stars.
  const HERO_SPACE = Math.max(320, Math.round(SCREEN_H * 0.58));

  const [mode, setMode] = useState<"landing" | "login" | "signup">("landing");
  const [email, setEmail] = useState(isChampion ? "" : "fan@meetchampion.local");
  const [password, setPassword] = useState(isChampion ? "" : "demo1234");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const doSignIn = async () => {
    setError(null); setLoading(true);
    try { await signIn(email.trim(), password); router.replace("/(tabs)"); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const doSignUp = async () => {
    setError(null); setLoading(true);
    try {
      if (password.length < 6) throw new Error("Password minima 6 caratteri.");
      if (!displayName.trim()) throw new Error("Nome obbligatorio.");
      await signUp({ email: email.trim(), password, displayName: displayName.trim(), role: isChampion ? "champion" : "fan" });
      router.replace(isChampion ? "/vip-verify" : "/(tabs)");
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <View style={{ flex: 1 }}>
      <JerseyBackground />
      <SafeAreaView style={{ flex: 1 }}>
        {/* Floating back button — always visible when NOT on landing */}
        {mode !== "landing" && (
          <TouchableOpacity
            testID="auth-back"
            onPress={() => { hap.light(); setMode("landing"); setError(null); }}
            hitSlop={16}
            style={styles.floatingBack}
          >
            <Ionicons name="chevron-back" size={22} color="#F5C451" />
            <Text style={styles.floatingBackText}>Indietro</Text>
          </TouchableOpacity>
        )}
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {/* Spacer — pushes CTA below the baked-in CHAMPION hero + stars. */}
            <View style={{ height: mode === "landing" ? HERO_SPACE : 40 }} />

            {/* Optional Champion badge — shows only on champion variant */}
            {isChampion && (
              <View style={styles.championBadge}>
                <Text style={styles.championBadgeText}>◆ PORTALE CHAMPION ◆</Text>
              </View>
            )}

            {/* Body */}
            <View style={styles.body}>
              {mode === "landing" && (
                <>
                  <Text style={styles.tagline}>
                    {isChampion
                      ? "Il tuo palcoscenico premium.\nRicevi prenotazioni video call dai tuoi tifosi."
                      : "Prenota video call 1:1 con i tuoi eroi del calcio."}
                  </Text>

                  <TouchableOpacity testID="landing-signin" onPress={() => setMode("login")}
                    style={[styles.primaryBtn, { backgroundColor: "#F5C451" }]}>
                    <Text style={styles.primaryBtnText}>Accedi</Text>
                  </TouchableOpacity>

                  <TouchableOpacity testID="landing-signup" onPress={() => setMode("signup")}
                    style={[styles.secondaryBtn, { borderColor: "#F5C45188" }]}>
                    <Text style={styles.secondaryBtnText}>Registrati</Text>
                  </TouchableOpacity>

                  <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>OPPURE</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  {!isChampion ? (
                    <TouchableOpacity testID="landing-goto-champion"
                      onPress={() => router.replace("/(auth)/sign-in?type=champion")}
                      style={styles.championGateBtn}>
                      <Text style={styles.championGateLabel}>SEI UN CHAMPION?</Text>
                      <Text style={styles.championGateText}>Accedi al portale professionisti  →</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity testID="landing-goto-fan"
                      onPress={() => router.replace("/(auth)/sign-in")}
                      style={styles.championGateBtn}>
                      <Text style={styles.championGateLabel}>SEI UN UTENTE?</Text>
                      <Text style={styles.championGateText}>Torna al portale utenti  →</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}

              {mode !== "landing" && (
                <View style={styles.formCard}>
                  <View style={styles.formHeader}>
                    <View style={{ width: 32 }} />
                    <Text style={styles.formTitle}>
                      {mode === "login" ? "Accedi" : "Registrati"} · {isChampion ? "Champion" : "Utente"}
                    </Text>
                    <View style={{ width: 32 }} />
                  </View>

                  {mode === "signup" && (
                    <>
                      <Text style={styles.label}>Nome</Text>
                      <TextInput value={displayName} onChangeText={setDisplayName}
                        placeholder="il tuo nome" placeholderTextColor="#8B9BB4"
                        testID="signup-name-input" style={styles.input} />
                    </>
                  )}

                  <Text style={styles.label}>Email</Text>
                  <TextInput value={email} onChangeText={setEmail}
                    autoCapitalize="none" keyboardType="email-address"
                    placeholder="you@example.com" placeholderTextColor="#8B9BB4"
                    testID="auth-email-input" style={styles.input} />

                  <Text style={styles.label}>Password</Text>
                  <TextInput value={password} onChangeText={setPassword}
                    secureTextEntry placeholder="••••••••" placeholderTextColor="#8B9BB4"
                    testID="auth-password-input" style={styles.input} />

                  {error && <Text style={styles.errorText}>{error}</Text>}

                  <TouchableOpacity
                    testID="auth-submit"
                    onPress={mode === "login" ? doSignIn : doSignUp}
                    disabled={loading}
                    style={[styles.primaryBtn, { backgroundColor: "#F5C451", marginTop: spacing.lg }, loading && { opacity: 0.6 }]}
                  >
                    {loading ? <ActivityIndicator color="#08142D" /> :
                      <Text style={styles.primaryBtnText}>{mode === "login" ? "Accedi" : "Crea account"}</Text>}
                  </TouchableOpacity>

                  {mode === "login" && !isChampion && (
                    <View style={styles.demoBox}>
                      <Text style={styles.demoLabel}>DEMO PRE-COMPILATO</Text>
                      <Text style={styles.demoValue}>fan@meetchampion.local · demo1234</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

// Standalone signup helper removed — signup is now handled by the doSignUp
// callback inside the component (via useAuth().signUp).

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, paddingBottom: spacing.xxl, minHeight: "100%" },
  body: { paddingHorizontal: spacing.lg, marginTop: spacing.lg, gap: spacing.md },

  // Reserved space for the "MEET THE CHAMPION" text baked in the background image.
  // (heroSpacer removed — now sized inline via HERO_SPACE from useWindowDimensions.)

  championBadge: {
    alignSelf: "center",
    marginBottom: spacing.md,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#F5C45188",
    backgroundColor: "#04091Ecc",
  },
  championBadgeText: {
    color: "#F5C451",
    fontWeight: "900",
    letterSpacing: 3,
    fontSize: 11,
  },

  floatingBack: {
    position: "absolute",
    top: Platform.OS === "web" ? 12 : 8,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#04091ecc",
    borderWidth: 1,
    borderColor: "#F5C45166",
    zIndex: 10,
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  floatingBackText: {
    color: "#F5C451",
    fontWeight: "800",
    fontSize: 13,
    letterSpacing: 0.5,
  },

  tagline: {
    color: "#EAF0FA",
    textAlign: "center",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: spacing.md,
    textShadowColor: "#00000066",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  primaryBtn: {
    padding: 15,
    borderRadius: radius.pill,
    alignItems: "center",
    shadowColor: "#F5C451",
    shadowOpacity: 0.55,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  primaryBtnText: {
    color: "#08142D",
    fontWeight: "900",
    fontSize: 15,
    letterSpacing: 2,
  },
  secondaryBtn: {
    padding: 14,
    borderRadius: radius.pill,
    alignItems: "center",
    borderWidth: 1.5,
    backgroundColor: "#ffffff10",
  },
  secondaryBtnText: {
    color: "#F5C451",
    fontWeight: "800",
    fontSize: 15,
    letterSpacing: 2,
  },

  divider: { flexDirection: "row", alignItems: "center", marginVertical: spacing.md, gap: spacing.sm },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#F5C45133" },
  dividerText: { color: "#8B9BB4", fontSize: 11, letterSpacing: 3, fontWeight: "700" },

  championGateBtn: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#F5C45144",
    backgroundColor: "#00000044",
    alignItems: "center",
  },
  championGateLabel: { color: "#F5C451", fontSize: 11, letterSpacing: 3, fontWeight: "800" },
  championGateText: { color: "#EAF0FA", marginTop: 4, fontWeight: "600" },

  formCard: {
    backgroundColor: "#04091ecc",
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: "#F5C45144",
    gap: 6,
  },
  formHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm },
  backLink: { color: "#F5C451", fontWeight: "700", width: 60 },
  formTitle: { color: "#F7FAFC", fontWeight: "800", letterSpacing: 1, fontSize: 14 },

  label: { color: "#A5B1C2", marginTop: spacing.sm, fontSize: 12, letterSpacing: 1.5, fontWeight: "700" },
  input: {
    backgroundColor: "#0B1735",
    borderColor: "#F5C45133",
    borderWidth: 1,
    borderRadius: radius.md,
    color: "#F7FAFC",
    padding: 14,
    marginTop: 4,
    outlineStyle: "none" as any,
  },
  errorText: { color: "#F04444", marginTop: spacing.sm },

  demoBox: {
    marginTop: spacing.md, padding: spacing.md,
    borderRadius: radius.md, borderWidth: 1, borderColor: "#F5C45133",
    backgroundColor: "#00000033",
  },
  demoLabel: { color: "#F5C451", fontSize: 10, letterSpacing: 2, fontWeight: "800", marginBottom: 4 },
  demoValue: { color: "#EAF0FA", fontFamily: "monospace", fontSize: 12 },
});
