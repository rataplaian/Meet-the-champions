// =============================================================================
// FIFA-style Champion card — reusable in Explore / Champion detail / carousels.
// =============================================================================
import { useMemo } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export interface FifaCardChamp {
  id: string;
  name: string;
  role?: string;             // "Coach", "Striker", ...
  age?: number | null;
  category: string;          // athlete | coach | celebrity | expert | ...
  overall?: number;          // 0-99, FIFA-style rating (derived from rating_average)
  callsDone: number;
  ratingAvg: number | null;
  priceCents: number;
  durationMin: number;
  languages: string[];
  photoUrl?: string | null;
  countryFlag?: string;      // 2-letter code, e.g. "IT"
}

const CATEGORY_GRADIENT: Record<string, readonly [string, string, string]> = {
  athlete:   ["#3D0F0F", "#B22222", "#F5C518"],
  coach:     ["#0B1F3A", "#1E4A8A", "#5FB3FF"],
  celebrity: ["#3B2A00", "#B8860B", "#FFD700"],
  expert:    ["#0F2E1F", "#116546", "#7CE0B8"],
  default:   ["#1B2030", "#3A4056", "#F5C518"],
};

const CATEGORY_LABEL: Record<string, string> = {
  athlete: "ATH",
  coach: "COA",
  celebrity: "STR",
  expert: "EXP",
};

function categoryGradient(cat: string) {
  return CATEGORY_GRADIENT[cat] ?? CATEGORY_GRADIENT.default;
}
function categoryLabel(cat: string) {
  return CATEGORY_LABEL[cat] ?? cat.slice(0, 3).toUpperCase();
}

export interface FifaCardProps {
  champ: FifaCardChamp;
  width: number;
  onPress?: () => void;
  testID?: string;
}

export function FifaCard({ champ, width: w, onPress, testID }: FifaCardProps) {
  const h = w * 1.55;
  const gradient = useMemo(() => categoryGradient(champ.category), [champ.category]);
  const priceUsd = Math.round(champ.priceCents / 100);
  const rating = champ.ratingAvg ?? 0;
  // Derive an FIFA-esque OVR from rating (1-5) + call volume, clamped 60-99.
  const ovr =
    champ.overall ??
    Math.min(99, Math.max(60, Math.round(rating * 15 + Math.min(champ.callsDone / 10, 24))));

  const Container: any = onPress ? TouchableOpacity : View;

  return (
    <Container
      testID={testID}
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.card, { width: w, height: h }]}
    >
      <LinearGradient
        colors={gradient}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={["#ffffff22", "#ffffff00", "#00000055"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {champ.photoUrl ? (
        <Image
          source={{ uri: champ.photoUrl }}
          style={[styles.portrait, { height: h * 0.62, width: w * 0.88 }]}
          resizeMode="cover"
        />
      ) : (
        <View
          style={[
            styles.portrait,
            styles.portraitPlaceholder,
            { height: h * 0.62, width: w * 0.88 },
          ]}
        >
          <Text style={styles.portraitInitials}>
            {champ.name
              .split(" ")
              .map((s) => s[0])
              .slice(0, 2)
              .join("")}
          </Text>
        </View>
      )}

      <LinearGradient
        colors={["transparent", "#00000000", "#000000cc"]}
        style={[StyleSheet.absoluteFill, { top: h * 0.4 }]}
      />

      {/* Top-left OVR + role */}
      <View style={[styles.topLeft, { padding: w * 0.06 }]}>
        <Text style={[styles.overall, { fontSize: w * 0.22 }]}>{ovr}</Text>
        <Text style={[styles.role, { fontSize: w * 0.075 }]}>
          {categoryLabel(champ.category)}
        </Text>
        {champ.countryFlag && (
          <View style={[styles.flag, { marginTop: w * 0.025 }]}>
            <Text style={styles.flagText}>{champ.countryFlag}</Text>
          </View>
        )}
        <View style={styles.langRow}>
          {champ.languages.slice(0, 3).map((l) => (
            <Text key={l} style={styles.langChip}>
              {l.toUpperCase()}
            </Text>
          ))}
        </View>
      </View>

      {/* Bottom: name + stat grid */}
      <View style={[styles.bottom, { padding: w * 0.06 }]}>
        <Text style={[styles.name, { fontSize: w * 0.09 }]} numberOfLines={1}>
          {champ.name.toUpperCase()}
        </Text>
        <Text style={[styles.subrole, { fontSize: w * 0.05 }]} numberOfLines={1}>
          {(champ.role ?? champ.category).toUpperCase()}
          {champ.age ? ` · ${champ.age} y/o` : ""}
        </Text>

        <View style={styles.divider} />

        <View style={styles.statsGrid}>
          <Stat label="RAT" value={rating ? rating.toFixed(1) : "—"} w={w} />
          <Stat label="CAL" value={String(champ.callsDone)} w={w} />
          <Stat label="MIN" value={String(champ.durationMin)} w={w} />
          <Stat label="USD" value={`$${priceUsd}`} w={w} />
        </View>
      </View>
    </Container>
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
  card: {
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "#F5C51844",
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
  },
  portraitPlaceholder: {
    backgroundColor: "#00000044",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  portraitInitials: {
    color: "#FFF6D2",
    fontSize: 40,
    fontWeight: "900",
    letterSpacing: 2,
  },

  topLeft: { position: "absolute", top: 0, left: 0 },
  overall: {
    color: "#FFF6D2",
    fontWeight: "900",
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
  name: { color: "#FFF6D2", fontWeight: "900", letterSpacing: 1 },
  subrole: { color: "#FFF6D2CC", fontWeight: "600", marginTop: 2, letterSpacing: 1 },
  divider: { height: 1, backgroundColor: "#FFF6D244", marginVertical: 8 },
  statsGrid: { flexDirection: "row", justifyContent: "space-between" },
  stat: { alignItems: "center" },
  statValue: { color: "#FFF6D2", fontWeight: "800" },
  statLabel: {
    color: "#FFF6D2AA",
    fontWeight: "700",
    letterSpacing: 1.5,
    marginTop: 2,
  },
});
