/**
 * Phase 11 - Human Follow-Up System
 * Auto-queues human follow-up when:
 * - Wellbeing score drops below 40
 * - Crisis escalation triggers (Samaritans reference)
 * - Guardian requests human contact
 * - 3+ consecutive missed scheduled sessions
 *
 * SLA targets:
 * - URGENT: 4 hours
 * - HIGH: 24 hours
 * - MEDIUM: 48 hours
 * - LOW: 72 hours
 */
import api from '@/lib/api';

// --- Types ---

export type FollowUpReason =
  | 'WELLBEING_DECLINE'
  | 'CRISIS_FLAG'
  | 'GUARDIAN_REQUEST'
  | 'ADMIN_REFERRAL'
  | 'MISSED_SESSIONS';

export type FollowUpPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type FollowUpStatus = 'QUEUED' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED';

export interface FollowUpEntry {
  id: string;
  userId: string;
  hireId?: string;
  reason: FollowUpReason;
  priority: FollowUpPriority;
  details: string;
  status: FollowUpStatus;
  assignedTo?: string;
  assignedAt?: string;
  notes?: string;
  resolvedAt?: string;
  resolution?: string;
  slaDeadline?: string;
  slaBreach: boolean;
  createdAt: string;
}

// --- SLA Calculation ---

const SLA_HOURS: Record<FollowUpPriority, number> = {
  URGENT: 4,
  HIGH: 24,
  MEDIUM: 48,
  LOW: 72,
};

export function calculateSLADeadline(priority: FollowUpPriority): Date {
  const now = new Date();
  return new Date(now.getTime() + SLA_HOURS[priority] * 60 * 60 * 1000);
}

export function isSLABreached(slaDeadline: string | Date): boolean {
  const deadline = typeof slaDeadline === 'string' ? new Date(slaDeadline) : slaDeadline;
  return new Date() > deadline;
}

export function getSLATimeRemaining(slaDeadline: string | Date): string {
  const deadline = typeof slaDeadline === 'string' ? new Date(slaDeadline) : slaDeadline;
  const diff = deadline.getTime() - Date.now();

  if (diff <= 0) return 'BREACHED';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) return `${hours}h ${minutes}m remaining`;
  return `${minutes}m remaining`;
}

// --- Auto-Queue Triggers ---

/**
 * Check wellbeing score and auto-queue if below 40.
 */
export async function checkWellbeingAndQueue(
  userId: string,
  hireId: string,
  wellbeingScore: number,
  companionName: string,
): Promise<void> {
  if (wellbeingScore >= 40) return;

  const priority: FollowUpPriority = wellbeingScore < 20 ? 'URGENT' : wellbeingScore < 30 ? 'HIGH' : 'MEDIUM';
  const slaDeadline = calculateSLADeadline(priority);

  try {
    await api.post('/trpc/followup.queue', {
      json: {
        userId,
        hireId,
        reason: 'WELLBEING_DECLINE' as FollowUpReason,
        priority,
        details: `Wellbeing score dropped to ${wellbeingScore}/100 for companion "${companionName}". ` +
          `Priority set to ${priority} based on score threshold.`,
        slaDeadline: slaDeadline.toISOString(),
      },
    });
  } catch (err) {
    console.error('[HumanFollowUp] Failed to queue wellbeing follow-up:', err);
  }
}

/**
 * Auto-queue on crisis escalation (Samaritans reference detected).
 */
export async function queueCrisisFollowUp(
  userId: string,
  hireId: string,
  triggerDetail: string,
): Promise<void> {
  const slaDeadline = calculateSLADeadline('URGENT');

  try {
    await api.post('/trpc/followup.queue', {
      json: {
        userId,
        hireId,
        reason: 'CRISIS_FLAG' as FollowUpReason,
        priority: 'URGENT' as FollowUpPriority,
        details: `Crisis escalation triggered. Samaritans reference provided to user. Detail: ${triggerDetail}`,
        slaDeadline: slaDeadline.toISOString(),
      },
    });
  } catch (err) {
    console.error('[HumanFollowUp] Failed to queue crisis follow-up:', err);
  }
}

/**
 * Guardian requests human contact for their child.
 */
export async function queueGuardianRequest(
  userId: string,
  hireId: string,
  guardianName: string,
  message: string,
): Promise<void> {
  const slaDeadline = calculateSLADeadline('HIGH');

  try {
    await api.post('/trpc/followup.queue', {
      json: {
        userId,
        hireId,
        reason: 'GUARDIAN_REQUEST' as FollowUpReason,
        priority: 'HIGH' as FollowUpPriority,
        details: `Guardian "${guardianName}" requested human contact. Message: ${message}`,
        slaDeadline: slaDeadline.toISOString(),
      },
    });
  } catch (err) {
    console.error('[HumanFollowUp] Failed to queue guardian request:', err);
  }
}

/**
 * Check for missed scheduled sessions and auto-queue after 3+ consecutive misses.
 */
export async function checkMissedSessionsAndQueue(
  userId: string,
  hireId: string,
  consecutiveMisses: number,
  companionName: string,
): Promise<void> {
  if (consecutiveMisses < 3) return;

  const priority: FollowUpPriority = consecutiveMisses >= 5 ? 'HIGH' : 'MEDIUM';
  const slaDeadline = calculateSLADeadline(priority);

  try {
    await api.post('/trpc/followup.queue', {
      json: {
        userId,
        hireId,
        reason: 'MISSED_SESSIONS' as FollowUpReason,
        priority,
        details: `${consecutiveMisses} consecutive missed scheduled sessions with "${companionName}". ` +
          `User may need support or schedule adjustment.`,
        slaDeadline: slaDeadline.toISOString(),
      },
    });
  } catch (err) {
    console.error('[HumanFollowUp] Failed to queue missed sessions follow-up:', err);
  }
}

// --- API Helpers ---

export async function fetchFollowUpQueue(
  filters?: { status?: FollowUpStatus; priority?: FollowUpPriority },
): Promise<FollowUpEntry[]> {
  try {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.priority) params.set('priority', filters.priority);
    const query = params.toString() ? `?${params.toString()}` : '';
    return await api.get<FollowUpEntry[]>(`/trpc/followup.list${query}`);
  } catch (err) {
    console.error('[HumanFollowUp] Failed to fetch queue:', err);
    return [];
  }
}

export async function assignFollowUp(id: string, assignedTo: string): Promise<void> {
  await api.put(`/trpc/followup.assign`, { json: { id, assignedTo } });
}

export async function resolveFollowUp(id: string, resolution: string, notes?: string): Promise<void> {
  await api.put(`/trpc/followup.resolve`, { json: { id, resolution, notes } });
}

export async function addFollowUpNotes(id: string, notes: string): Promise<void> {
  await api.put(`/trpc/followup.addNotes`, { json: { id, notes } });
}
