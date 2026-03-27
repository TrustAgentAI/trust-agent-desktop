/**
 * Session store - manages auth state and per-role messages.
 * Persists token to localStorage with try/catch.
 */
import { create } from 'zustand';
import { localStore } from '@/lib/tauri-compat';

interface Message {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

interface SessionState {
  token: string | null;
  userId: string | null;
  hireId: string | null;
  roleName: string | null;
  isAuthenticated: boolean;
  messages: Record<string, Message[]>;
  login: (token: string, userId: string) => void;
  setActiveRole: (hireId: string, roleName: string) => void;
  logout: () => void;
  addMessage: (hireId: string, message: Message) => void;
  clearMessages: (hireId: string) => void;
  getMessages: (hireId: string) => Message[];
}

const MAX_MESSAGES_PER_ROLE = 100;

export const useSession = create<SessionState>((set, get) => ({
  token: localStore.get<string>('session_token'),
  userId: localStore.get<string>('session_userId'),
  hireId: null,
  roleName: null,
  isAuthenticated: localStore.get<string>('session_token') !== null,
  messages: localStore.get<Record<string, Message[]>>('session_messages') || {},

  login: (token: string, userId: string) => {
    localStore.set('session_token', token);
    localStore.set('session_userId', userId);
    set({ token, userId, isAuthenticated: true });
  },

  setActiveRole: (hireId: string, roleName: string) => {
    set({ hireId, roleName });
  },

  logout: () => {
    localStore.remove('session_token');
    localStore.remove('session_userId');
    set({
      token: null,
      userId: null,
      hireId: null,
      roleName: null,
      isAuthenticated: false,
    });
  },

  addMessage: (hireId: string, message: Message) => {
    const current = get().messages;
    const roleMessages = current[hireId] || [];
    const updated = [...roleMessages, message].slice(-MAX_MESSAGES_PER_ROLE);
    const newMessages = { ...current, [hireId]: updated };
    localStore.set('session_messages', newMessages);
    set({ messages: newMessages });
  },

  clearMessages: (hireId: string) => {
    const current = get().messages;
    const newMessages = { ...current };
    delete newMessages[hireId];
    localStore.set('session_messages', newMessages);
    set({ messages: newMessages });
  },

  getMessages: (hireId: string) => {
    return get().messages[hireId] || [];
  },
}));

export default useSession;
