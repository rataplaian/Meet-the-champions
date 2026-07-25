// =============================================================================
// Auth background — displays the royal-blue jersey artwork entirely with a
// very slow Ken Burns micro-animation. Explicit aspect-ratio math avoids the
// inconsistent resizeMode="contain" behavior seen between native and web.
// =============================================================================
import { useEffect } from "react";
import { Image, StyleSheet, View, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";

const AUTH_BG = require("../../assets/images/auth-bg.png");

// Intrinsic dimensions of the optimised artwork.
const IMG_W = 941;
const IMG_H = 1672;
const IMG_ASPECT = IMG_W / IMG_H;

export function JerseyBackground() {
  const { width, height } = useWindowDimensions();

  // "Contain" math keeps the baked-in wordmark visible on narrow phones.
  const screenAspect = width / height;
  let imgW: number;
  let imgH: number;
  if (screenAspect > IMG_ASPECT) {
    imgH = height;
    imgW = height * IMG_ASPECT;
  } else {
    imgW = width;
    imgH = width / IMG_ASPECT;
  }
  const offsetX = (width - imgW) / 2;
  const offsetY = (height - imgH) / 2;

  const zoom = useSharedValue(0);
  const drift = useSharedValue(0);

  useEffect(() => {
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
    const scale = 1 + zoom.value * 0.015;
    const translateX = -3 + drift.value * 6;
    const translateY = -4 + zoom.value * 8;
    return { transform: [{ scale }, { translateX }, { translateY }] };
  });

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Match the dark blue in the artwork so any letterbox area blends in */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: "#01081A" }]} />

      {/* Animated full artwork — explicit width/height so it's guaranteed to
          fit completely on any screen. */}
      <Animated.View
        style={[
          {
            position: "absolute",
            left: offsetX,
            top: offsetY,
            width: imgW,
            height: imgH,
          },
          bgStyle,
        ]}
      >
        <Image
          source={AUTH_BG}
          style={{ width: imgW, height: imgH }}
          resizeMode="stretch"
          fadeDuration={400}
        />
      </Animated.View>

      {/* Soft depth vignette at bottom for CTA readability */}
      <LinearGradient
        colors={["rgba(4,9,30,0)", "rgba(4,9,30,0.55)"]}
        locations={[0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}


