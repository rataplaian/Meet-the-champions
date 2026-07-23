import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Dimensions,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { champions } from "../../src/services";
import { colors, radius, spacing } from "../../src/theme";
import { FifaCard } from "../../src/components/FifaCard";
import type { ChampionListItem } from "@meet-champion/shared";

const CATEGORIES = [
  { key: null as string | null, label: "All" },
  { key: "athlete", label: "Players" },
  { key: "coach", label: "Coaches" },
  { key: "celebrity", label: "Stars" },
  { key: "expert", label: "Experts" },
];

const { width: SCREEN_W } = Dimensions.get("window");
const CARD_W = (SCREEN_W - spacing.md * 3) / 2;

export default function Explore() {
  const [data, setData] = useState<ChampionListItem[]>([]);
  const [category, setCategory] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const list = await champions.list({ category: category ?? undefined });
      setData(list);
    } catch (e: any) {
      setError(e.message ?? "Failed to load champions");
    }
  }, [category]);

  useEffect(() => {
    let ok = true;
    (async () => {
      setLoading(true);
      await load();
      if (ok) setLoading(false);
    })();
    return () => {
      ok = false;
    };
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  // Client-side filter by name / team / age
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data;
    return data.filter((item) => {
      const name = (item.display_name ?? "").toLowerCase();
      const team = (item.last_team ?? "").toLowerCase();
      const age = item.birth_year
        ? String(new Date().getFullYear() - item.birth_year)
        : "";
      return name.includes(q) || team.includes(q) || age === q;
    });
  }, [data, query]);

  const searchBar = (
    <View style={styles.searchWrap}>
      <Ionicons name="search" size={18} color={colors.textMuted} />
      <TextInput
        testID="explore-search-input"
        value={query}
        onChangeText={setQuery}
        placeholder="Search by name, team or age…"
        placeholderTextColor={colors.textMuted}
        style={styles.searchInput}
        autoCorrect={false}
        autoCapitalize="none"
      />
      {query.length > 0 && (
        <TouchableOpacity onPress={() => setQuery("")} testID="explore-clear-search">
          <Ionicons name="close-circle" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      )}
    </View>
  );

  const chipRow = useMemo(
    () => (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRowContent}
        style={styles.chipRow}
      >
        {CATEGORIES.map((c) => {
          const active = c.key === category;
          return (
            <TouchableOpacity
              key={c.key ?? "all"}
              testID={`explore-category-${c.key ?? "all"}-chip`}
              onPress={() => setCategory(c.key)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {c.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    ),
    [category],
  );

  const renderItem = ({ item }: { item: ChampionListItem }) => {
    const age = item.birth_year
      ? new Date().getFullYear() - item.birth_year
      : null;
    return (
      <FifaCard
        testID={`champion-card-${item.profile_id}`}
        width={CARD_W}
        onPress={() => router.push(`/champion/${item.profile_id}` as never)}
        champ={{
          id: item.profile_id,
          name: item.display_name ?? "Champion",
          age,
          team: item.last_team,
          category: item.category,
          photoUrl: item.avatar_url,
        }}
      />
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {searchBar}
        {chipRow}
      </View>

      {loading ? (
        <Text style={styles.emptyText}>Loading…</Text>
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <FlatList
          testID="explore-champions-list"
          data={filtered}
          keyExtractor={(i) => i.profile_id}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperStyle={styles.rowWrap}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={40} color={colors.border} />
              <Text style={styles.emptyText}>
                {query ? `No match for “${query}”.` : "No champions yet."}
              </Text>
            </View>
          }
          keyboardShouldPersistTaps="handled"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { paddingTop: spacing.sm },

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    padding: 0,
  },

  chipRow: { maxHeight: 56, marginTop: spacing.sm },
  chipRowContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    alignItems: "center",
  },
  chip: {
    height: 36,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
    flexShrink: 0,
  },
  chipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + "22",
  },
  chipText: { color: colors.textMuted, fontSize: 13 },
  chipTextActive: { color: colors.primary, fontWeight: "600" },

  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  rowWrap: { gap: spacing.md, marginBottom: spacing.md },

  emptyState: { alignItems: "center", padding: spacing.xl, gap: spacing.md },
  emptyText: { color: colors.textMuted, textAlign: "center" },
  errorText: {
    color: colors.danger,
    textAlign: "center",
    marginTop: spacing.xl,
    padding: spacing.md,
  },
});
