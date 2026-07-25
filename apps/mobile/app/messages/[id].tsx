import { useMemo, useRef, useState } from "react";
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
import { router, useLocalSearchParams } from "expo-router";
import { useAuth } from "../../src/context/auth";
import { useSocial } from "../../src/context/social";
import {
  conversationTitle,
  findPerson,
  type SocialMessage,
  type SocialPerson,
} from "../../src/store/social";
import { SocialAvatar } from "../../src/components/SocialAvatar";
import { hap } from "../../src/utils/haptics";

const BACKGROUND = require("../../assets/images/predictions-bg.png");

function messageTime(value: string) {
  return new Date(value).toLocaleTimeString("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SocialChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const social = useSocial();
  const [draft, setDraft] = useState("");
  const [optionsOpen, setOptionsOpen] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const conversation = social.state.conversations.find((item) => item.id === id);
  const messages = useMemo(
    () => social.state.messages
      .filter((message) => message.conversationId === id)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [id, social.state.messages],
  );

  const close = () => {
    hap.light();
    router.replace("/messages" as never);
  };

  if (!conversation || !user || !conversation.participantIds.includes(user.id)) {
    return (
      <View style={styles.screen}>
        <Image source={BACKGROUND} resizeMode="cover" style={StyleSheet.absoluteFill} />
        <LinearGradient colors={["#02071188", "#020711EE"]} style={StyleSheet.absoluteFill} />
        <SafeAreaView style={styles.unavailable}>
          <Ionicons name="lock-closed" size={34} color="#F5C451" />
          <Text style={styles.unavailableTitle}>Chat non disponibile</Text>
          <Text style={styles.unavailableBody}>
            {"Accetta prima l'amicizia o l'invito al gruppo."}
          </Text>
          <TouchableOpacity onPress={close} style={styles.unavailableAction}>
            <Text style={styles.unavailableActionText}>Torna ai messaggi</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

  const otherId = conversation.participantIds.find((personId) => personId !== user.id);
  const otherPerson = otherId ? findPerson(otherId, user) : undefined;
  const title = conversationTitle(conversation, user.id, user);
  const subtitle = conversation.type === "group"
    ? `${conversation.participantIds.length} partecipanti`
    : "Amico MTC";

  const send = async () => {
    if (!draft.trim()) return;
    try {
      const text = draft;
      setDraft("");
      await social.sendMessage(conversation.id, text);
      hap.light();
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
    } catch (error) {
      setDraft((current) => current || draft);
      Alert.alert("Messaggio non inviato", error instanceof Error ? error.message : "Riprova.");
    }
  };

  return (
    <View style={styles.screen}>
      <Image source={BACKGROUND} resizeMode="cover" style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={["#02071170", "#020711B8", "#020711E8"]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <SocialAvatar
            person={otherPerson}
            group={conversation.type === "group"}
            size={42}
          />
          <View style={styles.headerCopy}>
            <Text numberOfLines={1} style={styles.headerTitle}>{title}</Text>
            <Text style={styles.headerSubtitle}>{subtitle}</Text>
          </View>
          {conversation.type === "group" && (
            <TouchableOpacity
              accessibilityLabel="Opzioni del gruppo"
              testID="group-options-button"
              onPress={() => setOptionsOpen(true)}
              style={styles.headerIcon}
            >
              <Ionicons name="people-outline" size={21} color="#EAF0F7" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            accessibilityLabel="Chiudi chat"
            testID="chat-window-close"
            onPress={close}
            style={[styles.headerIcon, styles.closeIcon]}
          >
            <Ionicons name="close" size={22} color="#F5C451" />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={0}
          style={styles.keyboard}
        >
          <ScrollView
            ref={scrollRef}
            testID="social-chat-messages"
            contentContainerStyle={styles.messages}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
          >
            <View style={styles.encryptionNotice}>
              <Ionicons name="lock-closed" size={12} color="#8AA0B8" />
              <Text style={styles.encryptionText}>
                Conversazione privata tra amici MTC
              </Text>
            </View>
            {conversation.type === "group" && conversation.participantIds.length === 1 && (
              <View style={styles.waitingNotice}>
                <Text style={styles.waitingText}>
                  Gli inviti sono stati inviati. La chat si anima quando gli amici accettano.
                </Text>
              </View>
            )}
            {messages.map((message) => (
              <ChatBubble
                key={message.id}
                message={message}
                own={message.senderId === user.id}
                sender={findPerson(message.senderId, user)}
                group={conversation.type === "group"}
              />
            ))}
          </ScrollView>

          <View style={styles.composer}>
            <View style={styles.inputShell}>
              <Ionicons name="happy-outline" size={21} color="#718095" />
              <TextInput
                testID="social-chat-input"
                value={draft}
                onChangeText={setDraft}
                onSubmitEditing={() => void send()}
                returnKeyType="send"
                maxLength={1000}
                multiline
                placeholder="Scrivi un messaggio"
                placeholderTextColor="#78869A"
                style={styles.input}
              />
            </View>
            <TouchableOpacity
              accessibilityLabel="Invia messaggio"
              testID="social-chat-send"
              disabled={!draft.trim()}
              onPress={() => void send()}
              style={[styles.sendButton, { opacity: draft.trim() ? 1 : 0.45 }]}
            >
              <Ionicons name="send" size={19} color="#07111F" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <GroupOptionsModal
        visible={optionsOpen}
        conversationId={conversation.id}
        onClose={() => setOptionsOpen(false)}
      />
    </View>
  );
}

function ChatBubble({
  message,
  own,
  sender,
  group,
}: {
  message: SocialMessage;
  own: boolean;
  sender: SocialPerson;
  group: boolean;
}) {
  return (
    <View style={[styles.messageRow, own && styles.ownMessageRow]}>
      {!own && <SocialAvatar person={sender} size={31} />}
      <View style={[styles.bubble, own ? styles.ownBubble : styles.otherBubble]}>
        {group && !own && <Text style={styles.senderName}>{sender.displayName}</Text>}
        <Text style={styles.messageText}>{message.text}</Text>
        <View style={styles.messageMeta}>
          <Text style={styles.messageTime}>{messageTime(message.createdAt)}</Text>
          {own && <Ionicons name="checkmark-done" size={14} color="#176FC1" />}
        </View>
      </View>
    </View>
  );
}

function GroupOptionsModal({
  visible,
  conversationId,
  onClose,
}: {
  visible: boolean;
  conversationId: string;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const social = useSocial();
  const conversation = social.state.conversations.find((item) => item.id === conversationId);
  if (!conversation || !user) return null;

  const participants = conversation.participantIds.map((id) => findPerson(id, user));
  const pendingIds = social.state.groupInvitations
    .filter((invite) => invite.conversationId === conversationId && invite.status === "pending")
    .map((invite) => invite.toId);
  const inviteable = social.people.filter(
    (person) =>
      social.friendIds.includes(person.id) &&
      !conversation.participantIds.includes(person.id) &&
      !pendingIds.includes(person.id),
  );
  const canInvite = conversation.createdBy === user.id;

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View testID="group-options-modal" style={styles.optionsSheet}>
          <View style={styles.optionsHeader}>
            <View style={styles.optionsTitleGroup}>
              <Text style={styles.optionsEyebrow}>OPZIONI GRUPPO</Text>
              <Text numberOfLines={1} style={styles.optionsTitle}>{conversation.title}</Text>
            </View>
            <TouchableOpacity accessibilityLabel="Chiudi opzioni gruppo" onPress={onClose} style={styles.optionsClose}>
              <Ionicons name="close" size={21} color="#F5C451" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.optionsContent}>
            <Text style={styles.optionsSection}>Partecipanti</Text>
            {participants.map((person) => (
              <View key={person.id} style={styles.memberRow}>
                <SocialAvatar person={person} size={40} />
                <View style={styles.memberCopy}>
                  <Text style={styles.memberName}>{person.displayName}</Text>
                  <Text style={styles.memberMeta}>
                    {person.id === conversation.createdBy ? "Amministratore" : "Partecipante"}
                  </Text>
                </View>
              </View>
            ))}

            {pendingIds.length > 0 && (
              <>
                <Text style={styles.optionsSection}>Inviti in attesa</Text>
                {pendingIds.map((personId) => {
                  const person = findPerson(personId, user);
                  return (
                    <View key={personId} style={styles.memberRow}>
                      <SocialAvatar person={person} size={40} />
                      <View style={styles.memberCopy}>
                        <Text style={styles.memberName}>{person.displayName}</Text>
                        <Text style={styles.pendingInviteText}>Richiesta inviata</Text>
                      </View>
                      <Ionicons name="time-outline" size={18} color="#F5C451" />
                    </View>
                  );
                })}
              </>
            )}

            {canInvite && (
              <>
                <Text style={styles.optionsSection}>Invita un amico</Text>
                {inviteable.length ? inviteable.map((person) => (
                  <View key={person.id} style={styles.memberRow}>
                    <SocialAvatar person={person} size={40} />
                    <Text style={[styles.memberName, styles.memberCopy]}>{person.displayName}</Text>
                    <TouchableOpacity
                      testID={`group-invite-${person.id}`}
                      onPress={async () => {
                        try {
                          await social.inviteToGroup(conversationId, person.id);
                          hap.success();
                        } catch (error) {
                          Alert.alert("Invito non inviato", error instanceof Error ? error.message : "Riprova.");
                        }
                      }}
                      style={styles.inviteButton}
                    >
                      <Ionicons name="person-add" size={17} color="#07111F" />
                      <Text style={styles.inviteButtonText}>Invita</Text>
                    </TouchableOpacity>
                  </View>
                )) : (
                  <Text style={styles.noInviteText}>
                    Tutti gli amici disponibili sono gia nel gruppo o hanno un invito in attesa.
                  </Text>
                )}
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#04101F" },
  safe: { flex: 1 },
  keyboard: { flex: 1 },
  header: {
    minHeight: 68,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#07182AF5",
    borderBottomWidth: 1,
    borderBottomColor: "#F5C45144",
  },
  headerCopy: { flex: 1, minWidth: 0 },
  headerTitle: { color: "#FFFFFF", fontSize: 16, fontWeight: "900", letterSpacing: 0 },
  headerSubtitle: { color: "#AAB7C8", fontSize: 10, marginTop: 2, letterSpacing: 0 },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF0D",
  },
  closeIcon: { borderWidth: 1, borderColor: "#F5C45166" },
  messages: { flexGrow: 1, paddingHorizontal: 12, paddingTop: 18, paddingBottom: 12 },
  encryptionNotice: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    maxWidth: 280,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 17,
    borderRadius: 8,
    backgroundColor: "#07182AD9",
  },
  encryptionText: { color: "#9AAABD", fontSize: 9, fontWeight: "700", letterSpacing: 0 },
  waitingNotice: {
    alignSelf: "center",
    maxWidth: 300,
    padding: 10,
    marginBottom: 15,
    borderRadius: 8,
    backgroundColor: "#F5C45118",
    borderWidth: 1,
    borderColor: "#F5C45144",
  },
  waitingText: { color: "#F2D68E", fontSize: 10, lineHeight: 15, textAlign: "center" },
  messageRow: { flexDirection: "row", alignItems: "flex-end", gap: 7, marginBottom: 8 },
  ownMessageRow: { justifyContent: "flex-end" },
  bubble: {
    maxWidth: "78%",
    minWidth: 86,
    paddingHorizontal: 11,
    paddingTop: 8,
    paddingBottom: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  ownBubble: {
    backgroundColor: "#D9E8C7",
    borderColor: "#F5C45188",
    borderBottomRightRadius: 2,
  },
  otherBubble: {
    backgroundColor: "#FFFFFFF5",
    borderColor: "#FFFFFF",
    borderBottomLeftRadius: 2,
  },
  senderName: { color: "#9B6200", fontSize: 10, fontWeight: "900", marginBottom: 3 },
  messageText: { color: "#132033", fontSize: 14, lineHeight: 19, letterSpacing: 0 },
  messageMeta: { alignSelf: "flex-end", flexDirection: "row", alignItems: "center", gap: 3, marginTop: 2 },
  messageTime: { color: "#657387", fontSize: 9, letterSpacing: 0 },
  composer: {
    minHeight: 66,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    backgroundColor: "#07182AF5",
    borderTopWidth: 1,
    borderTopColor: "#FFFFFF22",
  },
  inputShell: {
    flex: 1,
    minHeight: 48,
    maxHeight: 112,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 24,
    backgroundColor: "#FFFFFFF5",
  },
  input: { flex: 1, minHeight: 42, maxHeight: 104, color: "#132033", fontSize: 14, paddingVertical: 10 },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5C451",
  },
  unavailable: { flex: 1, alignItems: "center", justifyContent: "center", padding: 28 },
  unavailableTitle: { color: "#FFFFFF", fontSize: 21, fontWeight: "900", marginTop: 12 },
  unavailableBody: { color: "#B3C0D0", fontSize: 13, textAlign: "center", marginTop: 6 },
  unavailableAction: { minHeight: 44, marginTop: 20, paddingHorizontal: 18, borderRadius: 8, justifyContent: "center", backgroundColor: "#F5C451" },
  unavailableActionText: { color: "#07111F", fontSize: 12, fontWeight: "900" },
  modalBackdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "#010713C7" },
  optionsSheet: {
    width: "100%",
    maxWidth: 430,
    alignSelf: "center",
    maxHeight: "86%",
    backgroundColor: "#07182A",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: "#F5C45155",
  },
  optionsHeader: {
    minHeight: 78,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#FFFFFF22",
  },
  optionsTitleGroup: { flex: 1, minWidth: 0 },
  optionsEyebrow: { color: "#F5C451", fontSize: 9, fontWeight: "900", letterSpacing: 1.2 },
  optionsTitle: { color: "#FFFFFF", fontSize: 20, fontWeight: "900", letterSpacing: 0, marginTop: 2 },
  optionsClose: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F5C45155",
  },
  optionsContent: { padding: 18, paddingBottom: 36 },
  optionsSection: { color: "#F5C451", fontSize: 11, fontWeight: "900", letterSpacing: 0, marginTop: 13, marginBottom: 6 },
  memberRow: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#FFFFFF22",
  },
  memberCopy: { flex: 1, minWidth: 0 },
  memberName: { color: "#FFFFFF", fontSize: 14, fontWeight: "800", letterSpacing: 0 },
  memberMeta: { color: "#96A5B8", fontSize: 10, marginTop: 3 },
  pendingInviteText: { color: "#F5C451", fontSize: 10, marginTop: 3 },
  inviteButton: {
    minHeight: 34,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 8,
    backgroundColor: "#F5C451",
  },
  inviteButtonText: { color: "#07111F", fontSize: 10, fontWeight: "900" },
  noInviteText: { color: "#9AAABD", fontSize: 11, lineHeight: 16, paddingVertical: 12 },
});
