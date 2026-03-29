/**
 * Streaks & Milestones store - tracks consecutive-day streaks,
 * per-role session counts, per-role total minutes, and milestone achievements.
 * Persists to localStorage via localStore.
 */
import { create } from 'zustand';
import { localStore } from '@/lib/tauri-compat';

// --- Types ---

export interface Milestone {
  id: string;
  type: 'session' | 'streak' | 'time';
  label: string;
  roleId?: string;
  roleName?: string;
  achievedAt: number;
}

export interface StreaksState {
  /** Consecutive days with at least 1 session */
  currentStreak: number;
  /** Highest streak ever achieved */
  longestStreak: number;
  /** Date string (YYYY-MM-DD) of the last recorded session day */
  lastSessionDate: string | null;
  /** Total sessions per role (keyed by roleId) */
  totalSessions: Record<string, number>;
  /** Total minutes per role (keyed by roleId) */
  totalMinutes: Record<string, number>;
  /** Role display names (keyed by roleId) */
  roleNames: Record<string, string>;
  /** Milestones that have been reached */
  milestonesReached: Milestone[];
  /** Milestone IDs the user has dismissed from the "new" banner */
  dismissedMilestones: Set<string>;
  /** Newly earned milestones that haven't been shown yet */
  pendingCelebrations: Milestone[];

  // --- Actions ---
  recordSession: (roleId: string, roleName: string, durationMinutes: number) => void;
  dismissCelebration: (milestoneId: string) => void;
  getTotalSessionsForRole: (roleId: string) => number;
  getTotalMinutesForRole: (roleId: string) => number;
  getTotalHoursForRole: (roleId: string) => number;
}

const STORAGE_KEY = 'streaks_data';

interface PersistedData {
  currentStreak: number;
  longestStreak: number;
  lastSessionDate: string | null;
  totalSessions: Record<string, number>;
  totalMinutes: Record<string, number>;
  roleNames: Record<string, string>;
  milestonesReached: Milestone[];
  dismissedMilestones: string[];
}

function loadData(): PersistedData {
  const raw = localStore.get<PersistedData>(STORAGE_KEY);
  if (raw) return raw;
  return {
    currentStreak: 0,
    longestStreak: 0,
    lastSessionDate: null,
    totalSessions: {},
    totalMinutes: {},
    roleNames: {},
    milestonesReached: [],
    dismissedMilestones: [],
  };
}

