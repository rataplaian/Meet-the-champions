import { usePathname, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/auth";
import { useSocial } from "../context/social";
import { hap } from "../utils/haptics";

export function GlobalMessagesButton() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { state } = useSocial();

  if (!user || pathname.startsWith("/messages")) return null;

  const pendingCount =
    state.friendRequests.filter((request) => request.toId === user.id && request.status === "pending").length +
    state.groupInvitations.filter((invite) => invite.toId === user.id && invite.status === "pending").length;

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Apri messaggi e amicizie"
        testID="global-messages-button"
        onPress={() => {
          hap.light();
          router.push("/messages" as never);
        }}
        style={[styles.button, { top: Math.max(insets.top, 8) + 6 }]}
      >
        <Ionicons name="chatbubbles" size={21} color="#F5C451" />
        {pendingCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{Math.min(pendingCount, 9)}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    position: "absolute",
    right: 14,
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#07182AF2",
    borderWidth: 1,
    borderColor: "#F5C45199",
    shadowColor: "#000000",
    shadowOpacity: 0.32,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 12,
  },
  badge: {
    position: "absolute",
    right: -3,
    top: -3,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#D52E48",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0,
  },
});
