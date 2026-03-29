/**
 * Session Scheduler - Calendar sync and scheduling utilities
 *
 * Handles:
 * - Weekly schedule grid management
 * - .ics file generation for calendar export
 * - Google Calendar URL generation
 * - Recurring event RRULE generation
 * - Smart schedule suggestions based on past behaviour
 * - Notification timing calculations
 */

export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export const DAYS_OF_WEEK: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export const DAY_LABELS: Record<DayOfWeek, string> = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
};

export const DAY_SHORT_LABELS: Record<DayOfWeek, string> = {
  mon: 'Mon',
  tue: 'Tue',
  wed: 'Wed',
  thu: 'Thu',
  fri: 'Fri',
  sat: 'Sat',
  sun: 'Sun',
};

/** RRULE day abbreviations */
const RRULE_DAYS: Record<DayOfWeek, string> = {
  mon: 'MO',
  tue: 'TU',
  wed: 'WE',
  thu: 'TH',
  fri: 'FR',
  sat: 'SA',
  sun: 'SU',
};

export interface TimeSlot {
  id: string;
  day: DayOfWeek;
  /** Hour in 24h format (0-23) */
  hour: number;
  /** Minute (0 or 30) */
  minute: number;
  /** Duration in minutes */
  duration: number;
  roleId: string;
  roleName: string;
}

export interface WeeklySchedule {
  slots: TimeSlot[];
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleSuggestion {
  day: DayOfWeek;
  hour: number;
  minute: number;
  reason: string;
  confidence: number; // 0-1
}

export interface SessionHistory {
  roleId: string;
  startedAt: string;
  endedAt: string;
  dayOfWeek: DayOfWeek;
  hour: number;
}

/**
 * Create a new time slot.
 */
export function createTimeSlot(
  day: DayOfWeek,
  hour: number,
  minute: number,
  duration: number,
  roleId: string,
  roleName: string
): TimeSlot {
  return {
    id: `slot_${day}_${hour}_${minute}_${Date.now().toString(36)}`,
    day,
    hour,
    minute,
    duration,
    roleId,
    roleName,
  };
}

/**
 * Format a time slot as a human-readable string.
 */
export function formatTimeSlot(slot: TimeSlot): string {
  const h = slot.hour % 12 || 12;
  const ampm = slot.hour < 12 ? 'AM' : 'PM';
  const m = String(slot.minute).padStart(2, '0');
  return `${DAY_SHORT_LABELS[slot.day]} ${h}:${m} ${ampm}`;
}

/**
 * Format hour and minute as HH:MM AM/PM
 */
export function formatTime(hour: number, minute: number): string {
  const h = hour % 12 || 12;
  const ampm = hour < 12 ? 'AM' : 'PM';
  const m = String(minute).padStart(2, '0');
  return `${h}:${m} ${ampm}`;
}

/**
 * Get the next occurrence of a time slot from the current time.
 */
export function getNextOccurrence(slot: TimeSlot): Date {
  const now = new Date();
  const dayIndex = DAYS_OF_WEEK.indexOf(slot.day);
  const currentDayIndex = (now.getDay() + 6) % 7; // JS Sunday=0, we want Monday=0

  let daysUntil = dayIndex - currentDayIndex;
  if (daysUntil < 0) daysUntil += 7;
  if (daysUntil === 0) {
    // Same day - check if time has passed
    const slotMinutes = slot.hour * 60 + slot.minute;
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    if (nowMinutes >= slotMinutes) {
      daysUntil = 7; // Next week
    }
  }

  const next = new Date(now);
  next.setDate(next.getDate() + daysUntil);
  next.setHours(slot.hour, slot.minute, 0, 0);
  return next;
}

/**
 * Get the soonest upcoming session across all slots.
 */
export function getNextSession(slots: TimeSlot[]): { slot: TimeSlot; date: Date } | null {
  if (slots.length === 0) return null;

  let nearest: { slot: TimeSlot; date: Date } | null = null;

  for (const slot of slots) {
    const nextDate = getNextOccurrence(slot);
    if (!nearest || nextDate.getTime() < nearest.date.getTime()) {
      nearest = { slot, date: nextDate };
    }
  }

  return nearest;
}

/**
 * Check if a session was missed (scheduled time has passed within the last 24h).
 */
export function getMissedSessions(slots: TimeSlot[]): TimeSlot[] {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const missed: TimeSlot[] = [];

  for (const slot of slots) {
    // Check if yesterday's or today's occurrence was missed
    const dayIndex = DAYS_OF_WEEK.indexOf(slot.day);
    const currentDayIndex = (now.getDay() + 6) % 7;

    // Check yesterday
    const yesterdayIndex = (currentDayIndex + 6) % 7;
    if (dayIndex === yesterdayIndex) {
      const scheduledTime = new Date(now);
      scheduledTime.setDate(scheduledTime.getDate() - 1);
      scheduledTime.setHours(slot.hour, slot.minute, 0, 0);
      if (scheduledTime >= oneDayAgo && scheduledTime < now) {
        missed.push(slot);
      }
    }
  }

  return missed;
}

/**
 * Suggest optimal schedule based on session history.
 * Analyses when the user has historically had sessions and suggests
 * time slots that match their natural patterns.
 */
export function getSuggestedSchedule(
  history: SessionHistory[],
  existingSlots: TimeSlot[]
): ScheduleSuggestion[] {
  if (history.length < 3) {
    // Not enough data - suggest default optimal times
    return [
      { day: 'mon', hour: 9, minute: 0, reason: 'Morning focus time', confidence: 0.5 },
      { day: 'wed', hour: 16, minute: 0, reason: 'Mid-week afternoon', confidence: 0.5 },
      { day: 'fri', hour: 10, minute: 0, reason: 'End-of-week review', confidence: 0.5 },
    ];
  }

  // Count frequency of each day/hour combination
  const frequency: Record<string, number> = {};
  for (const session of history) {
    const key = `${session.dayOfWeek}_${session.hour}`;
    frequency[key] = (frequency[key] || 0) + 1;
  }

  // Sort by frequency and pick top slots, excluding already scheduled ones
  const existingKeys = new Set(existingSlots.map((s) => `${s.day}_${s.hour}`));

  const suggestions = Object.entries(frequency)
    .filter(([key]) => !existingKeys.has(key))
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([key, count]) => {
      const [day, hourStr] = key.split('_');
      const hour = parseInt(hourStr, 10);
      const confidence = Math.min(count / history.length, 1);
      return {
        day: day as DayOfWeek,
        hour,
        minute: 0,
        reason: `You often train at ${formatTime(hour, 0)} on ${DAY_LABELS[day as DayOfWeek]}s`,
        confidence,
      };
    });

