/**
 * Authentication store - browser-compatible, persists to localStorage.
 * Replaces direct @tauri-apps/plugin-store usage.
 */
import { create } from 'zustand';
import { localStore } from '@/lib/tauri-compat';
import { login as authLogin } from '@/lib/auth';

interface AuthState {
  token: string | null;
  userId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (apiKey: string) => Promise<void>;
  loginBrowserMode: (apiKey: string) => void;
  logout: () => void;
  restoreSession: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStore.get<string>('auth_token'),
  userId: localStore.get<string>('auth_userId'),
  isAuthenticated: localStore.get<string>('auth_token') !== null,
  isLoading: false,
  error: null,

  login: async (apiKey: string) => {
    set({ isLoading: true, error: null });
    try {
      const result = await authLogin(apiKey);
      localStore.set('auth_token', result.token);
      localStore.set('auth_userId', result.userId);
      set({
        token: result.token,
        userId: result.userId,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed. Please try again.';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  loginBrowserMode: (apiKey: string) => {
    // In browser mode, accept any key starting with "ta_" for development
    const userId = `user_${Date.now()}`;
    localStore.set('auth_token', apiKey);
    localStore.set('auth_userId', userId);
    set({
      token: apiKey,
      userId,
      isAuthenticated: true,
      isLoading: false,
      error: null,
    });
  },

  logout: () => {
    localStore.remove('auth_token');
    localStore.remove('auth_userId');
    set({
      token: null,
      userId: null,
      isAuthenticated: false,
      error: null,
    });
  },

  restoreSession: () => {
    const token = localStore.get<string>('auth_token');
    const userId = localStore.get<string>('auth_userId');
    if (token && userId) {
      set({ token, userId, isAuthenticated: true });
    }
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;
