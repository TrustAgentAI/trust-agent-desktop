/**
 * SafeguardingChecker - runs at session start for child/vulnerable accounts.
 * Enforces:
 *   - 45-minute daily session limit (hard limit for child accounts)
 *   - 9pm curfew for child accounts
 *   - Logs all safeguarding events
 *   - Alerts guardian on any concern
 */

import { TRPCError } from '@trpc/server';
import type { PrismaClient } from '@prisma/client';
import { addNotificationJob } from '../../queues/notification-queue';

export interface SafeguardingCheckResult {
  allowed: boolean;
  reason?: string;
  eventType?: string;
  severity?: string;
}

export interface SafeguardingContext {
  userId: string;
  accountType: string;
  sessionId?: string;
}

const CHILD_DAILY_LIMIT_MINS = 45;
const CHILD_CURFEW_HOUR = 21; // 9pm

/**
 * Check safeguarding rules before allowing a session to start.
 * For child accounts: enforce 45-min daily limit and 9pm curfew.
 * Logs all safeguarding events to SafeguardingEvent table.
 */
export async function runSafeguardingPreCheck(
  prisma: PrismaClient,
  context: SafeguardingContext,
): Promise<SafeguardingCheckResult> {
  // Only apply safeguarding to child accounts
  if (context.accountType !== 'CHILD') {
    return { allowed: true };
  }

  // Check 1: Curfew enforcement (9pm - 6am)
  const currentHour = new Date().getHours();
  if (currentHour >= CHILD_CURFEW_HOUR || currentHour < 6) {
    await logSafeguardingEvent(prisma, {
      userId: context.userId,
      sessionId: context.sessionId || null,
      eventType: 'CURFEW_BLOCK',
      severity: 'high',
      details: `Session blocked: child account attempted access at ${currentHour}:00. Curfew is ${CHILD_CURFEW_HOUR}:00-06:00.`,
    });

    await alertGuardians(prisma, context.userId, 'CURFEW_BLOCK', `Your child attempted to start a session at ${currentHour}:00, which is outside permitted hours (before 9pm).`);

    return {
      allowed: false,
      reason: `Sessions are not available between ${CHILD_CURFEW_HOUR}:00 and 06:00 for child accounts`,
      eventType: 'CURFEW_BLOCK',
      severity: 'high',
    };
  }

  // Check 2: Daily session limit (45 minutes hard limit)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todaySessions = await prisma.agentSession.aggregate({
    where: {
      userId: context.userId,
      startedAt: { gte: today },
      status: { in: ['ACTIVE', 'COMPLETED'] },
    },
    _sum: { durationSeconds: true },
  });

  const usedMins = Math.floor((todaySessions._sum.durationSeconds || 0) / 60);

  if (usedMins >= CHILD_DAILY_LIMIT_MINS) {
    await logSafeguardingEvent(prisma, {
      userId: context.userId,
      sessionId: context.sessionId || null,
      eventType: 'DAILY_LIMIT_HIT',
      severity: 'medium',
      details: `Daily limit of ${CHILD_DAILY_LIMIT_MINS} minutes reached. Used ${usedMins} minutes today.`,
    });

    await alertGuardians(prisma, context.userId, 'DAILY_LIMIT_HIT', `Your child has reached their daily session limit of ${CHILD_DAILY_LIMIT_MINS} minutes (${usedMins} minutes used today).`);

    return {
      allowed: false,
      reason: `Daily session limit of ${CHILD_DAILY_LIMIT_MINS} minutes reached (${usedMins} minutes used today)`,
      eventType: 'DAILY_LIMIT_HIT',
      severity: 'medium',
    };
  }

  return { allowed: true };
}

/**
 * Log a safeguarding event to the database.
 */
export async function logSafeguardingEvent(
  prisma: PrismaClient,
  data: {
    userId: string;
    sessionId: string | null;
    eventType: string;
    severity: string;
    details: string;
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  await prisma.safeguardingEvent.create({
    data: {
      userId: data.userId,
      sessionId: data.sessionId,
      eventType: data.eventType,
      severity: data.severity,
      details: data.details,
      metadata: data.metadata ?? undefined,
    },
  });
}

/**
 * Alert all guardians linked to a child user.
 */
async function alertGuardians(
  prisma: PrismaClient,
  childUserId: string,
  alertType: string,
  message: string,
): Promise<void> {
  const familyLinks = await prisma.familyLink.findMany({
    where: { childId: childUserId },
    include: {
      guardian: { select: { id: true, email: true, name: true } },
    },
  });

  for (const link of familyLinks) {
    // Create a GuardianAlert record
    await prisma.guardianAlert.create({
      data: {
        familyLinkId: link.id,
        type: alertType,
        message,
      },
    });

    // Log the guardian alert as a safeguarding event
    await logSafeguardingEvent(prisma, {
      userId: childUserId,
      sessionId: null,
      eventType: 'GUARDIAN_ALERTED',
      severity: 'medium',
      details: `Guardian ${link.guardian.email} alerted about ${alertType}`,
      metadata: { guardianId: link.guardian.id, alertType },
    });

    // Send notification via queue
    await addNotificationJob({
      type: 'guardian_alert',
      userId: link.guardian.id,
      title: 'Safeguarding Alert',
      body: message,
      data: { childId: childUserId, alertType },
      priority: 'high',
    });
  }
}