  return suggestions;
}

// ---- Calendar Export Utilities ----

/**
 * Format a date as iCalendar DATETIME (YYYYMMDDTHHMMSS).
 */
function formatICSDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

/**
 * Generate an RRULE for recurring weekly events.
 */
function generateRRule(days: DayOfWeek[]): string {
  const byDay = days.map((d) => RRULE_DAYS[d]).join(',');
  return `RRULE:FREQ=WEEKLY;BYDAY=${byDay}`;
}

/**
 * Generate a .ics file content for a set of scheduled sessions.
 */
export function generateICSFile(
  slots: TimeSlot[],
  options?: { title?: string; description?: string }
): string {
  const title = options?.title || 'Trust Agent Session';
  const description = options?.description || 'Scheduled learning session with your Trust Agent role.';

  const events = slots.map((slot) => {
    const startDate = getNextOccurrence(slot);
    const endDate = new Date(startDate.getTime() + slot.duration * 60 * 1000);
    const uid = `${slot.id}@trust-agent-desktop`;

    return [
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTART:${formatICSDate(startDate)}`,
      `DTEND:${formatICSDate(endDate)}`,
      `RRULE:FREQ=WEEKLY;BYDAY=${RRULE_DAYS[slot.day]}`,
      `SUMMARY:${title} - ${slot.roleName}`,
      `DESCRIPTION:${description}`,
      'STATUS:CONFIRMED',
      `BEGIN:VALARM`,
      `TRIGGER:-PT15M`,
      `ACTION:DISPLAY`,
      `DESCRIPTION:Your session with ${slot.roleName} starts in 15 minutes`,
      `END:VALARM`,
      'END:VEVENT',
    ].join('\r\n');
  });

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Trust Agent Desktop//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');
}

/**
 * Download .ics file to user's computer.
 */
export function downloadICSFile(slots: TimeSlot[], filename?: string): void {
  const content = generateICSFile(slots);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || 'trust-agent-sessions.ics';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate a Google Calendar URL for adding a recurring event.
 */
export function generateGoogleCalendarURL(slot: TimeSlot): string {
  const startDate = getNextOccurrence(slot);
  const endDate = new Date(startDate.getTime() + slot.duration * 60 * 1000);

  const formatGCal = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  };

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `Trust Agent Session - ${slot.roleName}`,
    dates: `${formatGCal(startDate)}/${formatGCal(endDate)}`,
    details: `Scheduled learning session with ${slot.roleName}.\n\nPowered by Trust Agent Desktop.`,
    recur: `RRULE:FREQ=WEEKLY;BYDAY=${RRULE_DAYS[slot.day]}`,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Get minutes until the next session for notification purposes.
 */
export function getMinutesUntilNextSession(slots: TimeSlot[]): number | null {
  const next = getNextSession(slots);
  if (!next) return null;
  const diffMs = next.date.getTime() - Date.now();
  return Math.max(0, Math.round(diffMs / (60 * 1000)));
}

/**
 * Get a notification message for upcoming session.
 */
export function getSessionNotification(
  slots: TimeSlot[]
): { message: string; type: 'upcoming' | 'now' | 'missed' } | null {
  // Check for missed sessions first
  const missed = getMissedSessions(slots);
  if (missed.length > 0) {
    const slot = missed[0];
    return {
      message: `You missed your session with ${slot.roleName} yesterday at ${formatTime(slot.hour, slot.minute)}. Want to reschedule?`,
      type: 'missed',
    };
  }

  // Check for upcoming sessions
  const minutesUntil = getMinutesUntilNextSession(slots);
  if (minutesUntil === null) return null;

  const next = getNextSession(slots);
  if (!next) return null;

  if (minutesUntil <= 0) {
    return {
      message: `Your session with ${next.slot.roleName} is starting now!`,
      type: 'now',
    };
  }

  if (minutesUntil <= 15) {
    return {
      message: `Your session with ${next.slot.roleName} starts in ${minutesUntil} minute${minutesUntil !== 1 ? 's' : ''}.`,
      type: 'upcoming',
    };
  }

  return null;
}
