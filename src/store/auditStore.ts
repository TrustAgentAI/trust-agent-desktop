import { create } from 'zustand';

type AuditAction = 'READ' | 'WRITE' | 'API_CALL' | 'TOOL_USE' | 'MESSAGE' | 'ERROR';

interface AuditEvent {
  id: string;
  hireId: string;
  action: AuditAction;
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

interface AuditStore {
  events: AuditEvent[];
  addEvent: (event: AuditEvent) => void;
  clearEvents: () => void;
  getEventsForRole: (hireId: string) => AuditEvent[];
}

function createMockEvents(): AuditEvent[] {
  const now = new Date().toISOString();
  return [
    {
      id: `audit_${Date.now()}_1`,
      hireId: 'system',
      action: 'MESSAGE',
      description: 'User session initialised',
      timestamp: now,
    },
    {
      id: `audit_${Date.now()}_2`,
      hireId: 'system',
      action: 'READ',
      description: 'Role configuration loaded from Trust Agent gateway',
      timestamp: now,
    },
    {
      id: `audit_${Date.now()}_3`,
      hireId: 'system',
      action: 'MESSAGE',
      description: 'Agent ready - browser preview mode active',
      timestamp: now,
    },
  ];
}

export const useAuditStore = create<AuditStore>((set, get) => ({
  events: createMockEvents(),

  addEvent: (event: AuditEvent) => {
    set((state) => {
      const updated = [event, ...state.events];
      if (updated.length > 500) {
        updated.length = 500;
      }
      return { events: updated };
    });
  },

  clearEvents: () => {
    set({ events: [] });
  },

  getEventsForRole: (hireId: string) => {
    return get().events.filter((e) => e.hireId === hireId || e.hireId === 'system');
  },
}));

export type { AuditEvent, AuditAction };
export default useAuditStore;
