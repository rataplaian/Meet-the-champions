import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PRESETS, radius, spacing, useTheme } from "../../src/theme";

export default function Appearance() {
  const { preset, tokens, setPreset } = useTheme();
  return (
    <ScrollView style={{ flex: 1, backgroundColor: tokens.bg }} contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}>
      <Text style={{ color: tokens.text, fontSize: 22, fontWeight: "800", marginBottom: 4 }}>Tema della tua squadra</Text>
      <Text style={{ color: tokens.textMuted, marginBottom: spacing.lg }}>
        Nessun logo o stemma ufficiale — solo palette cromatiche.
      </Text>

      {/* Anteprima */}
      <View style={{ backgroundColor: tokens.surface, borderColor: tokens.accent + "44", borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.lg }}>
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
          <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: tokens.primary }} />
          <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: tokens.secondary }} />
          <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: tokens.accent }} />
        </View>
        <Text style={{ color: tokens.text, fontSize: 20, fontWeight: "800" }}>Anteprima tema</Text>
        <Text style={{ color: tokens.textMuted, marginTop: 4 }}>Prezzi, prenotazione e conferme restano sempre leggibili.</Text>
        <View style={{ flexDirection: "row", gap: 8, marginTop: 14 }}>
          <View style={{ backgroundColor: tokens.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 }}>
            <Text style={{ color: tokens.bg, fontWeight: "800", fontSize: 12 }}>Prenota</Text>
          </View>
          <View style={{ backgroundColor: tokens.success, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 }}>
            <Text style={{ color: "#07111F", fontWeight: "800", fontSize: 12 }}>Disponibile</Text>
          </View>
        </View>
      </View>

      <Text style={{ color: tokens.accent, letterSpacing: 2, fontSize: 12, fontWeight: "800", marginBottom: 8 }}>PRESET</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md }}>
        {PRESETS.map((p) => {
          const selected = p.id === preset.id;
          return (
            <TouchableOpacity key={p.id} testID={`preset-${p.id}`} onPress={() => setPreset(p.id)}
              style={{
                width: "47%", aspectRatio: 1.2, borderRadius: radius.lg, padding: spacing.md,
                backgroundColor: p.background,
                borderWidth: selected ? 2 : 1,
                borderColor: selected ? tokens.primary : tokens.border,
                justifyContent: "space-between",
              }}>
              <View style={{ flexDirection: "row", gap: 6 }}>
                <View style={{ width: 20, height: 20, borderRadius: 6, backgroundColor: p.primary }} />
                <View style={{ width: 20, height: 20, borderRadius: 6, backgroundColor: p.secondary }} />
                <View style={{ width: 20, height: 20, borderRadius: 6, backgroundColor: p.accent }} />
              </View>
              <View>
                <Text style={{ color: "#F7FAFC", fontWeight: "700", fontSize: 14 }}>{p.label}</Text>
                <Text style={{ color: "#A5B1C2", fontSize: 11, marginTop: 2 }}>{p.description}</Text>
              </View>
              {selected && (
                <View style={{ position: "absolute", top: 8, right: 8 }}>
                  <Ionicons name="checkmark-circle" size={20} color={tokens.primary} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={{ color: tokens.textMuted, fontSize: 12, textAlign: "center", marginTop: spacing.xl }}>
        Il tema è decorativo. Verde (conferme) e rosso (errori) non cambiano mai.
      </Text>
    </ScrollView>
  );
}
