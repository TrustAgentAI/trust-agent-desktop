// Authentication state store - persisted to Tauri store
import { create } from 'zustand';
import { Store } from '@tauri-apps/plugin-store';
import type { User } from '../lib/roleConfig';
import { gateway, configureGateway, GatewayError } from '../lib/gateway';

interface AuthState {
  sessionToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  restoreSession: () => Promise<void>;
  clearError: () => void;
}

let tauriStore: Store | null = null;

async function getTauriStore(): Promise<Store> {
  if (!tauriStore) {
    tauriStore = await Store.load('auth.json');
  }
  return tauriStore;
}

export const useAuthStore = create<AuthState>((set, get) => {
  // Configure gateway to use this store's token
  configureGateway({
    getToken: () => get().sessionToken,
    onTokenExpired: async () => {
      await get().refreshToken();
    },
  });

  return {
    sessionToken: null,
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,

    login: async (email: string, password: string) => {
      set({ isLoading: true, error: null });
      try {
        const response = await gateway.auth.signin(email, password);
        const store = await getTauriStore();
        await store.set('sessionToken', response.token);
        await store.set('user', response.user);
        await store.save();

        set({
          sessionToken: response.token,
          user: response.user,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch (err) {
        const message =
          err instanceof GatewayError ? err.message : 'Failed to sign in';
        set({ error: message, isLoading: false });
        throw err;
      }
    },

    logout: async () => {
      try {
        await gateway.auth.signout();
      } catch {
        // Continue logout even if API call fails
      }

      try {
        const store = await getTauriStore();
        await store.delete('sessionToken');
        await store.delete('user');
        await store.save();
      } catch {
        // Continue logout even if store clear fails
      }

      set({
        sessionToken: null,
        user: null,
        isAuthenticated: false,
        error: null,
      });
    },

    refreshToken: async () => {
      const currentToken = get().sessionToken;
      if (!currentToken) {
        throw new Error('No session token to refresh');
      }

      try {
        const response = await gateway.auth.signin('', '');
        const store = await getTauriStore();
        await store.set('sessionToken', response.token);
        await store.save();

        set({ sessionToken: response.token });
      } catch {
        // If refresh fails, force logout
        await get().logout();
        throw new Error('Session expired. Please sign in again.');
      }
    },

    restoreSession: async () => {
      set({ isLoading: true });
      try {
        const store = await getTauriStore();
        const token = await store.get<string>('sessionToken');
        const user = await store.get<User>('user');

        if (token && user) {
          set({
            sessionToken: token,
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          set({ isLoading: false });
        }
      } catch {
        set({ isLoading: false });
      }
    },

    clearError: () => set({ error: null }),
  };
});

export default useAuthStore;
