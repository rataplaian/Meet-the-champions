// =============================================================================
// Meet Champion — FIFA-style preview landing.
// Vertical player-card aesthetic with rounded chamfered corners, category
// gradient, portrait, rating badge, and stat grid.
// =============================================================================
import { useMemo } from "react";
import {
  Dimensions,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";

type Category = "athlete" | "coach" | "celebrity" | "expert";

interface Champ {
  name: string;
  role: string;         // e.g. "Coach", "Striker"
  age: number;
  category: Category;
  overall: number;      // out of 99, FIFA-style
  callsDone: number;
  ratingAvg: number;
  priceUsd: number;
  durationMin: number;
  languages: string[];
  photo: string;
  countryFlag: string;
}

const CHAMPS: Champ[] = [
  {
    name: "MARTA ROSSI",
    role: "Sprint Coach",
    age: 32,
    category: "athlete",
    overall: 94,
    callsDone: 218,
    ratingAvg: 4.9,
    priceUsd: 49,
    durationMin: 15,
    languages: ["EN", "IT"],
    countryFlag: "IT",
    photo: "https://images.unsplash.com/photo-1594381898411-846e7d193883?w=600&q=80",
  },
  {
    name: "JORDAN STEEL",
    role: "Startup Mentor",
    age: 41,
    category: "coach",
    overall: 91,
    callsDone: 340,
    ratingAvg: 4.8,
    priceUsd: 99,
    durationMin: 30,
    languages: ["EN"],
    countryFlag: "US",
    photo: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&q=80",
  },
  {
    name: "NINA VOICE",
    role: "Vocal Coach",
    age: 29,
    category: "celebrity",
    overall: 97,
    callsDone: 512,
    ratingAvg: 5.0,
    priceUsd: 129,
    durationMin: 20,
    languages: ["EN", "FR"],
    countryFlag: "FR",
    photo: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=600&q=80",
  },
  {
    name: "KENJI TANAKA",
    role: "AI Researcher",
    age: 37,
    category: "expert",
    overall: 89,
    callsDone: 96,
    ratingAvg: 4.7,
    priceUsd: 79,
    durationMin: 25,
    languages: ["EN", "JP"],
    countryFlag: "JP",
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80",
  },
  {
    name: "LUCA BIANCHI",
    role: "Football Trainer",
    age: 45,
    category: "athlete",
    overall: 88,
    callsDone: 154,
    ratingAvg: 4.6,
    priceUsd: 59,
    durationMin: 20,
    languages: ["IT", "ES"],
    countryFlag: "IT",
    photo: "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=600&q=80",
  },
  {
    name: "AYA MORENO",
    role: "Dance Choreographer",
    age: 27,
    category: "celebrity",
    overall: 92,
    callsDone: 287,
    ratingAvg: 4.9,
    priceUsd: 89,
    durationMin: 20,
    languages: ["EN", "ES"],
    countryFlag: "ES",
    photo: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=600&q=80",
  },
];

const CATEGORY_GRADIENT: Record<Category, readonly [string, string, string]> = {
  athlete:   ["#3D0F0F", "#B22222", "#F5C518"],   // deep red → crimson → gold accent
  coach:     ["#0B1F3A", "#1E4A8A", "#5FB3FF"],   // navy → blue → cyan
  celebrity: ["#3B2A00", "#B8860B", "#FFD700"],   // bronze → gold (classic FIFA gold)
  expert:    ["#0F2E1F", "#116546", "#7CE0B8"],   // dark green → emerald
};

const CATEGORY_LABEL: Record<Category, string> = {
  athlete: "ATH",
  coach: "COA",
  celebrity: "STR",   // "Star"
  expert: "EXP",
};

const { width: SCREEN_W } = Dimensions.get("window");
const CARD_W = Math.min(SCREEN_W - 48, 300);
const CARD_H = CARD_W * 1.55;

export default function PreviewLanding() {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Brand header */}
        <View style={styles.brandHeader}>
          <View style={styles.logoDot} />
          <Text style={styles.brand}>MEET CHAMPION</Text>
        </View>
        <Text style={styles.tagline}>
          Book 1:1 video calls with your heroes.
        </Text>

        {/* Featured card (large) */}
        <View style={styles.featureWrap}>
          <ChampionCard champ={CHAMPS[0]} size="large" />
        </View>

        {/* Horizontal scroller of cards */}
        <Text style={styles.sectionLabel}>ROSTER</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.rowContent}
        >
          {CHAMPS.slice(1).map((c) => (
            <ChampionCard key={c.name} champ={c} size="medium" />
          ))}
        </ScrollView>

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
              >
                <Text style={styles.legendChipText}>{CATEGORY_LABEL[c]}</Text>
              </LinearGradient>
              <Text style={styles.legendLabel}>{c.toUpperCase()}</Text>
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
// FIFA-style card
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

  const gradient = useMemo(() => CATEGORY_GRADIENT[champ.category], [champ.category]);

  return (
    <View style={[styles.card, { width: w, height: h }]}>
      {/* Gradient background */}
      <LinearGradient
        colors={gradient}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Subtle diagonal shine */}
      <LinearGradient
        colors={["#ffffff22", "#ffffff00", "#00000055"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Portrait */}
      <Image
        source={{ uri: champ.photo }}
        style={[styles.portrait, { height: h * 0.62 }]}
        resizeMode="cover"
      />

      {/* Dark bottom overlay so the info bar is readable */}
      <LinearGradient
        colors={["transparent", "#00000000", "#000000cc"]}
        style={[StyleSheet.absoluteFill, { top: h * 0.4 }]}
      />

      {/* Top-left rating + role */}
      <View style={[styles.topLeft, { padding: w * 0.06 }]}>
        <Text style={[styles.overall, { fontSize: w * 0.22 }]}>
          {champ.overall}
        </Text>
        <Text style={[styles.role, { fontSize: w * 0.075 }]}>
          {CATEGORY_LABEL[champ.category]}
        </Text>
        <View style={[styles.flag, { marginTop: w * 0.025 }]}>
          <Text style={styles.flagText}>{champ.countryFlag}</Text>
        </View>
        <View style={styles.langRow}>
          {champ.languages.map((l) => (
            <Text key={l} style={styles.langChip}>{l}</Text>
          ))}
        </View>
      </View>

      {/* Bottom: name + stats */}
      <View style={[styles.bottom, { padding: w * 0.06 }]}>
        <Text style={[styles.name, { fontSize: w * 0.09 }]} numberOfLines={1}>
          {champ.name}
        </Text>
        <Text style={[styles.subrole, { fontSize: w * 0.05 }]}>
          {champ.role.toUpperCase()} · {champ.age} y/o
        </Text>

        <View style={styles.divider} />

        <View style={styles.statsGrid}>
          <Stat label="RAT" value={champ.ratingAvg.toFixed(1)} w={w} />
          <Stat label="CAL" value={String(champ.callsDone)} w={w} />
          <Stat label="MIN" value={String(champ.durationMin)} w={w} />
          <Stat label="USD" value={`$${champ.priceUsd}`} w={w} />
        </View>
      </View>
    </View>
  );
}

