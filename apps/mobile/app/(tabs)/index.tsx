import { useEffect, useMemo, useState, useCallback } from "react";
import {
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { champions } from "../../src/services";
import { colors, formatPrice, radius, spacing, typography } from "../../src/theme";
import type { ChampionListItem } from "@meet-champion/shared";

const CATEGORIES = [
  { key: null as string | null, label: "All" },
  { key: "athlete", label: "Athletes" },
  { key: "coach", label: "Coaches" },
  { key: "celebrity", label: "Celebrities" },
  { key: "expert", label: "Experts" },
];

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
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{c.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    ),
    [category],
  );

  const renderItem = ({ item }: { item: ChampionListItem }) => (
    <TouchableOpacity
      testID={`champion-card-${item.profile_id}`}
      style={styles.card}
      onPress={() => router.push(`/champion/${item.profile_id}` as never)}
    >
      <View style={styles.avatar}>
        <Ionicons name="person" size={28} color={colors.textMuted} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardName}>{item.display_name ?? "Champion"}</Text>
        <Text style={styles.cardHeadline} numberOfLines={2}>
          {item.headline}
        </Text>
        <View style={styles.metaRow}>
          <Ionicons name="star" size={14} color={colors.primary} />
          <Text style={styles.metaText}>
            {item.rating_average ? item.rating_average.toFixed(1) : "New"} · {item.total_calls} calls
          </Text>
        </View>
      </View>
      <View style={styles.priceCol}>
        <Text style={styles.price}>{formatPrice(item.hourly_rate_cents, item.currency)}</Text>
        <Text style={styles.priceUnit}>/ {item.call_duration_minutes}m</Text>
      </View>
    </TouchableOpacity>
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
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={<Text style={styles.emptyText}>No champions yet.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  chipRow: { maxHeight: 56, marginTop: spacing.sm },
  chipRowContent: { paddingHorizontal: spacing.md, gap: spacing.sm, alignItems: "center" },
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

  listContent: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl },
  card: {
    flexDirection: "row",
    gap: spacing.md,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  avatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.bgElevated,
    alignItems: "center", justifyContent: "center",
  },
  cardName: { ...typography.h3, color: colors.text },
  cardHeadline: { ...typography.small, color: colors.textMuted, marginTop: 2 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 },
  metaText: { color: colors.textMuted, fontSize: 12 },
  priceCol: { alignItems: "flex-end" },
  price: { color: colors.primary, fontWeight: "700", fontSize: 16 },
  priceUnit: { color: colors.textMuted, fontSize: 12 },

  emptyText: { color: colors.textMuted, textAlign: "center", marginTop: spacing.xl },
  errorText: { color: colors.danger, textAlign: "center", marginTop: spacing.xl, padding: spacing.md },
});
