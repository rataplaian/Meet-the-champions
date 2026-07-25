import { useMemo, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useAuth } from "../../src/context/auth";
import { useSocial } from "../../src/context/social";
import {
  conversationTitle,
  findPerson,
  type SocialConversation,
  type SocialPerson,
} from "../../src/store/social";
import { SocialAvatar } from "../../src/components/SocialAvatar";
import { hap } from "../../src/utils/haptics";

const BACKGROUND = require("../../assets/images/user-settings-bg.jpg");

function shortTime(value: string) {
  const date = new Date(value);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) {
    return date.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit" });
}

export default function MessagesScreen() {
  const { user } = useAuth();
  const social = useSocial();
  const [query, setQuery] = useState("");
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const normalizedQuery = query.trim().toLocaleLowerCase("it-IT");

  const incomingRequests = social.state.friendRequests.filter(
    (request) => request.toId === user?.id && request.status === "pending",
  );
  const incomingGroupInvites = social.state.groupInvitations.filter(
    (invite) => invite.toId === user?.id && invite.status === "pending",
  );
  const conversations = useMemo(() => {
    if (!user) return [];
    return social.state.conversations
      .filter((conversation) => conversation.participantIds.includes(user.id))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [social.state.conversations, user]);
  const searchResults = useMemo(() => {
    if (!normalizedQuery || !user) return [];
    return social.people.filter((person) =>
      person.id !== user.id &&
      `${person.displayName} ${person.handle}`.toLocaleLowerCase("it-IT").includes(normalizedQuery),
    );
  }, [normalizedQuery, social.people, user]);

  const close = () => {
    hap.light();
    router.replace("/(tabs)" as never);
  };

  const openConversation = (conversationId: string) => {
    hap.light();
    router.push(`/messages/${conversationId}` as never);
  };

  const openDirect = async (friendId: string) => {
    try {
      const conversationId = await social.openDirectConversation(friendId);
      openConversation(conversationId);
    } catch (error) {
      Alert.alert("Chat non disponibile", error instanceof Error ? error.message : "Riprova.");
    }
  };

  return (
    <View style={styles.screen}>
      <Image source={BACKGROUND} resizeMode="cover" style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={["#02071144", "#020711B8", "#020711EE"]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>COMMUNITY MTC</Text>
            <Text style={styles.title}>Messaggi</Text>
          </View>
          <TouchableOpacity
            accessibilityLabel="Chiudi messaggi"
            testID="messages-close"
            onPress={close}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={22} color="#F5C451" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchShell}>
          <Ionicons name="search" size={20} color="#69798C" />
          <TextInput
            testID="people-search-input"
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            placeholder="Cerca persone e amici"
            placeholderTextColor="#748398"
            style={styles.searchInput}
          />
          {query ? (
            <TouchableOpacity accessibilityLabel="Cancella ricerca" onPress={() => setQuery("")}>
              <Ionicons name="close-circle" size={19} color="#69798C" />
            </TouchableOpacity>
          ) : null}
        </View>

        <ScrollView
          testID="messages-inbox"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
        >
          {normalizedQuery ? (
            <View>
              <SectionHeading title="Persone" count={searchResults.length} />
              {searchResults.length ? searchResults.map((person) => (
                <PersonSearchRow
                  key={person.id}
                  person={person}
                  userId={user?.id ?? ""}
                  onMessage={() => void openDirect(person.id)}
                />
              )) : (
                <EmptyState
                  icon="search-outline"
                  title="Nessun profilo trovato"
                  body="Prova con un altro nome o nickname."
                />
              )}
            </View>
          ) : (
            <>
              {incomingRequests.length > 0 && (
                <View>
                  <SectionHeading title="Richieste di amicizia" count={incomingRequests.length} />
                  {incomingRequests.map((request) => {
                    const person = findPerson(request.fromId, user);
                    return (
                      <RequestRow
                        key={request.id}
                        person={person}
                        label="Vuole aggiungerti agli amici"
                        onAccept={() => void social.respondToFriendRequest(request.id, true)}
                        onDecline={() => void social.respondToFriendRequest(request.id, false)}
                      />
                    );
                  })}
                </View>
              )}

              {incomingGroupInvites.length > 0 && (
                <View>
                  <SectionHeading title="Inviti ai gruppi" count={incomingGroupInvites.length} />
                  {incomingGroupInvites.map((invite) => {
                    const conversation = social.state.conversations.find(
                      (item) => item.id === invite.conversationId,
                    );
                    return (
                      <RequestRow
                        key={invite.id}
                        group
                        person={findPerson(invite.fromId, user)}
                        title={conversation?.title ?? "Gruppo MTC"}
                        label={`Invito di ${findPerson(invite.fromId, user).displayName}`}
                        onAccept={async () => {
                          await social.respondToGroupInvitation(invite.id, true);
                          openConversation(invite.conversationId);
                        }}
                        onDecline={() => void social.respondToGroupInvitation(invite.id, false)}
                      />
                    );
                  })}
                </View>
              )}

              <View style={styles.conversationHeader}>
                <SectionHeading title="Le tue chat" count={conversations.length} />
                <TouchableOpacity
                  testID="create-group-button"
                  onPress={() => setGroupModalOpen(true)}
                  style={styles.groupButton}
                >
                  <Ionicons name="people" size={16} color="#07111F" />
                  <Text style={styles.groupButtonText}>Nuovo gruppo</Text>
                </TouchableOpacity>
              </View>
              {conversations.length ? conversations.map((conversation) => (
                <ConversationRow
                  key={conversation.id}
                  conversation={conversation}
                  userId={user?.id ?? ""}
                  onPress={() => openConversation(conversation.id)}
                />
              )) : (
                <EmptyState
                  icon="chatbubbles-outline"
                  title="Ancora nessuna chat"
                  body="Cerca una persona, invia una richiesta e attendi che venga accettata."
                />
              )}

              <View style={styles.privacyNote}>
                <Ionicons name="shield-checkmark" size={18} color="#F5C451" />
                <Text style={styles.privacyText}>
                  I messaggi privati si attivano solo dopo che la richiesta di amicizia viene accettata.
                </Text>
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>

      <CreateGroupModal
        visible={groupModalOpen}
        onClose={() => setGroupModalOpen(false)}
        onCreated={openConversation}
      />
    </View>
  );
}

function SectionHeading({ title, count }: { title: string; count: number }) {
  return (
    <View style={styles.sectionHeading}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionCount}>{count}</Text>
    </View>
  );
}

function PersonSearchRow({
  person,
  userId,
  onMessage,
}: {
  person: SocialPerson;
  userId: string;
  onMessage: () => void;
}) {
  const social = useSocial();
  const friends = social.friendIds.includes(person.id);
  const incoming = social.state.friendRequests.find(
    (request) => request.fromId === person.id && request.toId === userId && request.status === "pending",
  );
  const outgoing = social.state.friendRequests.some(
    (request) => request.fromId === userId && request.toId === person.id && request.status === "pending",
  );

  return (
    <View style={styles.listRow}>
      <SocialAvatar person={person} />
      <View style={styles.rowCopy}>
        <Text numberOfLines={1} style={styles.rowTitle}>{person.displayName}</Text>
        <Text style={styles.rowMeta}>
          {person.handle} · {person.role === "champion" ? "Champion" : "Fan"}
        </Text>
      </View>
      {friends ? (
        <TouchableOpacity testID={`message-friend-${person.id}`} onPress={onMessage} style={styles.iconAction}>
          <Ionicons name="chatbubble" size={18} color="#07111F" />
        </TouchableOpacity>
      ) : incoming ? (
        <TouchableOpacity
          testID={`accept-friend-${person.id}`}
          onPress={() => void social.respondToFriendRequest(incoming.id, true)}
          style={styles.primarySmall}
        >
          <Text style={styles.primarySmallText}>Accetta</Text>
        </TouchableOpacity>
      ) : outgoing ? (
        <View style={styles.pendingPill}>
          <Ionicons name="time-outline" size={13} color="#F5C451" />
          <Text style={styles.pendingText}>In attesa</Text>
        </View>
      ) : (
        <TouchableOpacity
          testID={`add-friend-${person.id}`}
          onPress={async () => {
            try {
              await social.sendFriendRequest(person.id);
              hap.success();
            } catch (error) {
              Alert.alert("Richiesta non inviata", error instanceof Error ? error.message : "Riprova.");
            }
          }}
          style={styles.iconAction}
        >
          <Ionicons name="person-add" size={18} color="#07111F" />
        </TouchableOpacity>
      )}
    </View>
  );
}

function RequestRow({
  person,
  title,
  label,
  group = false,
  onAccept,
  onDecline,
}: {
  person: SocialPerson;
  title?: string;
  label: string;
  group?: boolean;
  onAccept: () => void | Promise<void>;
  onDecline: () => void | Promise<void>;
}) {
  return (
    <View style={styles.requestRow}>
      <SocialAvatar person={person} group={group} />
      <View style={styles.rowCopy}>
        <Text numberOfLines={1} style={styles.rowTitle}>{title ?? person.displayName}</Text>
        <Text numberOfLines={2} style={styles.rowMeta}>{label}</Text>
      </View>
      <TouchableOpacity accessibilityLabel="Rifiuta" onPress={onDecline} style={styles.declineAction}>
        <Ionicons name="close" size={18} color="#D74B60" />
      </TouchableOpacity>
      <TouchableOpacity accessibilityLabel="Accetta" onPress={onAccept} style={styles.iconAction}>
        <Ionicons name="checkmark" size={20} color="#07111F" />
      </TouchableOpacity>
    </View>
  );
}

function ConversationRow({
  conversation,
  userId,
  onPress,
}: {
  conversation: SocialConversation;
  userId: string;
  onPress: () => void;
}) {
  const { user } = useAuth();
  const { state } = useSocial();
  const otherId = conversation.participantIds.find((id) => id !== userId);
  const person = otherId ? findPerson(otherId, user) : undefined;
  const messages = state.messages
    .filter((message) => message.conversationId === conversation.id)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const latest = messages.at(-1);

  return (
    <TouchableOpacity testID={`conversation-${conversation.id}`} onPress={onPress} style={styles.conversationRow}>
      <SocialAvatar person={person} group={conversation.type === "group"} size={52} />
      <View style={styles.rowCopy}>
        <Text numberOfLines={1} style={styles.rowTitle}>
          {conversationTitle(conversation, userId, user)}
        </Text>
        <Text numberOfLines={1} style={styles.previewText}>
          {latest
            ? `${latest.senderId === userId ? "Tu: " : ""}${latest.text}`
            : conversation.type === "group"
              ? "Gruppo creato · inviti in attesa"
              : "Inizia la conversazione"}
        </Text>
      </View>
      <View style={styles.conversationMeta}>
        <Text style={styles.timeText}>{latest ? shortTime(latest.createdAt) : ""}</Text>
        <Ionicons name="chevron-forward" size={17} color="#8290A1" />
      </View>
    </TouchableOpacity>
  );
}

function EmptyState({
  icon,
  title,
  body,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
}) {
  return (
    <View style={styles.emptyState}>
      <Ionicons name={icon} size={28} color="#F5C451" />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
    </View>
  );
}

function CreateGroupModal({
  visible,
  onClose,
  onCreated,
}: {
  visible: boolean;
  onClose: () => void;
  onCreated: (conversationId: string) => void;
}) {
  const social = useSocial();
  const [title, setTitle] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const friends = social.people.filter((person) => social.friendIds.includes(person.id));

  const close = () => {
    setTitle("");
    setSelectedIds([]);
    onClose();
  };

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={close}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.modalBackdrop}
      >
        <View testID="create-group-modal" style={styles.groupSheet}>
          <View style={styles.groupSheetHeader}>
            <View>
              <Text style={styles.eyebrow}>NUOVA CHAT</Text>
              <Text style={styles.sheetTitle}>Crea un gruppo</Text>
            </View>
            <TouchableOpacity accessibilityLabel="Chiudi creazione gruppo" onPress={close} style={styles.sheetClose}>
              <Ionicons name="close" size={21} color="#EAF0F7" />
            </TouchableOpacity>
          </View>
          <TextInput
            testID="group-name-input"
            value={title}
            onChangeText={setTitle}
            maxLength={40}
            placeholder="Nome del gruppo"
            placeholderTextColor="#78889B"
            style={styles.groupNameInput}
          />
          <Text style={styles.inviteLabel}>Invita i tuoi amici</Text>
          <ScrollView style={styles.friendPicker} showsVerticalScrollIndicator={false}>
            {friends.map((person) => {
              const selected = selectedIds.includes(person.id);
              return (
                <TouchableOpacity
                  key={person.id}
                  testID={`group-select-${person.id}`}
                  onPress={() => setSelectedIds((current) =>
                    selected ? current.filter((id) => id !== person.id) : [...current, person.id]
                  )}
                  style={styles.friendPickRow}
                >
                  <SocialAvatar person={person} size={40} />
                  <Text style={styles.friendPickName}>{person.displayName}</Text>
                  <Ionicons
                    name={selected ? "checkmark-circle" : "ellipse-outline"}
                    size={23}
                    color={selected ? "#F5C451" : "#68798C"}
                  />
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <Text style={styles.inviteHint}>
            Gli amici selezionati riceveranno un invito e entreranno nel gruppo dopo averlo accettato.
          </Text>
          <TouchableOpacity
            testID="group-create-confirm"
            onPress={async () => {
              try {
                const conversationId = await social.createGroup(title, selectedIds);
                hap.success();
                close();
                onCreated(conversationId);
              } catch (error) {
                Alert.alert("Gruppo non creato", error instanceof Error ? error.message : "Riprova.");
              }
            }}
            style={styles.createAction}
          >
            <Ionicons name="people" size={18} color="#07111F" />
            <Text style={styles.createActionText}>Crea e invia gli inviti</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#05101F" },
  safe: { flex: 1 },
  header: {
    minHeight: 76,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerCopy: { flex: 1 },
  eyebrow: { color: "#F5C451", fontSize: 10, fontWeight: "900", letterSpacing: 1.4 },
  title: { color: "#FFFFFF", fontSize: 28, lineHeight: 32, fontWeight: "900", letterSpacing: 0 },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#07182AEE",
    borderWidth: 1,
    borderColor: "#F5C45188",
  },
  searchShell: {
    height: 48,
    marginHorizontal: 18,
    marginBottom: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: "#FFFFFFF2",
    borderRadius: 8,
  },
  searchInput: { flex: 1, color: "#0B1220", fontSize: 15, fontWeight: "600" },
  content: { paddingHorizontal: 18, paddingBottom: 42, gap: 22 },
  sectionHeading: {
    minHeight: 34,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: { color: "#FFFFFF", fontSize: 15, fontWeight: "900", letterSpacing: 0 },
  sectionCount: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    textAlign: "center",
    textAlignVertical: "center",
    color: "#07111F",
    backgroundColor: "#F5C451",
    fontSize: 11,
    lineHeight: 22,
    fontWeight: "900",
  },
  listRow: {
    minHeight: 70,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#FFFFFF30",
  },
  requestRow: {
    minHeight: 76,
    padding: 10,
    marginBottom: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    borderRadius: 8,
    backgroundColor: "#0C2036F2",
    borderWidth: 1,
    borderColor: "#F5C45155",
  },
  rowCopy: { flex: 1, minWidth: 0 },
  rowTitle: { color: "#FFFFFF", fontSize: 15, fontWeight: "800", letterSpacing: 0 },
  rowMeta: { color: "#AAB7C8", fontSize: 11, lineHeight: 15, marginTop: 3, letterSpacing: 0 },
  iconAction: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5C451",
  },
  declineAction: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF12",
    borderWidth: 1,
    borderColor: "#D74B6055",
  },
  primarySmall: { minHeight: 34, paddingHorizontal: 12, borderRadius: 8, justifyContent: "center", backgroundColor: "#F5C451" },
  primarySmallText: { color: "#07111F", fontSize: 11, fontWeight: "900" },
  pendingPill: {
    minHeight: 30,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 8,
    backgroundColor: "#F5C45118",
    borderWidth: 1,
    borderColor: "#F5C45144",
  },
  pendingText: { color: "#F5C451", fontSize: 10, fontWeight: "800" },
  conversationHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  groupButton: {
    height: 34,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 8,
    backgroundColor: "#F5C451",
  },
  groupButtonText: { color: "#07111F", fontSize: 10, fontWeight: "900" },
  conversationRow: {
    minHeight: 76,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#FFFFFF33",
  },
  previewText: { color: "#AAB7C8", fontSize: 12, marginTop: 5, letterSpacing: 0 },
  conversationMeta: { minWidth: 42, alignItems: "flex-end", gap: 9 },
  timeText: { color: "#8E9BAC", fontSize: 10, fontWeight: "700" },
  privacyNote: {
    marginTop: 4,
    padding: 14,
    flexDirection: "row",
    gap: 10,
    borderRadius: 8,
    backgroundColor: "#07182AD9",
    borderWidth: 1,
    borderColor: "#F5C45144",
  },
  privacyText: { flex: 1, color: "#C5D0DD", fontSize: 11, lineHeight: 16, letterSpacing: 0 },
  emptyState: { minHeight: 145, alignItems: "center", justifyContent: "center", paddingHorizontal: 28 },
  emptyTitle: { color: "#FFFFFF", fontSize: 16, fontWeight: "900", marginTop: 9 },
  emptyBody: { color: "#AAB7C8", fontSize: 12, lineHeight: 17, textAlign: "center", marginTop: 5 },
  modalBackdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "#010713C7" },
  groupSheet: {
    width: "100%",
    maxWidth: 430,
    alignSelf: "center",
    maxHeight: "82%",
    padding: 18,
    paddingBottom: 30,
    backgroundColor: "#07182A",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: "#F5C45155",
  },
  groupSheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18 },
  sheetTitle: { color: "#FFFFFF", fontSize: 22, fontWeight: "900", letterSpacing: 0 },
  sheetClose: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FFFFFF33",
  },
  groupNameInput: {
    height: 50,
    paddingHorizontal: 14,
    borderRadius: 8,
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    backgroundColor: "#FFFFFF0D",
    borderWidth: 1,
    borderColor: "#F5C45166",
  },
  inviteLabel: { color: "#FFFFFF", fontSize: 13, fontWeight: "900", marginTop: 20, marginBottom: 7 },
  friendPicker: { maxHeight: 210 },
  friendPickRow: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#FFFFFF22",
  },
  friendPickName: { flex: 1, color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
  inviteHint: { color: "#97A7BA", fontSize: 10, lineHeight: 15, marginTop: 12 },
  createAction: {
    minHeight: 48,
    marginTop: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 8,
    backgroundColor: "#F5C451",
  },
  createActionText: { color: "#07111F", fontSize: 13, fontWeight: "900" },
});
