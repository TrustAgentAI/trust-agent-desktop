import { create } from 'zustand';
import { localStore } from '@/lib/tauri-compat';

interface PermissionGrant {
  path: string;
  access: 'read' | 'read-write';
  agentRoleId: string;
  grantedAt: string;
}

interface PermissionStore {
  grants: PermissionGrant[];
  addGrant: (grant: PermissionGrant) => void;
  removeGrant: (path: string, agentRoleId: string) => void;
  getGrantsForRole: (agentRoleId: string) => PermissionGrant[];
  loadGrants: () => Promise<void>;
}

const STORAGE_KEY = 'permission_grants';

export const usePermissionStore = create<PermissionStore>((set, get) => ({
  grants: [],

  addGrant: (grant: PermissionGrant) => {
    const updated = [...get().grants, grant];
    set({ grants: updated });
    localStore.set(STORAGE_KEY, updated);
  },

  removeGrant: (path: string, agentRoleId: string) => {
    const updated = get().grants.filter(
      (g) => !(g.path === path && g.agentRoleId === agentRoleId),
    );
    set({ grants: updated });
    localStore.set(STORAGE_KEY, updated);
  },

  getGrantsForRole: (agentRoleId: string) => {
    return get().grants.filter((g) => g.agentRoleId === agentRoleId);
  },

  loadGrants: async () => {
    const stored = localStore.get<PermissionGrant[]>(STORAGE_KEY);
    if (stored && Array.isArray(stored)) {
      set({ grants: stored });
    }
  },
}));

export type { PermissionGrant };
export default usePermissionStore;
