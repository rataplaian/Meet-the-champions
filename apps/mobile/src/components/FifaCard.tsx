import {
  GestureResponderEvent,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import type { Champion } from "../store";
import { useTheme } from "../theme";
import { championCardPhotoUri } from "../utils/championPhotos";
import { FavoriteSparkles } from "./FavoriteSparkles";

const CATEGORY_GRADIENT: Record<string, readonly [string, string, string]> = {
  athlete:   ["#5A0E0E", "#E53935", "#FFC107"],   // deep crimson → vivid red → amber
  coach:     ["#0B2E7A", "#1E88E5", "#00E5FF"],   // navy → azure → cyan
  celebrity: ["#4A2C00", "#D4A017", "#FFD54F"],   // bronze → rich gold → light gold
  expert:    ["#0E4D2F", "#1CB278", "#7EFEB6"],   // pine → emerald → mint
};

export function FifaCard({
  champ,
  width: w,
  onPress,
  favorite = false,
  onToggleFavorite,
  testID,
}: {
  champ: Champion;
  width: number;
  onPress?: () => void;
  favorite?: boolean;
  onToggleFavorite?: () => void;
  testID?: string;
}) {
  const h = w * 1.55;
  const gradient = CATEGORY_GRADIENT[champ.category] ?? CATEGORY_GRADIENT.coach!;
  const Container: any = onPress ? TouchableOpacity : View;
  const { tokens } = useTheme();

  return (
    <View style={[styles.frame, { width: w, height: h }]}>
      <Container
        testID={testID}
        onPress={onPress}
        activeOpacity={0.85}
        style={[
          styles.card,
          {
            width: w,
            height: h,
            borderColor: favorite ? "#F2B705" : tokens.accent + "66",
            shadowColor: favorite ? "#FFD34E" : tokens.primary,
            shadowOpacity: favorite ? 0.58 : 0.3,
          },
        ]}
      >
      <Image
        source={{ uri: championCardPhotoUri(champ.photoUrl) }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        fadeDuration={0}
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

      {favorite ? <FavoriteSparkles height={h} /> : null}

      {champ.verified && (
        <View style={[styles.badge, { backgroundColor: tokens.accent }]}>
          <Text style={styles.badgeText}>✓ VERIFIED</Text>
        </View>
      )}

      <Pressable
        testID={`${testID ?? champ.id}-favorite`}
        accessibilityRole="button"
        accessibilityLabel={favorite ? `Rimuovi ${champ.name} dai preferiti` : `Aggiungi ${champ.name} ai preferiti`}
        accessibilityState={{ selected: favorite }}
        hitSlop={8}
        onPress={(event: GestureResponderEvent) => {
          event.stopPropagation();
          onToggleFavorite?.();
        }}
        style={({ pressed }) => [
          styles.favorite,
          favorite ? styles.favoriteActive : styles.favoriteIdle,
          pressed && styles.favoritePressed,
        ]}
      >
        <Ionicons
          name={favorite ? "star" : "star-outline"}
          size={22}
          color={favorite ? "#FFD34E" : "#FFF7DA"}
        />
      </Pressable>

      <View style={[styles.bottom, { padding: w * 0.075 }]}>
        <Text style={[styles.name, { fontSize: w * 0.082, lineHeight: w * 0.088 }]} numberOfLines={2}>
          {champ.name.toUpperCase()}
        </Text>
        <Text style={[styles.subrole, { fontSize: w * 0.05, color: tokens.accent }]} numberOfLines={1}>
          {champ.age} · {champ.team.toUpperCase()}
        </Text>
      </View>
      </Container>
      {favorite ? <FavoriteSparkles height={h} outside /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { overflow: "visible" },
  card: {
    borderRadius: 42,
    overflow: "hidden",
    borderWidth: 2,
    backgroundColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  badge: {
    position: "absolute",
    top: 14,
    left: 14,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  favorite: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    shadowColor: "#FFD34E",
    shadowOffset: { width: 0, height: 2 },
  },
  favoriteIdle: {
    backgroundColor: "#07111FCC",
    borderColor: "#FFF7DA88",
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  favoriteActive: {
    backgroundColor: "#4A3100DD",
    borderColor: "#FFD34E",
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 8,
  },
  favoritePressed: { transform: [{ scale: 0.9 }] },
  badgeText: { color: "#07111F", fontWeight: "800", fontSize: 9, letterSpacing: 1 },
  bottom: { position: "absolute", left: 0, right: 0, bottom: 0 },
  name: {
    color: "#F7FAFC",
    fontWeight: "900",
    letterSpacing: 1,
    textShadowColor: "#000000cc",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  subrole: { fontWeight: "700", marginTop: 4, letterSpacing: 2 },
});
