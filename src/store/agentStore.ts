/**
 * Agent/Role store - manages hired roles per spec 2.6.
 * Persists to localStorage.
 */
import { create } from 'zustand';
import { localStore } from '@/lib/tauri-compat';

interface HiredRole {
  hireId: string;
  roleName: string;
  roleSlug?: string;
  roleCategory: string;
  trustScore: number;
  trustBadge: 'PLATINUM' | 'GOLD' | 'SILVER' | 'BASIC';
  isActive: boolean;
  sessionToken: string | null;
}

interface AgentStore {
  roles: HiredRole[];
  activeRoleId: string | null;
  addRole: (role: HiredRole) => void;
  setActiveRole: (hireId: string) => void;
  updateSessionToken: (hireId: string, token: string) => void;
  removeRole: (hireId: string) => void;
}

export const useAgentStore = create<AgentStore>((set, get) => ({
  roles: localStore.get<HiredRole[]>('agent_roles') || [],
  activeRoleId: null,

  addRole: (role: HiredRole) => {
    const updated = [...get().roles, role];
    localStore.set('agent_roles', updated);
    set({ roles: updated });
  },

  setActiveRole: (hireId: string) => {
    const roles = get().roles.map((r) => ({
      ...r,
      isActive: r.hireId === hireId,
    }));
    localStore.set('agent_roles', roles);
    set({ roles, activeRoleId: hireId });
  },

  updateSessionToken: (hireId: string, token: string) => {
    const roles = get().roles.map((r) =>
      r.hireId === hireId ? { ...r, sessionToken: token } : r
    );
    localStore.set('agent_roles', roles);
    set({ roles });
  },

  removeRole: (hireId: string) => {
    const updated = get().roles.filter((r) => r.hireId !== hireId);
    localStore.set('agent_roles', updated);
    const activeRoleId = get().activeRoleId === hireId ? null : get().activeRoleId;
    set({ roles: updated, activeRoleId });
  },
}));

export type { HiredRole };
export default useAgentStore;
