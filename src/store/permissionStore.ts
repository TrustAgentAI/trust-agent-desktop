// File permission state store - synced with Tauri store for persistence
import { create } from 'zustand';
import { Store } from '@tauri-apps/plugin-store';
import type { FilePermissionGrant } from '../lib/roleConfig';

interface PermissionState {
  grants: FilePermissionGrant[];
  isLoading: boolean;
  error: string | null;

  addGrant: (grant: FilePermissionGrant) => Promise<void>;
  removeGrant: (grantId: string) => Promise<void>;
  loadGrants: () => Promise<void>;
  getGrantsForRole: (roleHireId: string) => FilePermissionGrant[];
  clearError: () => void;
}

let permStore: Store | null = null;

async function getPermStore(): Promise<Store> {
  if (!permStore) {
    permStore = await Store.load('permissions.json');
  }
  return permStore;
}

export const usePermissionStore = create<PermissionState>((set, get) => ({
  grants: [],
  isLoading: false,
  error: null,

  addGrant: async (grant: FilePermissionGrant) => {
    try {
      const updatedGrants = [...get().grants, grant];
      const store = await getPermStore();
      await store.set('grants', updatedGrants);
      await store.save();
      set({ grants: updatedGrants });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add permission grant';
      set({ error: message });
      throw err;
    }
  },

  removeGrant: async (grantId: string) => {
    try {
      const updatedGrants = get().grants.filter((g) => g.id !== grantId);
      const store = await getPermStore();
      await store.set('grants', updatedGrants);
      await store.save();
      set({ grants: updatedGrants });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove permission grant';
      set({ error: message });
      throw err;
    }
  },

  loadGrants: async () => {
    set({ isLoading: true, error: null });
    try {
      const store = await getPermStore();
      const grants = await store.get<FilePermissionGrant[]>('grants');
      set({ grants: grants || [], isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load permissions';
      set({ error: message, isLoading: false });
    }
  },

  getGrantsForRole: (roleHireId: string) => {
    return get().grants.filter((g) => g.roleHireId === roleHireId);
  },

  clearError: () => set({ error: null }),
}));

export default usePermissionStore;
