import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "./auth";
import {
  SOCIAL_DIRECTORY,
  createGroup as createGroupInStore,
  getFriendIds,
  inviteToGroup as inviteToGroupInStore,
  loadSocialState,
  openDirectConversation as openDirectConversationInStore,
  respondToFriendRequest as respondToFriendRequestInStore,
  respondToGroupInvitation as respondToGroupInvitationInStore,
  sendFriendRequest as sendFriendRequestInStore,
  sendSocialMessage as sendSocialMessageInStore,
  type SocialPerson,
  type SocialState,
} from "../store/social";

const EMPTY_STATE: SocialState = {
  friendships: [],
  friendRequests: [],
  conversations: [],
  messages: [],
  groupInvitations: [],
};

interface SocialContextValue {
  state: SocialState;
  people: readonly SocialPerson[];
  friendIds: string[];
  loading: boolean;
  refresh: () => Promise<void>;
  sendFriendRequest: (targetId: string) => Promise<void>;
  respondToFriendRequest: (requestId: string, accept: boolean) => Promise<void>;
  openDirectConversation: (friendId: string) => Promise<string>;
  createGroup: (title: string, invitedFriendIds: string[]) => Promise<string>;
  inviteToGroup: (conversationId: string, friendId: string) => Promise<void>;
  respondToGroupInvitation: (invitationId: string, accept: boolean) => Promise<void>;
  sendMessage: (conversationId: string, text: string) => Promise<void>;
}

const SocialContext = createContext<SocialContextValue | null>(null);

export function SocialProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState<SocialState>(EMPTY_STATE);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setState(EMPTY_STATE);
      return;
    }
    setLoading(true);
    try {
      setState(await loadSocialState(user.id));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const run = useCallback(async (action: (userId: string) => Promise<SocialState>) => {
    if (!user) throw new Error("Accedi per usare i messaggi.");
    const next = await action(user.id);
    setState(next);
  }, [user]);

  const value = useMemo<SocialContextValue>(() => ({
    state,
    people: SOCIAL_DIRECTORY,
    friendIds: user ? getFriendIds(state, user.id) : [],
    loading,
    refresh,
    sendFriendRequest: (targetId) =>
      run((userId) => sendFriendRequestInStore(userId, targetId)),
    respondToFriendRequest: (requestId, accept) =>
      run((userId) => respondToFriendRequestInStore(userId, requestId, accept)),
    openDirectConversation: async (friendId) => {
      if (!user) throw new Error("Accedi per usare i messaggi.");
      const result = await openDirectConversationInStore(user.id, friendId);
      setState(result.state);
      return result.conversationId;
    },
    createGroup: async (title, invitedFriendIds) => {
      if (!user) throw new Error("Accedi per creare un gruppo.");
      const result = await createGroupInStore(user.id, title, invitedFriendIds);
      setState(result.state);
      return result.conversationId;
    },
    inviteToGroup: (conversationId, friendId) =>
      run((userId) => inviteToGroupInStore(userId, conversationId, friendId)),
    respondToGroupInvitation: (invitationId, accept) =>
      run((userId) => respondToGroupInvitationInStore(userId, invitationId, accept)),
    sendMessage: (conversationId, text) =>
      run((userId) => sendSocialMessageInStore(userId, conversationId, text)),
  }), [loading, refresh, run, state, user]);

  return <SocialContext.Provider value={value}>{children}</SocialContext.Provider>;
}

export function useSocial() {
  const context = useContext(SocialContext);
  if (!context) throw new Error("useSocial must be used within <SocialProvider>");
  return context;
}
