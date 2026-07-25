import type { PropsWithChildren } from "react";
import {
  Image,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";

const GOLD_FRAME_BACKGROUND = require("../../assets/images/match-card-bg.png");

type GoldFramePanelProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  overlayColor?: string;
  testID?: string;
}>;

export function GoldFramePanel({
  children,
  style,
  contentStyle,
  overlayColor = "#02071112",
  testID,
}: GoldFramePanelProps) {
  return (
    <View testID={testID} style={[styles.frame, style]}>
      <Image
        source={GOLD_FRAME_BACKGROUND}
        resizeMode="cover"
        style={StyleSheet.absoluteFill}
      />
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: overlayColor }]}
      />
      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    overflow: "hidden",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#F5C451CC",
    backgroundColor: "#0B1730",
    shadowColor: "#F5C451",
    shadowOpacity: 0.14,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  content: {
    flex: 1,
  },
});
