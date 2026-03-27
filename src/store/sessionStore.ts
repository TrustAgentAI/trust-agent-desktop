// Chat session state store
import { create } from 'zustand';
import type { RoleSession, Message } from '../lib/roleConfig';
import { gateway, GatewayError } from '../lib/gateway';

interface SessionState {
  sessions: Map<string, RoleSession>;
  currentSessionId: string | null;
  messages: Message[];
  isAgentThinking: boolean;
  error: string | null;

  setCurrentSession: (sessionId: string | null) => void;
  addMessage: (message: Message) => void;
  setThinking: (thinking: boolean) => void;
  clearSession: (sessionId: string) => void;
  loadHistory: (sessionId: string) => Promise<void>;
  getSession: (sessionId: string) => RoleSession | undefined;
  registerSession: (session: RoleSession) => void;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  sessions: new Map(),
  currentSessionId: null,
  messages: [],
  isAgentThinking: false,
  error: null,

  setCurrentSession: (sessionId: string | null) => {
    if (sessionId) {
      const session = get().sessions.get(sessionId);
      set({
        currentSessionId: sessionId,
        messages: session?.messages || [],
      });
    } else {
      set({ currentSessionId: null, messages: [] });
    }
  },

  addMessage: (message: Message) => {
    const { currentSessionId, sessions } = get();
    const updatedMessages = [...get().messages, message];

    if (currentSessionId) {
      const session = sessions.get(currentSessionId);
      if (session) {
        const updatedSession = {
          ...session,
          messages: [...session.messages, message],
        };
        const updatedSessions = new Map(sessions);
        updatedSessions.set(currentSessionId, updatedSession);
        set({ messages: updatedMessages, sessions: updatedSessions });
        return;
      }
    }

    set({ messages: updatedMessages });
  },

  setThinking: (thinking: boolean) => {
    set({ isAgentThinking: thinking });
  },

  clearSession: (sessionId: string) => {
    const { sessions, currentSessionId } = get();
    const updatedSessions = new Map(sessions);
    updatedSessions.delete(sessionId);

    if (currentSessionId === sessionId) {
      set({
        sessions: updatedSessions,
        currentSessionId: null,
        messages: [],
        isAgentThinking: false,
      });
    } else {
      set({ sessions: updatedSessions });
    }
  },

  loadHistory: async (sessionId: string) => {
    try {
      const messages = await gateway.sessions.getHistory(sessionId);
      const { sessions } = get();
      const session = sessions.get(sessionId);

      if (session) {
        const updatedSession = { ...session, messages };
        const updatedSessions = new Map(sessions);
        updatedSessions.set(sessionId, updatedSession);
        set({ sessions: updatedSessions });

        if (get().currentSessionId === sessionId) {
          set({ messages });
        }
      }
    } catch (err) {
      const message =
        err instanceof GatewayError ? err.message : 'Failed to load message history';
      set({ error: message });
      throw err;
    }
  },

  getSession: (sessionId: string) => {
    return get().sessions.get(sessionId);
  },

  registerSession: (session: RoleSession) => {
    const updatedSessions = new Map(get().sessions);
    updatedSessions.set(session.sessionId, session);
    set({ sessions: updatedSessions });
  },
}));

export default useSessionStore;
