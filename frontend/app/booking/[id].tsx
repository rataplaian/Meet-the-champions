// Booking detail — checkout + confirmation ticket + action buttons.
// Post-payment shows an animated QR ticket. "Join" opens the fake call screen.
import { useCallback, useEffect, useState } from "react";
import { Alert, ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn, FadeInDown, ZoomIn } from "react-native-reanimated";
import { bookings as bStore, champions as cStore, reviews as rStore, Booking, Champion } from "../../src/store";
import { useAuth } from "../../src/context/auth";
import { formatPrice, radius, spacing, useTheme } from "../../src/theme";
import { hap } from "../../src/utils/haptics";
import { QrTicket, TicketFrame } from "../../src/components/QrTicket";
import { CountdownPill } from "../../src/components/CountdownPill";

export default function BookingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { tokens } = useTheme();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [champ, setChamp] = useState<Champion | null>(null);
  const [paying, setPaying] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewed, setReviewed] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    const b = await bStore.getById(id);
    setBooking(b);
    if (b) {
      setChamp(await cStore.getById(b.championId));
      const existing = await rStore.byBooking(b.id);
      setReviewed(!!existing);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const onPay = async () => {
    if (!booking) return;
    hap.medium();
    setPaying(true);
    await new Promise((r) => setTimeout(r, 1100));
    try {
      await bStore.pay(booking.id);
      hap.success();
      setShowSuccess(true);
      await load();
    } catch (e: any) {
      hap.error();
      Alert.alert("Errore", e.message);
    } finally { setPaying(false); }
  };

  const onCancel = () => {
    if (!booking) return;
    Alert.alert(
      "Confermi la cancellazione?",
      "Lo slot tornerà disponibile.",
      [
        { text: "No", style: "cancel" },
        {
          text: "Sì, cancella", style: "destructive", onPress: async () => {
            hap.warning();
            try { await bStore.cancel(booking.id); load(); }
            catch (e: any) { Alert.alert("Errore", e.message); }
          },
        },
      ],
    );
  };

  const onJoinCall = () => {
    if (!booking) return;
    hap.heavy();
    router.push(`/call/${booking.id}` as never);
  };

  const onFakeChat = () => {
    hap.light();
    Alert.alert("Chat 24h", `Hai avviato una chat con ${champ?.name}. Ti risponderà entro 24h. (demo)`);
  };
  const onFakeAutograph = () => {
    hap.light();
    Alert.alert("Autografo", `Il tuo video autografo verrà generato e inviato via email. (demo)`);
  };

  const onSubmitReview = async () => {
    if (!booking || !user) return;
    try {
      await rStore.create({
        bookingId: booking.id, fanId: user.id, championId: booking.championId,
        rating, comment: comment.trim() || undefined,
      });
      hap.success();
      Alert.alert("Grazie!", "La tua recensione è stata inviata.");
      setReviewed(true);
    } catch (e: any) { Alert.alert("Errore", e.message); }
  };

  if (!booking || !champ) {
    return (
      <View style={{ flex: 1, backgroundColor: tokens.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={tokens.primary} />
      </View>
    );
  }

  const d = new Date(booking.scheduledStart);
  const confirmed = booking.status === "confirmed" || booking.status === "completed";

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: tokens.bg }}
      contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: 40 }}
    >
      {booking.status === "pending_payment" ? (
        // -------- CHECKOUT VIEW --------
        <Animated.View entering={FadeInDown.duration(400)} style={{ gap: spacing.md }}>
          <View style={[styles.hero, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
            <View style={[styles.iconCircle, { backgroundColor: tokens.primary + "22" }]}>
              <Ionicons name="card" size={32} color={tokens.primary} />
            </View>
            <Text style={{ color: tokens.text, fontSize: 22, fontWeight: "900", marginTop: 12 }}>
              Riepilogo Ordine
            </Text>
            <Text style={{ color: tokens.textMuted, marginTop: 4, fontSize: 13 }}>Controlla e conferma</Text>
          </View>

          <SummaryCard
            champ={champ}
            date={d}
            duration={booking.durationMinutes}
            price={formatPrice(booking.priceCents, booking.currency)}
            tokens={tokens}
          />

          {/* Mock payment method selector */}
          <View style={[styles.paymentSel, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
            <Text style={[styles.sectionLabel, { color: tokens.accent }]}>METODO DI PAGAMENTO</Text>
            <View style={styles.methodRow}>
              <View style={[styles.methodCard, { backgroundColor: tokens.primary + "22", borderColor: tokens.primary }]}>
                <Ionicons name="card-outline" size={22} color={tokens.primary} />
                <Text style={{ color: tokens.text, fontWeight: "700", fontSize: 12 }}>Carta</Text>
                <Text style={{ color: tokens.textMuted, fontSize: 10 }}>•••• 4242</Text>
              </View>
              <View style={[styles.methodCard, { backgroundColor: tokens.surface, borderColor: tokens.border, opacity: 0.6 }]}>
                <Ionicons name="logo-apple" size={22} color={tokens.text} />
                <Text style={{ color: tokens.text, fontWeight: "700", fontSize: 12 }}>Apple Pay</Text>
              </View>
              <View style={[styles.methodCard, { backgroundColor: tokens.surface, borderColor: tokens.border, opacity: 0.6 }]}>
                <Ionicons name="logo-google" size={22} color={tokens.text} />
                <Text style={{ color: tokens.text, fontWeight: "700", fontSize: 12 }}>G Pay</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            testID="pay-btn"
            onPress={onPay}
            disabled={paying}
            style={{ borderRadius: radius.pill, overflow: "hidden" }}
          >
            <LinearGradient
              colors={[tokens.accent, "#EBB43B"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.payBtn}
            >
              {paying ? <ActivityIndicator color="#08142D" /> : (
                <>
                  <Ionicons name="lock-closed" size={16} color="#08142D" />
                  <Text style={styles.payBtnText}>PAGA {formatPrice(booking.priceCents, booking.currency)}</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity testID="cancel-btn" onPress={onCancel} style={styles.cancelBtn}>
            <Text style={{ color: tokens.textMuted, fontWeight: "600" }}>Annulla prenotazione</Text>
          </TouchableOpacity>

          <Text style={{ color: tokens.textMuted, textAlign: "center", fontSize: 11, marginTop: 4 }}>
            🔒 Pagamento sicuro · Modalità demo · nessun addebito reale
          </Text>
        </Animated.View>
      ) : (
        // -------- CONFIRMED / TICKET VIEW --------
        <Animated.View entering={FadeIn.duration(400)} style={{ gap: spacing.md }}>
          {showSuccess && (
            <Animated.View entering={ZoomIn.duration(500)} style={[styles.successBanner, { backgroundColor: tokens.success + "22", borderColor: tokens.success }]}>
              <Ionicons name="checkmark-circle" size={24} color={tokens.success} />
              <Text style={{ color: tokens.success, fontWeight: "800", letterSpacing: 1 }}>
                PAGAMENTO CONFERMATO ✨
              </Text>
            </Animated.View>
          )}

          <TicketFrame accent={tokens.accent}>
            <View style={{ padding: spacing.lg, alignItems: "center", gap: 12 }}>
              <View style={styles.brandRow}>
                <Ionicons name="football" size={16} color={tokens.accent} />
                <Text style={styles.brandRowText}>MEET CHAMPION · TICKET</Text>
                <Ionicons name="football" size={16} color={tokens.accent} />
              </View>

              <View style={{ alignItems: "center", gap: 2 }}>
                <Text style={styles.ticketName}>{champ.name.toUpperCase()}</Text>
                <Text style={styles.ticketMeta}>{champ.team}</Text>
              </View>

              <View style={styles.ticketDivider} />

              <View style={{ flexDirection: "row", justifyContent: "space-around", width: "100%" }}>
                <TicketField label="DATA" value={d.toLocaleDateString("it-IT", { day: "numeric", month: "short" })} />
                <TicketField label="ORA" value={d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })} />
                <TicketField label="DURATA" value={`${booking.durationMinutes}'`} />
              </View>

              <CountdownPill startsAt={booking.scheduledStart} durationMinutes={booking.durationMinutes} />

              <View style={styles.ticketDashed} />

              <QrTicket code={booking.id} size={168} />

              <Text style={styles.ticketFoot}>
                Presenta questo ticket all{"\u2019"}ingresso della call
              </Text>
            </View>
          </TicketFrame>

          {booking.status === "confirmed" && (
            <>
              <TouchableOpacity
                testID="join-btn"
                onPress={onJoinCall}
                style={{ borderRadius: radius.pill, overflow: "hidden" }}
              >
                <LinearGradient
                  colors={["#2ED47A", "#1FA362"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.joinBtn}
                >
                  <Ionicons name="videocam" size={18} color="#07111F" />
                  <Text style={styles.joinBtnText}>ENTRA NELLA CALL</Text>
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.actionRow}>
                <SmallAction icon="chatbubbles" label="Chat" color="#7257FF" onPress={onFakeChat} tokens={tokens} testID="chat-btn" />
                <SmallAction icon="star" label="Autografo" color="#E53935" onPress={onFakeAutograph} tokens={tokens} testID="autograph-btn" />
                <SmallAction icon="close-circle-outline" label="Annulla" color={tokens.danger} onPress={onCancel} tokens={tokens} testID="cancel-btn" />
              </View>
            </>
          )}

          {booking.status === "completed" && !reviewed && (
            <Animated.View entering={FadeInDown.duration(400)}
              style={{ backgroundColor: tokens.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: tokens.border, padding: spacing.md }}>
              <Text style={{ color: tokens.accent, fontWeight: "800", marginBottom: 8, letterSpacing: 1, fontSize: 12 }}>
                LASCIA UNA RECENSIONE
              </Text>
              <View style={{ flexDirection: "row", gap: 4, marginBottom: 10 }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <TouchableOpacity key={n} onPress={() => { hap.select(); setRating(n); }}>
                    <Text style={{ fontSize: 32, color: n <= rating ? tokens.accent : tokens.border }}>★</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                value={comment} onChangeText={setComment}
                placeholder="Com'è andata? (opzionale)" placeholderTextColor={tokens.textMuted}
                multiline
                style={{ backgroundColor: tokens.bg, color: tokens.text, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: tokens.border, minHeight: 60 }}
              />
              <TouchableOpacity onPress={onSubmitReview} testID="review-submit"
                style={{ marginTop: 10, backgroundColor: tokens.primary, padding: 12, borderRadius: 10, alignItems: "center" }}>
                <Text style={{ color: "#07111F", fontWeight: "800" }}>Invia recensione</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
          {reviewed && (
            <Text style={{ color: tokens.success, textAlign: "center", fontWeight: "700" }}>
              ✓ Recensione inviata — grazie!
            </Text>
          )}

          <TouchableOpacity
            onPress={() => router.replace("/(tabs)/bookings" as never)}
            style={{ marginTop: 4, padding: 12, alignItems: "center" }}
          >
            <Text style={{ color: tokens.textMuted, fontWeight: "600" }}>← Torna alle tue prenotazioni</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </ScrollView>
  );
}

function SummaryCard({ champ, date, duration, price, tokens }: any) {
  return (
    <View style={[styles.summary, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
      <Text style={[styles.sectionLabel, { color: tokens.accent }]}>DETTAGLI</Text>
      <View style={styles.rowSpace}>
        <Text style={{ color: tokens.textMuted }}>Con</Text>
        <Text style={{ color: tokens.text, fontWeight: "800" }}>{champ.name}</Text>
      </View>
      <View style={styles.rowSpace}>
        <Text style={{ color: tokens.textMuted }}>Data</Text>
        <Text style={{ color: tokens.text, fontWeight: "600" }}>
          {date.toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" })}
        </Text>
      </View>
      <View style={styles.rowSpace}>
        <Text style={{ color: tokens.textMuted }}>Ora</Text>
        <Text style={{ color: tokens.text, fontWeight: "600" }}>
          {date.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
        </Text>
      </View>
      <View style={styles.rowSpace}>
        <Text style={{ color: tokens.textMuted }}>Durata</Text>
        <Text style={{ color: tokens.text, fontWeight: "600" }}>{duration} min</Text>
      </View>
      <View style={{ height: 1, backgroundColor: tokens.border, marginVertical: 8 }} />
      <View style={styles.rowSpace}>
        <Text style={{ color: tokens.text, fontSize: 16, fontWeight: "800" }}>TOTALE</Text>
        <Text style={{ color: tokens.accent, fontSize: 20, fontWeight: "900" }}>{price}</Text>
      </View>
    </View>
  );
}

function TicketField({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ alignItems: "center", gap: 2 }}>
      <Text style={{ color: "#F5C45188", fontSize: 9, fontWeight: "800", letterSpacing: 2 }}>{label}</Text>
      <Text style={{ color: "#F7FAFC", fontSize: 14, fontWeight: "800" }}>{value}</Text>
    </View>
  );
}

function SmallAction({ icon, label, color, onPress, tokens, testID }: any) {
  return (
    <TouchableOpacity onPress={onPress} testID={testID}
      style={[styles.smallAction, { backgroundColor: tokens.surface, borderColor: color + "44" }]}>
      <View style={[styles.smallIconWrap, { backgroundColor: color + "22" }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={{ color: tokens.text, fontSize: 12, fontWeight: "700" }}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  hero: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: "center",
  },
  iconCircle: { width: 60, height: 60, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  summary: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: 8,
  },
  sectionLabel: { fontSize: 11, letterSpacing: 2, fontWeight: "800", marginBottom: 6 },
  rowSpace: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  paymentSel: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  methodRow: { flexDirection: "row", gap: 10 },
  methodCard: {
    flex: 1,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
    gap: 4,
  },
  payBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    padding: 16,
    shadowColor: "#F5C451",
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  payBtnText: { color: "#08142D", fontWeight: "900", fontSize: 15, letterSpacing: 2 },
  cancelBtn: { padding: 12, alignItems: "center" },

  successBanner: {
    flexDirection: "row", alignItems: "center", gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  brandRowText: { color: "#F5C451", letterSpacing: 3, fontWeight: "800", fontSize: 11 },
  ticketName: {
    color: "#F7FAFC",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 1,
    textShadowColor: "#000000aa",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  ticketMeta: { color: "#F5C451", fontSize: 12, fontWeight: "700", letterSpacing: 1 },
  ticketDivider: { height: 1, width: "100%", backgroundColor: "#F5C45133", marginTop: 6 },
  ticketDashed: {
    height: 1, width: "100%",
    borderTopWidth: 1,
    borderTopColor: "#F5C45144",
    borderStyle: "dashed",
    marginTop: 8,
  },
  ticketFoot: {
    color: "#A5B1C2", fontSize: 11, textAlign: "center", marginTop: 6,
  },

  joinBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    padding: 16,
    shadowColor: "#2ED47A",
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  joinBtnText: { color: "#07111F", fontWeight: "900", fontSize: 15, letterSpacing: 2 },
  actionRow: { flexDirection: "row", gap: 8 },
  smallAction: {
    flex: 1,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    gap: 6,
  },
  smallIconWrap: {
    width: 36, height: 36, borderRadius: 999,
    alignItems: "center", justifyContent: "center",
  },
});
