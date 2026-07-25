// =============================================================================
// Auth background — keeps the complete portrait artwork visible at the
// largest possible proportional size on native and web.
// =============================================================================
import { Image, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const AUTH_BG = require("../../assets/images/auth-bg.png");

export function JerseyBackground() {
  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Match the dark blue in the artwork so any letterbox area blends in */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: "#071630" }]} />

      <Image
        source={AUTH_BG}
        style={styles.backgroundImage}
        resizeMode="contain"
        fadeDuration={400}
      />

      {/* Soft depth vignette at bottom for CTA readability */}
      <LinearGradient
        colors={["rgba(4,9,30,0)", "rgba(4,9,30,0.40)"]}
        locations={[0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
  },
});


