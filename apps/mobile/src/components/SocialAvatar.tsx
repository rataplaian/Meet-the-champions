import { Ionicons } from "@expo/vector-icons";
import { Image, StyleSheet, Text, View } from "react-native";
import type { SocialPerson } from "../store/social";

export function SocialAvatar({
  person,
  size = 48,
  group = false,
}: {
  person?: SocialPerson;
  size?: number;
  group?: boolean;
}) {
  const radius = size / 2;
  if (group) {
    return (
      <View style={[styles.fallback, styles.group, { width: size, height: size, borderRadius: radius }]}>
        <Ionicons name="people" size={size * 0.48} color="#07111F" />
      </View>
    );
  }

  if (person?.avatarUrl) {
    return (
      <Image
        accessibilityLabel={`Foto di ${person.displayName}`}
        source={{ uri: person.avatarUrl }}
        style={{ width: size, height: size, borderRadius: radius }}
      />
    );
  }

  return (
    <View style={[styles.fallback, { width: size, height: size, borderRadius: radius }]}>
      <Text style={[styles.initial, { fontSize: size * 0.38 }]}>
        {person?.displayName.charAt(0).toUpperCase() ?? "M"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#123153",
    borderWidth: 1,
    borderColor: "#F5C45188",
  },
  group: {
    backgroundColor: "#F5C451",
  },
  initial: {
    color: "#F5C451",
    fontWeight: "900",
    letterSpacing: 0,
  },
});
