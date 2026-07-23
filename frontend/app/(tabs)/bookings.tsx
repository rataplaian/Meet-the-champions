// Bookings tab — split into "Prossime" (upcoming) and "Passate" (past).
// Upcoming items show a live countdown pill (see CountdownPill).
// Empty state illustrated. Pull to refresh supported.
import { useCallback, useMemo, useState } from "react";
import { FlatList, Image, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { bookings as bStore, champions as cStore, Booking, Champion } from "../../src/store";
import { useAuth } from "../../src/context/auth";
import { formatPrice, radius, spacing, useTheme } from "../../src/theme";
import { CountdownPill } from "../../src/components/CountdownPill";
import { Skeleton } from "../../src/components/Skeleton";
import { hap } from "../../src/utils/haptics";

const STATUS_LABEL: Record<string, string> = {
  pending_payment: "Da pagare",
  confirmed: "Confermata",
  in_progress: "In corso",
  completed: "Completata",
  cancelled: "Annullata",
  refunded: "Rimborsata",
};

type Tab = "upcoming" | "past";

export default function BookingsScreen() {
  const { tokens } = useTheme();
  const { user } = useAuth();
  const [data, setData] = useState<(Booking & { champion?: Champion })[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("upcoming");

  const load = useCallback(async () => {
    if (!user) return;
    const role = user.role === "champion" ? "champion" : "fan";
    const list = await bStore.listForUser(user.id, role);
    const enriched = await Promise.all(list.map(async (b) => ({
      ...b, champion: (await cStore.getById(b.championId)) ?? undefined,
    })));
    setData(enriched);
    setLoading(false);
  }, [user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => { hap.light(); setRefreshing(true); await load(); setRefreshing(false); };

  const { upcoming, past } = useMemo(() => {
    const now = Date.now();
    const up: typeof data = [];
    const pa: typeof data = [];
    for (const b of data) {
      const end = new Date(b.scheduledStart).getTime() + b.durationMinutes * 60_000;
      const isPast =
        end < now || b.status === "completed" || b.status === "cancelled" || b.status === "refunded";
      (isPast ? pa : up).push(b);
    }
    up.sort((a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime());
    pa.sort((a, b) => new Date(b.scheduledStart).getTime() - new Date(a.scheduledStart).getTime());
    return { upcoming: up, past: pa };
  }, [data]);

  const visible = tab === "upcoming" ? upcoming : past;

  // Highlight the next upcoming pending_payment for a reminder banner
  const nextPending = upcoming.find((b) => b.status === "pending_payment");
  const nextConfirmed = upcoming.find((b) => b.status === "confirmed");

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bg }}>
      {/* Reminder banner */}
      {(nextPending || nextConfirmed) && tab === "upcoming" && (
        <Animated.View entering={FadeInDown.duration(300)}>
          <ReminderBanner
            booking={nextPending ?? nextConfirmed!}
            tokens={tokens}
            onPress={() => router.push(`/booking/${(nextPending ?? nextConfirmed)!.id}` as never)}
          />
        </Animated.View>
      )}

      {/* Tabs */}
      <View style={styles.tabsWrap}>
        <TabBtn
          label={`Prossime · ${upcoming.length}`}
          active={tab === "upcoming"}
          onPress={() => { hap.select(); setTab("upcoming"); }}
          tokens={tokens}
          testID="tab-upcoming"
        />
        <TabBtn
          label={`Passate · ${past.length}`}
          active={tab === "past"}
          onPress={() => { hap.select(); setTab("past"); }}
          tokens={tokens}
          testID="tab-past"
        />
      </View>

      {loading ? (
        <View style={{ padding: spacing.md, gap: spacing.md }}>
          {[0, 1, 2].map((i) => <Skeleton key={i} height={92} radius={16} />)}
        </View>
      ) : (
        <FlatList
          testID="bookings-list"
          data={visible}
          keyExtractor={(b) => b.id}
          contentContainerStyle={{ padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tokens.primary} />}
          ListEmptyComponent={<EmptyState tab={tab} tokens={tokens} />}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.duration(300).delay(index * 40)}>
              <BookingRow item={item} tab={tab} tokens={tokens} />
            </Animated.View>
          )}
        />
      )}
    </View>
  );
}

function ReminderBanner({ booking, tokens, onPress }: any) {
  const isPending = booking.status === "pending_payment";
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={{ marginHorizontal: spacing.md, marginTop: spacing.md }}>
      <LinearGradient
        colors={isPending ? [tokens.danger + "44", tokens.danger + "22"] : [tokens.accent + "44", tokens.accent + "22"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.banner, { borderColor: (isPending ? tokens.danger : tokens.accent) + "88" }]}
      >
        <View style={[styles.bannerIcon, { backgroundColor: (isPending ? tokens.danger : tokens.accent) + "44" }]}>
          <Ionicons name={isPending ? "alert-circle" : "notifications"} size={20} color={isPending ? tokens.danger : tokens.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: tokens.text, fontWeight: "800", fontSize: 13 }}>
            {isPending ? "Prenotazione in attesa di pagamento" : `Prossimo appuntamento con ${booking.champion?.name ?? "il campione"}`}
          </Text>
          <Text style={{ color: tokens.textMuted, fontSize: 12, marginTop: 2 }}>
            {new Date(booking.scheduledStart).toLocaleString("it-IT", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={tokens.textMuted} />
      </LinearGradient>
    </TouchableOpacity>
  );
}

