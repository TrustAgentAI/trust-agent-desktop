// Agent/role state store
import { create } from 'zustand';
import type { HiredRole, RoleSession } from '../lib/roleConfig';
import { gateway, GatewayError } from '../lib/gateway';

interface AgentState {
  hiredRoles: HiredRole[];
  activeRoleId: string | null;
  activeSession: RoleSession | null;
  isLoading: boolean;
  error: string | null;

  setActiveRole: (roleId: string | null) => void;
  loadHiredRoles: () => Promise<void>;
  startSession: (roleHireId: string) => Promise<RoleSession>;
  endSession: () => void;
  clearError: () => void;
}

export const useAgentStore = create<AgentState>((set, _get) => ({
  hiredRoles: [],
  activeRoleId: null,
  activeSession: null,
  isLoading: false,
  error: null,

  setActiveRole: (roleId: string | null) => {
    set({ activeRoleId: roleId });
  },

  loadHiredRoles: async () => {
    set({ isLoading: true, error: null });
    try {
      const roles = await gateway.roles.listHired();
      set({ hiredRoles: roles, isLoading: false });
    } catch (err) {
      const message =
        err instanceof GatewayError ? err.message : 'Failed to load hired roles';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  startSession: async (roleHireId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await gateway.sessions.create(roleHireId);
      const session: RoleSession = {
        sessionId: response.sessionId,
        roleHireId: response.roleHireId,
        startedAt: Date.now(),
        messages: [],
        status: 'active',
        apiKey: response.apiKey,
      };
      set({ activeSession: session, isLoading: false });
      return session;
    } catch (err) {
      const message =
        err instanceof GatewayError ? err.message : 'Failed to start session';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  endSession: () => {
    set({ activeSession: null });
  },

  clearError: () => set({ error: null }),
}));

export default useAgentStore;
