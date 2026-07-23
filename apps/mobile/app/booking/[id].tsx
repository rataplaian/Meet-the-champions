import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import dayjs from "dayjs";
import { Ionicons } from "@expo/vector-icons";
import { bookings, payments } from "../../src/services";
import { colors, formatPrice, radius, spacing, typography } from "../../src/theme";
import type { Booking } from "@meet-champion/shared";

export default function BookingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => setBooking(await bookings.getById(id)))();
  }, [id]);

  const onPay = async () => {
    if (!booking) return;
    setPaying(true);
    setError(null);
    try {
      // In a real app, you would use @stripe/stripe-react-native
      // `initPaymentSheet` + `presentPaymentSheet`. Here we only fetch
      // the client_secret to prove the edge fn works.
      const { client_secret } = await payments.createIntent(booking.id);
      if (!client_secret) throw new Error("no_client_secret");
      // TODO: wire Stripe PaymentSheet UI
      setError("PaymentIntent created. Wire @stripe/stripe-react-native to complete payment (see docs).");
    } catch (e: any) {
      setError(e.message ?? "Payment failed");
    } finally {
      setPaying(false);
    }
  };

  const onJoinCall = () => {
    if (!booking) return;
    router.push(`/call/${booking.id}` as never);
  };

  if (!booking) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      <View style={styles.card}>
        <Ionicons name="calendar" size={40} color={colors.primary} />
        <Text style={styles.when}>
          {dayjs(booking.scheduled_start).format("dddd, MMM D")}
        </Text>
        <Text style={styles.time}>
          {dayjs(booking.scheduled_start).format("HH:mm")} –
          {" "}{dayjs(booking.scheduled_end).format("HH:mm")}
        </Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{booking.status.replace(/_/g, " ")}</Text>
        </View>
      </View>

      <View style={styles.rowCard}>
        <Text style={styles.muted}>Total</Text>
        <Text style={styles.total}>{formatPrice(booking.price_cents, booking.currency)}</Text>
      </View>
      <View style={styles.rowCard}>
        <Text style={styles.muted}>Platform fee</Text>
        <Text style={styles.value}>{formatPrice(booking.platform_fee_cents, booking.currency)}</Text>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      {booking.status === "pending_payment" && (
        <TouchableOpacity
          testID="booking-pay-button"
          style={[styles.button, paying && { opacity: 0.5 }]}
          onPress={onPay}
          disabled={paying}
        >
          <Text style={styles.buttonText}>{paying ? "Preparing…" : "Pay now"}</Text>
        </TouchableOpacity>
      )}

      {["confirmed", "in_progress"].includes(booking.status) && (
        <TouchableOpacity
          testID="booking-join-call-button"
          style={styles.button}
          onPress={onJoinCall}
        >
          <Ionicons name="videocam" size={20} color={colors.bg} />
          <Text style={styles.buttonText}>Join call</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  when: { ...typography.h2, color: colors.text, marginTop: spacing.md },
  time: { color: colors.textMuted, marginTop: 4 },
  statusBadge: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.primary + "22",
  },
  statusText: { color: colors.primary, fontWeight: "600", textTransform: "capitalize" },
  rowCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  muted: { color: colors.textMuted },
  value: { color: colors.text },
  total: { color: colors.primary, fontWeight: "700", fontSize: 18 },
  button: {
    flexDirection: "row",
    gap: spacing.sm,
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.lg,
  },
  buttonText: { color: colors.bg, fontWeight: "700", fontSize: 16 },
  error: { color: colors.danger, marginTop: spacing.sm },
});
