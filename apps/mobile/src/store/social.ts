import AsyncStorage from "@react-native-async-storage/async-storage";

export type SocialRole = "fan" | "champion";
export type RequestStatus = "pending" | "accepted" | "declined";
export type ConversationType = "direct" | "group";

export interface SocialPerson {
  id: string;
  displayName: string;
  handle: string;
  role: SocialRole;
  avatarUrl: string | null;
}

export interface Friendship {
  id: string;
  memberIds: [string, string];
  createdAt: string;
}

export interface FriendRequest {
  id: string;
  fromId: string;
  toId: string;
  status: RequestStatus;
  createdAt: string;
}

export interface SocialConversation {
  id: string;
  type: ConversationType;
  title: string | null;
  participantIds: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface SocialMessage {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: string;
}

export interface GroupInvitation {
  id: string;
  conversationId: string;
  fromId: string;
  toId: string;
  status: RequestStatus;
  createdAt: string;
}

export interface SocialState {
  friendships: Friendship[];
  friendRequests: FriendRequest[];
  conversations: SocialConversation[];
  messages: SocialMessage[];
  groupInvitations: GroupInvitation[];
}

export const SOCIAL_DIRECTORY: readonly SocialPerson[] = [
  {
    id: "social-giulia",
    displayName: "Giulia Rossi",
    handle: "@giulia.rossi",
    role: "fan",
    avatarUrl: "https://i.pravatar.cc/240?img=47",
  },
  {
    id: "social-marco",
    displayName: "Marco Bianchi",
    handle: "@marco10",
    role: "fan",
    avatarUrl: "https://i.pravatar.cc/240?img=12",
  },
  {
    id: "social-sara",
    displayName: "Sara Conti",
    handle: "@sara.goal",
    role: "fan",
    avatarUrl: "https://i.pravatar.cc/240?img=44",
  },
  {
    id: "social-luca",
    displayName: "Luca Ferri",
    handle: "@luca.ferri",
    role: "fan",
    avatarUrl: "https://i.pravatar.cc/240?img=11",
  },
  {
    id: "social-anna",
    displayName: "Anna Moretti",
    handle: "@anna.stadium",
    role: "fan",
    avatarUrl: "https://i.pravatar.cc/240?img=32",
  },
  {
    id: "social-davide",
    displayName: "Davide Romano",
    handle: "@davide.romano",
    role: "fan",
    avatarUrl: null,
  },
  {
    id: "social-champion",
    displayName: "Matteo Riva",
    handle: "@matteo.riva",
    role: "champion",
    avatarUrl: "https://i.pravatar.cc/240?img=52",
  },
];

const STORAGE_PREFIX = "@mc/social@2:";

function storageKey(userId: string) {
  return `${STORAGE_PREFIX}${userId}`;
}

function nowIso() {
  return new Date().toISOString();
}

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function defaultState(userId: string): SocialState {
  const now = Date.now();
  const ago = (minutes: number) => new Date(now - minutes * 60_000).toISOString();
  const directId = `social-direct-${userId}-giulia`;
  const groupId = `social-group-${userId}-weekend`;
  const inviteGroupId = `social-group-${userId}-stadium`;

  return {
    friendships: [
      {
        id: `friendship-${userId}-giulia`,
        memberIds: [userId, "social-giulia"],
        createdAt: ago(480),
      },
      {
        id: `friendship-${userId}-sara`,
        memberIds: [userId, "social-sara"],
        createdAt: ago(320),
      },
    ],
    friendRequests: [
      {
        id: `friend-request-${userId}-marco`,
        fromId: "social-marco",
        toId: userId,
        status: "pending",
        createdAt: ago(36),
      },
    ],
    conversations: [
      {
        id: directId,
        type: "direct",
        title: null,
        participantIds: [userId, "social-giulia"],
        createdBy: userId,
        createdAt: ago(470),
        updatedAt: ago(8),
      },
      {
        id: groupId,
        type: "group",
        title: "Tifosi del weekend",
        participantIds: [userId, "social-giulia", "social-sara"],
        createdBy: userId,
        createdAt: ago(210),
        updatedAt: ago(22),
      },
      {
        id: inviteGroupId,
        type: "group",
        title: "Trasferta allo stadio",
        participantIds: ["social-luca", "social-anna"],
        createdBy: "social-luca",
        createdAt: ago(95),
        updatedAt: ago(95),
      },
    ],
    messages: [
      {
        id: `${directId}-1`,
        conversationId: directId,
        senderId: "social-giulia",
        text: "Hai visto il prossimo evento con i Champion?",
        createdAt: ago(34),
      },
      {
        id: `${directId}-2`,
        conversationId: directId,
        senderId: userId,
        text: "Si, stavo proprio scegliendo quale prenotare.",
        createdAt: ago(8),
      },
      {
        id: `${groupId}-1`,
        conversationId: groupId,
        senderId: "social-sara",
        text: "Per domenica ci siamo tutti?",
        createdAt: ago(46),
      },
      {
        id: `${groupId}-2`,
        conversationId: groupId,
        senderId: "social-giulia",
        text: "Io ci sono. Ci sentiamo qui prima della partita!",
        createdAt: ago(22),
      },
    ],
    groupInvitations: [
      {
        id: `group-invite-${userId}-stadium`,
        conversationId: inviteGroupId,
        fromId: "social-luca",
        toId: userId,
        status: "pending",
        createdAt: ago(95),
      },
    ],
  };
}

async function persist(userId: string, state: SocialState) {
  await AsyncStorage.setItem(storageKey(userId), JSON.stringify(state));
  return state;
}

export async function loadSocialState(userId: string): Promise<SocialState> {
  const stored = await AsyncStorage.getItem(storageKey(userId));
  if (!stored) {
    const seeded = defaultState(userId);
    await persist(userId, seeded);
    return seeded;
  }

  try {
    return JSON.parse(stored) as SocialState;
  } catch {
    const seeded = defaultState(userId);
    await persist(userId, seeded);
    return seeded;
  }
}

async function updateState(
  userId: string,
  change: (current: SocialState) => SocialState,
) {
  const current = await loadSocialState(userId);
  return persist(userId, change(current));
}

export function getFriendIds(state: SocialState, userId: string) {
  return state.friendships.flatMap((friendship) => {
    if (!friendship.memberIds.includes(userId)) return [];
    return friendship.memberIds.filter((id) => id !== userId);
  });
}

export function findPerson(
  personId: string,
  currentUser?: { id: string; displayName: string; role: string; avatarUrl?: string | null } | null,
): SocialPerson {
  if (currentUser?.id === personId) {
    return {
      id: currentUser.id,
      displayName: currentUser.displayName,
      handle: "@tu",
      role: currentUser.role === "champion" ? "champion" : "fan",
      avatarUrl: currentUser.avatarUrl ?? null,
    };
  }

  return SOCIAL_DIRECTORY.find((person) => person.id === personId) ?? {
    id: personId,
    displayName: "Utente MTC",
    handle: "@utente",
    role: "fan",
    avatarUrl: null,
  };
}

export function conversationTitle(
  conversation: SocialConversation,
  userId: string,
  currentUser?: { id: string; displayName: string; role: string; avatarUrl?: string | null } | null,
) {
  if (conversation.type === "group") return conversation.title ?? "Gruppo MTC";
  const otherId = conversation.participantIds.find((id) => id !== userId);
  return otherId ? findPerson(otherId, currentUser).displayName : "Chat";
}

export async function sendFriendRequest(userId: string, targetId: string) {
  if (userId === targetId) throw new Error("Non puoi aggiungere te stesso.");
  return updateState(userId, (state) => {
    if (getFriendIds(state, userId).includes(targetId)) {
      throw new Error("Siete gia amici.");
    }
    const existing = state.friendRequests.find(
      (request) =>
        request.status === "pending" &&
        ((request.fromId === userId && request.toId === targetId) ||
          (request.fromId === targetId && request.toId === userId)),
    );
    if (existing) throw new Error("C'e gia una richiesta in attesa.");
    return {
      ...state,
      friendRequests: [
        ...state.friendRequests,
        {
          id: uid("friend-request"),
          fromId: userId,
          toId: targetId,
          status: "pending",
          createdAt: nowIso(),
        },
      ],
    };
  });
}

export async function respondToFriendRequest(
  userId: string,
  requestId: string,
  accept: boolean,
) {
  return updateState(userId, (state) => {
    const request = state.friendRequests.find((item) => item.id === requestId);
    if (!request || request.toId !== userId || request.status !== "pending") {
      throw new Error("Richiesta non disponibile.");
    }
    const friendships = accept
      ? [
          ...state.friendships,
          {
            id: uid("friendship"),
            memberIds: [userId, request.fromId] as [string, string],
            createdAt: nowIso(),
          },
        ]
      : state.friendships;
    return {
      ...state,
      friendships,
      friendRequests: state.friendRequests.map((item) =>
        item.id === requestId
          ? { ...item, status: accept ? "accepted" : "declined" }
          : item,
      ),
    };
  });
}

export async function openDirectConversation(userId: string, friendId: string) {
  let conversationId = "";
  const next = await updateState(userId, (state) => {
    if (!getFriendIds(state, userId).includes(friendId)) {
      throw new Error("Puoi scrivere solo agli amici che hanno accettato la richiesta.");
    }
    const existing = state.conversations.find(
      (conversation) =>
        conversation.type === "direct" &&
        conversation.participantIds.includes(userId) &&
        conversation.participantIds.includes(friendId),
    );
    if (existing) {
      conversationId = existing.id;
      return state;
    }
    const createdAt = nowIso();
    const conversation: SocialConversation = {
      id: uid("direct"),
      type: "direct",
      title: null,
      participantIds: [userId, friendId],
      createdBy: userId,
      createdAt,
      updatedAt: createdAt,
    };
    conversationId = conversation.id;
    return { ...state, conversations: [...state.conversations, conversation] };
  });
  return { state: next, conversationId };
}

export async function createGroup(
  userId: string,
  title: string,
  invitedFriendIds: string[],
) {
  const cleanTitle = title.trim();
  if (cleanTitle.length < 2) throw new Error("Inserisci un nome per il gruppo.");
  let conversationId = "";
  const next = await updateState(userId, (state) => {
    const friendIds = getFriendIds(state, userId);
    const validInvites = Array.from(
      new Set(invitedFriendIds.filter((id) => friendIds.includes(id))),
    );
    const createdAt = nowIso();
    conversationId = uid("group");
    const conversation: SocialConversation = {
      id: conversationId,
      type: "group",
      title: cleanTitle,
      participantIds: [userId],
      createdBy: userId,
      createdAt,
      updatedAt: createdAt,
    };
    const invitations = validInvites.map<GroupInvitation>((friendId) => ({
      id: uid("group-invite"),
      conversationId,
      fromId: userId,
      toId: friendId,
      status: "pending",
      createdAt,
    }));
    return {
      ...state,
      conversations: [...state.conversations, conversation],
      groupInvitations: [...state.groupInvitations, ...invitations],
    };
  });
  return { state: next, conversationId };
}

export async function inviteToGroup(
  userId: string,
  conversationId: string,
  friendId: string,
) {
  return updateState(userId, (state) => {
    const conversation = state.conversations.find((item) => item.id === conversationId);
    if (!conversation || conversation.type !== "group" || conversation.createdBy !== userId) {
      throw new Error("Solo chi ha creato il gruppo puo invitare nuovi partecipanti.");
    }
    if (!getFriendIds(state, userId).includes(friendId)) {
      throw new Error("Puoi invitare solo amici confermati.");
    }
    if (conversation.participantIds.includes(friendId)) {
      throw new Error("Questa persona e gia nel gruppo.");
    }
    const pending = state.groupInvitations.some(
      (invite) =>
        invite.conversationId === conversationId &&
        invite.toId === friendId &&
        invite.status === "pending",
    );
    if (pending) throw new Error("Invito gia inviato.");
    return {
      ...state,
      groupInvitations: [
        ...state.groupInvitations,
        {
          id: uid("group-invite"),
          conversationId,
          fromId: userId,
          toId: friendId,
          status: "pending",
          createdAt: nowIso(),
        },
      ],
    };
  });
}

export async function respondToGroupInvitation(
  userId: string,
  invitationId: string,
  accept: boolean,
) {
  return updateState(userId, (state) => {
    const invitation = state.groupInvitations.find((item) => item.id === invitationId);
    if (!invitation || invitation.toId !== userId || invitation.status !== "pending") {
      throw new Error("Invito non disponibile.");
    }
    return {
      ...state,
      groupInvitations: state.groupInvitations.map((item) =>
        item.id === invitationId
          ? { ...item, status: accept ? "accepted" : "declined" }
          : item,
      ),
      conversations: state.conversations.map((conversation) =>
        accept && conversation.id === invitation.conversationId
          ? {
              ...conversation,
              participantIds: Array.from(new Set([...conversation.participantIds, userId])),
              updatedAt: nowIso(),
            }
          : conversation,
      ),
    };
  });
}

export async function sendSocialMessage(
  userId: string,
  conversationId: string,
  text: string,
) {
  const cleanText = text.trim();
  if (!cleanText) throw new Error("Scrivi un messaggio.");
  return updateState(userId, (state) => {
    const conversation = state.conversations.find((item) => item.id === conversationId);
    if (!conversation?.participantIds.includes(userId)) {
      throw new Error("Non fai parte di questa conversazione.");
    }
    if (conversation.type === "direct") {
      const otherId = conversation.participantIds.find((id) => id !== userId);
      if (!otherId || !getFriendIds(state, userId).includes(otherId)) {
        throw new Error("Puoi scrivere solo agli amici confermati.");
      }
    }
    const createdAt = nowIso();
    return {
      ...state,
      conversations: state.conversations.map((item) =>
        item.id === conversationId ? { ...item, updatedAt: createdAt } : item,
      ),
      messages: [
        ...state.messages,
        {
          id: uid("message"),
          conversationId,
          senderId: userId,
          text: cleanText.slice(0, 1000),
          createdAt,
        },
      ],
    };
  });
}
