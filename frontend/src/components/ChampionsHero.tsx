// =============================================================================
// Shared Champions "hero" — golden 3D "MEET THE CHAMPIONS" logo + 5 gold stars
// (2 top, 3 bottom) — sits on top of a royal-blue jersey fabric backdrop.
// =============================================================================
import { useMemo } from "react";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export function ChampionsHero({ variant = "fan" }: { variant?: "fan" | "champion" }) {
  const { width: winW } = useWindowDimensions();
  const contentW = Math.min(winW - 32, 380);
  const bigSize = Math.round(contentW * 0.115);  // "CHAMPIONS" glyph size
  const smallSize = Math.round(contentW * 0.045);

  const starRow2 = useMemo(() => "★  ★".split(""), []);
  const starRow3 = useMemo(() => "★  ★  ★".split(""), []);

  const label = variant === "champion" ? "CHAMPIONS ARENA" : "MEET THE";
  const bigWord = variant === "champion" ? "CHAMPIONS" : "CHAMPIONS";

  return (
    <View style={{ alignItems: "center", width: contentW }}>
      {/* Arch backdrop */}
      <View style={[styles.archWrap, { width: contentW * 0.98, height: contentW * 0.42 }]}>
        <LinearGradient
          colors={["#00000000", "#F5C45122", "#F5C45144", "#F5C45122", "#00000000"]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 1 }}
          end={{ x: 0.5, y: 0 }}
        />
        <View style={[styles.archOuter, { width: contentW * 0.9, height: contentW * 0.9, borderRadius: contentW * 0.45 }]} />
        <View style={[styles.archInner, { width: contentW * 0.78, height: contentW * 0.78, borderRadius: contentW * 0.39 }]} />

        {/* Text stack */}
        <View style={styles.textStack}>
          <Text style={[styles.tinyLabel, { fontSize: smallSize, letterSpacing: 6 }]}>
            {label}
          </Text>
          {/* 3D golden CHAMPIONS — layered text for depth */}
          <View>
            {/* Deep shadow */}
            <Text
              style={[
                styles.bigText,
                styles.bigShadowDeep,
                { fontSize: bigSize, top: 5, left: 3 },
              ]}
            >
              {bigWord}
            </Text>
            {/* Mid shadow */}
            <Text
              style={[
                styles.bigText,
                styles.bigShadowMid,
                { fontSize: bigSize, top: 3, left: 2 },
              ]}
            >
              {bigWord}
            </Text>
            {/* Dark base */}
            <Text
              style={[
                styles.bigText,
                { color: "#4A2E00", fontSize: bigSize, top: 2, left: 1 },
              ]}
            >
              {bigWord}
            </Text>
            {/* Highlight top */}
            <Text style={[styles.bigText, styles.bigGold, { fontSize: bigSize }]}>
              {bigWord}
            </Text>
          </View>
        </View>
      </View>

      {/* 5 stars: 2 on top, 3 on bottom, width matches text */}
      <View style={{ marginTop: -8, alignItems: "center", width: contentW * 0.62 }}>
        <View style={styles.starRow}>
          <Star size={smallSize * 1.4} />
          <Star size={smallSize * 1.4} />
        </View>
        <View style={[styles.starRow, { marginTop: 2 }]}>
          <Star size={smallSize * 1.4} />
          <Star size={smallSize * 1.4} />
          <Star size={smallSize * 1.4} />
        </View>
      </View>
    </View>
  );
}

function Star({ size }: { size: number }) {
  return (
    <Text style={{
      color: "#F5C451",
      fontSize: size,
      marginHorizontal: 6,
      textShadowColor: "#00000099",
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 3,
    }}>★</Text>
  );
}

const styles = StyleSheet.create({
  archWrap: {
    alignItems: "center",
    justifyContent: "flex-end",
    marginBottom: 8,
  },
  archOuter: {
    position: "absolute",
    top: 0,
    borderWidth: 2,
    borderColor: "#F5C45166",
    borderBottomColor: "transparent",
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
  archInner: {
    position: "absolute",
    top: 12,
    borderWidth: 1,
    borderColor: "#F5C45144",
    borderBottomColor: "transparent",
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
  textStack: {
    position: "absolute",
    bottom: 6,
    alignItems: "center",
  },
  tinyLabel: {
    color: "#F5C451",
    fontWeight: "700",
    marginBottom: 6,
    textShadowColor: "#00000099",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  bigText: {
    fontWeight: "900",
    letterSpacing: 3,
    position: "absolute",
  },
  bigShadowDeep: { color: "#00000099" },
  bigShadowMid:  { color: "#6B4100" },
  bigGold: {
    color: "#FFE58A",
    position: "relative",
    textShadowColor: "#8B5A00",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 0,
  },
  starRow: { flexDirection: "row", justifyContent: "center" },
});
