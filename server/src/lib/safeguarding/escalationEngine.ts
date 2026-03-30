/**
 * Safeguarding Escalation Engine
 * Called at the END of every session for child/vulnerable accounts.
 * Analyses session METADATA ONLY - never message content.
 */

import type { PrismaClient } from '@prisma/client';
import { logSafeguardingEvent } from './checker';
import { addNotificationJob } from '../../queues/notification-queue';

export async function runSafeguardingEscalation(
  prisma: PrismaClient,
  hireId: string,
  sessionMetadata: {
    sessionId: string;
    durationMinutes: number;
  },
): Promise<void> {
  const hire = await prisma.hire.findUnique({
    where: { id: hireId },
    include: {
      user: {
        select: {
          id: true,
          accountType: true,
          guardedBy: {
            include: {
              guardian: { select: { id: true, email: true, name: true } },
            },
          },
        },
      },
    },
  });

  if (!hire) return;

  const user = hire.user;
  const isVulnerable = user.accountType === 'CHILD' || user.accountType === 'ELDERLY';

  if (!isVulnerable) return;

  const signals: string[] = [];
  let escalationLevel = 0; // 0=none, 1=notify guardian, 2=human queue

  // Signal 1: Session frequency (5+ sessions in 24 hours)
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentCount = await prisma.agentSession.count({
    where: {
      hireId,
      startedAt: { gte: twentyFourHoursAgo },
    },
  });

  if (recentCount >= 5) {
    signals.push(`${recentCount} sessions in last 24 hours`);
    escalationLevel = Math.max(escalationLevel, 1);

    await logSafeguardingEvent(prisma, {
      userId: user.id,
      sessionId: sessionMetadata.sessionId,
      eventType: 'HIGH_FREQUENCY',
      severity: 'medium',
      details: `${recentCount} sessions in last 24 hours for ${user.accountType} account`,
      metadata: { recentCount, hireId },
    });
  }

  // Signal 2: After-hours access for child accounts
  if (user.accountType === 'CHILD') {
    const hour = new Date().getHours();
    if (hour >= 21 || hour < 6) {
      signals.push(`Session active at ${hour}:00 - outside safe hours for child accounts`);
      escalationLevel = Math.max(escalationLevel, 1);

      await logSafeguardingEvent(prisma, {
        userId: user.id,
        sessionId: sessionMetadata.sessionId,
        eventType: 'AFTER_HOURS',
        severity: 'high',
        details: `Session ended at ${hour}:00 - outside safe hours for child accounts`,
      });
    }
  }

  // Signal 3: Wellbeing score critically low or rapidly declining
  const recentWellbeing = await prisma.wellbeingSignal.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });

  if (recentWellbeing) {
    if (recentWellbeing.score < 30) {
      signals.push(`Wellbeing score critically low: ${recentWellbeing.score}/100`);
      escalationLevel = Math.max(escalationLevel, 2);

      await logSafeguardingEvent(prisma, {
        userId: user.id,
        sessionId: sessionMetadata.sessionId,
        eventType: 'WELLBEING_CRITICAL',
        severity: 'critical',
        details: `Wellbeing score critically low: ${recentWellbeing.score}/100`,
        metadata: { score: recentWellbeing.score, trend: recentWellbeing.trend },
      });
    } else if (recentWellbeing.trend === 'declining' && recentWellbeing.score < 50) {
      signals.push(`Wellbeing declining: score ${recentWellbeing.score}/100 with negative trend`);
      escalationLevel = Math.max(escalationLevel, 1);

      await logSafeguardingEvent(prisma, {
        userId: user.id,
        sessionId: sessionMetadata.sessionId,
        eventType: 'CONCERN_FLAGGED',
        severity: 'high',
        details: `Wellbeing declining: ${recentWellbeing.score}/100 with negative trend`,
        metadata: { score: recentWellbeing.score, trend: recentWellbeing.trend },
      });
    }
  }

  if (escalationLevel === 0) return;

  // Notify guardian(s)
  for (const link of user.guardedBy) {
    await prisma.guardianAlert.create({
      data: {
        familyLinkId: link.id,
        type: escalationLevel >= 2 ? 'wellbeing_concern' : 'usage_pattern',
        message: `Safeguarding alert: ${signals.join('; ')}`,
        hireId,
      },
    });

    await logSafeguardingEvent(prisma, {
      userId: user.id,
      sessionId: sessionMetadata.sessionId,
      eventType: 'GUARDIAN_ALERTED',
      severity: escalationLevel >= 2 ? 'critical' : 'high',
      details: `Guardian ${link.guardian.email} alerted: ${signals.join('; ')}`,
      metadata: { guardianId: link.guardian.id, escalationLevel, signals },
    });

    await addNotificationJob({
      type: 'guardian_alert',
      userId: link.guardian.id,
      title: escalationLevel >= 2 ? 'Urgent Safeguarding Alert' : 'Safeguarding Notice',
      body: `Safeguarding concern for your child: ${signals.join('; ')}`,
      data: {
        childId: user.id,
        signals,
        severity: escalationLevel >= 2 ? 'HIGH' : 'MEDIUM',
      },
      priority: 'high',
    });
  }

  // Level 2+: Add to human follow-up queue
  if (escalationLevel >= 2) {
    await prisma.humanFollowUpQueue.create({
      data: {
        userId: user.id,
        hireId,
        reason: 'safeguarding',
        priority: 'urgent',
        details: `Safeguarding escalation (level ${escalationLevel}): ${signals.join('; ')}`,
      },
    });
  }
}
