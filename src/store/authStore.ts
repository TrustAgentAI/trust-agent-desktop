/**
 * Authentication store - manages user session state.
 * Persists JWT + user data to localStorage via tauri-compat.
 */
import { create } from 'zustand';
import {
  loginWithEmail,
  loginWithGoogle as authLoginWithGoogle,
  clearSession,
  getSession,
  refreshToken as authRefreshToken,
  type AuthUser,
} from '@/lib/auth';

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  restoreSession: () => void;
  refreshSession: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  refreshToken: null,
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const result = await loginWithEmail(email, password);
      set({
        token: result.token,
        refreshToken: result.refreshToken,
        user: result.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed. Please try again.';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  loginWithGoogle: async () => {
    set({ isLoading: true, error: null });
    try {
      await authLoginWithGoogle();
      // The actual authentication happens via callback - just show loading state
      // The callback handler will call restoreSession or set state directly
      set({ isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Google sign-in failed.';
      set({ error: message, isLoading: false });
    }
  },

  logout: () => {
    clearSession();
    set({
      token: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      error: null,
    });
  },

  restoreSession: () => {
    const session = getSession();
    if (session && session.token && session.user) {
      set({
        token: session.token,
        refreshToken: session.refreshToken,
        user: session.user,
        isAuthenticated: true,
      });
    }
  },

  refreshSession: async () => {
    try {
      const result = await authRefreshToken();
      set({
        token: result.token,
        refreshToken: result.refreshToken,
      });
    } catch {
      // If refresh fails, log the user out
      get().logout();
    }
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;