function Stat({ label, value, w }: { label: string; value: string; w: number }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { fontSize: w * 0.062 }]}>{value}</Text>
      <Text style={[styles.statLabel, { fontSize: w * 0.038 }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#05060A" },
  scrollContent: { paddingVertical: 24, alignItems: "center" },

  brandHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  logoDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#F5C518" },
  brand: {
    color: "#F4F5F7",
    fontWeight: "800",
    letterSpacing: 4,
    fontSize: 14,
  },
  tagline: { color: "#9AA3B2", fontSize: 13, marginTop: 6, marginBottom: 20 },

  featureWrap: { alignItems: "center", marginBottom: 12 },

  sectionLabel: {
    alignSelf: "flex-start",
    color: "#9AA3B2",
    letterSpacing: 3,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 24,
    marginBottom: 12,
    marginLeft: 24,
  },
  rowContent: { paddingHorizontal: 24, gap: 12 },

  // ---------- Card ----------
  card: {
    borderRadius: 24,
    overflow: "hidden",
    // FIFA-esque hard border + faint gold outline
    borderWidth: 1.5,
    borderColor: "#F5C51844",
    // "chamfered" look via extra corner tint below (approximated with radius)
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  portrait: {
    position: "absolute",
    top: "6%",
    left: "20%",
    right: "-4%",
    width: "88%",
  },
  topLeft: { position: "absolute", top: 0, left: 0 },
  overall: {
    color: "#FFF6D2",
    fontWeight: "900",
    lineHeight: undefined,
    letterSpacing: -1,
    textShadowColor: "#00000088",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  role: {
    color: "#FFF6D2",
    fontWeight: "800",
    letterSpacing: 2,
    marginTop: -4,
    textShadowColor: "#00000088",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  flag: {
    backgroundColor: "#ffffff22",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  flagText: { color: "#FFF", fontWeight: "700", fontSize: 10, letterSpacing: 1 },

  langRow: { flexDirection: "row", gap: 4, marginTop: 6 },
  langChip: {
    backgroundColor: "#00000055",
    color: "#FFF6D2",
    fontSize: 9,
    fontWeight: "700",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
    letterSpacing: 0.5,
  },

  bottom: { position: "absolute", left: 0, right: 0, bottom: 0 },
  name: {
    color: "#FFF6D2",
    fontWeight: "900",
    letterSpacing: 1,
    textShadowColor: "#00000088",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  subrole: {
    color: "#FFF6D2CC",
    fontWeight: "600",
    marginTop: 2,
    letterSpacing: 1,
  },

  divider: {
    height: 1,
    backgroundColor: "#FFF6D244",
    marginVertical: 8,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  stat: { alignItems: "center" },
  statValue: { color: "#FFF6D2", fontWeight: "800" },
  statLabel: {
    color: "#FFF6D2AA",
    fontWeight: "700",
    letterSpacing: 1.5,
    marginTop: 2,
  },

  // ---------- Legend ----------
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
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F5C51844",
  },
  legendChipText: {
    color: "#FFF6D2",
    fontWeight: "800",
    fontSize: 11,
    letterSpacing: 1.5,
  },
  legendLabel: {
    color: "#9AA3B2",
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: "600",
  },

  footNote: {
    color: "#4B5566",
    fontSize: 10,
    letterSpacing: 2,
    marginTop: 40,
    marginBottom: 8,
  },
});
