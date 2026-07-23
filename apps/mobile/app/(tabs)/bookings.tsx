import { useCallback, useEffect, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import dayjs from "dayjs";
import { bookings } from "../../src/services";
import { useAuth } from "../../src/context/auth";
import { colors, formatPrice, radius, spacing, typography } from "../../src/theme";
import type { Booking } from "@meet-champion/shared";

export default function BookingsScreen() {
  const { profile } = useAuth();
  const [data, setData] = useState<Booking[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!profile) return;
    const role = profile.role === "champion" ? "champion" : "fan";
    const list = await bookings.getMy(role);
    setData(list);
  }, [profile]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <FlatList
        testID="bookings-list"
        data={data}
        keyExtractor={(b) => b.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={<Text style={styles.emptyText}>No bookings yet.</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity
            testID={`booking-card-${item.id}`}
            style={styles.card}
            onPress={() => router.push(`/booking/${item.id}` as never)}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.when}>
                {dayjs(item.scheduled_start).format("ddd, MMM D · HH:mm")}
              </Text>
              <Text style={styles.status}>{item.status.replace(/_/g, " ")}</Text>
            </View>
            <Text style={styles.amount}>{formatPrice(item.price_cents, item.currency)}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  listContent: { padding: spacing.md, gap: spacing.md },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  when: { ...typography.h3, color: colors.text },
  status: { color: colors.textMuted, marginTop: 4, textTransform: "capitalize" },
  amount: { color: colors.primary, fontWeight: "700" },
  emptyText: { color: colors.textMuted, textAlign: "center", marginTop: spacing.xl },
});
