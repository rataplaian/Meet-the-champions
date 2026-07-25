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

const INSIDE_PARTICLES = [
  { left: "7%", delay: 0, duration: 4600, size: 10, drift: 9 },
  { left: "14%", delay: 2400, duration: 5100, size: 6, drift: -5 },
  { left: "23%", delay: 1800, duration: 5400, size: 7, drift: -8 },
  { left: "37%", delay: 700, duration: 5000, size: 8, drift: 6 },
  { left: "45%", delay: 3600, duration: 5900, size: 6, drift: 10 },
  { left: "54%", delay: 2500, duration: 5800, size: 6, drift: -7 },
  { left: "63%", delay: 300, duration: 5200, size: 7, drift: -9 },
  { left: "70%", delay: 1200, duration: 4900, size: 9, drift: 8 },
  { left: "79%", delay: 4100, duration: 6100, size: 6, drift: 5 },
  { left: "89%", delay: 3200, duration: 5600, size: 7, drift: -5 },
] as const;

const OUTSIDE_PARTICLES = [
  { left: "4%", delay: 900, duration: 4400, size: 7, drift: 12 },
  { left: "16%", delay: 2800, duration: 5100, size: 9, drift: -7 },
  { left: "29%", delay: 200, duration: 4800, size: 6, drift: 10 },
  { left: "41%", delay: 3600, duration: 5500, size: 8, drift: -9 },
  { left: "55%", delay: 1500, duration: 4600, size: 10, drift: 7 },
  { left: "68%", delay: 4200, duration: 5800, size: 6, drift: -11 },
  { left: "81%", delay: 2300, duration: 5000, size: 8, drift: 9 },
  { left: "94%", delay: 500, duration: 5400, size: 7, drift: -12 },
] as const;

export function FavoriteSparkles({
  height,
  outside = false,
}: {
  height: number;
  outside?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const particles = outside ? OUTSIDE_PARTICLES : INSIDE_PARTICLES;
  const travelHeight = outside ? 96 : height;

  return (
    <View
      style={[
        outside
          ? [styles.outsideLayer, { top: height - 16 }]
          : StyleSheet.absoluteFill,
        styles.noPointerEvents,
      ]}
      accessibilityElementsHidden
    >
      {particles.map((particle, index) => (
        <FallingSparkle
          key={`${particle.left}-${index}`}
          {...particle}
          height={travelHeight}
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
  outsideLayer: {
    position: "absolute",
    left: -8,
    right: -8,
    height: 104,
    overflow: "visible",
    zIndex: 30,
  },
});
