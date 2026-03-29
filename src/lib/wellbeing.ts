/**
 * Wellbeing scoring engine.
 * Analyzes session patterns (frequency, duration, sentiment) to produce
 * a 1-5 weekly wellbeing score and triggers family alerts when the score
 * drops 2+ points.
 *
 * PRIVACY: Never includes session content in alerts - only the signal.
 */
import { localStore } from '@/lib/tauri-compat';

// --- Types ---

export interface WeeklyScore {
  /** ISO week string YYYY-Www e.g. "2026-W13" */
  weekId: string;
  /** 1 (very low) to 5 (excellent) */
  score: number;
  /** How many sessions that week */
  sessionCount: number;
  /** Total minutes that week */
  totalMinutes: number;
  /** Average session duration */
  avgDuration: number;
  /** Detected sentiment signal */
  sentimentSignal: 'positive' | 'neutral' | 'negative' | 'unknown';
}

export interface WellbeingAlert {
  id: string;
  /** The companion/role name */
  companionName: string;
  /** The user's display name */
  userName: string;
  /** Alert message for guardian */
  message: string;
  /** When the alert was generated */
  timestamp: number;
  /** Whether guardian has seen it */
  acknowledged: boolean;
  /** Score drop details */
  previousScore: number;
  currentScore: number;
}

export interface SessionRecord {
  /** ISO date string YYYY-MM-DD */
  date: string;
  /** Duration in minutes */
  durationMinutes: number;
  /** Rough sentiment from topics or keywords */
  sentiment?: 'positive' | 'neutral' | 'negative';
}

export interface WellbeingState {
  /** Rolling session records (last 90 days) */
  sessionRecords: SessionRecord[];
  /** Weekly scores (last 12 weeks) */
  weeklyScores: WeeklyScore[];
  /** Pending alerts not yet sent to guardian */
  pendingAlerts: WellbeingAlert[];
  /** All alerts ever generated */
  alertHistory: WellbeingAlert[];
}

const STORAGE_KEY = 'wellbeing_data';
const MAX_SESSION_RECORDS = 365;
const MAX_WEEKLY_SCORES = 52;

function loadState(): WellbeingState {
  const raw = localStore.get<WellbeingState>(STORAGE_KEY);
  if (raw) return raw;
  return {
    sessionRecords: [],
    weeklyScores: [],
    pendingAlerts: [],
    alertHistory: [],
  };
}

function saveState(state: WellbeingState): void {
  localStore.set(STORAGE_KEY, state);
}

/**
 * Get ISO week identifier for a date.
 */
