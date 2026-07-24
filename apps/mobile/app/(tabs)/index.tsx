import { useEffect, useMemo, useState, useCallback } from "react";
import { Dimensions, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn } from "react-native-reanimated";
import { champions as champStore, favorites as favoriteStore, Champion } from "../../src/store";
import { radius, spacing, useTheme } from "../../src/theme";
import { SkeletonCard } from "../../src/components/Skeleton";
import { hap } from "../../src/utils/haptics";
import { championCardPhotoUri } from "../../src/utils/championPhotos";
import { CoverflowRail } from "../../src/components/CoverflowRail";

const CATEGORIES = [
  { key: null as string | null, label: "Tutti", icon: "apps-outline" as const },
  { key: "favorites", label: "Preferiti", icon: "star" as const },
  { key: "athlete", label: "Giocatori", icon: "football-outline" as const },
  { key: "coach", label: "Allenatori", icon: "clipboard-outline" as const },
  { key: "celebrity", label: "Stars", icon: "sparkles-outline" as const },
  { key: "expert", label: "Ex Pro", icon: "ribbon-outline" as const },
];

const { width: SCREEN_W } = Dimensions.get("window");
const SKEL_W = Math.min(220, Math.round(SCREEN_W * 0.56));
const WARMED_PHOTOS = new Set<string>();

async function warmChampionPhotos(list: Champion[]) {
  const urls = [...new Set(list.map((champion) => championCardPhotoUri(champion.photoUrl)))]
    .filter((url) => !WARMED_PHOTOS.has(url));

  await Promise.allSettled(
    urls.map(async (url) => {
      const loaded = await Image.prefetch(url);
      if (loaded !== false) WARMED_PHOTOS.add(url);
    }),
  );
}

export default function Explore() {
  const { tokens } = useTheme();
  const [data, setData] = useState<Champion[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [category, setCategory] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [list, savedFavorites] = await Promise.all([
      champStore.list(),
      favoriteStore.list(),
    ]);
    await warmChampionPhotos(list);
    setData(list);
    setFavoriteIds(new Set(savedFavorites));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const visible = category === "favorites"
      ? data.filter((c) => favoriteIds.has(c.id))
      : category
        ? data.filter((c) => c.category === category)
        : data;
    if (!q) return visible;
    return visible.filter((c) =>
      c.name.toLowerCase().includes(q) ||
      c.team.toLowerCase().includes(q) ||
      String(c.age) === q,
    );
  }, [category, data, favoriteIds, query]);

  const toggleFavorite = useCallback(async (championId: string) => {
    const wasFavorite = favoriteIds.has(championId);
    const next = new Set(favoriteIds);
    if (wasFavorite) next.delete(championId);
    else next.add(championId);
    setFavoriteIds(next);
    if (wasFavorite) hap.light();
    else hap.success();
    await favoriteStore.set(championId, !wasFavorite);
  }, [favoriteIds]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: tokens.bg }} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
      {/* Search */}
      <View style={[styles.searchWrap, { backgroundColor: tokens.surface, borderColor: tokens.border, shadowColor: tokens.primary }]}>
        <Ionicons name="search" size={18} color={tokens.primary} />
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
                active && { backgroundColor: tokens.primary }]}>
              <Ionicons name={c.icon} size={14} color={active ? "#FFFFFF" : c.key === "favorites" ? "#C78300" : tokens.textMuted} />
              <Text style={{ color: active ? "#FFFFFF" : tokens.textMuted, fontWeight: active ? "700" : "500", fontSize: 13 }}>
                {c.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Featured section header */}
      <View style={{ paddingHorizontal: spacing.md, marginTop: spacing.lg, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
          <Ionicons name="star" size={13} color="#E4A400" />
          <Text style={{ color: tokens.primary, letterSpacing: 2, fontSize: 12, fontWeight: "900" }}>MEET THE CHAMPIONS</Text>
        </View>
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
            {category === "favorites" ? "Tocca la stellina su un campione per ritrovarlo qui" : "Prova un altro nome o squadra"}
          </Text>
        </Animated.View>
      ) : (
        <CoverflowRail
          data={filtered}
          favoriteIds={favoriteIds}
          onToggleFavorite={toggleFavorite}
        />
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
            {filtered.length === 1
              ? "1 CHAMPION DISPONIBILE · SCORRI PER SCEGLIERE"
              : `${filtered.length} CHAMPIONS DISPONIBILI · SCORRI PER SCEGLIERE`}
          </Text>
        </View>
      )}

      {/* Gold glow at bottom */}
      <LinearGradient
        colors={["transparent", tokens.secondary + "10", tokens.accent + "14"]}
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
    shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  searchInput: { flex: 1, fontSize: 14, padding: 0, outlineStyle: "none" as any },
  chip: {
    height: 36, paddingHorizontal: 13, borderRadius: radius.pill,
    borderWidth: 1, justifyContent: "center", alignItems: "center",
    flexDirection: "row", gap: 6, flexShrink: 0,
  },
});
