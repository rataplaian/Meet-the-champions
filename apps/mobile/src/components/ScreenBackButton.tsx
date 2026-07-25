import { router } from "expo-router";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { hap } from "../utils/haptics";

interface ScreenBackButtonProps {
  fallback: string;
  onPress?: () => void;
}

export function ScreenBackButton({ fallback, onPress }: ScreenBackButtonProps) {
  const goBack = () => {
    hap.light();
    if (onPress) {
      onPress();
      return;
    }
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(fallback as never);
  };

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel="Torna indietro"
      testID="screen-back"
      hitSlop={10}
      onPress={goBack}
      style={styles.button}
    >
      <Ionicons name="chevron-back" size={20} color="#F5C451" />
      <Text style={styles.label}>Indietro</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingLeft: 8,
    paddingRight: 12,
    borderRadius: 8,
    backgroundColor: "#07111FEE",
    borderWidth: 1,
    borderColor: "#F5C45155",
  },
  label: {
    color: "#F5C451",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0,
  },
});
