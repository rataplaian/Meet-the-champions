import { useMemo, useRef, useState } from "react";
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { radius, spacing, useTheme } from "../../src/theme";
import { hap } from "../../src/utils/haptics";

const CHAT_BACKGROUND = require("../../assets/images/predictions-bg.png");

type FanSide = "home" | "away" | "neutral";
type ChatFilter = "all" | "home" | "away";

interface LiveMatch {
  id: string;
  competition: string;
  minute: string;
  score: string;
  home: string;
  away: string;
  homeColor: string;
  awayColor: string;
  online: number;
}

interface ChatMessage {
  id: string;
  author: string;
  text: string;
  time: string;
  side: FanSide;
  own?: boolean;
}

const LIVE_MATCHES: LiveMatch[] = [
  {
    id: "juv-inter",
    competition: "SERIE A",
    minute: "62'",
    score: "1 - 1",
    home: "Juventus",
    away: "Inter",
    homeColor: "#D7AF45",
    awayColor: "#1769D2",
    online: 1248,
  },
  {
    id: "milan-napoli",
    competition: "SERIE A",
    minute: "31'",
    score: "0 - 1",
    home: "Milan",
    away: "Napoli",
    homeColor: "#D52B3F",
    awayColor: "#1685D1",
    online: 864,
  },
];
const DEFAULT_LIVE_MATCH = LIVE_MATCHES[0] as LiveMatch;

const INITIAL_MESSAGES: Record<string, ChatMessage[]> = {
  "juv-inter": [
    { id: "ji-1", author: "MTC Live", text: "La chat e aperta. Rispetto e fair play, sempre.", time: "21:04", side: "neutral" },
    { id: "ji-2", author: "Luca B.", text: "Che ritmo stasera, sembra una finale.", time: "21:06", side: "home" },
    { id: "ji-3", author: "Ale Nerazzurro", text: "Grande recupero a centrocampo!", time: "21:07", side: "away" },
    { id: "ji-4", author: "Sofia", text: "Il pareggio ha acceso completamente la partita.", time: "21:08", side: "home" },
    { id: "ji-5", author: "Marco 1908", text: "Ora serve calma, ci sono ancora tanti minuti.", time: "21:09", side: "away" },
    { id: "ji-6", author: "MTC Live", text: "Siamo entrati nel 62 minuto.", time: "21:10", side: "neutral" },
  ],
  "milan-napoli": [
    { id: "mn-1", author: "MTC Live", text: "Benvenuti nella chat temporanea di Milan - Napoli.", time: "20:46", side: "neutral" },
    { id: "mn-2", author: "Giulia Rossonera", text: "Dobbiamo alzare il pressing.", time: "20:50", side: "home" },
    { id: "mn-3", author: "Ciro N.", text: "Che bella azione sul gol!", time: "20:52", side: "away" },
    { id: "mn-4", author: "Fabio", text: "Partita ancora lunghissima.", time: "20:54", side: "home" },
  ],
};

function resetWebInputViewport() {
  if (Platform.OS !== "web" || typeof document === "undefined") return;
  requestAnimationFrame(() => {
    let element = document.querySelector('[data-testid="live-chat-input"]')?.parentElement;
    while (element) {
      if (element.scrollTop > 0) element.scrollTop = 0;
      element = element.parentElement;
    }
  });
}

