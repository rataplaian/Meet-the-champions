import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from "react-native";
import { WebView } from "react-native-webview";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { video } from "../../src/services";
import { colors, spacing } from "../../src/theme";
import type { VideoRoom } from "@meet-champion/shared";

// Note: react-native-webview must be installed. This screen shows the
// video call using the provider's web widget URL, which is a portable
// approach that works for Daily/Twilio/etc. For a native RN Video SDK,
// replace this WebView with the provider-specific component.
export default function CallScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [room, setRoom] = useState<VideoRoom | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setRoom(await video.getRoomForBooking(id));
      } catch (e: any) {
        setError(e.message ?? "Failed to open room");
      }
    })();
  }, [id]);

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }
  if (!room) {
    return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>;
  }

  const url = `${room.room_url}?t=${encodeURIComponent(room.token)}`;

  return (
    <View style={{ flex: 1, backgroundColor: "black" }}>
      <WebView
        source={{ uri: url }}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled
        domStorageEnabled
        style={{ flex: 1 }}
      />
      <TouchableOpacity style={styles.leaveButton} onPress={() => router.back()} testID="call-leave-button">
        <Ionicons name="close" size={20} color="white" />
        <Text style={styles.leaveText}>Leave</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg },
  error: { color: colors.danger, marginBottom: spacing.md },
  back: { color: colors.primary, fontWeight: "600" },
  leaveButton: {
    position: "absolute",
    top: 48,
    right: 16,
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    backgroundColor: "#00000088",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  leaveText: { color: "white", fontWeight: "600" },
});
