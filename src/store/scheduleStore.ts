/**
 * Schedule Store - manages weekly session schedule
 *
 * Persists schedule to localStorage via localStore (Brain storage).
 * Tracks time slots, notification preferences, and calendar sync state.
 */
import { create } from 'zustand';
import { localStore } from '@/lib/tauri-compat';
import {
  type TimeSlot,
  type WeeklySchedule,
  type DayOfWeek,
  type SessionHistory,
  type ScheduleSuggestion,
  createTimeSlot,
  getNextSession as findNextSession,
  getMissedSessions,
  getSuggestedSchedule,
  getSessionNotification,
} from '@/lib/session-scheduler';

interface ScheduleState {
  /** The weekly schedule with all time slots */
  schedule: WeeklySchedule;
  /** Whether push notifications are enabled */
  notifications: boolean;
  /** Whether calendar sync has been performed */
  calendarSynced: boolean;
  /** Session history for smart suggestions */
  sessionHistory: SessionHistory[];
  /** Default session duration in minutes */
  defaultDuration: number;

  /** Add a time slot to the schedule */
  setSlot: (
    day: DayOfWeek,
    hour: number,
    minute: number,
    roleId: string,
    roleName: string,
    duration?: number
  ) => void;

  /** Remove a time slot from the schedule */
  removeSlot: (slotId: string) => void;

  /** Remove all slots for a given day */
  clearDay: (day: DayOfWeek) => void;

  /** Get the next upcoming session */
  getNextSession: () => { slot: TimeSlot; date: Date } | null;

  /** Get all slots for a specific day */
  getSlotsForDay: (day: DayOfWeek) => TimeSlot[];

  /** Get all slots for a specific role */
  getSlotsForRole: (roleId: string) => TimeSlot[];

  /** Get missed sessions from the last 24h */
  getMissedSessions: () => TimeSlot[];

  /** Get smart schedule suggestions based on history */
  getSuggestedSchedule: () => ScheduleSuggestion[];

  /** Get notification message if a session is upcoming/missed */
  getNotification: () => ReturnType<typeof getSessionNotification>;

  /** Record a completed session for history */
  recordSession: (roleId: string, startedAt: string, endedAt: string) => void;

  /** Toggle notification preference */
  setNotifications: (enabled: boolean) => void;

  /** Mark calendar as synced */
  setCalendarSynced: (synced: boolean) => void;

  /** Update default session duration */
  setDefaultDuration: (minutes: number) => void;

  /** Check if a specific slot exists (day + hour + minute) */
  hasSlot: (day: DayOfWeek, hour: number, minute: number) => boolean;

  /** Toggle a slot on/off for a specific time */
  toggleSlot: (
    day: DayOfWeek,
    hour: number,
    minute: number,
    roleId: string,
    roleName: string,
    duration?: number
  ) => void;
}

const SCHEDULE_KEY = 'session_schedule';
const HISTORY_KEY = 'session_history';
const PREFS_KEY = 'schedule_prefs';

interface SchedulePrefs {
  notifications: boolean;
  calendarSynced: boolean;
  defaultDuration: number;
}