function TabBtn({ label, active, onPress, tokens, testID }: any) {
  return (
    <TouchableOpacity onPress={onPress} testID={testID} style={[
      styles.tab,
      active
        ? { backgroundColor: tokens.primary + "22", borderColor: tokens.primary }
        : { borderColor: tokens.border },
    ]}>
      <Text style={{ color: active ? tokens.primary : tokens.textMuted, fontWeight: active ? "800" : "600", fontSize: 13 }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function BookingRow({ item, tab, tokens }: any) {
  const statusColor =
    item.status === "confirmed" || item.status === "completed" ? "#2ED47A"
      : item.status === "cancelled" || item.status === "refunded" ? tokens.danger
        : tokens.accent;

  return (
    <TouchableOpacity
      testID={`booking-${item.id}`}
      onPress={() => { hap.light(); router.push(`/booking/${item.id}` as never); }}
      activeOpacity={0.85}
      style={{
        backgroundColor: tokens.surface, borderColor: tokens.border, borderWidth: 1,
        borderRadius: radius.lg, padding: spacing.md, flexDirection: "row", alignItems: "center", gap: spacing.md,
      }}
    >
      {item.champion?.photoUrl && (
        <View style={{ width: 56, height: 56, borderRadius: 14, overflow: "hidden", borderWidth: 1.5, borderColor: tokens.accent + "88" }}>
          <Image source={{ uri: item.champion.photoUrl }} style={{ width: "100%", height: "100%" }} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={{ color: tokens.text, fontWeight: "800", fontSize: 15 }} numberOfLines={1}>
          {item.champion?.name ?? "Champion"}
        </Text>
        <Text style={{ color: tokens.textMuted, marginTop: 2, fontSize: 12 }} numberOfLines={1}>
          {new Date(item.scheduledStart).toLocaleString("it-IT", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 }}>
          <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: statusColor + "22" }}>
            <Text style={{ color: statusColor, fontSize: 10, fontWeight: "800", letterSpacing: 0.5 }}>
              {STATUS_LABEL[item.status] ?? item.status}
            </Text>
          </View>
          {tab === "upcoming" && (item.status === "confirmed" || item.status === "pending_payment") && (
            <CountdownPill startsAt={item.scheduledStart} durationMinutes={item.durationMinutes} size="sm" />
          )}
        </View>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Text style={{ color: tokens.accent, fontWeight: "900", fontSize: 15 }}>
          {formatPrice(item.priceCents, item.currency)}
        </Text>
        <Ionicons name="chevron-forward" size={16} color={tokens.textMuted} style={{ marginTop: 4 }} />
      </View>
    </TouchableOpacity>
  );
}

function EmptyState({ tab, tokens }: any) {
  return (
    <View style={{ alignItems: "center", padding: spacing.xxl, gap: 12 }}>
      <View style={[styles.emptyIcon, { backgroundColor: tokens.surface, borderColor: tokens.accent + "44" }]}>
        <Ionicons name={tab === "upcoming" ? "calendar" : "time"} size={40} color={tokens.accent} />
      </View>
      <Text style={{ color: tokens.text, fontSize: 17, fontWeight: "800", marginTop: 8 }}>
        {tab === "upcoming" ? "Nessuna prenotazione in programma" : "Nessuna prenotazione passata"}
      </Text>
      <Text style={{ color: tokens.textMuted, textAlign: "center", fontSize: 13, lineHeight: 19, maxWidth: 280 }}>
        {tab === "upcoming"
          ? "Prenota il tuo primo Champion su Explore e crea un ricordo da leggenda ⚡"
          : "Le prenotazioni completate o annullate appariranno qui."}
      </Text>
      {tab === "upcoming" && (
        <TouchableOpacity
          onPress={() => router.replace("/(tabs)" as never)}
          style={{
            marginTop: 10,
            paddingHorizontal: 22, paddingVertical: 12,
            borderRadius: 999,
            backgroundColor: tokens.accent,
          }}
        >
          <Text style={{ color: "#08142D", fontWeight: "900", letterSpacing: 1 }}>SCOPRI I CAMPIONI</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tabsWrap: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  tab: {
    flex: 1,
    height: 40,
    borderRadius: 999,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  bannerIcon: {
    width: 38, height: 38, borderRadius: 999,
    alignItems: "center", justifyContent: "center",
  },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 999,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1,
  },
});
