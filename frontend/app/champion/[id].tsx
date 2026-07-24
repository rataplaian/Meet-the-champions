// Champion Detail — completely redesigned for visual clarity.
// Structure (top → bottom):
//   1. Hero photo (parallax-safe, gradient fade)
//   2. Overlapping info card (name, team, rating, verified)
//   3. Stat strip (rating · totalCalls · fromPrice)
//   4. Bio section
//   5. Services 2x2 grid (video / voice / training / tip only)
//   6. Slot picker grouped by day
//   7. Career timeline
//   8. Reviews preview
//   9. Sticky bottom CTA with total
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn, FadeInDown, ZoomIn } from "react-native-reanimated";
import { champions, bookings as bStore, reviews as rStore, AvailabilitySlot, Champion, Review } from "../../src/store";
import { useAuth } from "../../src/context/auth";
import { formatPrice, radius, spacing, useTheme } from "../../src/theme";
import { hap } from "../../src/utils/haptics";

// ---------------------------------------------------------------------------
// Services (Chat 24h and Autograph removed per user request).
// ---------------------------------------------------------------------------
interface ServiceOption {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  desc: string;
  priceMultiplier: number;
  color: string;
}

const SERVICES: ServiceOption[] = [
  { key: "video",    icon: "videocam", label: "Videochiamata", desc: "Faccia a faccia",     priceMultiplier: 1.0, color: "#1677FF" },
  { key: "voice",    icon: "call",     label: "Chiamata",      desc: "Solo audio",          priceMultiplier: 0.6, color: "#27C2FF" },
  { key: "training", icon: "barbell",  label: "Allenamento",   desc: "Sessione dedicata",   priceMultiplier: 0.9, color: "#2ED47A" },
  { key: "tip",      icon: "bulb",     label: "Consiglio",     desc: "Scheda personalizzata", priceMultiplier: 0.4, color: "#F5C451" },
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
  // Note modal — the fan can optionally add a message (max 300 chars) that
  // will be sent to the champion together with the booking request.
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState("");

  const load = useCallback(async () => {
    if (!id) return;
    setChamp(await champions.getById(id));
    setSlots(await champions.availableSlots(id));
    setRevs((await rStore.listForChampion(id)).slice(0, 3));
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const priceCents = champ ? Math.round(champ.ratePerCallCents * service.priceMultiplier) : 0;
  const fromPriceCents = champ ? Math.round(champ.ratePerCallCents * 0.4) : 0;

  // Group slots by day for a cleaner selector.
  const slotsByDay = useMemo(() => {
    const map = new Map<string, AvailabilitySlot[]>();
    for (const s of slots.slice(0, 14)) {
      const d = new Date(s.startsAt);
      const key = d.toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" });
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return Array.from(map.entries());
  }, [slots]);

  const onBook = () => {
    if (!selectedSlot || !champ || !user) {
      hap.warning();
      Alert.alert("Seleziona uno slot");
      return;
    }
    hap.light();
    // Open the note modal instead of creating the booking immediately.
    setNoteOpen(true);
  };

  const submitRequest = async () => {
    if (!selectedSlot || !champ || !user) return;
    hap.medium();
    setBusy(true);
    try {
      const b = await bStore.create({
        fanId: user.id,
        championId: champ.id,
        slotId: selectedSlot,
        userNote: note.trim() || undefined,
      });
      setNoteOpen(false);
      setNote("");
      router.replace(`/booking/${b.id}` as never);
    } catch (e: any) {
      hap.error();
      Alert.alert("Errore", e.message);
    } finally { setBusy(false); }
  };

  if (!champ) {
    return (
      <View style={{ flex: 1, backgroundColor: tokens.bg, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: tokens.textMuted }}>Caricamento…</Text>
      </View>
    );
  }

  const initials = champ.name.split(" ").map((n) => n[0]).join("").slice(0, 2);

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bg }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ---------- 1. HERO ---------- */}
        <View style={styles.hero}>
          <Image source={{ uri: champ.photoUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          <LinearGradient
            colors={["#00000099", "transparent", "#04091E"]}
            locations={[0, 0.4, 1]}
            style={StyleSheet.absoluteFill}
          />
          {/* Floating chips at top */}
          <View style={styles.topRow}>
            {champ.verified && (
              <View style={[styles.chipTop, { backgroundColor: tokens.accent }]}>
                <Ionicons name="checkmark-circle" size={12} color="#08142D" />
                <Text style={styles.chipTopText}>VERIFIED</Text>
              </View>
            )}
            <View style={[styles.chipTop, { backgroundColor: "#000000aa", borderColor: "#ffffff33", borderWidth: 1 }]}>
              <Text style={[styles.chipTopText, { color: "#F7FAFC" }]}>{champ.countryFlag}</Text>
            </View>
          </View>
        </View>

        {/* ---------- 2. INFO CARD (overlaps hero) ---------- */}
        <View style={styles.infoWrap}>
          <View style={[styles.infoCard, { backgroundColor: tokens.surface, borderColor: tokens.accent + "44" }]}>
            <Text style={[styles.name, { color: tokens.text }]} numberOfLines={1}>
              {champ.name}
            </Text>
            <Text style={[styles.team, { color: tokens.accent }]} numberOfLines={1}>
              {champ.team}
            </Text>
            <View style={styles.metaRow}>
              <Text style={[styles.metaText, { color: tokens.textMuted }]}>{champ.age} anni</Text>
              <View style={[styles.dotSep, { backgroundColor: tokens.textMuted }]} />
              <Text style={[styles.metaText, { color: tokens.textMuted }]}>
                {champ.languages.slice(0, 3).join(" · ")}
              </Text>
            </View>
          </View>

          {/* ---------- 3. STAT STRIP ---------- */}
          <View style={[styles.statsCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
            <StatCol
              icon="star"
              value={champ.ratingAvg.toFixed(1)}
              label={`${champ.ratingCount} recens.`}
              color={tokens.accent}
              tokens={tokens}
            />
            <View style={[styles.divider, { backgroundColor: tokens.border }]} />
            <StatCol
              icon="videocam"
              value={String(champ.totalCalls)}
              label="chiamate"
              color="#2ED47A"
              tokens={tokens}
            />
            <View style={[styles.divider, { backgroundColor: tokens.border }]} />
            <StatCol
              icon="pricetag"
              value={formatPrice(fromPriceCents)}
              label="da"
              color={tokens.primary}
              tokens={tokens}
            />
          </View>
        </View>

        {/* ---------- 4. BIO ---------- */}
        <Section title="SU DI ME" tokens={tokens}>
          <View style={[styles.bioCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
            <Text style={{ color: tokens.text, lineHeight: 22, fontSize: 14 }}>{champ.bio}</Text>
          </View>
        </Section>

        {/* ---------- 5. SERVICES 2x2 ---------- */}
        <Section title="COME VUOI INTERAGIRE?" tokens={tokens}>
          <View style={styles.svcGrid}>
            {SERVICES.map((s, idx) => {
              const active = s.key === service.key;
              const price = Math.round(champ.ratePerCallCents * s.priceMultiplier);
              return (
                <Animated.View
                  key={s.key}
                  entering={FadeInDown.delay(idx * 60).duration(300)}
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
                      },
                    ]}
                  >
                    <View style={styles.svcTopRow}>
                      <View style={[styles.svcIconWrap, { backgroundColor: s.color + "33" }]}>
                        <Ionicons name={s.icon} size={22} color={s.color} />
                      </View>
                      {active && (
                        <Ionicons name="checkmark-circle" size={20} color={s.color} />
                      )}
                    </View>
                    <Text style={[styles.svcLabel, { color: tokens.text }]}>{s.label}</Text>
                    <Text style={[styles.svcDesc, { color: tokens.textMuted }]}>{s.desc}</Text>
                    <View style={{ flex: 1 }} />
                    <View style={styles.svcPriceRow}>
                      <Text style={[styles.svcPrice, { color: s.color }]}>{formatPrice(price)}</Text>
                      <Text style={{ color: tokens.textMuted, fontSize: 10, fontWeight: "700" }}>
                        {champ.callDurationMinutes}'
                      </Text>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
        </Section>

        {/* ---------- 6. SLOT PICKER (grouped by day) ---------- */}
        <Section title="SLOT DISPONIBILI" tokens={tokens}>
          {slotsByDay.length === 0 ? (
            <View style={[styles.emptyBox, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
              <Ionicons name="calendar-outline" size={22} color={tokens.textMuted} />
              <Text style={{ color: tokens.textMuted, marginTop: 6 }}>Nessuno slot disponibile</Text>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {slotsByDay.map(([day, list]) => (
                <View key={day}>
                  <Text style={[styles.dayLabel, { color: tokens.textMuted }]}>{day.toUpperCase()}</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 8, paddingRight: spacing.md }}>
                    {list.map((s) => {
                      const active = s.id === selectedSlot;
                      const d = new Date(s.startsAt);
                      return (
                        <TouchableOpacity
                          key={s.id}
                          testID={`slot-${s.id}`}
                          onPress={() => { hap.select(); setSelectedSlot(s.id); }}
                          style={[
                            styles.slotPill,
                            {
                              backgroundColor: active ? tokens.primary + "33" : tokens.surface,
                              borderColor: active ? tokens.primary : tokens.border,
                            },
                          ]}
                        >
                          <Text style={{
                            color: active ? tokens.primary : tokens.text,
                            fontWeight: active ? "800" : "600",
                            fontSize: 13,
                          }}>
                            {d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              ))}
            </View>
          )}
        </Section>

        {/* ---------- 7. CAREER TIMELINE ---------- */}
        <Section title="CARRIERA" tokens={tokens}>
          <View style={[styles.careerCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
            {champ.career.map((c, i) => (
              <View key={i} style={styles.careerRow}>
                <View style={styles.careerTimeline}>
                  <View style={[styles.careerDot, { backgroundColor: tokens.accent }]} />
                  {i < champ.career.length - 1 && (
                    <View style={[styles.careerLine, { backgroundColor: tokens.accent + "44" }]} />
                  )}
                </View>
                <View style={{ flex: 1, paddingBottom: i < champ.career.length - 1 ? 14 : 0 }}>
                  <Text style={{ color: tokens.accent, fontWeight: "800", fontSize: 11, letterSpacing: 1 }}>
                    {c.years}
                  </Text>
                  <Text style={{ color: tokens.text, fontWeight: "700", fontSize: 14, marginTop: 2 }}>
                    {c.team}
                  </Text>
                  {c.number != null && (
                    <Text style={{ color: tokens.textMuted, fontSize: 12, marginTop: 2 }}>
                      Maglia #{c.number}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </Section>

        {/* ---------- 8. REVIEWS ---------- */}
        {revs.length > 0 && (
          <Section title={`RECENSIONI · ${champ.ratingCount}`} tokens={tokens}>
            <View style={{ gap: 10 }}>
              {revs.map((r, i) => (
                <Animated.View
                  key={r.id}
                  entering={FadeIn.delay(i * 60)}
                  style={[styles.reviewCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}
                >
                  <View style={styles.reviewHeader}>
                    <View style={[styles.reviewAvatar, { backgroundColor: tokens.accent + "22", borderColor: tokens.accent }]}>
                      <Text style={{ color: tokens.accent, fontWeight: "900", fontSize: 12 }}>U</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: tokens.text, fontWeight: "700", fontSize: 13 }}>Utente</Text>
                      <Text style={{ color: tokens.accent, fontSize: 13, marginTop: 2 }}>
                        {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                      </Text>
                    </View>
                  </View>
                  {r.comment && (
                    <Text style={{ color: tokens.textMuted, marginTop: 8, fontSize: 13, lineHeight: 19 }}>
                      {"\u201C"}{r.comment}{"\u201D"}
                    </Text>
                  )}
                </Animated.View>
              ))}
            </View>
          </Section>
        )}

        <View style={{ height: spacing.lg }} />
      </ScrollView>

      {/* ---------- 9. STICKY BOTTOM CTA ---------- */}
      <View style={[styles.stickyBar, { backgroundColor: tokens.bg, borderTopColor: tokens.accent + "44" }]}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: tokens.textMuted, fontSize: 11, letterSpacing: 1, fontWeight: "700" }}>
            {service.label.toUpperCase()} · {champ.callDurationMinutes} MIN
          </Text>
          <Text style={{ color: tokens.text, fontSize: 22, fontWeight: "900", marginTop: 2 }}>
            {formatPrice(priceCents)}
          </Text>
        </View>
        <TouchableOpacity
          testID="book-btn"
          onPress={onBook}
          disabled={!selectedSlot || busy}
          style={{ opacity: (!selectedSlot || busy) ? 0.5 : 1, borderRadius: radius.pill, overflow: "hidden" }}
        >
          <LinearGradient
            colors={[service.color, service.color + "bb"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.ctaButton}
          >
            <Text style={{ color: "#07111F", fontWeight: "900", letterSpacing: 1, fontSize: 14 }}>
              {busy ? "INVIO…" : selectedSlot ? "INVIA RICHIESTA" : "SCEGLI SLOT"}
            </Text>
            {!busy && <Ionicons name="arrow-forward" size={16} color="#07111F" />}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* ---------- REQUEST NOTE MODAL ---------- */}
      <Modal visible={noteOpen} animationType="slide" transparent onRequestClose={() => setNoteOpen(false)}>
        <View style={styles.modalBackdrop}>
          <Animated.View entering={ZoomIn.duration(220)} style={[styles.modalCard, { backgroundColor: tokens.surface, borderColor: tokens.accent + "88" }]}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={{ color: tokens.accent, fontSize: 12, fontWeight: "800", letterSpacing: 2 }}>
                RICHIESTA A {champ.name.toUpperCase()}
              </Text>
              <TouchableOpacity onPress={() => setNoteOpen(false)} hitSlop={12} testID="note-close">
                <Ionicons name="close" size={22} color={tokens.textMuted} />
              </TouchableOpacity>
            </View>
            <Text style={{ color: tokens.text, fontSize: 18, fontWeight: "900", marginTop: 6 }}>
              Aggiungi un messaggio
            </Text>
            <Text style={{ color: tokens.textMuted, fontSize: 12, marginTop: 4 }}>
              Facoltativo · massimo 300 caratteri
            </Text>

            <TextInput
              testID="note-input"
              value={note}
              onChangeText={(t) => setNote(t.slice(0, 300))}
              placeholder="Es. Ciao! Sono un tuo grande fan da anni…"
              placeholderTextColor={tokens.textMuted}
              multiline
              maxLength={300}
              style={[styles.noteInput, { backgroundColor: tokens.bg, borderColor: tokens.border, color: tokens.text }]}
            />
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 6 }}>
              <Text style={{ color: tokens.textMuted, fontSize: 11 }}>
                💰 Nessun addebito ora — pagherai solo se il champion accetta
              </Text>
              <Text style={{ color: note.length >= 280 ? tokens.danger : tokens.textMuted, fontSize: 11, fontWeight: "700" }}>
                {note.length}/300
              </Text>
            </View>

            <TouchableOpacity
              testID="submit-request-btn"
              onPress={submitRequest}
              disabled={busy}
              style={{ marginTop: spacing.md, borderRadius: radius.pill, overflow: "hidden", opacity: busy ? 0.5 : 1 }}
            >
              <LinearGradient
                colors={[service.color, service.color + "bb"]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.ctaButton}
              >
                <Ionicons name="send" size={16} color="#07111F" />
                <Text style={{ color: "#07111F", fontWeight: "900", letterSpacing: 1, fontSize: 14 }}>
                  {busy ? "INVIO…" : "INVIA RICHIESTA"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Small reusable sub-components
// ---------------------------------------------------------------------------
function Section({ title, children, tokens }: { title: string; children: React.ReactNode; tokens: any }) {
  return (
    <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.xl }}>
      <Text style={[styles.sectionTitle, { color: tokens.accent }]}>{title}</Text>
      {children}
    </View>
  );
}

function StatCol({ icon, value, label, color, tokens }: any) {
  return (
    <View style={styles.statCol}>
      <Ionicons name={icon} size={16} color={color} />
      <Text style={[styles.statValue, { color: tokens.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: tokens.textMuted }]}>{label}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  hero: { height: 360, position: "relative" },
  topRow: {
    position: "absolute",
    top: spacing.md,
    right: spacing.md,
    flexDirection: "row",
    gap: 6,
  },
  chipTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  chipTopText: { color: "#08142D", fontWeight: "900", fontSize: 10, letterSpacing: 1 },

  infoWrap: {
    paddingHorizontal: spacing.md,
    marginTop: -60,
    gap: spacing.sm,
  },
  infoCard: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  name: {
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  team: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  metaText: { fontSize: 12, fontWeight: "600" },
  dotSep: { width: 3, height: 3, borderRadius: 999 },

  statsCard: {
    flexDirection: "row",
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  statCol: { flex: 1, alignItems: "center", gap: 3 },
  statValue: { fontSize: 18, fontWeight: "900", marginTop: 2 },
  statLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase" },
  divider: { width: 1, marginHorizontal: 4 },

  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2.5,
    marginBottom: 12,
  },

  bioCard: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },

  // Services 2x2 grid
  svcGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  svcCell: { width: "48.5%" },
  svcCard: {
    minHeight: 132,
    padding: spacing.md,
    borderRadius: radius.lg,
    justifyContent: "flex-start",
  },
  svcTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  svcIconWrap: {
    width: 42, height: 42, borderRadius: 999,
    alignItems: "center", justifyContent: "center",
  },
  svcLabel: { fontSize: 15, fontWeight: "800" },
  svcDesc: { fontSize: 11, marginTop: 2 },
  svcPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  svcPrice: { fontSize: 15, fontWeight: "900" },

  // Slots
  dayLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  slotPill: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1.5,
  },

  emptyBox: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: "center",
  },

  // Career timeline
  careerCard: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  careerRow: { flexDirection: "row", gap: 12 },
  careerTimeline: { width: 12, alignItems: "center" },
  careerDot: {
    width: 10, height: 10, borderRadius: 5,
    marginTop: 4,
  },
  careerLine: {
    flex: 1,
    width: 2,
    marginTop: 2,
  },

  // Reviews
  reviewCard: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  reviewHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  reviewAvatar: {
    width: 32, height: 32, borderRadius: 999,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1,
  },

  // Sticky CTA
  stickyBar: {
    position: "absolute",
    left: 0, right: 0, bottom: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 14,
    justifyContent: "center",
  },

  // Note request modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: "#00000088",
    justifyContent: "center",
    padding: spacing.lg,
  },
  modalCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    gap: 6,
  },
  noteInput: {
    marginTop: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: 12,
    minHeight: 100,
    fontSize: 14,
    lineHeight: 20,
    textAlignVertical: "top",
  },
});
