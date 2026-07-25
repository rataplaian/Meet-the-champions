import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn } from "react-native-reanimated";
import {
  champions as champStore,
  favorites as favoriteStore,
  type Champion,
} from "../../src/store";
import { radius, spacing } from "../../src/theme";
import { SkeletonCard } from "../../src/components/Skeleton";
import { hap } from "../../src/utils/haptics";
import { championCardPhotoUri } from "../../src/utils/championPhotos";
import { CoverflowRail } from "../../src/components/CoverflowRail";

const HUB_BACKGROUND = require("../../assets/images/champions-hub-bg.jpg");

const HUB_RAILS = [
  {
    key: "all",
    label: "TUTTI",
    icon: "apps-outline" as const,
    includes: (_champion: Champion) => true,
  },
  {
    key: "coaches",
    label: "ALLENATORI",
    icon: "clipboard-outline" as const,
    includes: (champion: Champion) => champion.category === "coach",
  },
  {
    key: "serie-a",
    label: "SERIE A",
    icon: "shield-outline" as const,
    includes: (champion: Champion) => champion.italianLeagues?.includes("serie-a") ?? false,
  },
  {
    key: "serie-b",
    label: "SERIE B",
    icon: "shield-outline" as const,
    includes: (champion: Champion) => champion.italianLeagues?.includes("serie-b") ?? false,
  },
  {
    key: "serie-c",
    label: "SERIE C",
    icon: "shield-outline" as const,
    includes: (champion: Champion) => champion.italianLeagues?.includes("serie-c") ?? false,
  },
  {
    key: "serie-d",
    label: "SERIE D",
    icon: "shield-outline" as const,
    includes: (champion: Champion) => champion.italianLeagues?.includes("serie-d") ?? false,
  },
  {
    key: "legend",
    label: "LEGEND",
    icon: "trophy-outline" as const,
    includes: (champion: Champion) => champion.category === "expert",
  },
] as const;

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
  const [data, setData] = useState<Champion[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
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

  const rails = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matching = q
      ? data.filter((champion) =>
        champion.name.toLowerCase().includes(q) ||
        champion.team.toLowerCase().includes(q) ||
        String(champion.age) === q)
      : data;

    return HUB_RAILS
      .map((rail) => ({
        ...rail,
        champions: matching.filter(rail.includes),
      }))
      .filter((rail) => rail.champions.length > 0);
  }, [data, query]);

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
    <View style={styles.screen}>
      <Image
        source={HUB_BACKGROUND}
        resizeMode="cover"
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={["#02091522", "#02091544", "#02091588"]}
        locations={[0, 0.45, 1]}
        style={[StyleSheet.absoluteFill, styles.noPointerEvents]}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color="#174C9A" />
          <TextInput
            testID="search-input"
            value={query}
            onChangeText={setQuery}
            placeholder="Cerca per nome, squadra o età…"
            placeholderTextColor="#66758A"
            autoCorrect={false}
            autoCapitalize="none"
            style={styles.searchInput}
          />
          {query.length > 0 && (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Cancella ricerca"
              onPress={() => setQuery("")}
            >
              <Ionicons name="close-circle" size={19} color="#66758A" />
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <View style={styles.loadingSection}>
            <SectionHeader label="TUTTI" count={0} icon="apps-outline" />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.skeletons}
            >
              {[0, 1, 2, 3].map((index) => (
                <SkeletonCard
                  key={index}
                  width={SKEL_W}
                  height={Math.round(SKEL_W * 1.55)}
                />
              ))}
            </ScrollView>
          </View>
        ) : rails.length === 0 ? (
          <Animated.View entering={FadeIn} style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="search" size={28} color="#FFD34E" />
            </View>
            <Text style={styles.emptyTitle}>Nessun risultato</Text>
            <Text style={styles.emptyCopy}>Prova un altro nome o squadra</Text>
          </Animated.View>
        ) : (
          rails.map((rail) => (
            <View key={rail.key} style={styles.railSection}>
              <SectionHeader
                label={rail.label}
                count={rail.champions.length}
                icon={rail.icon}
              />
              <CoverflowRail
                data={rail.champions}
                favoriteIds={favoriteIds}
                onToggleFavorite={toggleFavorite}
                testID={`rail-${rail.key}`}
                cardTestIdPrefix={`${rail.key}-card-`}
                primary={rail.key === "all"}
              />
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function SectionHeader({
  label,
  count,
  icon,
}: {
  label: string;
  count: number;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleWrap}>
        <View style={styles.goldRule} />
        <Ionicons name={icon} size={16} color="#FFD34E" />
        <Text style={styles.sectionTitle}>{label}</Text>
      </View>
      {count > 0 ? (
        <Text style={styles.sectionCount}>
          {count === 1 ? "1 CHAMPION" : `${count} CHAMPIONS`}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#031027",
  },
  scroll: {
    flex: 1,
    backgroundColor: "transparent",
  },
  noPointerEvents: {
    pointerEvents: "none",
  },
  content: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: "#E8B93A",
    backgroundColor: "#F8FBFFEE",
    shadowColor: "#000000",
    shadowOpacity: 0.24,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  searchInput: {
    flex: 1,
    color: "#07111F",
    fontSize: 14,
    padding: 0,
    outlineStyle: "none" as any,
  },
  loadingSection: {
    marginTop: spacing.sm,
  },
  skeletons: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: 12,
  },
  railSection: {
    marginTop: spacing.sm,
  },
  sectionHeader: {
    minHeight: 38,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  goldRule: {
    width: 4,
    height: 22,
    borderRadius: 2,
    backgroundColor: "#FFD34E",
    shadowColor: "#FFD34E",
    shadowOpacity: 0.7,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0,
    textShadowColor: "#000000CC",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 5,
  },
  sectionCount: {
    color: "#D7E6FF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0,
    textShadowColor: "#000000",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  empty: {
    minHeight: 360,
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  emptyIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#071B38DD",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FFD34E88",
  },
  emptyTitle: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 17,
  },
  emptyCopy: {
    color: "#D7E6FF",
    fontSize: 12,
    textAlign: "center",
  },
});
