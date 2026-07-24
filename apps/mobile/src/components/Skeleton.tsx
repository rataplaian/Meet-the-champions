// Skeleton loader with a subtle shimmer using Reanimated.
import { useEffect } from "react";
import { StyleSheet, ViewStyle } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../theme";

interface Props {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = "100%", height = 16, radius = 8, style }: Props) {
  const { tokens } = useTheme();
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [shimmer]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: 0.35 + shimmer.value * 0.35,
  }));

  return (
    <Animated.View
      style={[
        { width: width as any, height, borderRadius: radius, backgroundColor: tokens.surface, overflow: "hidden" },
        animStyle,
        style,
      ]}
    >
      <LinearGradient
        colors={["transparent", tokens.accent + "22", "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}

export function SkeletonCard({ width, height }: { width: number; height: number }) {
  return <Skeleton width={width} height={height} radius={32} />;
}