export default function LiveChatScreen() {
  const { tokens } = useTheme();
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const inputRef = useRef<TextInput>(null);
  const [matchId, setMatchId] = useState(DEFAULT_LIVE_MATCH.id);
  const [filter, setFilter] = useState<ChatFilter>("all");
  const [supporting, setSupporting] = useState<Exclude<FanSide, "neutral">>("home");
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState(INITIAL_MESSAGES);

  const match = LIVE_MATCHES.find((item) => item.id === matchId) ?? DEFAULT_LIVE_MATCH;
  const visibleMessages = useMemo(
    () => (messages[match.id] ?? []).filter((message) => filter === "all" || message.side === filter),
    [filter, match.id, messages],
  );

  const chooseMatch = (nextMatch: LiveMatch) => {
    hap.select();
    setMatchId(nextMatch.id);
    setFilter("all");
    setSupporting("home");
  };

  const chooseFilter = (nextFilter: ChatFilter) => {
    hap.select();
    setFilter(nextFilter);
    if (nextFilter !== "all") setSupporting(nextFilter);
  };

  const sendMessage = () => {
    const text = draft.trim();
    if (!text) return;

    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const nextMessage: ChatMessage = {
      id: `${match.id}-${Date.now()}`,
      author: "Tu",
      text,
      time,
      side: supporting,
      own: true,
    };

    hap.success();
    setMessages((current) => ({
      ...current,
      [match.id]: [...(current[match.id] ?? []), nextMessage],
    }));
    setDraft("");
    inputRef.current?.blur();
    resetWebInputViewport();
    setFilter((current) => (current === "all" ? current : supporting));
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  };

  return (
    <View testID="live-chat-screen" style={[styles.screen, { backgroundColor: tokens.bg }]}>
      <Image source={CHAT_BACKGROUND} resizeMode="cover" style={styles.backgroundImage} />
      <LinearGradient
        colors={["#02071155", "#02071188", "#020711AA"]}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 86 : 0}
      >
        <View style={styles.pageHeader}>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveBadgeText}>LIVE CHAT</Text>
          </View>
          <Text style={styles.title}>Commenta la partita</Text>
          <View style={styles.temporaryNotice}>
            <Ionicons name="time-outline" size={15} color="#FFE49A" />
            <Text style={styles.temporaryText}>
              Questa chat e temporanea e si chiudera al termine della partita.
            </Text>
          </View>
        </View>

        <View style={styles.matchPicker}>
          {LIVE_MATCHES.map((item) => {
            const selected = item.id === match.id;
            return (
              <TouchableOpacity
                key={item.id}
                testID={`live-match-${item.id}`}
                accessibilityState={{ selected }}
                onPress={() => chooseMatch(item)}
                style={[
                  styles.matchButton,
                  {
                    backgroundColor: selected ? "#F5C451" : "#091728EE",
                    borderColor: selected ? "#FFF1B8" : "#FFFFFF26",
                  },
                ]}
              >
                <View style={styles.matchMetaRow}>
                  <Text style={[styles.competition, { color: selected ? "#443000" : "#9CB5D4" }]}>
                    {item.competition}
                  </Text>
                  <Text style={[styles.minute, { color: selected ? "#8A1C2D" : "#FF8193" }]}>
                    LIVE {item.minute}
                  </Text>
                </View>
                <Text numberOfLines={1} style={[styles.matchTeams, { color: selected ? "#08111F" : "#FFFFFF" }]}>
                  {item.home}  {item.score}  {item.away}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.chatShell}>
          <View style={styles.chatTopBar}>
            <View style={[styles.ballMark, { backgroundColor: match.homeColor }]}>
              <Ionicons name="football" size={21} color="#FFFFFF" />
            </View>
            <View style={styles.chatIdentity}>
              <Text numberOfLines={1} style={styles.chatTitle}>
                {match.home} - {match.away}
              </Text>
              <Text style={styles.onlineText}>{match.online.toLocaleString("it-IT")} persone online</Text>
            </View>
            <Ionicons name="shield-checkmark" size={22} color="#F5C451" />
          </View>

          <View style={styles.filters}>
            <FilterButton
              label="Tutti"
              selected={filter === "all"}
              color="#0A4BA8"
              onPress={() => chooseFilter("all")}
            />
            <FilterButton
              label={match.home}
              selected={filter === "home"}
              color={match.homeColor}
              onPress={() => chooseFilter("home")}
            />
            <FilterButton
              label={match.away}
              selected={filter === "away"}
              color={match.awayColor}
              onPress={() => chooseFilter("away")}
            />
          </View>

          <FlatList
            ref={listRef}
            testID="live-chat-messages"
            data={visibleMessages}
            keyExtractor={(item) => item.id}
            style={styles.messageList}
            contentContainerStyle={styles.messageContent}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            renderItem={({ item }) => (
              <MessageBubble
                message={item}
                homeColor={match.homeColor}
                awayColor={match.awayColor}
              />
            )}
          />

          <View style={styles.composerArea}>
            <View style={styles.supportingRow}>
              <View
                style={[
                  styles.supportingDot,
                  { backgroundColor: supporting === "home" ? match.homeColor : match.awayColor },
                ]}
              />
              <Text numberOfLines={1} style={styles.supportingText}>
                Scrivi come tifoso {supporting === "home" ? match.home : match.away}
              </Text>
              <TouchableOpacity
                accessibilityLabel="Cambia squadra supportata"
                onPress={() => setSupporting((current) => (current === "home" ? "away" : "home"))}
                style={styles.swapButton}
              >
                <Ionicons name="swap-horizontal" size={16} color="#0A4BA8" />
              </TouchableOpacity>
            </View>
            <View style={styles.composerRow}>
              <View style={styles.inputShell}>
                <Ionicons name="happy-outline" size={21} color="#6D7B8D" />
                <TextInput
                  ref={inputRef}
                  testID="live-chat-input"
                  value={draft}
                  onChangeText={setDraft}
                  onSubmitEditing={sendMessage}
                  placeholder="Scrivi un messaggio"
                  placeholderTextColor="#7D8998"
                  returnKeyType="send"
                  maxLength={280}
                  style={styles.input}
                />
              </View>
              <TouchableOpacity
                testID="live-chat-send"
                accessibilityLabel="Invia messaggio"
                disabled={!draft.trim()}
                onPress={sendMessage}
                style={[styles.sendButton, { opacity: draft.trim() ? 1 : 0.45 }]}
              >
                <Ionicons name="send" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function FilterButton({
  label,
  selected,
  color,
  onPress,
}: {
  label: string;
  selected: boolean;
  color: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.filterButton,
        { backgroundColor: selected ? color : "#FFFFFF", borderColor: selected ? color : "#D4DAE2" },
      ]}
    >
      <Text numberOfLines={1} style={[styles.filterText, { color: selected ? "#FFFFFF" : "#445164" }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function MessageBubble({
  message,
  homeColor,
  awayColor,
}: {
  message: ChatMessage;
  homeColor: string;
  awayColor: string;
}) {
  const neutral = message.side === "neutral";
  const sideColor = message.side === "home" ? homeColor : awayColor;

  if (neutral) {
    return (
      <View style={styles.systemMessage}>
        <Ionicons name="information-circle-outline" size={14} color="#54708F" />
        <Text style={styles.systemText}>{message.text}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.messageRow, message.own && styles.ownMessageRow]}>
      {!message.own && (
        <View style={[styles.avatar, { backgroundColor: sideColor }]}>
          <Text style={styles.avatarText}>{message.author.charAt(0).toUpperCase()}</Text>
        </View>
      )}
      <View style={[styles.bubble, message.own ? styles.ownBubble : styles.otherBubble]}>
        {!message.own && <Text style={[styles.author, { color: sideColor }]}>{message.author}</Text>}
        <Text style={styles.messageText}>{message.text}</Text>
        <View style={styles.messageMeta}>
          <Text style={styles.messageTime}>{message.time}</Text>
          {message.own && <Ionicons name="checkmark-done" size={14} color="#1685D1" />}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  keyboardView: { flex: 1 },
  backgroundImage: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
  },
  pageHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 9,
  },
  liveBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    height: 24,
    borderRadius: 6,
    backgroundColor: "#C51F3BEF",
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
  },
  liveBadgeText: { color: "#FFFFFF", fontSize: 10, fontWeight: "900", letterSpacing: 0 },
  title: {
    marginTop: 7,
    color: "#FFFFFF",
    fontSize: 24,
    lineHeight: 29,
    fontWeight: "900",
    letterSpacing: 0,
    textShadowColor: "#000000",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  temporaryNotice: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  temporaryText: {
    flex: 1,
    color: "#E8EDF4",
    fontSize: 10,
    lineHeight: 14,
  },
  matchPicker: {
    flexDirection: "row",
    paddingHorizontal: spacing.lg,
    paddingBottom: 10,
    gap: 8,
  },
  matchButton: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 9,
    paddingVertical: 8,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  matchMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 4,
  },
  competition: { fontSize: 8, fontWeight: "900", letterSpacing: 0 },
  minute: { fontSize: 8, fontWeight: "900", letterSpacing: 0 },
  matchTeams: {
    marginTop: 4,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "800",
    letterSpacing: 0,
  },
  chatShell: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: "#E9EEF3F5",
    borderTopLeftRadius: radius.sm,
    borderTopRightRadius: radius.sm,
  },
  chatTopBar: {
    minHeight: 55,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: "#08182A",
    borderBottomWidth: 1,
    borderBottomColor: "#F5C45155",
  },
  ballMark: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFFAA",
  },
  chatIdentity: { flex: 1 },
  chatTitle: { color: "#FFFFFF", fontSize: 13, fontWeight: "900", letterSpacing: 0 },
  onlineText: { color: "#AFC0D4", fontSize: 9, marginTop: 2 },
  filters: {
    minHeight: 47,
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexDirection: "row",
    gap: 6,
    backgroundColor: "#F7F9FB",
    borderBottomWidth: 1,
    borderBottomColor: "#D6DCE4",
  },
  filterButton: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    borderRadius: 7,
    borderWidth: 1,
  },
  filterText: { fontSize: 9, fontWeight: "800", letterSpacing: 0 },
  messageList: { flex: 1 },
  messageContent: {
    flexGrow: 1,
    justifyContent: "flex-end",
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 7,
  },
  systemMessage: {
    alignSelf: "center",
    maxWidth: "88%",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 7,
    backgroundColor: "#DCEAF5",
  },
  systemText: {
    flexShrink: 1,
    color: "#4A6078",
    fontSize: 9,
    lineHeight: 12,
    textAlign: "center",
  },
  messageRow: {
    maxWidth: "87%",
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
  },
  ownMessageRow: { alignSelf: "flex-end" },
  avatar: {
    width: 27,
    height: 27,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#FFFFFF", fontSize: 11, fontWeight: "900", letterSpacing: 0 },
  bubble: {
    maxWidth: "100%",
    minWidth: 88,
    paddingHorizontal: 9,
    paddingTop: 6,
    paddingBottom: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  otherBubble: {
    backgroundColor: "#FFFFFF",
    borderColor: "#D7DDE5",
    borderBottomLeftRadius: 2,
  },
  ownBubble: {
    backgroundColor: "#DDF5D8",
    borderColor: "#BBDDB6",
    borderBottomRightRadius: 2,
  },
  author: { marginBottom: 2, fontSize: 9, fontWeight: "900", letterSpacing: 0 },
  messageText: { color: "#182331", fontSize: 12, lineHeight: 16 },
  messageMeta: {
    alignSelf: "flex-end",
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginTop: 2,
  },
  messageTime: { color: "#6F7D8C", fontSize: 8 },
  composerArea: {
    paddingHorizontal: 8,
    paddingTop: 5,
    paddingBottom: Platform.OS === "ios" ? 8 : 6,
    backgroundColor: "#F3F5F7",
    borderTopWidth: 1,
    borderTopColor: "#D2D8DF",
  },
  supportingRow: {
    height: 21,
    paddingHorizontal: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  supportingDot: { width: 7, height: 7, borderRadius: 4 },
  supportingText: {
    flex: 1,
    color: "#526173",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0,
  },
  swapButton: {
    width: 28,
    height: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  composerRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  inputShell: {
    flex: 1,
    height: 42,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderRadius: 21,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D5DBE2",
  },
  input: {
    flex: 1,
    height: 40,
    paddingVertical: 0,
    color: "#172333",
    fontSize: 12,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0A4BA8",
  },
});
