import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import dayjs from "dayjs";
import { Ionicons } from "@expo/vector-icons";
import { bookings as bookingsSvc, champions } from "../../src/services";
import { colors, formatPrice, radius, spacing, typography } from "../../src/theme";
import type { AvailabilitySlot, ChampionProfile, Profile } from "@meet-champion/shared";

export default function ChampionDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [data, setData] = useState<(ChampionProfile & { profile: Profile }) | null>(null);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const c = await champions.getById(id);
      setData(c);
      const s = await champions.availableSlots(id);
      setSlots(s);
    })();
  }, [id]);

  const onBook = async () => {
    if (!selectedSlot || !id) return;
    setError(null);
    setBooking(true);
    try {
      const b = await bookingsSvc.create({ championId: id, slotId: selectedSlot });
      router.replace(`/booking/${b.id}` as never);
    } catch (e: any) {
      setError(e.message ?? "Booking failed");
    } finally {
      setBooking(false);
    }
  };

  if (!data) return <View style={styles.container}><Text style={styles.muted}>Loading…</Text></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={44} color={colors.textMuted} />
        </View>
        <Text style={styles.name}>{data.profile.display_name}</Text>
        <Text style={styles.headline}>{data.headline}</Text>
        <View style={styles.metaRow}>
          <Ionicons name="star" size={14} color={colors.primary} />
          <Text style={styles.muted}>
            {data.rating_average ? data.rating_average.toFixed(1) : "New"} · {data.total_calls} calls
          </Text>
        </View>
      </View>

      <View style={styles.priceCard}>
        <View>
          <Text style={styles.muted}>Rate</Text>
          <Text style={styles.price}>
            {formatPrice(data.hourly_rate_cents, data.currency)}
          </Text>
        </View>
        <View>
          <Text style={styles.muted}>Duration</Text>
          <Text style={styles.priceValue}>{data.call_duration_minutes} min</Text>
        </View>
        <View>
          <Text style={styles.muted}>Languages</Text>
          <Text style={styles.priceValue}>{data.languages.join(", ")}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Pick a slot</Text>
      {slots.length === 0 ? (
        <Text style={styles.muted}>No open slots.</Text>
      ) : (
        <View style={styles.slotsWrap}>
          {slots.map((s) => {
            const active = s.id === selectedSlot;
            return (
              <TouchableOpacity
                key={s.id}
                testID={`slot-${s.id}`}
                style={[styles.slotChip, active && styles.slotChipActive]}
                onPress={() => setSelectedSlot(s.id)}
              >
                <Text style={[styles.slotText, active && { color: colors.primary, fontWeight: "700" }]}>
                  {dayjs(s.starts_at).format("MMM D · HH:mm")}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity
        testID="champion-book-button"
        style={[styles.bookButton, (!selectedSlot || booking) && { opacity: 0.5 }]}
        disabled={!selectedSlot || booking}
        onPress={onBook}
      >
        <Text style={styles.bookButtonText}>
          {booking ? "Reserving…" : `Book · ${formatPrice(data.hourly_rate_cents, data.currency)}`}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { alignItems: "center", marginBottom: spacing.lg },
  avatar: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: colors.surface,
    alignItems: "center", justifyContent: "center",
  },
  name: { ...typography.h1, color: colors.text, marginTop: spacing.md },
  headline: { color: colors.textMuted, textAlign: "center", marginTop: 4 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8 },
  muted: { color: colors.textMuted },
  priceCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  price: { color: colors.primary, fontWeight: "700", fontSize: 20, marginTop: 4 },
  priceValue: { color: colors.text, fontWeight: "600", marginTop: 4 },
  sectionTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.sm },
  slotsWrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.lg },
  slotChip: {
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  slotChipActive: { borderColor: colors.primary, backgroundColor: colors.primary + "22" },
  slotText: { color: colors.textMuted },
  bookButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: "center",
    marginTop: spacing.md,
  },
  bookButtonText: { color: colors.bg, fontWeight: "700", fontSize: 16 },
  error: { color: colors.danger, marginTop: spacing.sm },
});
