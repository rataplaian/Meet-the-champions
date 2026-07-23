// =============================================================================
// Royal-blue jersey background — layered gradients + faint diagonal weave.
// Approximates the look of a modern football jersey without external assets.
// =============================================================================
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export function JerseyBackground() {
  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Base royal blue radial-ish */}
      <LinearGradient
        colors={["#0A1E5C", "#08142D", "#040820"]}
        locations={[0, 0.6, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Side vignette for jersey shading */}
      <LinearGradient
        colors={["#00000055", "transparent", "transparent", "#00000055"]}
        locations={[0, 0.25, 0.75, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Diagonal weave 1 */}
      <LinearGradient
        colors={[
          "transparent", "#ffffff08", "transparent",
          "#ffffff08", "transparent", "#ffffff08", "transparent",
        ]}
        locations={[0, 0.1, 0.25, 0.35, 0.55, 0.7, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Diagonal weave 2 (opposite) */}
      <LinearGradient
        colors={[
          "transparent", "#00000018", "transparent",
          "#00000018", "transparent", "#00000018", "transparent",
        ]}
        locations={[0, 0.15, 0.3, 0.5, 0.65, 0.85, 1]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Top-glow gold accent */}
      <LinearGradient
        colors={["#F5C45122", "transparent"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.35 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}