function getWeekId(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

/**
 * Compute a wellbeing score (1-5) from a week's session data.
 *
 * Factors:
 * - Session frequency (compared to rolling average)
 * - Duration changes (sudden increases or decreases)
 * - Sentiment signals
 */
function computeWeeklyScore(
  weekRecords: SessionRecord[],
  rollingAvgSessions: number,
  rollingAvgDuration: number,
): { score: number; sentimentSignal: 'positive' | 'neutral' | 'negative' | 'unknown' } {
  if (weekRecords.length === 0) {
    // No sessions this week - could be concerning if they usually have sessions
    if (rollingAvgSessions >= 3) {
      return { score: 2, sentimentSignal: 'unknown' };
    }
    return { score: 3, sentimentSignal: 'unknown' };
  }

  let score = 3; // Start neutral

  const weekSessionCount = weekRecords.length;
  const weekTotalMinutes = weekRecords.reduce((s, r) => s + r.durationMinutes, 0);
  const weekAvgDuration = weekTotalMinutes / weekSessionCount;

  // Frequency analysis
  if (rollingAvgSessions > 0) {
    const freqRatio = weekSessionCount / rollingAvgSessions;
    if (freqRatio < 0.3) {
      // Major drop in sessions
      score -= 1;
    } else if (freqRatio > 2.5) {
      // Unusual spike - could indicate distress seeking
      score -= 0.5;
    } else if (freqRatio >= 0.7 && freqRatio <= 1.5) {
      // Consistent usage
      score += 0.5;
    }
  }

  // Duration analysis
  if (rollingAvgDuration > 0) {
    const durRatio = weekAvgDuration / rollingAvgDuration;
    if (durRatio > 3) {
      // Sessions much longer than normal
      score -= 0.5;
    } else if (durRatio < 0.3) {
      // Very short sessions - disengagement
      score -= 0.5;
    }
  }

  // Sentiment analysis
  const sentiments = weekRecords.filter((r) => r.sentiment).map((r) => r.sentiment!);
  let sentimentSignal: 'positive' | 'neutral' | 'negative' | 'unknown' = 'unknown';

  if (sentiments.length > 0) {
    const negCount = sentiments.filter((s) => s === 'negative').length;
    const posCount = sentiments.filter((s) => s === 'positive').length;
    const total = sentiments.length;

    if (negCount / total > 0.5) {
      sentimentSignal = 'negative';
      score -= 1;
    } else if (posCount / total > 0.6) {
      sentimentSignal = 'positive';
      score += 1;
    } else {
      sentimentSignal = 'neutral';
    }
  }

  // Clamp to 1-5
  score = Math.max(1, Math.min(5, Math.round(score)));

  return { score, sentimentSignal };
}

/**
 * Record a completed session and recalculate the current week's wellbeing score.
 */
export function recordWellbeingSession(
  durationMinutes: number,
  sentiment?: 'positive' | 'neutral' | 'negative',
): WellbeingState {
  const state = loadState();
  const today = new Date().toISOString().slice(0, 10);

  // Add record
  state.sessionRecords.push({
    date: today,
    durationMinutes,
    sentiment,
  });

  // Trim old records
  state.sessionRecords = state.sessionRecords.slice(-MAX_SESSION_RECORDS);

  // Recalculate current week
  const currentWeekId = getWeekId(new Date());
  const weekRecords = state.sessionRecords.filter((r) => getWeekId(new Date(r.date)) === currentWeekId);

  // Calculate rolling averages from previous 4 weeks
  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
  const recentRecords = state.sessionRecords.filter((r) => {
    const rd = new Date(r.date);
    return rd >= fourWeeksAgo && getWeekId(rd) !== currentWeekId;
  });

  // Group by week for averages
  const weekGroups: Record<string, SessionRecord[]> = {};
  for (const r of recentRecords) {
    const wid = getWeekId(new Date(r.date));
    if (!weekGroups[wid]) weekGroups[wid] = [];
    weekGroups[wid].push(r);
  }

  const weekKeys = Object.keys(weekGroups);
  const rollingAvgSessions =
    weekKeys.length > 0
      ? weekKeys.reduce((s, k) => s + weekGroups[k].length, 0) / weekKeys.length
      : 0;
  const allRecentDurations = recentRecords.map((r) => r.durationMinutes);
  const rollingAvgDuration =
    allRecentDurations.length > 0
      ? allRecentDurations.reduce((s, d) => s + d, 0) / allRecentDurations.length
      : 0;

  const { score, sentimentSignal } = computeWeeklyScore(
    weekRecords,
    rollingAvgSessions,
    rollingAvgDuration,
  );

  const weekTotalMinutes = weekRecords.reduce((s, r) => s + r.durationMinutes, 0);
  const weekAvgDuration = weekRecords.length > 0 ? weekTotalMinutes / weekRecords.length : 0;

  // Update or insert current week score
  const existingIdx = state.weeklyScores.findIndex((w) => w.weekId === currentWeekId);
  const newScore: WeeklyScore = {
    weekId: currentWeekId,
    score,
    sessionCount: weekRecords.length,
    totalMinutes: weekTotalMinutes,
    avgDuration: Math.round(weekAvgDuration),
    sentimentSignal,
  };

  if (existingIdx >= 0) {
    state.weeklyScores[existingIdx] = newScore;
  } else {
    state.weeklyScores.push(newScore);
  }

  // Trim old scores
  state.weeklyScores = state.weeklyScores.slice(-MAX_WEEKLY_SCORES);

  saveState(state);
  return state;
}

/**
 * Check if a family alert should be triggered.
 * Returns null if no alert needed, or the alert object if triggered.
 */
export function checkForFamilyAlert(
  companionName: string,
  userName: string,
): WellbeingAlert | null {
  const state = loadState();

  if (state.weeklyScores.length < 2) return null;

  // Compare current week to previous week
  const sorted = [...state.weeklyScores].sort((a, b) => a.weekId.localeCompare(b.weekId));
  const current = sorted[sorted.length - 1];
  const previous = sorted[sorted.length - 2];

  if (!current || !previous) return null;

  const drop = previous.score - current.score;

  // Alert if score dropped 2+ points
  if (drop >= 2) {
    // Check if we already generated an alert for this week
    const existingAlert = state.alertHistory.find(
      (a) =>
        a.currentScore === current.score &&
        a.previousScore === previous.score &&
        new Date(a.timestamp).toISOString().slice(0, 10) ===
          new Date().toISOString().slice(0, 10),
    );
    if (existingAlert) return null;

    const alert: WellbeingAlert = {
      id: `alert-${Date.now()}`,
      companionName,
      userName,
      message: `${companionName} has noticed ${userName} seems a little lower this week. You might want to check in.`,
      timestamp: Date.now(),
      acknowledged: false,
      previousScore: previous.score,
      currentScore: current.score,
    };

    state.pendingAlerts.push(alert);
    state.alertHistory.push(alert);
    saveState(state);

    return alert;
  }

  return null;
}

/**
 * Get the current wellbeing state for display.
 */
export function getWellbeingState(): WellbeingState {
  return loadState();
}

/**
 * Get the last N weekly scores for trend display.
 */
export function getWeeklyTrend(count: number = 5): WeeklyScore[] {
  const state = loadState();
  const sorted = [...state.weeklyScores].sort((a, b) => a.weekId.localeCompare(b.weekId));
  return sorted.slice(-count);
}

/**
 * Get the current week's score.
 */
export function getCurrentWeekScore(): WeeklyScore | null {
  const state = loadState();
  const currentWeekId = getWeekId(new Date());
  return state.weeklyScores.find((w) => w.weekId === currentWeekId) || null;
}

/**
 * Get the overall wellbeing status label.
 */
export function getWellbeingStatus(): 'stable' | 'improving' | 'declining' {
  const trend = getWeeklyTrend(3);
  if (trend.length < 2) return 'stable';

  const recent = trend[trend.length - 1].score;
  const prior = trend[trend.length - 2].score;

  if (recent > prior) return 'improving';
  if (recent < prior && prior - recent >= 2) return 'declining';
  return 'stable';
}

/**
 * Acknowledge a pending alert.
 */
export function acknowledgeAlert(alertId: string): void {
  const state = loadState();
  state.pendingAlerts = state.pendingAlerts.filter((a) => a.id !== alertId);
  state.alertHistory = state.alertHistory.map((a) =>
    a.id === alertId ? { ...a, acknowledged: true } : a,
  );
  saveState(state);
}

/**
 * Get pending (unsent/unacknowledged) alerts.
 */
export function getPendingAlerts(): WellbeingAlert[] {
  const state = loadState();
  return state.pendingAlerts;
}
