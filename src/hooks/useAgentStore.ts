import { create } from 'zustand';
import type { AgentRole, ChatMessage, AgentTask, FolderPermission, AuditLogEntry, NavItem } from '@/types';

interface AgentStore {
  // Agent state
  hiredRoles: AgentRole[];
  activeAgentId: string | null;
  setActiveAgent: (id: string) => void;
  setHiredRoles: (roles: AgentRole[]) => void;
  updateAgentStatus: (id: string, status: AgentRole['status']) => void;

  // Chat state
  messages: ChatMessage[];
  isTyping: boolean;
  addMessage: (message: ChatMessage) => void;
  setMessages: (messages: ChatMessage[]) => void;
  setIsTyping: (typing: boolean) => void;

  // Task state
  activeTasks: AgentTask[];
  addTask: (task: AgentTask) => void;
  updateTask: (id: string, updates: Partial<AgentTask>) => void;

  // Permissions
  permissions: FolderPermission[];
  setPermissions: (perms: FolderPermission[]) => void;
  addPermission: (perm: FolderPermission) => void;
  removePermission: (id: string) => void;

  // Audit
  auditLog: AuditLogEntry[];
  addAuditEntry: (entry: AuditLogEntry) => void;

  // Navigation
  activeNav: NavItem;
  setActiveNav: (nav: NavItem) => void;

  // Right panel
  rightPanelOpen: boolean;
  toggleRightPanel: () => void;
}

export const useAgentStore = create<AgentStore>((set) => ({
  hiredRoles: [],
  activeAgentId: null,
  setActiveAgent: (id) => set({ activeAgentId: id }),
  setHiredRoles: (roles) => set({ hiredRoles: roles }),
  updateAgentStatus: (id, status) =>
    set((state) => ({
      hiredRoles: state.hiredRoles.map((r) =>
        r.id === id ? { ...r, status } : r
      ),
    })),

  messages: [],
  isTyping: false,
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  setMessages: (messages) => set({ messages }),
  setIsTyping: (typing) => set({ isTyping: typing }),

  activeTasks: [],
  addTask: (task) =>
    set((state) => ({ activeTasks: [...state.activeTasks, task] })),
  updateTask: (id, updates) =>
    set((state) => ({
      activeTasks: state.activeTasks.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      ),
    })),

  permissions: [],
  setPermissions: (perms) => set({ permissions: perms }),
  addPermission: (perm) =>
    set((state) => ({ permissions: [...state.permissions, perm] })),
  removePermission: (id) =>
    set((state) => ({
      permissions: state.permissions.filter((p) => p.id !== id),
    })),

  auditLog: [],
  addAuditEntry: (entry) =>
    set((state) => ({ auditLog: [entry, ...state.auditLog].slice(0, 200) })),

  activeNav: 'chat',
  setActiveNav: (nav) => set({ activeNav: nav }),

  rightPanelOpen: true,
  toggleRightPanel: () =>
    set((state) => ({ rightPanelOpen: !state.rightPanelOpen })),
}));