function saveData(state: PersistedData) {
  localStore.set(STORAGE_KEY, state);
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

/** All milestone definitions - checked after each session */
function checkMilestones(
  roleId: string,
  roleName: string,
  sessionCount: number,
  minuteCount: number,
  currentStreak: number,
  existing: Milestone[],
): Milestone[] {
  const newMilestones: Milestone[] = [];
  const existingIds = new Set(existing.map((m) => m.id));

  const sessionMilestones: { threshold: number; label: string }[] = [
    { threshold: 10, label: `Getting started with ${roleName}` },
    { threshold: 50, label: `${roleName} knows you well` },
    { threshold: 100, label: `Century with ${roleName}` },
    { threshold: 500, label: 'Expert relationship' },
  ];

  for (const sm of sessionMilestones) {
    const id = `session_${roleId}_${sm.threshold}`;
    if (sessionCount >= sm.threshold && !existingIds.has(id)) {
      newMilestones.push({
        id,
        type: 'session',
        label: sm.label,
        roleId,
        roleName,
        achievedAt: Date.now(),
      });
    }
  }

  const streakMilestones: { threshold: number; label: string }[] = [
    { threshold: 7, label: 'Week warrior' },
    { threshold: 30, label: 'Monthly commitment' },
    { threshold: 100, label: 'Dedicated learner' },
  ];

  for (const sk of streakMilestones) {
    const id = `streak_${sk.threshold}`;
    if (currentStreak >= sk.threshold && !existingIds.has(id)) {
      newMilestones.push({
        id,
        type: 'streak',
        label: sk.label,
        achievedAt: Date.now(),
      });
    }
  }

  const hoursMilestones: { hours: number; label: string }[] = [
    { hours: 10, label: 'Deep diver' },
    { hours: 100, label: 'True companion' },
  ];

  const totalHours = minuteCount / 60;
  for (const hm of hoursMilestones) {
    const id = `hours_${roleId}_${hm.hours}`;
    if (totalHours >= hm.hours && !existingIds.has(id)) {
      newMilestones.push({
        id,
        type: 'time',
        label: hm.label,
        roleId,
        roleName,
        achievedAt: Date.now(),
      });
    }
  }

  return newMilestones;
}

const initial = loadData();

export const useStreaksStore = create<StreaksState>((set, get) => ({
  currentStreak: initial.currentStreak,
  longestStreak: initial.longestStreak,
  lastSessionDate: initial.lastSessionDate,
  totalSessions: initial.totalSessions,
  totalMinutes: initial.totalMinutes,
  roleNames: initial.roleNames,
  milestonesReached: initial.milestonesReached,
  dismissedMilestones: new Set(initial.dismissedMilestones),
  pendingCelebrations: [],

  recordSession: (roleId: string, roleName: string, durationMinutes: number) => {
    const state = get();
    const today = todayStr();
    const yesterday = yesterdayStr();

    // Update streak
    let newStreak = state.currentStreak;
    if (state.lastSessionDate === today) {
      // Already recorded today, streak unchanged
    } else if (state.lastSessionDate === yesterday) {
      // Consecutive day
      newStreak = state.currentStreak + 1;
    } else {
      // Streak broken or first session
      newStreak = 1;
    }
    const newLongest = Math.max(state.longestStreak, newStreak);

    // Update per-role counts
    const newSessions = { ...state.totalSessions };
    newSessions[roleId] = (newSessions[roleId] || 0) + 1;

    const newMinutes = { ...state.totalMinutes };
    newMinutes[roleId] = (newMinutes[roleId] || 0) + durationMinutes;

    const newRoleNames = { ...state.roleNames, [roleId]: roleName };

    // Check for new milestones
    const allExisting = state.milestonesReached;
    const newMilestones = checkMilestones(
      roleId,
      roleName,
      newSessions[roleId],
      newMinutes[roleId],
      newStreak,
      allExisting,
    );

    const updatedMilestones = [...allExisting, ...newMilestones];

    // Persist
    const persisted: PersistedData = {
      currentStreak: newStreak,
      longestStreak: newLongest,
      lastSessionDate: today,
      totalSessions: newSessions,
      totalMinutes: newMinutes,
      roleNames: newRoleNames,
      milestonesReached: updatedMilestones,
      dismissedMilestones: Array.from(state.dismissedMilestones),
    };
    saveData(persisted);

    set({
      currentStreak: newStreak,
      longestStreak: newLongest,
      lastSessionDate: today,
      totalSessions: newSessions,
      totalMinutes: newMinutes,
      roleNames: newRoleNames,
      milestonesReached: updatedMilestones,
      pendingCelebrations: [...state.pendingCelebrations, ...newMilestones],
    });
  },

  dismissCelebration: (milestoneId: string) => {
    const state = get();
    const newDismissed = new Set(state.dismissedMilestones);
    newDismissed.add(milestoneId);
    const newPending = state.pendingCelebrations.filter((m) => m.id !== milestoneId);

    // Persist dismissed set
    const persisted: PersistedData = {
      currentStreak: state.currentStreak,
      longestStreak: state.longestStreak,
      lastSessionDate: state.lastSessionDate,
      totalSessions: state.totalSessions,
      totalMinutes: state.totalMinutes,
      roleNames: state.roleNames,
      milestonesReached: state.milestonesReached,
      dismissedMilestones: Array.from(newDismissed),
    };
    saveData(persisted);

    set({
      dismissedMilestones: newDismissed,
      pendingCelebrations: newPending,
    });
  },

  getTotalSessionsForRole: (roleId: string) => {
    return get().totalSessions[roleId] || 0;
  },

  getTotalMinutesForRole: (roleId: string) => {
    return get().totalMinutes[roleId] || 0;
  },

  getTotalHoursForRole: (roleId: string) => {
    return Math.round(((get().totalMinutes[roleId] || 0) / 60) * 10) / 10;
  },
}));

export default useStreaksStore;
