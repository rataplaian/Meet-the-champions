import type { ReactNode } from "react";
import { Platform, StyleSheet, useWindowDimensions, View } from "react-native";

const DESKTOP_BREAKPOINT = 600;
const PHONE_VIEWPORT_WIDTH = 430;

export function WebMobileViewport({ children }: { children: ReactNode }) {
  const { width, height } = useWindowDimensions();
  const desktopWeb = Platform.OS === "web" && width >= DESKTOP_BREAKPOINT;

  if (Platform.OS !== "web") return children;

  return (
    <View style={[styles.canvas, { height }]}>
      <View
        testID="mobile-web-viewport"
        style={[styles.viewport, { height }, desktopWeb && styles.desktopViewport]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    backgroundColor: "#030814",
  },
  viewport: {
    flex: 1,
    width: "100%",
    backgroundColor: "#F3F7FF",
    overflow: "hidden",
  },
  desktopViewport: {
    maxWidth: PHONE_VIEWPORT_WIDTH,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "#F5C45133",
    boxShadow: "0 0 36px rgba(0, 0, 0, 0.58)",
  },
});
