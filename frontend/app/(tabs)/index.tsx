import { useEffect, useMemo, useState, useCallback } from "react";
import { Dimensions, FlatList, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
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

export default function Explore() {
  const { tokens } = useTheme();
  const cardW = (Math.min(SCREEN_W, 420) - spacing.md * 3) / 2;
  const [data, setData] = useState<Champion[]>([]);
  const [category, setCategory] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const list = await champStore.list({ category: category ?? undefined });
    setData(list);
  }, [category]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

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
    <View style={{ flex: 1, backgroundColor: tokens.bg }}>
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

      <FlatList
        testID="explore-list" data={filtered} keyExtractor={(i) => i.id} numColumns={2}
        columnWrapperStyle={{ gap: spacing.md, marginBottom: spacing.md }}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tokens.primary} />}
        renderItem={({ item }) => (
          <FifaCard testID={`card-${item.id}`} champ={item} width={cardW}
            onPress={() => router.push(`/champion/${item.id}` as never)} />
        )}
        ListEmptyComponent={
          <View style={{ padding: spacing.xxl, alignItems: "center", gap: spacing.md }}>
            <Ionicons name="search-outline" size={40} color={tokens.border} />
            <Text style={{ color: tokens.textMuted }}>Nessun risultato per "{query}"</Text>
          </View>
        }
        keyboardShouldPersistTaps="handled"
      />
    </View>
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
