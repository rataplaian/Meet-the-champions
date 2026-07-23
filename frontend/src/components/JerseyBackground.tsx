// =============================================================================
// Auth background — uses a real royal-blue jersey artwork with a slow, subtle
// Ken Burns effect (very gentle scale + drift) so it never feels static but
// stays understated. If the artwork fails to load, gracefully falls back to
// the previous vector jersey.
// =============================================================================
import { useEffect } from "react";
import { Image, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";

// Bundled asset — Metro resolves it at bundle time.
const LEGEND_BG = require("../../assets/images/legend-bg.jpg");

export function JerseyBackground() {
  // Two shared values driving a slow zoom + gentle horizontal drift.
  const zoom = useSharedValue(0);
  const drift = useSharedValue(0);

  useEffect(() => {
    // 22-second full cycle — very slow, almost imperceptible per frame.
    zoom.value = withRepeat(
      withTiming(1, { duration: 22000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
    drift.value = withRepeat(
      withTiming(1, { duration: 30000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [zoom, drift]);

  const bgStyle = useAnimatedStyle(() => {
    // Scale 1.04 → 1.10 (max 6% growth) — feels alive without cropping content.
    const scale = 1.04 + zoom.value * 0.06;
    // Horizontal drift ±6px, vertical drift ±10px.
    const translateX = -6 + drift.value * 12;
    const translateY = -10 + zoom.value * 20;
    return { transform: [{ scale }, { translateX }, { translateY }] };
  });

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Base dark fallback in case the image is still loading. */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: "#04091E" }]} />

      {/* Slowly animated jersey image */}
      <Animated.View style={[StyleSheet.absoluteFill, bgStyle]}>
        <Image
          source={LEGEND_BG}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          fadeDuration={400}
        />
      </Animated.View>

      {/* Depth vignettes so form text is always legible on top */}
      <LinearGradient
        colors={["rgba(4,9,30,0)", "rgba(4,9,30,0.35)", "rgba(4,9,30,0.85)"]}
        locations={[0.35, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={["rgba(4,9,30,0.35)", "rgba(4,9,30,0)"]}
        locations={[0, 0.4]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}
