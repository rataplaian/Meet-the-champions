import { useEffect, useMemo, useState, useCallback } from "react";
import { Dimensions, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn } from "react-native-reanimated";
import { champions as champStore, Champion } from "../../src/store";
import { radius, spacing, useTheme } from "../../src/theme";
import { SkeletonCard } from "../../src/components/Skeleton";
import { hap } from "../../src/utils/haptics";
import { CoverflowRail } from "../../src/components/CoverflowRail";

const CATEGORIES = [
  { key: null as string | null, label: "Tutti" },
  { key: "athlete", label: "Giocatori" },
  { key: "coach", label: "Allenatori" },
  { key: "celebrity", label: "Stars" },
  { key: "expert", label: "Ex Pro" },
];

const { width: SCREEN_W } = Dimensions.get("window");
const SKEL_W = Math.min(220, Math.round(SCREEN_W * 0.56));

export default function Explore() {
  const { tokens } = useTheme();
  const [data, setData] = useState<Champion[]>([]);
  const [category, setCategory] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const list = await champStore.list({ category: category ?? undefined });
    setData(list);
    setLoading(false);
  }, [category]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data;
    return data.filter((c) =>
      c.name.toLowerCase().includes(q) ||
      c.team.toLowerCase().includes(q) ||
      String(c.age) === q,
    );
  }, [data, query]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: tokens.bg }} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
      {/* Search */}
      <View style={[styles.searchWrap, { backgroundColor: tokens.surface, borderColor: tokens.accent + "44" }]}>
        <Ionicons name="search" size={18} color={tokens.accent} />
        <TextInput
          testID="search-input" value={query} onChangeText={setQuery}
          placeholder="Cerca per nome, squadra o età…" placeholderTextColor={tokens.textMuted}
          autoCorrect={false} autoCapitalize="none"
          style={[styles.searchInput, { color: tokens.text }]}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery("")}>
            <Ionicons name="close-circle" size={18} color={tokens.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Category chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={{ maxHeight: 56, marginTop: spacing.sm }}
        contentContainerStyle={{ paddingHorizontal: spacing.md, gap: spacing.sm, alignItems: "center" }}>
        {CATEGORIES.map((c) => {
          const active = c.key === category;
          return (
            <TouchableOpacity key={c.key ?? "all"} onPress={() => { hap.select(); setCategory(c.key); }}
              testID={`cat-${c.key ?? "all"}`}
              style={[styles.chip, { backgroundColor: tokens.surface, borderColor: active ? tokens.primary : tokens.border },
                active && { backgroundColor: tokens.primary + "22" }]}>
              <Text style={{ color: active ? tokens.primary : tokens.textMuted, fontWeight: active ? "700" : "500", fontSize: 13 }}>
                {c.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Featured section header */}
      <View style={{ paddingHorizontal: spacing.md, marginTop: spacing.lg, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={{ color: tokens.accent, letterSpacing: 3, fontSize: 12, fontWeight: "800" }}>◆ MEET THE CHAMPIONS</Text>
        <Text style={{ color: tokens.textMuted, fontSize: 11 }}>Scorri ←→</Text>
      </View>

      {loading ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: spacing.md, paddingVertical: spacing.md, gap: 12 }}>
          {[0, 1, 2, 3].map((i) => <SkeletonCard key={i} width={SKEL_W} height={Math.round(SKEL_W * 1.55)} />)}
        </ScrollView>
      ) : filtered.length === 0 ? (
        <Animated.View entering={FadeIn} style={{ padding: 40, alignItems: "center", gap: 10 }}>
          <View style={{
            width: 68, height: 68, borderRadius: 999,
            backgroundColor: tokens.surface, alignItems: "center", justifyContent: "center",
            borderWidth: 1, borderColor: tokens.accent + "44",
          }}>
            <Ionicons name="search" size={28} color={tokens.accent} />
          </View>
          <Text style={{ color: tokens.text, fontWeight: "700" }}>Nessun risultato</Text>
          <Text style={{ color: tokens.textMuted, fontSize: 12, textAlign: "center" }}>
            Prova un altro nome o squadra
          </Text>
        </Animated.View>
      ) : (
        <CoverflowRail data={filtered} />
      )}

      {/* Center indicator hint */}
      {!loading && filtered.length > 0 && (
        <View style={{ alignItems: "center", marginTop: 4 }}>
          <View style={{ width: 60, height: 3, borderRadius: 2, backgroundColor: tokens.accent + "88" }} />
        </View>
      )}

      {/* Categories quick-jump legend */}
      {!loading && filtered.length > 0 && (
        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.lg, gap: 8 }}>
          <Text style={{ color: tokens.textMuted, fontSize: 11, letterSpacing: 2, fontWeight: "800" }}>
            {filtered.length} CHAMPIONS DISPONIBILI · SCORRI PER SCEGLIERE
          </Text>
        </View>
      )}

      {/* Gold glow at bottom */}
      <LinearGradient
        colors={["transparent", tokens.accent + "11"]}
        style={{ height: 100, marginTop: spacing.lg }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  searchWrap: {
    flexDirection: "row", alignItems: "center", gap: 10,
    marginHorizontal: spacing.md, marginTop: spacing.md,
    paddingHorizontal: spacing.md, paddingVertical: 12,
    borderRadius: radius.pill, borderWidth: 1.5,
  },
  searchInput: { flex: 1, fontSize: 14, padding: 0, outlineStyle: "none" as any },
  chip: {
    height: 36, paddingHorizontal: spacing.md, borderRadius: radius.pill,
    borderWidth: 1, justifyContent: "center", flexShrink: 0,
  },
});
