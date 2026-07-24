// =============================================================================
// FIFA-style Champion card (minimal).
// Shows only: full-bleed portrait + NAME + "AGE · LAST TEAM".
// Everything else (rating, price, calls, languages, experience, jersey numbers,
// career history) lives on the champion detail screen — the card is chrome.
// =============================================================================
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export interface FifaCardChamp {
  id: string;
  name: string;
  age?: number | null;
  team?: string | null;      // last team the champion belongs/belonged to
  category: string;          // athlete | coach | celebrity | expert
  photoUrl?: string | null;
}

const CATEGORY_GRADIENT: Record<string, readonly [string, string, string]> = {
  athlete:   ["#3D0F0F", "#B22222", "#F5C518"],
  coach:     ["#0B1F3A", "#1E4A8A", "#5FB3FF"],
  celebrity: ["#3B2A00", "#B8860B", "#FFD700"],
  expert:    ["#0F2E1F", "#116546", "#7CE0B8"],
  default:   ["#1B2030", "#3A4056", "#F5C518"],
};

function categoryGradient(cat: string): readonly [string, string, string] {
  return CATEGORY_GRADIENT[cat] ?? CATEGORY_GRADIENT.default!;
}

export interface FifaCardProps {
  champ: FifaCardChamp;
  width: number;
  onPress?: () => void;
  testID?: string;
}

export function FifaCard({ champ, width: w, onPress, testID }: FifaCardProps) {
  const h = w * 1.55;
  const gradient = categoryGradient(champ.category);
  const Container: any = onPress ? TouchableOpacity : View;

  const subtitle = [champ.age ?? null, champ.team ? champ.team.toUpperCase() : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <Container
      testID={testID}
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.card, { width: w, height: h }]}
    >
      {champ.photoUrl ? (
        <Image
          source={{ uri: champ.photoUrl }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.portraitPlaceholder]}>
          <Text style={styles.portraitInitials}>
            {champ.name
              .split(" ")
              .map((s) => s[0])
              .slice(0, 2)
              .join("")}
          </Text>
        </View>
      )}

      {/* Category tint */}
      <LinearGradient
        colors={[gradient[0] + "aa", gradient[1] + "33", gradient[2] + "11"]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Dark bottom scrim */}
      <LinearGradient
        colors={["transparent", "#000000ee"]}
        style={[StyleSheet.absoluteFill, { top: "50%" }]}
      />

      {/* NAME + AGE · TEAM */}
      <View style={[styles.bottom, { padding: w * 0.075 }]}>
        <Text
          style={[styles.name, { fontSize: w * 0.082, lineHeight: w * 0.088 }]}
          numberOfLines={2}
        >
          {champ.name.toUpperCase()}
        </Text>
        {!!subtitle && (
          <Text style={[styles.subrole, { fontSize: w * 0.05 }]} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 42,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#F5C51866",
    backgroundColor: "#000",
    shadowColor: "#000",
    shadowOpacity: 0.55,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 14,
  },
  portraitPlaceholder: {
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
  },
  portraitInitials: {
    color: "#FFF6D2",
    fontSize: 40,
    fontWeight: "900",
    letterSpacing: 2,
  },
  bottom: { position: "absolute", left: 0, right: 0, bottom: 0 },
  name: {
    color: "#FFF6D2",
    fontWeight: "900",
    letterSpacing: 1,
    textShadowColor: "#000000cc",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  subrole: {
    color: "#FFF6D2CC",
    fontWeight: "700",
    marginTop: 4,
    letterSpacing: 2,
  },
});
