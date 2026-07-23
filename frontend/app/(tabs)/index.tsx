import { useEffect, useMemo, useState, useCallback } from "react";
import { Dimensions, FlatList, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { champions as champStore, Champion } from "../../src/store";
import { radius, spacing, useTheme } from "../../src/theme";
import { FifaCard } from "../../src/components/FifaCard";

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

export default function Explore() {
  const { tokens } = useTheme();
  const [data, setData] = useState<Champion[]>([]);
  const [category, setCategory] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    const list = await champStore.list({ category: category ?? undefined });
    setData(list);
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

  const featured = filtered.slice(0, 3);
  const others = filtered.slice(3);

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
            <TouchableOpacity key={c.key ?? "all"} onPress={() => setCategory(c.key)}
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

      {/* Rail orizzontale fluido — decelerationRate="normal" = roulette-like */}
      <FlatList
        data={filtered}
        testID="rail-list"
        keyExtractor={(c) => c.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="normal"
        snapToAlignment="start"
        contentContainerStyle={{ paddingHorizontal: spacing.md, paddingVertical: spacing.md, gap: RAIL_GAP }}
        ItemSeparatorComponent={() => <View style={{ width: RAIL_GAP }} />}
        renderItem={({ item, index }) => (
          <View style={{ marginTop: index % 2 === 0 ? 0 : 12 }}>
            <FifaCard
              testID={`card-${item.id}`}
              champ={item}
              width={RAIL_CARD_W}
              onPress={() => router.push(`/champion/${item.id}` as never)}
            />
          </View>
        )}
        ListEmptyComponent={
          <View style={{ padding: 40, width: SCREEN_W - 32, alignItems: "center", gap: 8 }}>
            <Text style={{ color: tokens.textMuted }}>Nessun risultato per "{query}"</Text>
          </View>
        }
      />

      {/* Second row rail (reversed) */}
      {filtered.length > 3 && (
        <>
          <View style={{ paddingHorizontal: spacing.md, marginTop: spacing.lg, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={{ color: tokens.accent, letterSpacing: 3, fontSize: 12, fontWeight: "800" }}>★ ALL CHAMPIONS</Text>
          </View>
          <FlatList
            data={[...filtered].reverse()}
            testID="rail-list-2"
            keyExtractor={(c) => "r-" + c.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            decelerationRate="normal"
            contentContainerStyle={{ paddingHorizontal: spacing.md, paddingVertical: spacing.md, gap: RAIL_GAP }}
            ItemSeparatorComponent={() => <View style={{ width: RAIL_GAP }} />}
            renderItem={({ item }) => (
              <FifaCard
                testID={`card-r-${item.id}`}
                champ={item}
                width={RAIL_CARD_W * 0.85}
                onPress={() => router.push(`/champion/${item.id}` as never)}
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
