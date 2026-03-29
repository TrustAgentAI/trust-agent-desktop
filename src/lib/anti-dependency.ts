/**
 * Anti-Dependency Warning System
 *
 * Monitors session usage patterns and enforces healthy usage limits.
 * All companion roles encourage human connection over AI dependency.
 *
 * Rules:
 * - After 90 minutes in a single session: suggest a break
 * - 5+ sessions per day for 7+ consecutive days: companion raises it directly
 * - Children's roles: hard 45-minute daily limit, NO override
 * - All companion roles encourage human connection
 * - Wellbeing flag system for guardians
 */

// --- Types ---

export type WellbeingLevel = 'healthy' | 'caution' | 'warning' | 'critical';

export type BreakReason =
  | 'session_duration'    // 90+ minutes in single session
  | 'daily_limit'         // Approaching or exceeding daily limit
  | 'child_hard_limit'    // Children's hard 45-minute daily limit
  | 'high_frequency'      // 5+ sessions/day for 7+ days
  | 'late_night'          // Using after 10pm (for children)
  | 'weekend_overuse';    // Excessive weekend usage

export interface BreakSuggestion {
  reason: BreakReason;
  level: WellbeingLevel;
  message: string;
  companionMessage: string; // What the companion should say
  isHardLimit: boolean;     // If true, session MUST end
  minutesSuggested: number; // Suggested break duration in minutes
}

export interface UsagePattern {
  dailySessions: number[];     // Session counts per day (last 14 days)
  dailyMinutes: number[];      // Minutes per day (last 14 days)
  currentSessionMinutes: number;
  todayTotalMinutes: number;
  isChild: boolean;
  currentHour: number;        // 0-23
}

export interface AntiDependencyConfig {
  sessionWarningMinutes: number;       // Default: 90
  childDailyLimitMinutes: number;      // Default: 45 (HARD, no override)
  adultDailyLimitMinutes: number;      // Default: 240 (soft)
  highFrequencyThreshold: number;      // Default: 5 sessions/day
  highFrequencyDaysThreshold: number;  // Default: 7 consecutive days
  childCurfewHour: number;             // Default: 21 (9pm)
  breakDurationMinutes: number;        // Default: 15
}

// --- Constants ---

const DEFAULT_CONFIG: AntiDependencyConfig = {
  sessionWarningMinutes: 90,
  childDailyLimitMinutes: 45,
  adultDailyLimitMinutes: 240,
  highFrequencyThreshold: 5,
  highFrequencyDaysThreshold: 7,
  childCurfewHour: 21,
  breakDurationMinutes: 15,
};

const CHILD_LIMIT_MINUTES = 45; // HARD limit - cannot be changed

// --- Storage ---

const STORAGE_KEY = 'ta_usage_tracking';

interface UsageRecord {
  date: string;         // YYYY-MM-DD
  sessionCount: number;
  totalMinutes: number;
}

function loadUsageHistory(): UsageRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // Storage might be blocked
  }
  return [];
}

function saveUsageHistory(records: UsageRecord[]): void {
  try {
    // Keep last 30 days only
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    const trimmed = records.filter((r) => r.date >= cutoffStr);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // Storage might be blocked
  }
}

// --- Core Functions ---

/**
 * Record that a session occurred today.
 */
export function recordSessionUsage(durationMinutes: number): void {
  const today = new Date().toISOString().slice(0, 10);
  const history = loadUsageHistory();
  const todayRecord = history.find((r) => r.date === today);

  if (todayRecord) {
    todayRecord.sessionCount += 1;
    todayRecord.totalMinutes += durationMinutes;
  } else {
    history.push({ date: today, sessionCount: 1, totalMinutes: durationMinutes });
  }

  saveUsageHistory(history);
}

/**
 * Get today's usage stats.
 */
export function getTodayUsage(): { sessionCount: number; totalMinutes: number } {
  const today = new Date().toISOString().slice(0, 10);
  const history = loadUsageHistory();
  const todayRecord = history.find((r) => r.date === today);
  return todayRecord
    ? { sessionCount: todayRecord.sessionCount, totalMinutes: todayRecord.totalMinutes }
    : { sessionCount: 0, totalMinutes: 0 };
}

/**
 * Check if the user has had high-frequency usage (5+ sessions/day for 7+ consecutive days).
 */
export function checkHighFrequencyUsage(config: AntiDependencyConfig = DEFAULT_CONFIG): boolean {
  const history = loadUsageHistory();
  if (history.length < config.highFrequencyDaysThreshold) return false;

  // Sort by date descending
  const sorted = [...history].sort((a, b) => b.date.localeCompare(a.date));
  let consecutiveDays = 0;

  for (const record of sorted) {
    if (record.sessionCount >= config.highFrequencyThreshold) {
      consecutiveDays++;
    } else {
      break;
    }
  }

  return consecutiveDays >= config.highFrequencyDaysThreshold;
}

/**
 * Evaluate the current session and return any break suggestions.
 * Returns an empty array if no action needed.
 */
