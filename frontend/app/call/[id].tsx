// Fake "call in progress" screen. Purely visual, no real WebRTC.
// Shows champion avatar with a subtle pulse, a running timer, and
// simulated control buttons (mute, camera, end). "End call" marks the
// booking as completed so a review can be left.
import { useCallback, useEffect, useState } from "react";
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { bookings as bStore, champions as cStore, Booking, Champion } from "../../src/store";
import { hap } from "../../src/utils/haptics";

function formatSecs(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
}

export default function CallScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [champ, setChamp] = useState<Champion | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);
  const [phase, setPhase] = useState<"ringing" | "live">("ringing");

  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [pulse]);

  useEffect(() => {
    (async () => {
      if (!id) return;
      const b = await bStore.getById(id);
      setBooking(b);
      if (b) setChamp(await cStore.getById(b.championId));
    })();
  }, [id]);

  // Simulate ringing → live after 2.4s
  useEffect(() => {
    const t = setTimeout(() => {
      setPhase("live");
      hap.success();
    }, 2400);
    return () => clearTimeout(t);
  }, []);

  // Live timer
  useEffect(() => {
    if (phase !== "live") return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * (phase === "ringing" ? 0.18 : 0.05) }],
    opacity: 0.35 + pulse.value * 0.5,
  }));

  const endCall = useCallback(async () => {
    hap.medium();
    if (!booking) return router.back();
    try {
      if (booking.status !== "completed") await bStore.complete(booking.id);
    } catch {}
    router.replace(`/booking/${booking.id}` as never);
  }, [booking]);

  if (!champ || !booking) {
    return (
      <View style={{ flex: 1, backgroundColor: "#04091E", alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: "#EAF0FA" }}>Preparo la stanza…</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      {/* Full-bleed champion photo as the "remote video" feed */}
      <Image source={{ uri: champ.photoUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      <LinearGradient
        colors={["#00000099", "transparent", "#000000dd"]}
        locations={[0, 0.35, 1]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={{ flex: 1 }}>
        {/* Top status */}
        <View style={styles.top}>
          <View style={styles.topPill}>
            {phase === "live" ? (
              <>
                <View style={styles.liveDot} />
                <Text style={styles.topPillText}>LIVE · {formatSecs(seconds)}</Text>
              </>
            ) : (
              <Text style={styles.topPillText}>CHIAMATA IN CORSO…</Text>
            )}
          </View>
        </View>

        {/* Central pulse when ringing */}
        {phase === "ringing" ? (
          <View style={styles.centerWrap}>
            <Animated.View style={[styles.pulse, glowStyle]} />
            <View style={styles.avatarRing}>
              <Image source={{ uri: champ.photoUrl }} style={styles.avatar} />
            </View>
            <Text style={styles.callingName}>{champ.name}</Text>
            <Text style={styles.callingSub}>ti sta rispondendo…</Text>
          </View>
        ) : (
          <View style={{ flex: 1 }} />
        )}

        {/* Name overlay when live */}
        {phase === "live" && (
          <View style={styles.nameOverlay}>
            <BlurView intensity={30} tint="dark" style={styles.nameBlur}>
              <Text style={styles.nameText}>{champ.name}</Text>
              <Text style={styles.teamText}>{champ.team}</Text>
            </BlurView>
          </View>
        )}

        {/* Self-view thumbnail (only during live) */}
        {phase === "live" && cameraOn && (
          <View style={styles.selfView}>
            <LinearGradient
              colors={["#1677FF", "#08142D"]}
              style={StyleSheet.absoluteFill}
            />
            <Ionicons name="person" size={38} color="#F5C45166" />
            <Text style={styles.selfLabel}>Tu</Text>
          </View>
        )}
        {phase === "live" && !cameraOn && (
          <View style={styles.selfView}>
            <View style={[StyleSheet.absoluteFill, { backgroundColor: "#08142D" }]} />
            <Ionicons name="videocam-off" size={22} color="#F5C451" />
            <Text style={styles.selfLabel}>Camera off</Text>
          </View>
        )}

        {/* Bottom controls */}
        <View style={styles.controls}>
          <CtrlBtn
            active={!muted}
            icon={muted ? "mic-off" : "mic"}
            label={muted ? "Muto" : "Mic"}
            onPress={() => { hap.select(); setMuted((m) => !m); }}
            testID="ctrl-mic"
          />
          <CtrlBtn
            active={cameraOn}
            icon={cameraOn ? "videocam" : "videocam-off"}
            label="Camera"
            onPress={() => { hap.select(); setCameraOn((c) => !c); }}
            testID="ctrl-cam"
          />
          <TouchableOpacity onPress={endCall} testID="ctrl-end" style={styles.endBtn}>
            <Ionicons name="call" size={26} color="#fff" style={{ transform: [{ rotate: "135deg" }] }} />
          </TouchableOpacity>
          <CtrlBtn
            icon="chatbubbles"
            label="Chat"
            onPress={() => { hap.select(); Alert.alert("Chat", "Chat in call (demo)"); }}
            testID="ctrl-chat"
          />
          <CtrlBtn
            icon="ellipsis-horizontal"
            label="Altro"
            onPress={() => { hap.select(); }}
            testID="ctrl-more"
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

function CtrlBtn({
  icon, label, onPress, active = true, testID,
}: {
  icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; active?: boolean; testID?: string;
}) {
  return (
    <TouchableOpacity onPress={onPress} testID={testID} style={styles.ctrlWrap}>
      <View style={[styles.ctrlBtn, !active && { backgroundColor: "#F04444cc" }]}>
        <Ionicons name={icon} size={22} color="#fff" />
      </View>
      <Text style={styles.ctrlLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  top: { alignItems: "center", paddingTop: 16 },
  topPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#00000088",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#F5C45144",
  },
  topPillText: { color: "#F7FAFC", fontSize: 12, fontWeight: "800", letterSpacing: 1 },
  liveDot: { width: 8, height: 8, borderRadius: 999, backgroundColor: "#F04444" },
  centerWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  pulse: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 999,
    backgroundColor: "#F5C45166",
  },
  avatarRing: {
    width: 168,
    height: 168,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: "#F5C451",
    overflow: "hidden",
  },
  avatar: { width: "100%", height: "100%" },
  callingName: {
    color: "#F7FAFC",
    fontWeight: "900",
    fontSize: 24,
    marginTop: 20,
    letterSpacing: 0.5,
    textShadowColor: "#000000cc",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  callingSub: { color: "#F5C451", fontWeight: "600", fontSize: 13, letterSpacing: 1 },
  nameOverlay: {
    position: "absolute",
    left: 20,
    top: 68,
    borderRadius: 14,
    overflow: "hidden",
  },
  nameBlur: { paddingHorizontal: 14, paddingVertical: 8 },
  nameText: { color: "#fff", fontWeight: "800", fontSize: 16, letterSpacing: 0.3 },
  teamText: { color: "#F5C451", fontSize: 11, letterSpacing: 1.5, fontWeight: "700" },
  selfView: {
    position: "absolute",
    right: 16,
    top: 68,
    width: 110,
    height: 150,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#F5C45166",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  selfLabel: { color: "#F5C451", fontSize: 10, fontWeight: "700", letterSpacing: 1 },
  controls: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    paddingHorizontal: 14,
    paddingBottom: 24,
  },
  ctrlWrap: { alignItems: "center", gap: 6 },
  ctrlBtn: {
    width: 54, height: 54, borderRadius: 999,
    backgroundColor: "#ffffff22",
    alignItems: "center", justifyContent: "center",
    borderWidth: 1,
    borderColor: "#ffffff44",
  },
  ctrlLabel: { color: "#F7FAFC", fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },
  endBtn: {
    width: 68, height: 68, borderRadius: 999,
    backgroundColor: "#F04444",
    alignItems: "center", justifyContent: "center",
    shadowColor: "#F04444",
    shadowOpacity: 0.6, shadowRadius: 14, shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
});
