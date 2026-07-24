// 3-slide onboarding shown once on first launch. Uses OnboardingProvider
// context so AuthGate immediately reacts and lets the user proceed.
import { useCallback, useEffect, useRef, useState } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View, ViewToken, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming, Easing } from "react-native-reanimated";
import { JerseyBackground } from "../src/components/JerseyBackground";
import { hap } from "../src/utils/haptics";
import { useOnboarding, ONBOARDING_KEY as _KEY } from "../src/context/onboarding";

export const ONBOARDING_KEY = _KEY;

interface OnbSlide {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  accent: string;
}

const SLIDES: OnbSlide[] = [
  {
    key: "explore",
    icon: "compass",
    title: "Trova il tuo\ncampione",
    subtitle: "",
    accent: "#F5C451",
  },
  {
    key: "book",
    icon: "videocam",
    title: "Videochiamate\n1:1 esclusive",
    subtitle: "",
    accent: "#1677FF",
  },
  {
    key: "live",
    icon: "star",
    title: "Un ricordo\nche resta",
    subtitle: "",
    accent: "#2ED47A",
  },
];

export default function Onboarding() {
  const { width: SCREEN_W } = useWindowDimensions();
  const { markDone } = useOnboarding();
  const listRef = useRef<FlatList<OnbSlide>>(null);
  const [index, setIndex] = useState(0);

  const onViewable = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems[0]?.index != null) setIndex(viewableItems[0].index);
  }).current;

  const finish = useCallback(async () => {
    await markDone();
    router.replace("/(auth)/sign-in");
  }, [markDone]);

  const next = () => {
    hap.light();
    if (index >= SLIDES.length - 1) {
      finish();
    } else {
      const nextIdx = index + 1;
      // Update local index immediately so the CTA label / dots are correct
      // even if FlatList viewability callback doesn't fire (RN Web quirk with
      // horizontal pagingEnabled lists).
      setIndex(nextIdx);
      listRef.current?.scrollToOffset({ offset: nextIdx * SCREEN_W, animated: true });
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#04091E" }}>
      <JerseyBackground />
      <SafeAreaView style={{ flex: 1 }}>
        {/* Skip */}
        <View style={styles.top}>
          <Text style={styles.brand}>◆ MEET CHAMPION</Text>
          <TouchableOpacity onPress={finish} testID="onb-skip" hitSlop={12}>
            <Text style={styles.skip}>Salta</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          ref={listRef}
          data={SLIDES}
          keyExtractor={(s) => s.key}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewable}
          viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
          style={{ flex: 1 }}
          renderItem={({ item }) => <Slide slide={item} width={SCREEN_W} />}
        />

        {/* Dots + CTA */}
        <View style={styles.bottom}>
          <View style={styles.dotsRow}>
            {SLIDES.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i === index && { width: 22, backgroundColor: SLIDES[index].accent },
                ]}
              />
            ))}
          </View>
          <TouchableOpacity onPress={next} testID="onb-next" style={styles.cta}>
            <LinearGradient
              colors={[SLIDES[index].accent, SLIDES[index].accent + "cc"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ctaGrad}
            >
              <Text style={styles.ctaText}>{index === SLIDES.length - 1 ? "INIZIA" : "AVANTI"}</Text>
              <Ionicons name="arrow-forward" size={18} color="#08142D" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

function Slide({ slide, width }: { slide: OnbSlide; width: number }) {
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [pulse]);
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 0.08 }],
    opacity: 0.45 + pulse.value * 0.35,
  }));

  return (
    <View style={{ width, flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>
      <View style={{ alignItems: "center", justifyContent: "center" }}>
        <Animated.View style={[styles.glow, { backgroundColor: slide.accent + "44" }, pulseStyle]} />
        <View style={[styles.iconWrap, { borderColor: slide.accent + "aa", backgroundColor: "#08142Dcc" }]}>
          <Ionicons name={slide.icon} size={60} color={slide.accent} />
        </View>
      </View>
      <Text style={styles.title}>{slide.title}</Text>
      {slide.subtitle ? <Text style={styles.subtitle}>{slide.subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  top: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  brand: { color: "#F5C451", fontSize: 12, letterSpacing: 3, fontWeight: "800" },
  skip: { color: "#EAF0FA", fontSize: 14, fontWeight: "600", opacity: 0.7 },
  glow: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 999,
  },
  iconWrap: {
    width: 132,
    height: 132,
    borderRadius: 999,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: "#F7FAFC",
    fontWeight: "900",
    fontSize: 32,
    lineHeight: 38,
    textAlign: "center",
    letterSpacing: 0.5,
    marginTop: 48,
    textShadowColor: "#000000aa",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  subtitle: {
    color: "#B8C4D9",
    textAlign: "center",
    fontSize: 15,
    lineHeight: 22,
    marginTop: 14,
    maxWidth: 320,
  },
  bottom: { paddingHorizontal: 24, paddingBottom: 32, gap: 18 },
  dotsRow: { flexDirection: "row", justifyContent: "center", gap: 8 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: "#F5C45144",
  },
  cta: {
    borderRadius: 999,
    overflow: "hidden",
    shadowColor: "#F5C451",
    shadowOpacity: 0.5,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  ctaGrad: {
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  ctaText: { color: "#08142D", fontWeight: "900", fontSize: 15, letterSpacing: 3 },
});
