// Bookings tab — split into "Prossime" (upcoming) and "Passate" (past).
// Upcoming items show a live countdown pill (see CountdownPill).
// Empty state illustrated. Pull to refresh supported.
import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import {
  bookings as bStore,
  champions as cStore,
  interactions as iStore,
  Booking,
  Champion,
  ChampionInteraction,
} from "../../src/store";
import { useAuth } from "../../src/context/auth";
import { formatPrice, radius, spacing, useTheme } from "../../src/theme";
import { CountdownPill } from "../../src/components/CountdownPill";
import { GoldFramePanel } from "../../src/components/GoldFramePanel";
import { Skeleton } from "../../src/components/Skeleton";
import { hap } from "../../src/utils/haptics";

const BOOKINGS_BACKGROUND = require("../../assets/images/bookings-bg.png");

const STATUS_LABEL: Record<string, string> = {
  awaiting_champion: "In attesa",
  declined: "Rifiutata",
  pending_payment: "Da pagare",
  confirmed: "Confermata",
  in_progress: "In corso",
  completed: "Completata",
  cancelled: "Annullata",
  refunded: "Rimborsata",
};

type Tab = "upcoming" | "past";
type ChampionTab = "calendar" | "requests" | "messages";

export default function BookingsScreen() {
  const { tokens } = useTheme();
  const { user } = useAuth();
  const [data, setData] = useState<(Booking & { champion?: Champion })[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("upcoming");
  const [championTab, setChampionTab] = useState<ChampionTab>("calendar");
  const [inbox, setInbox] = useState<ChampionInteraction[]>([]);
  const isChampion = user?.role === "champion";

  const load = useCallback(async () => {
    if (!user) return;
    const role = user.role === "champion" ? "champion" : "fan";
    const list = await bStore.listForUser(user.id, role);
    const enriched = await Promise.all(list.map(async (b) => ({
      ...b, champion: (await cStore.getById(b.championId)) ?? undefined,
    })));
    setData(enriched);
    if (role === "champion") {
      setInbox(await iStore.listForUser(user.id, "champion"));
    }
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
        end < now || b.status === "completed" || b.status === "cancelled" ||
        b.status === "refunded" || b.status === "declined";
      (isPast ? pa : up).push(b);
    }
    up.sort((a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime());
    pa.sort((a, b) => new Date(b.scheduledStart).getTime() - new Date(a.scheduledStart).getTime());
    return { upcoming: up, past: pa };
  }, [data]);

  const visible = tab === "upcoming" ? upcoming : past;

  // Highlight the next upcoming pending_payment for a reminder banner
  const nextAwaiting = upcoming.find((b) => b.status === "awaiting_champion");
  const nextPending = upcoming.find((b) => b.status === "pending_payment");
  const nextConfirmed = upcoming.find((b) => b.status === "confirmed");

  if (isChampion) {
    return (
      <ChampionCalendar
        data={data}
        inbox={inbox}
        loading={loading}
        refreshing={refreshing}
        activeTab={championTab}
        onChangeTab={setChampionTab}
        onRefresh={onRefresh}
        onReload={load}
        tokens={tokens}
      />
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: tokens.bg }]}>
      <Image source={BOOKINGS_BACKGROUND} resizeMode="cover" style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={["#0207110D", "#02071133", "#02071166"]}
        locations={[0, 0.48, 1]}
        pointerEvents="none"
        style={StyleSheet.absoluteFill}
      />

      {/* Reminder banner */}
      {(nextAwaiting || nextPending || nextConfirmed) && tab === "upcoming" && (
        <Animated.View entering={FadeInDown.duration(300)}>
          <ReminderBanner
            booking={nextAwaiting ?? nextPending ?? nextConfirmed!}
            tokens={tokens}
            onPress={() => router.push(`/booking/${(nextAwaiting ?? nextPending ?? nextConfirmed)!.id}` as never)}
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
          style={styles.list}
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

function ChampionCalendar({
  data,
  inbox,
  loading,
  refreshing,
  activeTab,
  onChangeTab,
  onRefresh,
  onReload,
  tokens,
}: {
  data: (Booking & { champion?: Champion })[];
  inbox: ChampionInteraction[];
  loading: boolean;
  refreshing: boolean;
  activeTab: ChampionTab;
  onChangeTab: (tab: ChampionTab) => void;
  onRefresh: () => Promise<void>;
  onReload: () => Promise<void>;
  tokens: ReturnType<typeof useTheme>["tokens"];
}) {
  const [replyingTo, setReplyingTo] = useState<ChampionInteraction | null>(null);
  const [reply, setReply] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const now = Date.now();
  const confirmed = data
    .filter(
      (booking) =>
        (booking.status === "confirmed" || booking.status === "in_progress") &&
        new Date(booking.scheduledStart).getTime() >= now,
    )
    .sort((a, b) => a.scheduledStart.localeCompare(b.scheduledStart));
  const requests = data
    .filter(
      (booking) =>
        booking.status === "awaiting_champion" &&
        new Date(booking.scheduledStart).getTime() >= now,
    )
    .sort((a, b) => a.scheduledStart.localeCompare(b.scheduledStart));
  const pendingMessages = inbox.filter(
    (item) => item.type === "message" && item.status === "awaiting_reply",
  ).length;

  const accept = async (booking: Booking) => {
    hap.success();
    try {
      await bStore.acceptAndCharge(
        booking.id,
        "Confermato dal calendario Champion.",
      );
      Alert.alert(
        "Appuntamento confermato",
        "Lo slot è nel calendario. Nella demo il pagamento del fan è stato simulato.",
      );
      await onReload();
      onChangeTab("calendar");
    } catch (error: any) {
      Alert.alert("Impossibile confermare", error.message);
    }
  };

  const decline = (booking: Booking) => {
    Alert.alert(
      "Rifiutare la richiesta?",
      "Lo slot tornerà disponibile per gli altri fan.",
      [
        { text: "Annulla", style: "cancel" },
        {
          text: "Rifiuta",
          style: "destructive",
          onPress: async () => {
            await bStore.decline(booking.id, "Lo slot non è più disponibile.");
            await onReload();
          },
        },
      ],
    );
  };

  const sendReply = async () => {
    if (!replyingTo || !reply.trim()) return;
    setSendingReply(true);
    try {
      await iStore.reply(replyingTo.id, reply);
      hap.success();
      setReplyingTo(null);
      setReply("");
      await onReload();
      Alert.alert("Risposta inviata", "Hai completato la richiesta entro il termine previsto.");
    } catch (error: any) {
      hap.error();
      Alert.alert("Risposta non inviata", error.message);
    } finally {
      setSendingReply(false);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: tokens.bg }]}>
      <Image source={BOOKINGS_BACKGROUND} resizeMode="cover" style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={["#0207110D", "#02071133", "#02071177"]}
        locations={[0, 0.48, 1]}
        pointerEvents="none"
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.calendarHeader}>
        <Text style={styles.calendarEyebrow}>AREA CHAMPION</Text>
        <Text style={styles.calendarTitle}>Calendario eventi</Text>
        <Text style={styles.calendarSubtitle}>
          Appuntamenti confermati, richieste e messaggi dei fan.
        </Text>
      </View>

      <View style={styles.championTabs}>
        <ChampionTabButton
          label="Calendario"
          count={confirmed.length}
          active={activeTab === "calendar"}
          onPress={() => onChangeTab("calendar")}
        />
        <ChampionTabButton
          label="Richieste"
          count={requests.length}
          active={activeTab === "requests"}
          onPress={() => onChangeTab("requests")}
        />
        <ChampionTabButton
          label="Messaggi"
          count={pendingMessages}
          active={activeTab === "messages"}
          onPress={() => onChangeTab("messages")}
        />
      </View>

      {loading ? (
        <View style={{ padding: spacing.md, gap: spacing.md }}>
          {[0, 1, 2].map((item) => <Skeleton key={item} height={112} radius={14} />)}
        </View>
      ) : (
        <ScrollView
          testID="champion-calendar-list"
          style={styles.list}
          contentContainerStyle={styles.championContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tokens.accent} />
          }
        >
          {activeTab === "calendar" && (
            <>
              {confirmed.length === 0 ? (
                <ChampionEmpty
                  icon="calendar-clear-outline"
                  title="Nessun evento confermato"
                  text="Gli appuntamenti accettati e pagati appariranno qui."
                  tokens={tokens}
                />
              ) : (
                confirmed.map((booking, index) => (
                  <ChampionEventCard
                    key={booking.id}
                    booking={booking}
                    index={index}
                  />
                ))
              )}
            </>
          )}

          {activeTab === "requests" && (
            <>
              {requests.length === 0 ? (
                <ChampionEmpty
                  icon="checkmark-done-outline"
                  title="Nessuna richiesta in attesa"
                  text="Le nuove richieste dei fan compariranno qui."
                  tokens={tokens}
                />
              ) : (
                requests.map((booking) => (
                  <ChampionRequestCard
                    key={booking.id}
                    booking={booking}
                    onAccept={() => accept(booking)}
                    onDecline={() => decline(booking)}
                    tokens={tokens}
                  />
                ))
              )}
            </>
          )}

          {activeTab === "messages" && (
            <>
              <View style={styles.messageRule}>
                <Ionicons name="time-outline" size={19} color="#F5C451" />
                <Text style={styles.messageRuleText}>
                  Messaggio richiede una sola risposta entro 7 giorni. Supporta non richiede risposta.
                </Text>
              </View>
              {inbox.length === 0 ? (
                <ChampionEmpty
                  icon="chatbubbles-outline"
                  title="Nessun messaggio"
                  text="Messaggi e supporti acquistati dai fan appariranno qui."
                  tokens={tokens}
                />
              ) : (
                inbox.map((item) => (
                  <ChampionMessageCard
                    key={item.id}
                    item={item}
                    onReply={() => {
                      setReply("");
                      setReplyingTo(item);
                    }}
                  />
                ))
              )}
            </>
          )}
        </ScrollView>
      )}

      <Modal
        visible={Boolean(replyingTo)}
        transparent
        animationType="slide"
        onRequestClose={() => setReplyingTo(null)}
      >
        <View style={styles.replyBackdrop}>
          <View style={[styles.replyCard, { backgroundColor: tokens.surface, borderColor: "#F5C45188" }]}>
            <View style={styles.replyHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.replyEyebrow}>UNA SOLA RISPOSTA</Text>
                <Text style={[styles.replyTitle, { color: tokens.text }]}>
                  Rispondi a {replyingTo?.fanName ?? "Fan"}
                </Text>
              </View>
              <TouchableOpacity
                accessibilityLabel="Chiudi risposta"
                onPress={() => setReplyingTo(null)}
                style={styles.replyClose}
              >
                <Ionicons name="close" size={20} color={tokens.text} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.originalMessage, { color: tokens.textMuted }]}>
              {replyingTo?.userMessage}
            </Text>
            <TextInput
              testID="champion-reply-input"
              value={reply}
              onChangeText={(value) => setReply(value.slice(0, 1000))}
              placeholder="Scrivi la tua risposta…"
              placeholderTextColor={tokens.textMuted}
              multiline
              maxLength={1000}
              style={[styles.replyInput, { color: tokens.text, borderColor: tokens.border }]}
            />
            <TouchableOpacity
              testID="champion-send-reply"
              disabled={sendingReply || !reply.trim()}
              onPress={sendReply}
              style={{ opacity: sendingReply || !reply.trim() ? 0.5 : 1 }}
            >
              <LinearGradient colors={["#FFE27A", "#D49B22"]} style={styles.replySend}>
                <Ionicons name="send" size={17} color="#07111F" />
                <Text style={styles.replySendText}>
                  {sendingReply ? "INVIO…" : "INVIA RISPOSTA"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function ChampionTabButton({
  label,
  count,
  active,
  onPress,
}: {
  label: string;
  count: number;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={() => {
        hap.select();
        onPress();
      }}
      style={[styles.championTab, active && styles.championTabActive]}
    >
      <Text style={[styles.championTabText, active && styles.championTabTextActive]}>{label}</Text>
      <View style={[styles.championTabCount, active && styles.championTabCountActive]}>
        <Text style={[styles.championTabCountText, active && styles.championTabCountTextActive]}>
          {count}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function ChampionEventCard({
  booking,
  index,
}: {
  booking: Booking;
  index: number;
}) {
  const date = new Date(booking.scheduledStart);
  return (
    <Animated.View entering={FadeInDown.delay(index * 50)} style={styles.championCard}>
      <View style={styles.eventDate}>
        <Text style={styles.eventDay}>{date.getDate()}</Text>
        <Text style={styles.eventMonth}>
          {date.toLocaleDateString("it-IT", { month: "short" }).toUpperCase()}
        </Text>
      </View>
      <View style={styles.eventBody}>
        <Text style={styles.eventTime}>
          {date.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
          {" · "}
          {formatBookingDuration(booking)}
        </Text>
        <Text style={styles.eventFan}>{booking.fanName ?? "Fan"}</Text>
        <Text style={styles.eventService}>{serviceLabel(booking.serviceKey)}</Text>
        {booking.paymentSimulated && (
          <Text style={styles.simulatedPayment}>PAGAMENTO DEMO SIMULATO</Text>
        )}
      </View>
      <TouchableOpacity
        testID={`champion-start-${booking.id}`}
        accessibilityLabel={`Avvia ${serviceLabel(booking.serviceKey)} con ${booking.fanName ?? "Fan"}`}
        onPress={() => {
          hap.heavy();
          router.push(`/call/${booking.id}` as never);
        }}
        style={styles.quickStart}
      >
        <Ionicons name={booking.serviceKey === "voice" ? "call" : "videocam"} size={18} color="#07111F" />
        <Text style={styles.quickStartText}>AVVIA</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

function ChampionRequestCard({
  booking,
  onAccept,
  onDecline,
  tokens,
}: {
  booking: Booking;
  onAccept: () => void;
  onDecline: () => void;
  tokens: ReturnType<typeof useTheme>["tokens"];
}) {
  const date = new Date(booking.scheduledStart);
  return (
    <View style={[styles.requestCard, { borderColor: tokens.border }]}>
      <View style={styles.requestTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.requestFan}>{booking.fanName ?? "Fan"}</Text>
          <Text style={styles.requestMeta}>
            {serviceLabel(booking.serviceKey)} · {formatBookingDuration(booking)}
          </Text>
        </View>
        <Text style={styles.requestPrice}>{formatPrice(booking.priceCents, booking.currency)}</Text>
      </View>
      <Text style={styles.requestDate}>
        {date.toLocaleString("it-IT", {
          weekday: "long",
          day: "numeric",
          month: "long",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </Text>
      {booking.userNote && <Text style={styles.requestNote}>“{booking.userNote}”</Text>}
      <View style={styles.requestActions}>
        <TouchableOpacity testID={`champion-decline-${booking.id}`} onPress={onDecline} style={styles.declineButton}>
          <Ionicons name="close" size={17} color="#D93B52" />
          <Text style={styles.declineText}>Rifiuta</Text>
        </TouchableOpacity>
        <TouchableOpacity testID={`champion-accept-${booking.id}`} onPress={onAccept} style={styles.acceptButton}>
          <Ionicons name="checkmark" size={17} color="#07111F" />
          <Text style={styles.acceptText}>Accetta</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.chargeNotice}>
        Accettando, il pagamento del fan viene confermato.
      </Text>
    </View>
  );
}

function ChampionMessageCard({
  item,
  onReply,
}: {
  item: ChampionInteraction;
  onReply: () => void;
}) {
  const isMessage = item.type === "message";
  const statusText =
    item.status === "awaiting_reply"
      ? `RISPONDI ENTRO ${new Date(item.replyDueAt!).toLocaleDateString("it-IT", { day: "numeric", month: "short" }).toUpperCase()}`
      : item.status === "replied"
        ? "RISPOSTA INVIATA"
        : item.status === "refunded"
          ? "FAN RIMBORSATO"
          : "SUPPORTO RICEVUTO";
  return (
    <GoldFramePanel
      style={styles.messageCard}
      contentStyle={styles.messageCardContent}
      overlayColor={isMessage ? "#06162A22" : "#160E021A"}
    >
      <View style={styles.messageTop}>
        <View style={[styles.messageIcon, { backgroundColor: isMessage ? "#0A4BA8" : "#D49B22" }]}>
          <Ionicons name={isMessage ? "chatbubble-ellipses" : "heart"} size={18} color="#FFFFFF" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.messageFan}>{item.fanName ?? "Fan"}</Text>
          <Text style={[styles.messageStatus, { color: isMessage ? "#8FC6FF" : "#FFE27A" }]}>
            {statusText}
          </Text>
        </View>
      </View>
      <Text style={styles.messageText}>“{item.userMessage}”</Text>
      {item.championReply && (
        <Text style={styles.championReply}>
          La tua risposta: {item.championReply}
        </Text>
      )}
      {isMessage && item.status === "awaiting_reply" && (
        <TouchableOpacity testID={`champion-reply-${item.id}`} onPress={onReply} style={styles.replyButton}>
          <Ionicons name="return-down-forward" size={17} color="#07111F" />
          <Text style={styles.replyButtonText}>RISPONDI</Text>
        </TouchableOpacity>
      )}
    </GoldFramePanel>
  );
}

function ChampionEmpty({
  icon,
  title,
  text,
  tokens,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  text: string;
  tokens: ReturnType<typeof useTheme>["tokens"];
}) {
  return (
    <View style={[styles.championEmpty, { borderColor: tokens.border }]}>
      <Ionicons name={icon} size={34} color="#F5C451" />
      <Text style={styles.championEmptyTitle}>{title}</Text>
      <Text style={styles.championEmptyText}>{text}</Text>
    </View>
  );
}

function serviceLabel(service?: Booking["serviceKey"]) {
  if (service === "voice") return "Chiamata";
  if (service === "training") return "Allenamento";
  if (service === "tip") return "Consiglio";
  return "Videochiamata";
}

function formatBookingDuration(booking: Booking) {
  const seconds = booking.durationSeconds ?? booking.durationMinutes * 60;
  return seconds < 60 ? `${seconds} sec` : `${seconds / 60} min`;
}

function ReminderBanner({ booking, tokens, onPress }: any) {
  const isPending = booking.status === "pending_payment";
  const isAwaiting = booking.status === "awaiting_champion";
  const color = isPending ? tokens.danger : isAwaiting ? tokens.accent : tokens.accent;
  const icon = isPending ? "alert-circle" : isAwaiting ? "hourglass" : "notifications";
  const title = isPending
    ? "Il champion ha accettato · completa il pagamento"
    : isAwaiting
      ? `In attesa di ${booking.champion?.name ?? "risposta"}`
      : `Prossimo appuntamento con ${booking.champion?.name ?? "il campione"}`;
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={{ marginHorizontal: spacing.md, marginTop: spacing.md }}>
      <LinearGradient
        colors={[color + "44", color + "22"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.banner, { borderColor: color + "88" }]}
      >
        <View style={[styles.bannerIcon, { backgroundColor: color + "44" }]}>
          <Ionicons name={icon as any} size={20} color={color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: tokens.text, fontWeight: "800", fontSize: 13 }}>{title}</Text>
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
        ? { backgroundColor: "#0A4BA8EE", borderColor: "#F5C451" }
        : { backgroundColor: "#F8FBFFF2", borderColor: "#D6DEE8" },
    ]}>
      <Text style={{ color: active ? "#FFFFFF" : "#48586D", fontWeight: active ? "800" : "600", fontSize: 13 }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function BookingRow({ item, tab, tokens }: any) {
  const statusColor =
    item.status === "confirmed" || item.status === "completed" ? "#2ED47A"
      : item.status === "cancelled" || item.status === "refunded" || item.status === "declined" ? tokens.danger
        : tokens.accent;

  return (
    <TouchableOpacity
      testID={`booking-${item.id}`}
      onPress={() => { hap.light(); router.push(`/booking/${item.id}` as never); }}
      activeOpacity={0.85}
      style={{
        backgroundColor: tokens.surface + "F5", borderColor: tokens.border, borderWidth: 1,
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
    <View style={[styles.emptyState, { backgroundColor: tokens.surface + "F2", borderColor: tokens.border }]}>
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
  screen: {
    flex: 1,
  },
  list: {
    flex: 1,
    backgroundColor: "transparent",
  },
  calendarHeader: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  calendarEyebrow: {
    color: "#F5C451",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.8,
  },
  calendarTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "900",
    marginTop: 3,
    textShadowColor: "#000000",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  calendarSubtitle: {
    color: "#D5DEEB",
    fontSize: 12,
    marginTop: 3,
  },
  championTabs: {
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  championTab: {
    flex: 1,
    height: 42,
    paddingHorizontal: 7,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: "#D6DEE8",
    backgroundColor: "#F8FBFFF2",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  championTabActive: {
    backgroundColor: "#0A4BA8F2",
    borderColor: "#F5C451",
  },
  championTabText: {
    color: "#526176",
    fontSize: 10,
    fontWeight: "800",
  },
  championTabTextActive: { color: "#FFFFFF" },
  championTabCount: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: "#E3E9F1",
    alignItems: "center",
    justifyContent: "center",
  },
  championTabCountActive: { backgroundColor: "#F5C451" },
  championTabCountText: {
    color: "#526176",
    fontSize: 9,
    fontWeight: "900",
  },
  championTabCountTextActive: { color: "#07111F" },
  championContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
    gap: 10,
  },
  championCard: {
    minHeight: 112,
    padding: 11,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#F5C45188",
    backgroundColor: "#F8FBFFF4",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  eventDate: {
    width: 52,
    height: 68,
    borderRadius: 9,
    backgroundColor: "#10213A",
    borderWidth: 1,
    borderColor: "#F5C451",
    alignItems: "center",
    justifyContent: "center",
  },
  eventDay: { color: "#FFE27A", fontSize: 24, fontWeight: "900" },
  eventMonth: { color: "#FFFFFF", fontSize: 9, fontWeight: "900" },
  eventBody: { flex: 1 },
  eventTime: { color: "#0A4BA8", fontSize: 11, fontWeight: "900" },
  eventFan: { color: "#07111F", fontSize: 15, fontWeight: "900", marginTop: 3 },
  eventService: { color: "#526176", fontSize: 11, fontWeight: "700", marginTop: 1 },
  simulatedPayment: { color: "#08734D", fontSize: 8, fontWeight: "900", marginTop: 4 },
  quickStart: {
    width: 58,
    minHeight: 52,
    borderRadius: 10,
    backgroundColor: "#F5C451",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  quickStartText: { color: "#07111F", fontSize: 9, fontWeight: "900" },
  requestCard: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    backgroundColor: "#F8FBFFF4",
  },
  requestTop: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  requestFan: { color: "#07111F", fontSize: 15, fontWeight: "900" },
  requestMeta: { color: "#526176", fontSize: 11, fontWeight: "700", marginTop: 2 },
  requestPrice: { color: "#B77A09", fontSize: 15, fontWeight: "900" },
  requestDate: { color: "#0A4BA8", fontSize: 12, fontWeight: "800", marginTop: 10 },
  requestNote: { color: "#3E4B5C", fontSize: 12, lineHeight: 17, marginTop: 8 },
  requestActions: { flexDirection: "row", gap: 8, marginTop: 12 },
  declineButton: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FFB7C1",
    backgroundColor: "#FFF1F3",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  declineText: { color: "#D93B52", fontSize: 11, fontWeight: "900" },
  acceptButton: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#F5C451",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  acceptText: { color: "#07111F", fontSize: 11, fontWeight: "900" },
  chargeNotice: { color: "#68778A", fontSize: 9, textAlign: "center", marginTop: 7 },
  messageRule: {
    padding: 11,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: "#F5C45166",
    backgroundColor: "#111A28EE",
    flexDirection: "row",
    gap: 8,
  },
  messageRuleText: { flex: 1, color: "#D5DEEB", fontSize: 10, lineHeight: 15 },
  messageCard: {
    borderColor: "#F5C451BB",
  },
  messageCardContent: {
    padding: spacing.md,
  },
  messageTop: { flexDirection: "row", alignItems: "center", gap: 9 },
  messageIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  messageFan: { color: "#FFFFFF", fontSize: 13, fontWeight: "900" },
  messageStatus: { fontSize: 9, fontWeight: "900", marginTop: 2 },
  messageText: { color: "#D5DEEB", fontSize: 12, lineHeight: 18, marginTop: 11 },
  championReply: {
    color: "#D5DEEB",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#FFFFFF22",
  },
  replyButton: {
    height: 39,
    borderRadius: 8,
    backgroundColor: "#8FC6FF",
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  replyButtonText: { color: "#07111F", fontSize: 11, fontWeight: "900" },
  championEmpty: {
    padding: spacing.xl,
    borderRadius: radius.md,
    borderWidth: 1,
    backgroundColor: "#0D1727E8",
    alignItems: "center",
  },
  championEmptyTitle: { color: "#FFFFFF", fontSize: 15, fontWeight: "900", marginTop: 8 },
  championEmptyText: { color: "#B7C2D1", fontSize: 11, textAlign: "center", marginTop: 4 },
  replyBackdrop: {
    flex: 1,
    justifyContent: "center",
    padding: spacing.lg,
    backgroundColor: "#010713CC",
  },
  replyCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
  },
  replyHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  replyEyebrow: { color: "#F5C451", fontSize: 9, fontWeight: "900", letterSpacing: 1.5 },
  replyTitle: { fontSize: 17, fontWeight: "900", marginTop: 3 },
  replyClose: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF14",
  },
  originalMessage: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing.md,
    padding: 11,
    borderRadius: 8,
    backgroundColor: "#07111F22",
  },
  replyInput: {
    minHeight: 110,
    marginTop: 10,
    padding: 11,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: "#07111F22",
    textAlignVertical: "top",
  },
  replySend: {
    height: 46,
    borderRadius: 9,
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  replySendText: { color: "#07111F", fontSize: 12, fontWeight: "900" },
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
    backgroundColor: "#F8FBFFF2",
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
  emptyState: {
    alignItems: "center",
    marginTop: spacing.lg,
    padding: spacing.xxl,
    gap: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
});
