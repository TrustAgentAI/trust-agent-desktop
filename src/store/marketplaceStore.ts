// Marketplace browsing state store
import { create } from 'zustand';
import type { MarketplaceAgent, MarketplaceSkill, HiredRole } from '../lib/roleConfig';
import { gateway, GatewayError } from '../lib/gateway';

type MarketplaceTab = 'agents' | 'roles' | 'skills';

interface MarketplaceState {
  agents: MarketplaceAgent[];
  roles: HiredRole[];
  skills: MarketplaceSkill[];
  searchQuery: string;
  activeTab: MarketplaceTab;
  isLoading: boolean;
  error: string | null;

  fetchAgents: () => Promise<void>;
  fetchRoles: () => Promise<void>;
  fetchSkills: () => Promise<void>;
  search: (query: string) => void;
  setActiveTab: (tab: MarketplaceTab) => void;
  clearError: () => void;
}

export const useMarketplaceStore = create<MarketplaceState>((set, _get) => ({
  agents: [],
  roles: [],
  skills: [],
  searchQuery: '',
  activeTab: 'agents',
  isLoading: false,
  error: null,

  fetchAgents: async () => {
    set({ isLoading: true, error: null });
    try {
      const agents = await gateway.agents.list();
      set({ agents, isLoading: false });
    } catch (err) {
      const message =
        err instanceof GatewayError ? err.message : 'Failed to fetch agents';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  fetchRoles: async () => {
    set({ isLoading: true, error: null });
    try {
      const roles = await gateway.roles.listHired();
      set({ roles, isLoading: false });
    } catch (err) {
      const message =
        err instanceof GatewayError ? err.message : 'Failed to fetch roles';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  fetchSkills: async () => {
    set({ isLoading: true, error: null });
    try {
      const skills = await gateway.skills.list();
      set({ skills, isLoading: false });
    } catch (err) {
      const message =
        err instanceof GatewayError ? err.message : 'Failed to fetch skills';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  search: (query: string) => {
    set({ searchQuery: query });
  },

  setActiveTab: (tab: MarketplaceTab) => {
    set({ activeTab: tab });
  },

  clearError: () => set({ error: null }),
}));

export default useMarketplaceStore;
