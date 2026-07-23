import { useCallback, useEffect, useState } from "react";
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { champions, bookings as bStore, reviews as rStore, AvailabilitySlot, Champion, Review } from "../../src/store";
import { useAuth } from "../../src/context/auth";
import { formatPrice, radius, spacing, useTheme } from "../../src/theme";
import { hap } from "../../src/utils/haptics";

interface ServiceOption {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  desc: string;
  priceMultiplier: number; // multiplier over the champion's base rate
  color: string;
}

const SERVICES: ServiceOption[] = [
  { key: "video",     icon: "videocam",       label: "Videochiamata",  desc: "Faccia a faccia · consigliato", priceMultiplier: 1.0, color: "#1677FF" },
  { key: "voice",     icon: "call",           label: "Chiamata",       desc: "Solo audio · più privata",      priceMultiplier: 0.6, color: "#27C2FF" },
  { key: "training",  icon: "barbell",        label: "Allenamento",    desc: "Sessione mini 15'",             priceMultiplier: 0.9, color: "#2ED47A" },
  { key: "tip",       icon: "bulb",           label: "Consiglio",      desc: "Scheda o pillola audio",        priceMultiplier: 0.4, color: "#F5C451" },
  { key: "chat",      icon: "chatbubbles",    label: "Chat 24h",       desc: "Rispondo entro 24h",            priceMultiplier: 0.3, color: "#7257FF" },
  { key: "autograph", icon: "star",           label: "Autografo",      desc: "Video autografo dedicato",      priceMultiplier: 0.5, color: "#E53935" },
];

