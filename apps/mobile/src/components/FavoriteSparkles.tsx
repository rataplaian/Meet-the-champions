import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

const GOLD = "#FFD34E";

const PARTICLES = [
  { left: "7%", delay: 0, duration: 4600, size: 10, drift: 9 },
  { left: "21%", delay: 1800, duration: 5400, size: 7, drift: -8 },
  { left: "37%", delay: 700, duration: 5000, size: 8, drift: 6 },
  { left: "54%", delay: 2500, duration: 5800, size: 6, drift: -7 },
  { left: "70%", delay: 1200, duration: 4900, size: 9, drift: 8 },
  { left: "86%", delay: 3200, duration: 5600, size: 7, drift: -5 },
] as const;

export function FavoriteSparkles({ height }: { height: number }) {
  const reduceMotion = useReducedMotion();

  return (
    <View
      style={[StyleSheet.absoluteFill, styles.noPointerEvents]}
      accessibilityElementsHidden
    >
      {PARTICLES.map((particle, index) => (
        <FallingSparkle
          key={`${particle.left}-${index}`}
          {...particle}
          height={height}
          disabled={reduceMotion}
        />
      ))}
    </View>
  );
}

function FallingSparkle({
  left,
  delay,
  duration,
  size,
  drift,
  height,
  disabled,
}: {
  left: `${number}%`;
  delay: number;
  duration: number;
  size: number;
  drift: number;
  height: number;
  disabled: boolean;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (disabled) {
      progress.value = 0.48;
      return;
    }
    progress.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration, easing: Easing.linear }), -1, false),
    );
  }, [delay, disabled, duration, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.12, 0.7, 1], [0, 0.9, 0.55, 0]),
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [-12, height + 12]) },
      { translateX: interpolate(progress.value, [0, 0.5, 1], [0, drift, 0]) },
      { rotate: `${interpolate(progress.value, [0, 1], [0, 180])}deg` },
      { scale: interpolate(progress.value, [0, 0.5, 1], [0.65, 1, 0.7]) },
    ],
  }));

  return (
    <Animated.View style={[styles.particle, { left }, animatedStyle]}>
      <Ionicons name="sparkles" size={size} color={GOLD} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  particle: {
    position: "absolute",
    top: 0,
    shadowColor: GOLD,
    shadowOpacity: 0.75,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 0 },
  },
  noPointerEvents: { pointerEvents: "none" },
});
