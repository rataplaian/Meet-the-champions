import { useEffect } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { colors, radius, spacing, typography } from "../theme";
import type { StartupError } from "../config";

const STARTUP_BACKGROUND = require("../../assets/images/startup-bg.png");

const SPARKLES = [
  { top: 0, left: 64, size: 14 },
  { top: 18, left: 112, size: 9 },
  { top: 64, left: 126, size: 12 },
  { top: 112, left: 104, size: 8 },
  { top: 126, left: 54, size: 13 },
  { top: 108, left: 12, size: 9 },
  { top: 58, left: 0, size: 12 },
  { top: 16, left: 18, size: 8 },
] as const;

interface BootScreenProps {
  mode: string;
  error?: StartupError | null;
  diagnosticsEnabled?: boolean;
  onRetry?: () => void;
}

export function BootScreen({ mode, error, diagnosticsEnabled, onRetry }: BootScreenProps) {
  const hasError = Boolean(error);

  return (
    <View style={styles.container} testID={hasError ? "boot-error-screen" : "boot-loading-screen"}>
      <Image
        source={STARTUP_BACKGROUND}
        resizeMode="contain"
        style={styles.backgroundImage}
      />
      <LinearGradient
        colors={hasError ? ["#01040A44", "#01040A88"] : ["#01040A00", "#01040A44"]}
        style={StyleSheet.absoluteFill}
      />

      {hasError ? (
        <View style={styles.panel}>
          <Text style={styles.title}>Avvio da controllare</Text>
          <Text style={styles.body}>{error?.message}</Text>
          {diagnosticsEnabled && error?.step ? (
            <Text style={styles.diagnostics}>Passaggio: {error.step}</Text>
          ) : null}
          {onRetry ? (
            <TouchableOpacity testID="boot-retry-button" style={styles.button} onPress={onRetry}>
              <Ionicons name="refresh" size={18} color={colors.bg} />
              <Text style={styles.buttonText}>Riprova</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : (
        <View style={styles.loadingArea}>
          <LoadingFootball />
          <Text style={styles.loadingText}>CARICAMENTO {mode.toUpperCase()}</Text>
        </View>
      )}
    </View>
  );
}

function LoadingFootball() {
  const reduceMotion = useReducedMotion();
  const ballProgress = useSharedValue(0);
  const sparkleProgress = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;
    ballProgress.value = withRepeat(
      withTiming(1, { duration: 1700, easing: Easing.linear }),
      -1,
      false,
    );
    sparkleProgress.value = withRepeat(
      withTiming(1, { duration: 3600, easing: Easing.linear }),
      -1,
      false,
    );
  }, [ballProgress, reduceMotion, sparkleProgress]);

  const ballStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${ballProgress.value * 360}deg` }],
  }));
  const sparkleStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${sparkleProgress.value * -360}deg` }],
  }));

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel="Caricamento in corso"
      style={styles.loader}
    >
      <Animated.View testID="loading-sparkle-orbit" style={[styles.sparkleOrbit, sparkleStyle]}>
        {SPARKLES.map((sparkle, index) => (
          <Ionicons
            key={`${sparkle.left}-${sparkle.top}-${index}`}
            name="sparkles"
            size={sparkle.size}
            color={index % 2 === 0 ? "#FFD34E" : "#FFF2B0"}
            style={[styles.sparkle, { left: sparkle.left, top: sparkle.top }]}
          />
        ))}
      </Animated.View>

      <Animated.View testID="loading-football" style={[styles.ballShell, ballStyle]}>
        <LinearGradient
          colors={["#26354F", "#07111F", "#020711"]}
          start={{ x: 0.15, y: 0.1 }}
          end={{ x: 0.85, y: 0.9 }}
          style={styles.ball}
        >
          <Ionicons name="football" size={62} color="#F5C451" />
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#030814",
    padding: spacing.lg,
  },
  backgroundImage: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
  },
  loadingArea: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 42,
    alignItems: "center",
  },
  loader: {
    width: 144,
    height: 144,
    alignItems: "center",
    justifyContent: "center",
  },
  sparkleOrbit: {
    ...StyleSheet.absoluteFillObject,
  },
  sparkle: {
    position: "absolute",
    textShadowColor: "#F5C451",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  ballShell: {
    width: 92,
    height: 92,
    borderRadius: 46,
    padding: 2,
    backgroundColor: "#F5C451",
    shadowColor: "#F5C451",
    shadowOpacity: 0.68,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  ball: {
    flex: 1,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FFF2B088",
  },
  loadingText: {
    color: "#F5C451",
    marginTop: 4,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 2,
    textShadowColor: "#000000",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  panel: {
    width: "100%",
    maxWidth: 390,
    padding: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: "#030814EE",
    borderWidth: 1,
    borderColor: "#F5C45166",
  },
  title: { ...typography.h3, color: "#FFFFFF", marginBottom: spacing.sm },
  body: { color: "#D5DEEB", lineHeight: 20 },
  diagnostics: {
    color: "#F5C451",
    marginTop: spacing.md,
    fontSize: 12,
  },
  button: {
    marginTop: spacing.lg,
    backgroundColor: "#F5C451",
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  buttonText: { color: colors.bg, fontWeight: "800" },
});
