/**
 * BullMQ Re-Audit Queue Worker
 * Quality Drift Prevention System (Phase 7)
 *
 * Runs daily to check all active roles for re-audit conditions:
 *   1. Average review rating drops below 3.5 (from 5+ reviews)
 *   2. 3+ user reports on a role within 30 days
 *   3. 6 months since last audit
 *   4. Admin manual trigger (handled via admin router)
 *
 * Creates CompanionReAuditTrigger records when conditions are met.
 */

import { Queue, Worker, type Job } from 'bullmq';
import IORedis from 'ioredis';
import { prisma } from '../lib/prisma';

// ---------------------------------------------------------------------------
// Redis connection for BullMQ
// ---------------------------------------------------------------------------

const redisConnection = new IORedis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
});

// ---------------------------------------------------------------------------
// Queue definition
// ---------------------------------------------------------------------------

export const reauditQueue = new Queue('reaudit-checker', {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: { type: 'exponential', delay: 60_000 },
  },
});

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LOW_RATING_THRESHOLD = 3.5;
const MIN_REVIEWS_FOR_TRIGGER = 5;
const REPORT_THRESHOLD = 3;
const REPORT_WINDOW_DAYS = 30;
const AUDIT_EXPIRY_MONTHS = 6;

// ---------------------------------------------------------------------------
// Worker - processes the daily re-audit check
// ---------------------------------------------------------------------------

const reauditWorker = new Worker(
  'reaudit-checker',
  async (_job: Job) => {
    const triggersCreated: string[] = [];

    // Get all active roles
    const activeRoles = await prisma.role.findMany({
      where: { isActive: true },
      select: {
        id: true,
        slug: true,
        name: true,
        audit: {
          select: {
            completedAt: true,
            expiresAt: true,
          },
        },
      },
    });

    for (const role of activeRoles) {
      // --- Check 1: Low average rating ---
      const lowRatingTriggered = await checkLowRating(role.id);
      if (lowRatingTriggered) triggersCreated.push(`LOW_RATING:${role.slug}`);

      // --- Check 2: Excessive user reports ---
      const reportTriggered = await checkUserReports(role.id);
      if (reportTriggered) triggersCreated.push(`USER_REPORT:${role.slug}`);

      // --- Check 3: Scheduled re-audit (6 months since last audit) ---
      const scheduledTriggered = await checkScheduledReaudit(role.id, role.audit);
      if (scheduledTriggered) triggersCreated.push(`SCHEDULED:${role.slug}`);
    }

    return {
      rolesChecked: activeRoles.length,
      triggersCreated: triggersCreated.length,
      triggers: triggersCreated,
      completedAt: new Date().toISOString(),
    };
  },
  { connection: redisConnection, concurrency: 1 },
);

reauditWorker.on('completed', (job) => {
  console.log(`[ReAudit] Daily check completed: ${JSON.stringify(job.returnvalue)}`);
});

reauditWorker.on('failed', (job, err) => {
  console.error(`[ReAudit] Daily check failed:`, err.message);
});

// ---------------------------------------------------------------------------
// Check functions
// ---------------------------------------------------------------------------

/**
 * Check 1: Low rating trigger
 * Average review rating below 3.5 from 5+ reviews
 */
async function checkLowRating(roleId: string): Promise<boolean> {
  const avgResult = await prisma.companionReview.aggregate({
    where: { hire: { roleId } },
    _avg: { rating: true },
    _count: { rating: true },
  });

  const avgRating = avgResult._avg.rating;
  const reviewCount = avgResult._count.rating;

  if (reviewCount >= MIN_REVIEWS_FOR_TRIGGER && avgRating !== null && avgRating < LOW_RATING_THRESHOLD) {
    return await createTriggerIfNotExists(roleId, 'LOW_RATING', {
      averageRating: Math.round(avgRating * 100) / 100,
      reviewCount,
      threshold: LOW_RATING_THRESHOLD,
    });
  }

  return false;
}

/**
 * Check 2: User report trigger
 * 3+ reports within 30 days (using companionReview with rating 1 as proxy for reports)
 */
async function checkUserReports(roleId: string): Promise<boolean> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - REPORT_WINDOW_DAYS);

  // Count very low ratings (1 star) in the last 30 days as implicit reports
  const reportCount = await prisma.companionReview.count({
    where: {
      hire: { roleId },
      rating: 1,
      createdAt: { gte: thirtyDaysAgo },
    },
  });

  if (reportCount >= REPORT_THRESHOLD) {
    return await createTriggerIfNotExists(roleId, 'USER_REPORT', {
      reportCount,
      windowDays: REPORT_WINDOW_DAYS,
      threshold: REPORT_THRESHOLD,
      since: thirtyDaysAgo.toISOString(),
    });
  }

  return false;
}

/**
 * Check 3: Scheduled re-audit
 * 6 months since last audit completion
 */
async function checkScheduledReaudit(
  roleId: string,
  audit: { completedAt: Date; expiresAt: Date } | null,
): Promise<boolean> {
  if (!audit) {
    // No audit at all - should be triggered
    return await createTriggerIfNotExists(roleId, 'SCHEDULED', {
      reason: 'No audit record found',
    });
  }

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - AUDIT_EXPIRY_MONTHS);

  if (audit.completedAt < sixMonthsAgo) {
    return await createTriggerIfNotExists(roleId, 'SCHEDULED', {
      lastAuditAt: audit.completedAt.toISOString(),
      expiresAt: audit.expiresAt.toISOString(),
      monthsSinceAudit: AUDIT_EXPIRY_MONTHS,
    });
  }

  return false;
}

/**
 * Create a trigger if one doesn't already exist as PENDING for this role+type.
 */
async function createTriggerIfNotExists(
  roleId: string,
  triggerType: 'LOW_RATING' | 'USER_REPORT' | 'SCHEDULED' | 'ADMIN',
  triggerData: Record<string, unknown>,
): Promise<boolean> {
  const existing = await prisma.companionReAuditTrigger.findFirst({
    where: {
      roleId,
      triggerType,
      status: { in: ['PENDING', 'IN_PROGRESS'] },
    },
  });

  if (existing) return false;

  await prisma.companionReAuditTrigger.create({
    data: {
      roleId,
      triggerType,
      triggerData,
      status: 'PENDING',
    },
  });

  return true;
}

// ---------------------------------------------------------------------------
// Schedule the daily job (called from server startup)
// ---------------------------------------------------------------------------

export async function scheduleReauditCheck(): Promise<void> {
  // Remove any existing repeatable jobs first
  const existing = await reauditQueue.getRepeatableJobs();
  for (const job of existing) {
    await reauditQueue.removeRepeatableByKey(job.key);
  }

  // Schedule daily at 03:00 UTC
  await reauditQueue.add(
    'daily-reaudit-check',
    { scheduledAt: new Date().toISOString() },
    {
      repeat: { pattern: '0 3 * * *' },
    },
  );

  console.log('[ReAudit] Daily re-audit check scheduled at 03:00 UTC');
}