export function evaluateSession(
  currentSessionMinutes: number,
  isChild: boolean,
  config: AntiDependencyConfig = DEFAULT_CONFIG,
): BreakSuggestion[] {
  const suggestions: BreakSuggestion[] = [];
  const todayUsage = getTodayUsage();
  const currentHour = new Date().getHours();
  const todayTotalMinutes = todayUsage.totalMinutes + currentSessionMinutes;

  // 1. Child hard limit - 45 minutes daily, NO override
  if (isChild && todayTotalMinutes >= CHILD_LIMIT_MINUTES) {
    suggestions.push({
      reason: 'child_hard_limit',
      level: 'critical',
      message: `Daily session limit reached (${CHILD_LIMIT_MINUTES} minutes). This session must end.`,
      companionMessage:
        'You have done brilliantly today! Your daily session time is up. ' +
        'Now is a great time to go and practise what we covered, or spend time with friends and family. ' +
        'I will be here again tomorrow!',
      isHardLimit: true,
      minutesSuggested: 0,
    });
    return suggestions; // Hard limit takes priority over everything else
  }

  // 2. Child curfew
  if (isChild && currentHour >= config.childCurfewHour) {
    suggestions.push({
      reason: 'late_night',
      level: 'critical',
      message: `It is past ${config.childCurfewHour}:00. Sessions are not available after this time.`,
      companionMessage:
        'It is getting late! Time to wind down. ' +
        'Good rest is just as important as learning. See you tomorrow!',
      isHardLimit: true,
      minutesSuggested: 0,
    });
  }

  // 3. Session duration warning (90 minutes)
  if (currentSessionMinutes >= config.sessionWarningMinutes) {
    suggestions.push({
      reason: 'session_duration',
      level: 'caution',
      message: `You have been in this session for ${currentSessionMinutes} minutes. Consider taking a break.`,
      companionMessage:
        'We have been at this for a while. Taking a break actually helps your brain consolidate what you have learned. ' +
        'Step away for 15 minutes - stretch, get some water, maybe talk to someone. ' +
        'Real progress comes from applying what you learn, not just studying more.',
      isHardLimit: false,
      minutesSuggested: config.breakDurationMinutes,
    });
  }

  // 4. Approaching daily limit (non-child)
  if (!isChild && todayTotalMinutes >= config.adultDailyLimitMinutes) {
    suggestions.push({
      reason: 'daily_limit',
      level: 'warning',
      message: `You have used Trust Agent for ${todayTotalMinutes} minutes today. That is above the recommended daily usage.`,
      companionMessage:
        'You have spent a lot of time with me today. ' +
        'I want to make sure I am helping you, not becoming a crutch. ' +
        'The best learning and growth happens when you apply things in the real world. ' +
        'Try putting some of what we discussed into practice.',
      isHardLimit: false,
      minutesSuggested: 30,
    });
  }

  // 5. High frequency usage pattern
  if (checkHighFrequencyUsage(config)) {
    suggestions.push({
      reason: 'high_frequency',
      level: 'warning',
      message: 'You have had 5 or more sessions per day for over a week. This pattern suggests over-reliance.',
      companionMessage:
        'I have noticed you have been using me very frequently lately. ' +
        'I want to be honest with you - part of my job is to make sure you do not become dependent on me. ' +
        'Try going a day without a session. Reach out to a friend, a colleague, or a family member instead. ' +
        'Human connections are irreplaceable.',
      isHardLimit: false,
      minutesSuggested: 60,
    });
  }

  return suggestions;
}

/**
 * Get the overall wellbeing level for display purposes.
 */
export function getWellbeingLevel(
  currentSessionMinutes: number,
  isChild: boolean,
  config: AntiDependencyConfig = DEFAULT_CONFIG,
): WellbeingLevel {
  const suggestions = evaluateSession(currentSessionMinutes, isChild, config);

  if (suggestions.some((s) => s.level === 'critical')) return 'critical';
  if (suggestions.some((s) => s.level === 'warning')) return 'warning';
  if (suggestions.some((s) => s.level === 'caution')) return 'caution';
  return 'healthy';
}

/**
 * Get companion break messages that can be injected into the chat.
 * The companion should say these, not the system.
 */
export function getCompanionBreakMessages(
  currentSessionMinutes: number,
  isChild: boolean,
): string[] {
  const suggestions = evaluateSession(currentSessionMinutes, isChild);
  return suggestions.map((s) => s.companionMessage);
}

/**
 * Check if the session should be forcefully ended.
 * Only returns true for children hitting their hard limit or curfew.
 */
export function shouldForceEndSession(
  currentSessionMinutes: number,
  isChild: boolean,
): boolean {
  const suggestions = evaluateSession(currentSessionMinutes, isChild);
  return suggestions.some((s) => s.isHardLimit);
}

/**
 * Get encouraging "human connection" prompts.
 * Used at session end to redirect users to real-world activities.
 */
export function getHumanConnectionPrompt(): string {
  const prompts = [
    'Before your next session, try sharing what you learned with someone you trust.',
    'Consider calling a friend or family member today. Real conversations are irreplaceable.',
    'Take what we discussed and try applying it in a real situation before coming back.',
    'The best learning happens between sessions. Go practise in the real world.',
    'Remember, I am a tool to help you, not a replacement for human connection.',
    'Before opening another session, ask yourself: is there a person who could help me with this?',
    'Growth happens when you step away from the screen. Enjoy the world around you.',
  ];
  return prompts[Math.floor(Math.random() * prompts.length)];
}

export { DEFAULT_CONFIG as ANTI_DEPENDENCY_DEFAULTS };
export type { UsageRecord };