export default function ChampionDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { tokens } = useTheme();
  const [champ, setChamp] = useState<Champion | null>(null);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [revs, setRevs] = useState<Review[]>([]);
  const [service, setService] = useState<ServiceOption>(SERVICES[0]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setChamp(await champions.getById(id));
    setSlots(await champions.availableSlots(id));
    setRevs((await rStore.listForChampion(id)).slice(0, 3));
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const priceCents = champ ? Math.round(champ.ratePerCallCents * service.priceMultiplier) : 0;

  const onBook = async () => {
    if (!selectedSlot || !champ || !user) {
      hap.warning();
      Alert.alert("Seleziona uno slot");
      return;
    }
    hap.medium();
    setBusy(true);
    try {
      const b = await bStore.create({ fanId: user.id, championId: champ.id, slotId: selectedSlot });
      router.replace(`/booking/${b.id}` as never);
    } catch (e: any) {
      hap.error();
      Alert.alert("Errore", e.message);
    }
    finally { setBusy(false); }
  };

  if (!champ) {
    return <View style={{ flex: 1, backgroundColor: tokens.bg }}><Text style={{ color: tokens.textMuted, padding: 20 }}>Loading…</Text></View>;
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: tokens.bg }} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Hero */}
      <View style={{ position: "relative", height: 420 }}>
        <Image source={{ uri: champ.photoUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        <LinearGradient
          colors={["#00000066", "transparent", tokens.bg]}
          locations={[0, 0.4, 1]}
          style={StyleSheet.absoluteFill}
        />
        <View style={{ position: "absolute", bottom: 24, left: 20, right: 20 }}>
          {champ.verified && (
            <View style={{ flexDirection: "row", alignSelf: "flex-start", backgroundColor: tokens.accent, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, marginBottom: 10 }}>
              <Text style={{ color: "#08142D", fontWeight: "900", fontSize: 10, letterSpacing: 1.5 }}>✓ VERIFIED CHAMPION</Text>
            </View>
          )}
          <Text style={{ color: "#F7FAFC", fontSize: 32, fontWeight: "900", letterSpacing: 0.5 }} numberOfLines={2}>
            {champ.name}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 6 }}>
            <Text style={{ color: tokens.accent, fontWeight: "700", letterSpacing: 1 }}>{champ.age} y/o</Text>
            <View style={{ width: 3, height: 3, borderRadius: 999, backgroundColor: tokens.accent }} />
            <Text style={{ color: tokens.accent, fontWeight: "700", letterSpacing: 1 }} numberOfLines={1}>{champ.team.toUpperCase()}</Text>
            <View style={{ width: 3, height: 3, borderRadius: 999, backgroundColor: tokens.accent }} />
            <Text style={{ color: "#F7FAFC" }}>{champ.ratingAvg.toFixed(1)}★</Text>
          </View>
        </View>
      </View>

      <View style={{ padding: spacing.lg, gap: spacing.md }}>
        {/* Bio compatta */}
        <Text style={{ color: tokens.text, lineHeight: 22 }} numberOfLines={4}>
          {champ.bio}
        </Text>

        {/* Grid di azioni — la chiave di tutta la scheda */}
        <Text style={{ color: tokens.accent, letterSpacing: 2, fontSize: 12, fontWeight: "800", marginTop: spacing.md }}>
          COME VUOI INTERAGIRE?
        </Text>
        <View style={styles.servicesGrid}>
          {SERVICES.map((s, idx) => {
            const active = s.key === service.key;
            return (
              <Animated.View
                key={s.key}
                entering={FadeInDown.delay(idx * 40).duration(300)}
                style={styles.svcCell}
              >
              <TouchableOpacity
                testID={`svc-${s.key}`}
                onPress={() => { hap.select(); setService(s); }}
                activeOpacity={0.85}
                style={[
                  styles.svcCard,
                  {
                    backgroundColor: active ? s.color + "22" : tokens.surface,
                    borderColor: active ? s.color : tokens.border,
                    borderWidth: active ? 2 : 1,
                    shadowColor: s.color,
                    shadowOpacity: active ? 0.5 : 0,
                    shadowRadius: 14,
                    shadowOffset: { width: 0, height: 6 },
                  },
                ]}
              >
                <View style={[styles.svcIconWrap, { backgroundColor: s.color + "33" }]}>
                  <Ionicons name={s.icon} size={22} color={s.color} />
                </View>
                <Text style={{ color: tokens.text, fontWeight: "800", marginTop: 6, fontSize: 13 }}>{s.label}</Text>
                <Text style={{ color: tokens.textMuted, fontSize: 10, marginTop: 2, textAlign: "center" }} numberOfLines={2}>{s.desc}</Text>
                <Text style={{ color: s.color, fontWeight: "800", marginTop: 6, fontSize: 12 }}>
                  {formatPrice(Math.round(champ.ratePerCallCents * s.priceMultiplier))}
                </Text>
              </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

        {/* Slot picker */}
        <Text style={{ color: tokens.accent, letterSpacing: 2, fontSize: 12, fontWeight: "800", marginTop: spacing.md }}>
          SCEGLI UNO SLOT
        </Text>
        {slots.length === 0 ? (
          <Text style={{ color: tokens.textMuted }}>Nessuno slot disponibile ora.</Text>
        ) : (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {slots.slice(0, 12).map((s) => {
              const active = s.id === selectedSlot;
              const d = new Date(s.startsAt);
              return (
                <TouchableOpacity key={s.id} testID={`slot-${s.id}`} onPress={() => { hap.select(); setSelectedSlot(s.id); }}
                  style={{ paddingHorizontal: 12, paddingVertical: 10, borderRadius: 999, borderWidth: 1,
                    backgroundColor: active ? tokens.primary + "33" : tokens.surface,
                    borderColor: active ? tokens.primary : tokens.border }}>
                  <Text style={{ color: active ? tokens.primary : tokens.textMuted, fontWeight: active ? "700" : "500", fontSize: 12 }}>
                    {d.toLocaleDateString("it-IT", { day: "numeric", month: "short" })} · {d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Career */}
        <Text style={{ color: tokens.accent, letterSpacing: 2, fontSize: 12, fontWeight: "800", marginTop: spacing.md }}>CARRIERA</Text>
        <View style={{ backgroundColor: tokens.surface, borderRadius: radius.md, borderWidth: 1, borderColor: tokens.border, padding: spacing.md }}>
          {champ.career.map((c, i) => (
            <View key={i} style={{ flexDirection: "row", gap: 12, paddingVertical: 6, borderBottomWidth: i < champ.career.length - 1 ? 1 : 0, borderBottomColor: tokens.border }}>
              <Text style={{ color: tokens.accent, fontWeight: "700", width: 92, fontSize: 12 }}>{c.years}</Text>
              <Text style={{ color: tokens.text, flex: 1, fontSize: 13 }}>{c.team}{c.number ? `  ·  #${c.number}` : ""}</Text>
            </View>
          ))}
        </View>

        {/* Reviews preview */}
        {revs.length > 0 && (
          <>
            <Text style={{ color: tokens.accent, letterSpacing: 2, fontSize: 12, fontWeight: "800", marginTop: spacing.md }}>
              RECENSIONI · {champ.ratingCount}
            </Text>
            {revs.map((r) => (
              <View key={r.id} style={{ backgroundColor: tokens.surface, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: tokens.border }}>
                <Text style={{ color: tokens.accent }}>{"★".repeat(r.rating)}</Text>
                {r.comment && <Text style={{ color: tokens.textMuted, marginTop: 4, fontSize: 13 }}>{"\u201C"}{r.comment}{"\u201D"}</Text>}
              </View>
            ))}
          </>
        )}
      </View>

      {/* Sticky bottom CTA */}
      <View style={{ padding: spacing.lg }}>
        <TouchableOpacity
          testID="book-btn"
          onPress={onBook}
          disabled={!selectedSlot || busy}
          style={{
            backgroundColor: selectedSlot ? service.color : tokens.surface,
            padding: spacing.md, borderRadius: radius.pill, alignItems: "center",
            opacity: (!selectedSlot || busy) ? 0.5 : 1,
            shadowColor: service.color, shadowOpacity: 0.4, shadowRadius: 16, shadowOffset: { width: 0, height: 6 },
          }}
        >
          <Text style={{ color: selectedSlot ? "#07111F" : tokens.textMuted, fontWeight: "900", fontSize: 15, letterSpacing: 1 }}>
            {busy ? "PRENOTAZIONE…" : `PRENOTA ${service.label.toUpperCase()} · ${formatPrice(priceCents)}`}
          </Text>
        </TouchableOpacity>
        {!selectedSlot && (
          <Text style={{ color: tokens.textMuted, textAlign: "center", marginTop: 8, fontSize: 12 }}>
            Seleziona uno slot per prenotare
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  servicesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  svcCell: {
    width: "31.5%",
  },
  svcCard: {
    width: "100%",
    aspectRatio: 0.9,
    borderRadius: radius.lg,
    padding: 10,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  svcIconWrap: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: "center", justifyContent: "center",
  },
});
