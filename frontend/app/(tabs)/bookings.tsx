import { useCallback, useEffect, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { bookings as bStore, champions as cStore, Booking, Champion } from "../../src/store";
import { useAuth } from "../../src/context/auth";
import { formatPrice, radius, spacing, useTheme } from "../../src/theme";

const STATUS_LABEL: Record<string, string> = {
  pending_payment: "Da pagare",
  confirmed: "Confermata",
  in_progress: "In corso",
  completed: "Completata",
  cancelled: "Annullata",
  refunded: "Rimborsata",
};

export default function BookingsScreen() {
  const { tokens } = useTheme();
  const { user } = useAuth();
  const [data, setData] = useState<(Booking & { champion?: Champion })[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const role = user.role === "champion" ? "champion" : "fan";
    const list = await bStore.listForUser(user.id, role);
    const enriched = await Promise.all(list.map(async (b) => ({
      ...b, champion: (await cStore.getById(b.championId)) ?? undefined,
    })));
    setData(enriched);
  }, [user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bg }}>
      <FlatList
        testID="bookings-list"
        data={data}
        keyExtractor={(b) => b.id}
        contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tokens.primary} />}
        ListEmptyComponent={
          <Text style={{ color: tokens.textMuted, textAlign: "center", marginTop: spacing.xl, padding: spacing.md }}>
            Nessuna prenotazione. Vai su Explore e prenota il tuo Champion preferito!
          </Text>
        }
        renderItem={({ item }) => {
          const statusColor =
            item.status === "confirmed" || item.status === "completed" ? tokens.success
              : item.status === "cancelled" || item.status === "refunded" ? tokens.danger
              : tokens.accent;
          return (
            <TouchableOpacity
              testID={`booking-${item.id}`}
              onPress={() => router.push(`/booking/${item.id}` as never)}
              style={{
                backgroundColor: tokens.surface, borderColor: tokens.border, borderWidth: 1,
                borderRadius: radius.lg, padding: spacing.md, flexDirection: "row", alignItems: "center", gap: spacing.md,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ color: tokens.text, fontWeight: "700", fontSize: 16 }} numberOfLines={1}>
                  {item.champion?.name ?? "Champion"}
                </Text>
                <Text style={{ color: tokens.textMuted, marginTop: 4, fontSize: 13 }}>
                  {new Date(item.scheduledStart).toLocaleString("it-IT", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 }}>
                  <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: statusColor + "22" }}>
                    <Text style={{ color: statusColor, fontSize: 11, fontWeight: "700", letterSpacing: 0.5 }}>
                      {STATUS_LABEL[item.status] ?? item.status}
                    </Text>
                  </View>
                </View>
              </View>
              <Text style={{ color: tokens.accent, fontWeight: "800", fontSize: 16 }}>
                {formatPrice(item.priceCents, item.currency)}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({});
