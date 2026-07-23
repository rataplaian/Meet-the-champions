import { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  DEFAULT_PREFERENCES,
  PRESETS,
  colors,
  contrastRatio,
  isDarkBackground,
  radius,
  spacing,
  typography,
  useTheme,
  validateAndFix,
} from "../../src/theme";
import type {
  ThemeBorderStyle,
  ThemeGlowIntensity,
  UserThemePreferences,
} from "@meet-champion/shared";

// Small tap-friendly chip used for enum picks (border/glow style).
function OptionChip({
  label,
  active,
  onPress,
  testID,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  testID: string;
}) {
  return (
    <TouchableOpacity
      testID={testID}
      onPress={onPress}
      style={[
        styles.optChip,
        active && { borderColor: colors.primary, backgroundColor: colors.primary + "22" },
      ]}
    >
      <Text style={[styles.optChipText, active && { color: colors.primary, fontWeight: "700" }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function AppearanceScreen() {
  const { preferences, tokens, setPreset, updatePreferences, reset } = useTheme();
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);

  // Live preview object — recomputed on every change so users see the effect.
  const previewTokens = tokens;

  const applyPreset = async (id: string) => {
    setWarnings([]);
    await setPreset(id);
  };

  const patch = async (p: Partial<UserThemePreferences>) => {
    const merged = { ...preferences, ...p };
    const bgHex = tokens.background.primary;
    const res = validateAndFix(merged, bgHex);
    setWarnings(res.warnings);
    await updatePreferences(p);
  };

  const activeId = preferences.presetId;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: tokens.background.primary }}
      contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}
    >
      {/* Preview card */}
      <View
        style={[
          styles.previewCard,
          {
            backgroundColor: previewTokens.card.background,
            borderColor: previewTokens.card.border,
            shadowColor: previewTokens.card.glow,
          },
        ]}
      >
        <View style={styles.previewRow}>
          <View style={[styles.previewDot, { backgroundColor: previewTokens.action.primary }]} />
          <View style={[styles.previewDot, { backgroundColor: previewTokens.action.secondary }]} />
          <View style={[styles.previewDot, { backgroundColor: previewTokens.action.accent }]} />
        </View>
        <Text style={[styles.previewTitle, { color: previewTokens.text.primary }]}>
          Anteprima tema
        </Text>
        <Text style={[styles.previewBody, { color: previewTokens.text.secondary }]}>
          Prezzi, disponibilità e conferme restano sempre leggibili.
        </Text>
        <View style={styles.previewButtonsRow}>
          <View style={[styles.previewBtn, { backgroundColor: previewTokens.action.primary }]}>
            <Text style={styles.previewBtnText}>Prenota</Text>
          </View>
          <View style={[styles.previewBtn, { backgroundColor: previewTokens.action.success }]}>
            <Text style={styles.previewBtnText}>Disponibile</Text>
          </View>
        </View>
      </View>

      {/* Warnings */}
      {warnings.length > 0 && (
        <View style={styles.warnBox}>
          <Ionicons name="warning" size={16} color={colors.accent} />
          <View style={{ flex: 1 }}>
            {warnings.map((w, i) => (
              <Text key={i} style={styles.warnText}>
                {w}
              </Text>
            ))}
          </View>
        </View>
      )}

      {/* Presets */}
      <Text style={styles.sectionTitle}>Tema della tua squadra</Text>
      <Text style={styles.sectionHint}>
        Scegli un preset. Nessun logo o stemma ufficiale — solo colori.
      </Text>

      <View style={styles.presetGrid}>
        {PRESETS.map((p) => {
          const selected = p.id === activeId;
          return (
            <TouchableOpacity
              key={p.id}
              testID={`preset-${p.id}-card`}
              onPress={() => applyPreset(p.id)}
              style={[
                styles.presetCard,
                { backgroundColor: p.background },
                selected && { borderColor: colors.primary, borderWidth: 2 },
              ]}
            >
              <View style={styles.presetSwatchRow}>
                <View style={[styles.presetSwatch, { backgroundColor: p.primaryColor }]} />
                <View style={[styles.presetSwatch, { backgroundColor: p.secondaryColor }]} />
                <View style={[styles.presetSwatch, { backgroundColor: p.accentColor }]} />
              </View>
              <Text style={styles.presetLabel} numberOfLines={1}>
                {p.label}
              </Text>
              <Text style={styles.presetDesc} numberOfLines={1}>
                {p.description}
              </Text>
              {selected && (
                <View style={styles.presetCheck}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Advanced */}
      <TouchableOpacity
        testID="appearance-toggle-advanced"
        style={styles.advancedToggle}
        onPress={() => setAdvancedOpen((v) => !v)}
      >
        <Ionicons
          name={advancedOpen ? "chevron-down" : "chevron-forward"}
          size={18}
          color={colors.textMuted}
        />
        <Text style={styles.advancedToggleText}>Personalizzazione avanzata</Text>
      </TouchableOpacity>

      {advancedOpen && (
        <View style={styles.advancedBox}>
          <Text style={styles.optLabel}>Cornice</Text>
          <View style={styles.optRow}>
            {(["minimal", "glow", "metallic", "gradient"] as ThemeBorderStyle[]).map((b) => (
              <OptionChip
                key={b}
                testID={`opt-border-${b}`}
                label={b}
                active={preferences.borderStyle === b}
                onPress={() => patch({ borderStyle: b })}
              />
            ))}
          </View>

          <Text style={styles.optLabel}>Intensità glow</Text>
          <View style={styles.optRow}>
            {(["off", "low", "medium"] as ThemeGlowIntensity[]).map((g) => (
              <OptionChip
                key={g}
                testID={`opt-glow-${g}`}
                label={g}
                active={preferences.glowIntensity === g}
                onPress={() => patch({ glowIntensity: g })}
              />
            ))}
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.optLabel}>Pattern decorativo</Text>
            <Switch
              testID="opt-pattern-switch"
              value={preferences.patternEnabled}
              onValueChange={(v) => patch({ patternEnabled: v })}
              trackColor={{ true: colors.primary + "88", false: colors.border }}
              thumbColor={preferences.patternEnabled ? colors.primary : "#ccc"}
            />
          </View>
        </View>
      )}

      <TouchableOpacity testID="appearance-reset" style={styles.resetButton} onPress={reset}>
        <Ionicons name="refresh" size={16} color={colors.danger} />
        <Text style={styles.resetText}>Ripristina tema predefinito</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  previewCard: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    shadowOpacity: 0.6,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    marginBottom: spacing.md,
  },
  previewRow: { flexDirection: "row", gap: 8, marginBottom: spacing.md },
  previewDot: { width: 22, height: 22, borderRadius: 11 },
  previewTitle: { ...typography.h2 },
  previewBody: { marginTop: 6 },
  previewButtonsRow: { flexDirection: "row", gap: 8, marginTop: spacing.md },
  previewBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  previewBtnText: { color: "#07111F", fontWeight: "700", fontSize: 12 },

  warnBox: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#F5C45122",
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: "#F5C45144",
  },
  warnText: { color: colors.accent, fontSize: 12 },

  sectionTitle: {
    ...typography.h2,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: 4,
  },
  sectionHint: { color: colors.textMuted, marginBottom: spacing.md, fontSize: 13 },

  presetGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  presetCard: {
    width: "47%",
    aspectRatio: 1.2,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "space-between",
  },
  presetSwatchRow: { flexDirection: "row", gap: 6 },
  presetSwatch: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#ffffff22",
  },
  presetLabel: { color: colors.text, fontWeight: "700", fontSize: 14 },
  presetDesc: { color: colors.textMuted, fontSize: 11 },
  presetCheck: { position: "absolute", top: 8, right: 8 },

  advancedToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
  },
  advancedToggleText: { color: colors.textMuted, fontWeight: "600" },

  advancedBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.sm,
    gap: spacing.md,
  },
  optLabel: { color: colors.textMuted, fontSize: 13, marginBottom: 6 },
  optRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  optChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optChipText: { color: colors.textMuted, fontSize: 12, textTransform: "capitalize" },

  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.sm,
  },

  resetButton: {
    flexDirection: "row",
    gap: 6,
    alignSelf: "center",
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  resetText: { color: colors.danger, fontWeight: "600" },
});
