/**
 * Guardian store - manages guardian/parent dashboard state.
 * Tracks session data for dependents (children, elderly users).
 * Persists to localStorage.
 */
import { create } from 'zustand';

// --- Types ---

export type DependentType = 'child' | 'elderly';

export interface WellbeingFlag {
  id: string;
  type: 'usage_spike' | 'pattern_change' | 'time_limit_reached' | 'long_gap' | 'sentiment_concern';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: number;
  acknowledged: boolean;
}

export interface DailySessionLog {
  date: string; // YYYY-MM-DD
  totalMinutes: number;
  sessionCount: number;
  topicsDiscussed: string[];
  companionName: string;
}

export interface DependentProfile {
  id: string;
  name: string;
  type: DependentType;
  companionName: string;
  dailyTimeLimitMinutes: number;
  todayUsageMinutes: number;
  totalSessions: number;
  currentStreak: number; // days
  lastSessionAt: number | null;
  sessionLogs: DailySessionLog[];
  wellbeingFlags: WellbeingFlag[];
  notificationsEnabled: boolean;
}

export interface GuardianNotification {
  id: string;
  dependentId: string;
  dependentName: string;
  message: string;
  type: 'info' | 'warning' | 'critical';
  timestamp: number;
  read: boolean;
}

interface GuardianState {
  dependents: DependentProfile[];
  notifications: GuardianNotification[];
  addDependent: (profile: DependentProfile) => void;
  removeDependent: (id: string) => void;
  updateTimeLimit: (dependentId: string, minutes: number) => void;
  recordSession: (dependentId: string, durationMinutes: number, topics: string[]) => void;
  acknowledgeFlag: (dependentId: string, flagId: string) => void;
  markNotificationRead: (notificationId: string) => void;
  getDependentById: (id: string) => DependentProfile | undefined;
  getWeeklyStats: (dependentId: string) => { totalMinutes: number; sessionCount: number; avgPerDay: number };
}

const STORAGE_KEY = 'ta_guardian_data';

function loadData(): { dependents: DependentProfile[]; notifications: GuardianNotification[] } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // Storage might be blocked
  }
  return { dependents: [], notifications: [] };
}

function saveData(dependents: DependentProfile[], notifications: GuardianNotification[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ dependents, notifications }));
  } catch {
    // Storage might be blocked
  }
}

const initial = loadData();

export const useGuardianStore = create<GuardianState>((set, get) => ({
  dependents: initial.dependents,
  notifications: initial.notifications,

  addDependent: (profile) => {
    const updated = [...get().dependents, profile];
    const notifs = get().notifications;
    saveData(updated, notifs);
    set({ dependents: updated });
  },

  removeDependent: (id) => {
    const updated = get().dependents.filter((d) => d.id !== id);
    const notifs = get().notifications.filter((n) => n.dependentId !== id);
    saveData(updated, notifs);
    set({ dependents: updated, notifications: notifs });
  },

  updateTimeLimit: (dependentId, minutes) => {
    const updated = get().dependents.map((d) =>
      d.id === dependentId ? { ...d, dailyTimeLimitMinutes: minutes } : d,
    );
    saveData(updated, get().notifications);
    set({ dependents: updated });
  },

  recordSession: (dependentId, durationMinutes, topics) => {
    const today = new Date().toISOString().slice(0, 10);
    const updated = get().dependents.map((d) => {
      if (d.id !== dependentId) return d;

      const todayLog = d.sessionLogs.find((l) => l.date === today);
      let sessionLogs: DailySessionLog[];

      if (todayLog) {
        sessionLogs = d.sessionLogs.map((l) =>
          l.date === today
            ? {
                ...l,
                totalMinutes: l.totalMinutes + durationMinutes,
                sessionCount: l.sessionCount + 1,
                topicsDiscussed: [...new Set([...l.topicsDiscussed, ...topics])],
              }
            : l,
        );
      } else {
        sessionLogs = [
          ...d.sessionLogs,
          {
            date: today,
            totalMinutes: durationMinutes,
            sessionCount: 1,
            topicsDiscussed: topics,
            companionName: d.companionName,
          },
        ].slice(-90); // Keep last 90 days
      }

      const newUsage = d.todayUsageMinutes + durationMinutes;
      const newFlags = [...d.wellbeingFlags];

      // Check for time limit approaching
      if (newUsage >= d.dailyTimeLimitMinutes && d.todayUsageMinutes < d.dailyTimeLimitMinutes) {
        newFlags.push({
          id: `flag-${Date.now()}`,
          type: 'time_limit_reached',
          severity: 'warning',
          message: `${d.name} has reached their daily time limit of ${d.dailyTimeLimitMinutes} minutes.`,
          timestamp: Date.now(),
          acknowledged: false,
        });
      }

      return {
        ...d,
        todayUsageMinutes: newUsage,
        totalSessions: d.totalSessions + 1,
        lastSessionAt: Date.now(),
        sessionLogs,
        wellbeingFlags: newFlags,
      };
    });

    saveData(updated, get().notifications);
    set({ dependents: updated });
  },

  acknowledgeFlag: (dependentId, flagId) => {
    const updated = get().dependents.map((d) =>
      d.id === dependentId
        ? {
            ...d,
            wellbeingFlags: d.wellbeingFlags.map((f) =>
              f.id === flagId ? { ...f, acknowledged: true } : f,
            ),
          }
        : d,
    );
    saveData(updated, get().notifications);
    set({ dependents: updated });
  },

  markNotificationRead: (notificationId) => {
    const updated = get().notifications.map((n) =>
      n.id === notificationId ? { ...n, read: true } : n,
    );
    saveData(get().dependents, updated);
    set({ notifications: updated });
  },

  getDependentById: (id) => {
    return get().dependents.find((d) => d.id === id);
  },

  getWeeklyStats: (dependentId) => {
    const dep = get().dependents.find((d) => d.id === dependentId);
    if (!dep) return { totalMinutes: 0, sessionCount: 0, avgPerDay: 0 };

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekStr = weekAgo.toISOString().slice(0, 10);

    const weekLogs = dep.sessionLogs.filter((l) => l.date >= weekStr);
    const totalMinutes = weekLogs.reduce((sum, l) => sum + l.totalMinutes, 0);
    const sessionCount = weekLogs.reduce((sum, l) => sum + l.sessionCount, 0);

    return {
      totalMinutes,
      sessionCount,
      avgPerDay: Math.round(totalMinutes / 7),
    };
  },
}));

export default useGuardianStore;
