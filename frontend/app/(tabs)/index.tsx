import { useEffect, useMemo, useState, useCallback } from "react";
import { Dimensions, FlatList, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn } from "react-native-reanimated";
import { champions as champStore, Champion } from "../../src/store";
import { radius, spacing, useTheme } from "../../src/theme";
import { FifaCard } from "../../src/components/FifaCard";
import { SkeletonCard } from "../../src/components/Skeleton";
import { hap } from "../../src/utils/haptics";

const CATEGORIES = [
  { key: null as string | null, label: "Tutti" },
  { key: "athlete", label: "Giocatori" },
  { key: "coach", label: "Allenatori" },
  { key: "celebrity", label: "Stars" },
  { key: "expert", label: "Ex Pro" },
];

const { width: SCREEN_W } = Dimensions.get("window");
const RAIL_CARD_W = Math.min(SCREEN_W * 0.62, 260);
const RAIL_GAP = 16;
// Multiplier that creates an "infinite" feel — the user can scroll left/right
// as far as they want during a session. Cheap trick, no jitter, no edge.
const LOOP = 20;

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

  // Duplicate list N times so the horizontal FlatList feels endless in both
  // directions during a session. The FlatList starts scrolled to the middle.
  const looped = useMemo(() => {
    if (filtered.length === 0) return [];
    const out: (Champion & { _k: string })[] = [];
    for (let i = 0; i < LOOP; i++) {
      for (const c of filtered) out.push({ ...c, _k: `${i}-${c.id}` });
    }
    return out;
  }, [filtered]);

  const initialIndex = filtered.length ? Math.floor(LOOP / 2) * filtered.length : 0;

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
        <Text style={{ color: tokens.accent, letterSpacing: 3, fontSize: 12, fontWeight: "800" }}>◆ FEATURED CHAMPIONS</Text>
        <Text style={{ color: tokens.textMuted, fontSize: 11 }}>Scorri →</Text>
      </View>

      {/* Rail orizzontale a loop — decelerationRate="normal" per scroll fluido */}
      {loading ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: spacing.md, paddingVertical: spacing.md, gap: RAIL_GAP }}>
          {[0, 1, 2, 3].map((i) => <SkeletonCard key={i} width={RAIL_CARD_W} height={RAIL_CARD_W * 1.55} />)}
        </ScrollView>
      ) : (
      <FlatList
        data={looped}
        testID="rail-list"
        keyExtractor={(c) => c._k}
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="normal"
        initialScrollIndex={initialIndex}
        getItemLayout={(_, index) => ({ length: RAIL_CARD_W + RAIL_GAP, offset: (RAIL_CARD_W + RAIL_GAP) * index, index })}
        contentContainerStyle={{ paddingHorizontal: spacing.md, paddingVertical: spacing.md, gap: RAIL_GAP }}
        ItemSeparatorComponent={() => <View style={{ width: RAIL_GAP }} />}
        renderItem={({ item, index }) => (
          <View style={{ marginTop: index % 2 === 0 ? 0 : 12 }}>
            <FifaCard
              testID={`card-${item.id}`}
              champ={item}
              width={RAIL_CARD_W}
              onPress={() => { hap.light(); router.push(`/champion/${item.id}` as never); }}
            />
          </View>
        )}
        ListEmptyComponent={
          <Animated.View entering={FadeIn} style={{ padding: 40, width: SCREEN_W - 32, alignItems: "center", gap: 10 }}>
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
        }
      />
      )}

      {/* Second row rail (reversed) — same loop trick */}
      {filtered.length > 3 && (
        <>
          <View style={{ paddingHorizontal: spacing.md, marginTop: spacing.lg, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={{ color: tokens.accent, letterSpacing: 3, fontSize: 12, fontWeight: "800" }}>★ ALL CHAMPIONS</Text>
          </View>
          <FlatList
            data={[...looped].reverse()}
            testID="rail-list-2"
            keyExtractor={(c) => "r-" + c._k}
            horizontal
            showsHorizontalScrollIndicator={false}
            decelerationRate="normal"
            initialScrollIndex={initialIndex}
            getItemLayout={(_, index) => ({ length: RAIL_CARD_W * 0.85 + RAIL_GAP, offset: (RAIL_CARD_W * 0.85 + RAIL_GAP) * index, index })}
            contentContainerStyle={{ paddingHorizontal: spacing.md, paddingVertical: spacing.md, gap: RAIL_GAP }}
            ItemSeparatorComponent={() => <View style={{ width: RAIL_GAP }} />}
            renderItem={({ item }) => (
              <FifaCard
                testID={`card-r-${item.id}`}
                champ={item}
                width={RAIL_CARD_W * 0.85}
                onPress={() => { hap.light(); router.push(`/champion/${item.id}` as never); }}
              />
            )}
          />
        </>
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
