import { useCallback, useEffect, useState } from "react";
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { champions, bookings as bStore, reviews as rStore, AvailabilitySlot, Champion, Review } from "../../src/store";
import { useAuth } from "../../src/context/auth";
import { formatPrice, radius, spacing, useTheme } from "../../src/theme";

export default function ChampionDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { tokens } = useTheme();
  const [champ, setChamp] = useState<Champion | null>(null);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [revs, setRevs] = useState<Review[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [booking, setBooking] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setChamp(await champions.getById(id));
    setSlots(await champions.availableSlots(id));
    setRevs((await rStore.listForChampion(id)).slice(0, 5));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const onBook = async () => {
    if (!selectedSlot || !champ || !user) return;
    setBooking(true);
    try {
      const b = await bStore.create({ fanId: user.id, championId: champ.id, slotId: selectedSlot });
      router.replace(`/booking/${b.id}` as never);
    } catch (e: any) {
      Alert.alert("Errore", e.message);
    } finally { setBooking(false); }
  };

  if (!champ) {
    return <View style={{ flex: 1, backgroundColor: tokens.bg }}><Text style={{ color: tokens.textMuted, padding: 20 }}>Loading…</Text></View>;
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: tokens.bg }} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Hero */}
      <View style={{ position: "relative", height: 380 }}>
        <Image source={{ uri: champ.photoUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        <LinearGradient colors={["transparent", tokens.bg]} style={StyleSheet.absoluteFill} />
        <View style={{ position: "absolute", bottom: 20, left: 20, right: 20 }}>
          {champ.verified && (
            <View style={{ flexDirection: "row", alignSelf: "flex-start", backgroundColor: tokens.accent, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, marginBottom: 8 }}>
              <Text style={{ color: "#07111F", fontWeight: "800", fontSize: 11, letterSpacing: 1 }}>✓ VERIFIED CHAMPION</Text>
            </View>
          )}
          <Text style={{ color: tokens.text, fontSize: 30, fontWeight: "900", letterSpacing: 0.5 }}>{champ.name}</Text>
          <Text style={{ color: tokens.accent, fontWeight: "700", marginTop: 4, letterSpacing: 1 }}>
            {champ.age} · {champ.team.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={{ padding: spacing.lg, gap: spacing.md }}>
        {/* Stats row */}
        <View style={styles.statsRow}>
          <Stat label="Rating" value={`${champ.ratingAvg.toFixed(1)}★`} tokens={tokens} />
          <Stat label="Chiamate" value={String(champ.totalCalls)} tokens={tokens} />
          <Stat label="Prezzo" value={formatPrice(champ.ratePerCallCents)} tokens={tokens} accent />
          <Stat label="Durata" value={`${champ.callDurationMinutes}m`} tokens={tokens} />
        </View>

        {/* Bio */}
        <Section title="Biografia" tokens={tokens}>
          <Text style={{ color: tokens.text, lineHeight: 22 }}>{champ.bio}</Text>
        </Section>

        {/* Services */}
        <Section title="Servizi offerti" tokens={tokens}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {champ.services.map((s) => (
              <View key={s} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: tokens.primary + "22", borderWidth: 1, borderColor: tokens.primary + "66" }}>
                <Text style={{ color: tokens.primary, fontSize: 12, fontWeight: "600" }}>{s}</Text>
              </View>
            ))}
          </View>
        </Section>

        {/* Career */}
        <Section title="Carriera" tokens={tokens}>
          {champ.career.map((c, i) => (
            <View key={i} style={{ flexDirection: "row", gap: 12, marginBottom: 8 }}>
              <Text style={{ color: tokens.accent, fontWeight: "700", width: 100, fontSize: 13 }}>{c.years}</Text>
              <Text style={{ color: tokens.text, flex: 1, fontSize: 13 }}>{c.team}{c.number ? ` · #${c.number}` : ""}</Text>
            </View>
          ))}
        </Section>

        {/* Languages */}
        <Section title="Lingue" tokens={tokens}>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {champ.languages.map((l) => (
              <View key={l} style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, backgroundColor: tokens.surface, borderWidth: 1, borderColor: tokens.border }}>
                <Text style={{ color: tokens.text, fontSize: 12, fontWeight: "600" }}>{l}</Text>
              </View>
            ))}
          </View>
        </Section>

        {/* Slots */}
        <Section title="Scegli uno slot" tokens={tokens}>
          {slots.length === 0 ? (
            <Text style={{ color: tokens.textMuted }}>Nessuno slot disponibile.</Text>
          ) : (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {slots.slice(0, 12).map((s) => {
                const active = s.id === selectedSlot;
                const d = new Date(s.startsAt);
                return (
                  <TouchableOpacity key={s.id} testID={`slot-${s.id}`} onPress={() => setSelectedSlot(s.id)}
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
        </Section>

        {/* Reviews preview */}
        {revs.length > 0 && (
          <Section title={`Recensioni (${champ.ratingCount})`} tokens={tokens}>
            {revs.map((r) => (
              <View key={r.id} style={{ marginBottom: 8 }}>
                <Text style={{ color: tokens.accent }}>{"★".repeat(r.rating)}</Text>
                {r.comment && <Text style={{ color: tokens.textMuted, marginTop: 2, fontSize: 13 }}>"{r.comment}"</Text>}
              </View>
            ))}
          </Section>
        )}

        {/* Book CTA */}
        <TouchableOpacity testID="book-btn" onPress={onBook} disabled={!selectedSlot || booking}
          style={{ marginTop: spacing.md, backgroundColor: tokens.success, padding: spacing.md, borderRadius: radius.md, alignItems: "center", opacity: (!selectedSlot || booking) ? 0.4 : 1 }}>
          <Text style={{ color: "#07111F", fontWeight: "800", fontSize: 16 }}>
            {booking ? "Prenotazione…" : `Prenota — ${formatPrice(champ.ratePerCallCents)}`}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function Section({ title, tokens, children }: { title: string; tokens: any; children: React.ReactNode }) {
  return (
    <View style={{ marginTop: spacing.md }}>
      <Text style={{ color: tokens.accent, letterSpacing: 2, fontSize: 12, fontWeight: "800", marginBottom: 8 }}>{title.toUpperCase()}</Text>
      {children}
    </View>
  );
}
function Stat({ label, value, tokens, accent }: { label: string; value: string; tokens: any; accent?: boolean }) {
  return (
    <View style={{ flex: 1, alignItems: "center", padding: 10, backgroundColor: tokens.surface, borderRadius: 12, borderWidth: 1, borderColor: tokens.border }}>
      <Text style={{ color: accent ? tokens.accent : tokens.text, fontWeight: "800", fontSize: 15 }}>{value}</Text>
      <Text style={{ color: tokens.textMuted, fontSize: 10, marginTop: 2, letterSpacing: 1 }}>{label.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  statsRow: { flexDirection: "row", gap: 8 },
});
