import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { isDarkBackground, PRESETS, radius, spacing, useTheme } from "../../src/theme";

const USER_SETTINGS_BACKGROUND = require("../../assets/images/user-settings-bg.jpg");

export default function Appearance() {
  const { preset, tokens, setPreset } = useTheme();
  const panelColor = tokens.surface + "F4";

  return (
    <View style={styles.screen}>
      <Image
        source={USER_SETTINGS_BACKGROUND}
        resizeMode="cover"
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={["#01040A88", "#01040AAA", "#01040ACC"]}
        locations={[0, 0.48, 1]}
        style={[StyleSheet.absoluteFill, styles.noPointerEvents]}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Tema della tua squadra</Text>
        <Text style={styles.subtitle}>
          Nessun logo o stemma ufficiale — solo palette cromatiche.
        </Text>

        <View style={[styles.preview, { backgroundColor: panelColor, borderColor: tokens.accent + "66" }]}>
          <View style={styles.swatches}>
            <View style={[styles.swatch, { backgroundColor: tokens.primary }]} />
            <View style={[styles.swatch, { backgroundColor: tokens.secondary }]} />
            <View style={[styles.swatch, { backgroundColor: tokens.accent }]} />
          </View>
          <Text style={{ color: tokens.text, fontSize: 20, fontWeight: "800" }}>Anteprima tema</Text>
          <Text style={{ color: tokens.textMuted, marginTop: 4 }}>
            Prezzi, prenotazione e conferme restano sempre leggibili.
          </Text>
          <View style={styles.previewActions}>
            <View style={{ backgroundColor: tokens.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 }}>
              <Text style={{ color: tokens.bg, fontWeight: "800", fontSize: 12 }}>Prenota</Text>
            </View>
            <View style={{ backgroundColor: tokens.success, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 }}>
              <Text style={{ color: "#07111F", fontWeight: "800", fontSize: 12 }}>Disponibile</Text>
            </View>
          </View>
        </View>

        <Text style={styles.presetTitle}>PRESET</Text>
        <View style={styles.presetGrid}>
          {PRESETS.map((p) => {
            const selected = p.id === preset.id;
            const presetIsDark = isDarkBackground(p.background);
            const presetText = presetIsDark ? "#F7FAFC" : "#0B1220";
            const presetMuted = presetIsDark ? "#A5B1C2" : "#526071";
            return (
              <TouchableOpacity
                key={p.id}
                testID={`preset-${p.id}`}
                onPress={() => setPreset(p.id)}
                style={{
                  width: "47%",
                  aspectRatio: 1.2,
                  borderRadius: radius.lg,
                  padding: spacing.md,
                  backgroundColor: p.background,
                  borderWidth: selected ? 2 : 1,
                  borderColor: selected ? "#FFD34E" : "#FFFFFF55",
                  justifyContent: "space-between",
                  shadowColor: "#000000",
                  shadowOpacity: 0.24,
                  shadowRadius: 10,
                  shadowOffset: { width: 0, height: 5 },
                  elevation: 4,
                }}
              >
                <View style={styles.presetSwatches}>
                  <View style={[styles.presetSwatch, { backgroundColor: p.primary }]} />
                  <View style={[styles.presetSwatch, { backgroundColor: p.secondary }]} />
                  <View style={[styles.presetSwatch, { backgroundColor: p.accent }]} />
                </View>
                <View>
                  <Text style={{ color: presetText, fontWeight: "700", fontSize: 14 }}>{p.label}</Text>
                  <Text style={{ color: presetMuted, fontSize: 11, marginTop: 2 }}>{p.description}</Text>
                </View>
                {selected && (
                  <View style={styles.selected}>
                    <Ionicons name="checkmark-circle" size={20} color="#FFD34E" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.footer}>
          Il tema è decorativo. Verde (conferme) e rosso (errori) non cambiano mai.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#030814",
  },
  scroll: {
    flex: 1,
    backgroundColor: "transparent",
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  noPointerEvents: {
    pointerEvents: "none",
  },
  title: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 4,
    textShadowColor: "#000000",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    color: "#D5DEEB",
    marginBottom: spacing.lg,
    textShadowColor: "#000000",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  preview: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  swatches: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  swatch: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  previewActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
  },
  presetTitle: {
    color: "#FFD34E",
    letterSpacing: 2,
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 8,
    textShadowColor: "#000000",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  presetGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  presetSwatches: {
    flexDirection: "row",
    gap: 6,
  },
  presetSwatch: {
    width: 20,
    height: 20,
    borderRadius: 6,
  },
  selected: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  footer: {
    color: "#D5DEEB",
    fontSize: 12,
    textAlign: "center",
    marginTop: spacing.xl,
    textShadowColor: "#000000",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
