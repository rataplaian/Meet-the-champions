// =============================================================================
// Meet Champion — FIFA-style preview landing.
// Minimal card: full-bleed portrait + name + age + last team.
// Real photos from Wikimedia Commons (CC-licensed).
// Includes a search bar filtering by name / team / age.
// =============================================================================
import { useMemo, useState } from "react";
import {
  Dimensions,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";

type Category = "athlete" | "coach" | "celebrity" | "expert";

interface Champ {
  name: string;
  age: number;
  team: string;
  category: Category;
  photo: string;
}

const CHAMPS: Champ[] = [
  {
    name: "CRISTIANO RONALDO",
    age: 41,
    team: "Al-Nassr",
    category: "celebrity",
    photo: "https://upload.wikimedia.org/wikipedia/commons/8/8c/Cristiano_Ronaldo_2018.jpg",
  },
  {
    name: "LIONEL MESSI",
    age: 38,
    team: "Inter Miami",
    category: "celebrity",
    photo: "https://upload.wikimedia.org/wikipedia/commons/c/c1/Lionel_Messi_20180626.jpg",
  },
  {
    name: "KYLIAN MBAPPÉ",
    age: 27,
    team: "Real Madrid",
    category: "celebrity",
    photo: "https://upload.wikimedia.org/wikipedia/commons/e/e5/Kylian_Mbapp%C3%A9_2018.jpg",
  },
  {
    name: "ERLING HAALAND",
    age: 25,
    team: "Manchester City",
    category: "athlete",
    photo: "https://upload.wikimedia.org/wikipedia/commons/0/07/Erling_Haaland_2023_%28cropped%29.jpg",
  },
  {
    name: "JUDE BELLINGHAM",
    age: 22,
    team: "Real Madrid",
    category: "athlete",
    photo: "https://upload.wikimedia.org/wikipedia/commons/2/23/Jude_Bellingham_England_v_Ghana_23_June_2026-061_%28cropped%29.jpg",
  },
  {
    name: "PEP GUARDIOLA",
    age: 55,
    team: "Manchester City",
    category: "coach",
    photo: "https://upload.wikimedia.org/wikipedia/commons/a/a0/Pep_Guardiola.jpg",
  },
  {
    name: "CARLO ANCELOTTI",
    age: 66,
    team: "Brazil NT",
    category: "coach",
    photo: "https://upload.wikimedia.org/wikipedia/commons/e/e9/Carlo_Ancelotti_Brazil_V_Morocco_13_June_2026-34.jpg",
  },
];

const CATEGORY_GRADIENT: Record<Category, readonly [string, string, string]> = {
  athlete:   ["#3D0F0F", "#B22222", "#F5C451"],   // deep red → crimson → premium gold
  coach:     ["#08142D", "#1677FF", "#27C2FF"],   // royal blue → electric blue → sky
  celebrity: ["#3B2A00", "#B98728", "#F5C451"],   // bronze → dark gold → premium gold
  expert:    ["#0F2E1F", "#116546", "#2ED47A"],   // dark green → emerald → confirm green
};

const CATEGORY_LABEL: Record<Category, string> = {
  athlete: "PLAYERS",
  coach: "COACHES",
  celebrity: "STARS",
  expert: "EXPERTS",
};

const { width: SCREEN_W } = Dimensions.get("window");
const CARD_W = Math.min(SCREEN_W - 48, 300);
const CARD_H = CARD_W * 1.55;

export default function PreviewLanding() {
  const { width: winW } = useWindowDimensions();
  const contentW = Math.min(winW - 48, 342);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CHAMPS;
    return CHAMPS.filter((c) =>
      c.name.toLowerCase().includes(q) ||
      c.team.toLowerCase().includes(q) ||
      String(c.age) === q ||
      c.category.toLowerCase().includes(q),
    );
  }, [query]);

  const featured = filtered[0] ?? null;
  const rest = filtered.slice(1);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Brand header */}
        <View style={styles.brandHeader}>
          <View style={styles.logoDot} />
          <Text style={styles.brand}>MEET CHAMPION</Text>
        </View>
        <Text style={styles.tagline}>Book 1:1 video calls with your heroes.</Text>

        {/* Search bar */}
        <View style={[styles.searchWrap, { width: contentW }]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            testID="preview-search-input"
            value={query}
            onChangeText={setQuery}
            placeholder="Search by name, team or age…"
            placeholderTextColor="#8892A6"
            style={styles.searchInput}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <Text
              onPress={() => setQuery("")}
              style={styles.searchClear}
              suppressHighlighting
            >
              ✕
            </Text>
          )}
        </View>

        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔎</Text>
            <Text style={styles.emptyText}>No champion matches “{query}”.</Text>
          </View>
        ) : (
          <>
            {/* Featured card (large) */}
            {featured && (
              <View style={styles.featureWrap}>
                <ChampionCard champ={featured} size="large" />
              </View>
            )}

            {rest.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>ROSTER</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.rowContent}
                >
                  {rest.map((c) => (
                    <ChampionCard key={c.name} champ={c} size="medium" />
                  ))}
                </ScrollView>
              </>
            )}
          </>
        )}

        {/* Category legend */}
        <Text style={styles.sectionLabel}>CATEGORIES</Text>
        <View style={styles.legendRow}>
          {(Object.keys(CATEGORY_LABEL) as Category[]).map((c) => (
            <View key={c} style={styles.legendCell}>
              <LinearGradient
                colors={CATEGORY_GRADIENT[c]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.legendChip}
              />
              <Text style={styles.legendLabel}>{CATEGORY_LABEL[c]}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.footNote}>
          Portable · Supabase · Stripe · Daily · Resend
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// -----------------------------------------------------------------------------
// FIFA-style minimal card
// -----------------------------------------------------------------------------
function ChampionCard({
  champ,
  size = "medium",
}: {
  champ: Champ;
  size?: "medium" | "large";
}) {
  const w = size === "large" ? CARD_W : CARD_W * 0.72;
  const h = size === "large" ? CARD_H : CARD_H * 0.72;
  const gradient = CATEGORY_GRADIENT[champ.category];

  return (
    <View style={[styles.card, { width: w, height: h }]}>
      <Image
        source={{ uri: champ.photo }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />
      <LinearGradient
        colors={[gradient[0] + "aa", gradient[1] + "33", gradient[2] + "11"]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={["transparent", "#000000ee"]}
        style={[StyleSheet.absoluteFill, { top: "50%" }]}
      />

      <View style={[styles.bottom, { padding: w * 0.075 }]}>
        <Text
          style={[styles.name, { fontSize: w * 0.082, lineHeight: w * 0.088 }]}
          numberOfLines={2}
        >
          {champ.name}
        </Text>
        <Text style={[styles.subrole, { fontSize: w * 0.05 }]} numberOfLines={1}>
          {champ.age} · {champ.team.toUpperCase()}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#07111F" },
  scrollContent: { paddingVertical: 24, alignItems: "center" },

  brandHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  logoDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#F5C451" },
  brand: {
    color: "#F7FAFC",
    fontWeight: "800",
    letterSpacing: 4,
    fontSize: 14,
  },
  tagline: { color: "#A5B1C2", fontSize: 13, marginTop: 6, marginBottom: 20 },

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#122638",
    borderWidth: 1.5,
    borderColor: "#F5C45144",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 24,
    shadowColor: "#1677FF",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  searchInput: {
    flex: 1,
    color: "#F7FAFC",
    fontSize: 15,
    padding: 0,
    outlineStyle: "none" as any,
  },
  searchIcon: { fontSize: 16, color: "#F5C451" },
  searchClear: { fontSize: 16, color: "#A5B1C2", paddingHorizontal: 4 },

  featureWrap: { alignItems: "center", marginBottom: 12 },

  sectionLabel: {
    alignSelf: "flex-start",
    color: "#A5B1C2",
    letterSpacing: 3,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 24,
    marginBottom: 12,
    marginLeft: 24,
  },
  rowContent: { paddingHorizontal: 24, gap: 12 },

  emptyState: { alignItems: "center", padding: 40, gap: 12 },
  emptyIcon: { fontSize: 36 },
  emptyText: { color: "#A5B1C2", fontSize: 14, textAlign: "center" },

  // Card
  card: {
    borderRadius: 42,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#F5C45166",
    backgroundColor: "#07111F",
    shadowColor: "#1677FF",
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 14,
  },
  bottom: { position: "absolute", left: 0, right: 0, bottom: 0 },
  name: {
    color: "#F7FAFC",
    fontWeight: "900",
    letterSpacing: 1,
    textShadowColor: "#000000cc",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  subrole: {
    color: "#F5C451",
    fontWeight: "700",
    marginTop: 4,
    letterSpacing: 2,
  },

  legendRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    paddingHorizontal: 24,
  },
  legendCell: { alignItems: "center", gap: 6 },
  legendChip: {
    width: 44,
    height: 44,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F5C45144",
  },
  legendLabel: {
    color: "#A5B1C2",
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: "600",
  },

  footNote: {
    color: "#284258",
    fontSize: 10,
    letterSpacing: 2,
    marginTop: 40,
    marginBottom: 8,
  },
});
