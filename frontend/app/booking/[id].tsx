import { useCallback, useEffect, useState } from "react";
import { Alert, ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { bookings as bStore, champions as cStore, reviews as rStore, Booking, Champion } from "../../src/store";
import { useAuth } from "../../src/context/auth";
import { formatPrice, radius, spacing, useTheme } from "../../src/theme";

export default function BookingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { tokens } = useTheme();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [champ, setChamp] = useState<Champion | null>(null);
  const [paying, setPaying] = useState(false);
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
    setPaying(true);
    // Mock latency
    await new Promise((r) => setTimeout(r, 800));
    try {
      await bStore.pay(booking.id);
      Alert.alert("✅ Pagamento riuscito", "La tua prenotazione è confermata.");
      load();
    } catch (e: any) { Alert.alert("Errore", e.message); }
    finally { setPaying(false); }
  };

  const onCancel = async () => {
    if (!booking) return;
    Alert.alert("Confermi la cancellazione?", "Lo slot tornerà disponibile.",
      [
        { text: "No", style: "cancel" },
        { text: "Sì, cancella", style: "destructive", onPress: async () => {
          try { await bStore.cancel(booking.id); load(); }
          catch (e: any) { Alert.alert("Errore", e.message); }
        }},
      ]);
  };

  const onJoinAndComplete = async () => {
    if (!booking) return;
    Alert.alert("Videochiamata (demo)", "In produzione qui si aprirebbe la stanza Daily/Agora. Marchio la chiamata come completata per abilitare la recensione.",
      [{ text: "OK", onPress: async () => { try { await bStore.complete(booking.id); load(); } catch (e: any) { Alert.alert("Errore", e.message); }}}]);
  };

  const onSubmitReview = async () => {
    if (!booking || !user) return;
    try {
      await rStore.create({ bookingId: booking.id, fanId: user.id, championId: booking.championId, rating, comment: comment.trim() || undefined });
      Alert.alert("Grazie!", "La tua recensione è stata inviata.");
      setReviewed(true);
    } catch (e: any) { Alert.alert("Errore", e.message); }
  };

  if (!booking || !champ) {
    return <View style={{ flex: 1, backgroundColor: tokens.bg, alignItems: "center", justifyContent: "center" }}><ActivityIndicator color={tokens.primary} /></View>;
  }

  const d = new Date(booking.scheduledStart);
  const statusColor =
    booking.status === "confirmed" || booking.status === "completed" ? tokens.success
      : booking.status === "cancelled" || booking.status === "refunded" ? tokens.danger
      : tokens.accent;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: tokens.bg }} contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
      <View style={{ backgroundColor: tokens.surface, borderColor: tokens.border, borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg, alignItems: "center" }}>
        <Ionicons name="videocam" size={44} color={tokens.primary} />
        <Text style={{ color: tokens.text, fontSize: 20, fontWeight: "800", marginTop: 10 }}>{champ.name}</Text>
        <Text style={{ color: tokens.textMuted, marginTop: 4 }}>
          {d.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })} · {d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
        </Text>
        <View style={{ marginTop: 12, backgroundColor: statusColor + "22", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999 }}>
          <Text style={{ color: statusColor, fontWeight: "700", letterSpacing: 1, fontSize: 11 }}>
            {booking.status.replace(/_/g, " ").toUpperCase()}
          </Text>
        </View>
      </View>

      <Row label="Durata" value={`${booking.durationMinutes} min`} tokens={tokens} />
      <Row label="Totale" value={formatPrice(booking.priceCents, booking.currency)} tokens={tokens} accent />

      {booking.status === "pending_payment" && (
        <TouchableOpacity testID="pay-btn" onPress={onPay} disabled={paying}
          style={{ backgroundColor: tokens.primary, padding: spacing.md, borderRadius: radius.md, alignItems: "center", opacity: paying ? 0.6 : 1 }}>
          <Text style={{ color: tokens.bg, fontWeight: "800", fontSize: 16 }}>{paying ? "Elaborazione…" : "Paga ora (demo)"}</Text>
        </TouchableOpacity>
      )}

      {booking.status === "confirmed" && (
        <TouchableOpacity testID="join-btn" onPress={onJoinAndComplete}
          style={{ backgroundColor: tokens.success, padding: spacing.md, borderRadius: radius.md, alignItems: "center" }}>
          <Text style={{ color: "#07111F", fontWeight: "800", fontSize: 16 }}>Entra nella call</Text>
        </TouchableOpacity>
      )}

      {(booking.status === "pending_payment" || booking.status === "confirmed") && (
        <TouchableOpacity testID="cancel-btn" onPress={onCancel}
          style={{ padding: spacing.md, borderRadius: radius.md, alignItems: "center", borderWidth: 1, borderColor: tokens.danger + "88" }}>
          <Text style={{ color: tokens.danger, fontWeight: "700" }}>Cancella prenotazione</Text>
        </TouchableOpacity>
      )}

      {/* Review after completion */}
      {booking.status === "completed" && !reviewed && (
        <View style={{ backgroundColor: tokens.surface, borderRadius: radius.md, borderWidth: 1, borderColor: tokens.border, padding: spacing.md }}>
          <Text style={{ color: tokens.accent, fontWeight: "800", marginBottom: 8, letterSpacing: 1 }}>LASCIA UNA RECENSIONE</Text>
          <View style={{ flexDirection: "row", gap: 4, marginBottom: 8 }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <TouchableOpacity key={n} onPress={() => setRating(n)}>
                <Text style={{ fontSize: 28, color: n <= rating ? tokens.accent : tokens.border }}>★</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput value={comment} onChangeText={setComment} placeholder="Com'è andata? (opzionale)" placeholderTextColor={tokens.textMuted}
            multiline style={{ backgroundColor: tokens.bg, color: tokens.text, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: tokens.border, minHeight: 60 }} />
          <TouchableOpacity onPress={onSubmitReview} testID="review-submit"
            style={{ marginTop: 10, backgroundColor: tokens.primary, padding: 12, borderRadius: 10, alignItems: "center" }}>
            <Text style={{ color: tokens.bg, fontWeight: "700" }}>Invia recensione</Text>
          </TouchableOpacity>
        </View>
      )}
      {reviewed && (
        <Text style={{ color: tokens.success, textAlign: "center" }}>✓ Recensione inviata</Text>
      )}
    </ScrollView>
  );
}

function Row({ label, value, tokens, accent }: { label: string; value: string; tokens: any; accent?: boolean }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", padding: spacing.md, backgroundColor: tokens.surface, borderRadius: 12, borderWidth: 1, borderColor: tokens.border }}>
      <Text style={{ color: tokens.textMuted }}>{label}</Text>
      <Text style={{ color: accent ? tokens.accent : tokens.text, fontWeight: accent ? "800" : "600" }}>{value}</Text>
    </View>
  );
}
