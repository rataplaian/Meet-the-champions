import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Dimensions,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import { champions } from "../../src/services";
import { colors, radius, spacing } from "../../src/theme";
import { FifaCard } from "../../src/components/FifaCard";
import type { ChampionListItem } from "@meet-champion/shared";

const CATEGORIES = [
  { key: null as string | null, label: "All" },
  { key: "athlete", label: "Athletes" },
  { key: "coach", label: "Coaches" },
  { key: "celebrity", label: "Celebrities" },
  { key: "expert", label: "Experts" },
];

const { width: SCREEN_W } = Dimensions.get("window");
const CARD_W = (SCREEN_W - spacing.md * 3) / 2;   // 2-column grid

export default function Explore() {
  const [data, setData] = useState<ChampionListItem[]>([]);
  const [category, setCategory] = useState<string | null>(null);
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

  const renderItem = ({ item }: { item: ChampionListItem }) => (
    <FifaCard
      testID={`champion-card-${item.profile_id}`}
      width={CARD_W}
      onPress={() => router.push(`/champion/${item.profile_id}` as never)}
      champ={{
        id: item.profile_id,
        name: item.display_name ?? "Champion",
        category: item.category,
        callsDone: item.total_calls,
        ratingAvg: item.rating_average,
        priceCents: item.hourly_rate_cents,
        durationMin: item.call_duration_minutes,
        languages: item.languages,
        photoUrl: item.avatar_url,
      }}
    />
  );

  return (
    <View style={styles.container}>
      {chipRow}
      {loading ? (
        <Text style={styles.emptyText}>Loading…</Text>
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <FlatList
          testID="explore-champions-list"
          data={data}
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
          ListEmptyComponent={<Text style={styles.emptyText}>No champions yet.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
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
  chipActive: { borderColor: colors.primary, backgroundColor: colors.primary + "22" },
  chipText: { color: colors.textMuted, fontSize: 13 },
  chipTextActive: { color: colors.primary, fontWeight: "600" },

  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  rowWrap: { gap: spacing.md, marginBottom: spacing.md },

  emptyText: { color: colors.textMuted, textAlign: "center", marginTop: spacing.xl },
  errorText: {
    color: colors.danger,
    textAlign: "center",
    marginTop: spacing.xl,
    padding: spacing.md,
  },
});