function loadSchedule(): WeeklySchedule {
  return (
    localStore.get<WeeklySchedule>(SCHEDULE_KEY) || {
      slots: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  );
}

function saveSchedule(schedule: WeeklySchedule): void {
  localStore.set(SCHEDULE_KEY, schedule);
}

function loadHistory(): SessionHistory[] {
  return localStore.get<SessionHistory[]>(HISTORY_KEY) || [];
}

function saveHistory(history: SessionHistory[]): void {
  // Keep last 200 sessions
  const trimmed = history.slice(-200);
  localStore.set(HISTORY_KEY, trimmed);
}

function loadPrefs(): SchedulePrefs {
  return (
    localStore.get<SchedulePrefs>(PREFS_KEY) || {
      notifications: true,
      calendarSynced: false,
      defaultDuration: 45,
    }
  );
}

function savePrefs(prefs: SchedulePrefs): void {
  localStore.set(PREFS_KEY, prefs);
}

export const useScheduleStore = create<ScheduleState>((set, get) => {
  const prefs = loadPrefs();

  return {
    schedule: loadSchedule(),
    notifications: prefs.notifications,
    calendarSynced: prefs.calendarSynced,
    sessionHistory: loadHistory(),
    defaultDuration: prefs.defaultDuration,

    setSlot: (day, hour, minute, roleId, roleName, duration) => {
      const schedule = get().schedule;
      const dur = duration || get().defaultDuration;
      const newSlot = createTimeSlot(day, hour, minute, dur, roleId, roleName);
      const updated: WeeklySchedule = {
        ...schedule,
        slots: [...schedule.slots, newSlot],
        updatedAt: new Date().toISOString(),
      };
      saveSchedule(updated);
      set({ schedule: updated });
    },

    removeSlot: (slotId) => {
      const schedule = get().schedule;
      const updated: WeeklySchedule = {
        ...schedule,
        slots: schedule.slots.filter((s) => s.id !== slotId),
        updatedAt: new Date().toISOString(),
      };
      saveSchedule(updated);
      set({ schedule: updated });
    },

    clearDay: (day) => {
      const schedule = get().schedule;
      const updated: WeeklySchedule = {
        ...schedule,
        slots: schedule.slots.filter((s) => s.day !== day),
        updatedAt: new Date().toISOString(),
      };
      saveSchedule(updated);
      set({ schedule: updated });
    },

    getNextSession: () => {
      return findNextSession(get().schedule.slots);
    },

    getSlotsForDay: (day) => {
      return get()
        .schedule.slots.filter((s) => s.day === day)
        .sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute));
    },

    getSlotsForRole: (roleId) => {
      return get().schedule.slots.filter((s) => s.roleId === roleId);
    },

    getMissedSessions: () => {
      return getMissedSessions(get().schedule.slots);
    },

    getSuggestedSchedule: () => {
      return getSuggestedSchedule(get().sessionHistory, get().schedule.slots);
    },

    getNotification: () => {
      if (!get().notifications) return null;
      return getSessionNotification(get().schedule.slots);
    },

    recordSession: (roleId, startedAt, endedAt) => {
      const start = new Date(startedAt);
      const dayIndex = (start.getDay() + 6) % 7;
      const days: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

      const entry: SessionHistory = {
        roleId,
        startedAt,
        endedAt,
        dayOfWeek: days[dayIndex],
        hour: start.getHours(),
      };

      const history = [...get().sessionHistory, entry];
      saveHistory(history);
      set({ sessionHistory: history });
    },

    setNotifications: (enabled) => {
      const prefs = loadPrefs();
      prefs.notifications = enabled;
      savePrefs(prefs);
      set({ notifications: enabled });
    },

    setCalendarSynced: (synced) => {
      const prefs = loadPrefs();
      prefs.calendarSynced = synced;
      savePrefs(prefs);
      set({ calendarSynced: synced });
    },

    setDefaultDuration: (minutes) => {
      const prefs = loadPrefs();
      prefs.defaultDuration = minutes;
      savePrefs(prefs);
      set({ defaultDuration: minutes });
    },

    hasSlot: (day, hour, minute) => {
      return get().schedule.slots.some(
        (s) => s.day === day && s.hour === hour && s.minute === minute
      );
    },

    toggleSlot: (day, hour, minute, roleId, roleName, duration) => {
      const existing = get().schedule.slots.find(
        (s) => s.day === day && s.hour === hour && s.minute === minute
      );
      if (existing) {
        get().removeSlot(existing.id);
      } else {
        get().setSlot(day, hour, minute, roleId, roleName, duration);
      }
    },
  };
});

export default useScheduleStore;
