/**
 * Micro-Moment Notification Scheduler
 * BullMQ repeatable job that runs every hour to:
 * 1. Query users with upcoming scheduled sessions (10 min before)
 * 2. Query users who haven't had a session in 3+ days
 * 3. Create Notification records with appropriate messages
 * 4. Queue push notifications via VAPID
 */

import { Queue, Worker, type Job } from 'bullmq';
import IORedis from 'ioredis';
import webpush from 'web-push';
import { prisma } from '../lib/prisma';

// ---------------------------------------------------------------------------
// Redis connection
// ---------------------------------------------------------------------------

const redisConnection = new IORedis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
});

// ---------------------------------------------------------------------------
// VAPID configuration for push notifications
// ---------------------------------------------------------------------------

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:notifications@trust-agent.ai',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

// ---------------------------------------------------------------------------
// Queue
// ---------------------------------------------------------------------------

export const microMomentQueue = new Queue('micro-moments', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
});

/**
 * Schedule the repeatable job (runs every hour).
 */
export async function scheduleMicroMomentJob(): Promise<void> {
  // Remove any existing repeatable jobs to avoid duplicates
  const existing = await microMomentQueue.getRepeatableJobs();
  for (const job of existing) {
    await microMomentQueue.removeRepeatableByKey(job.key);
  }

  await microMomentQueue.add(
    'check-micro-moments',
    {},
    {
      repeat: { every: 60 * 60 * 1000 }, // Every hour
    }
  );

  console.log('Micro-moment scheduler registered (runs every hour)');
}

// ---------------------------------------------------------------------------
// Worker
// ---------------------------------------------------------------------------

export const microMomentWorker = new Worker(
  'micro-moments',
  async (_job: Job) => {
    const now = new Date();

    // 1. Upcoming scheduled sessions (within next 10 minutes)
    await processUpcomingSessions(now);

    // 2. Users who haven't had a session in 3+ days
    await processInactiveUsers(now);
  },
  {
    connection: redisConnection,
    concurrency: 1,
    limiter: { max: 1, duration: 60000 },
  }
);

microMomentWorker.on('completed', (job) => {
  console.log(`Micro-moment job ${job.id} completed`);
});

microMomentWorker.on('failed', (job, err) => {
  console.error(`Micro-moment job ${job?.id} failed:`, err.message);
});

// ---------------------------------------------------------------------------
// Process upcoming sessions (10 min before)
// ---------------------------------------------------------------------------

async function processUpcomingSessions(now: Date): Promise<void> {
  const tenMinutesFromNow = new Date(now.getTime() + 10 * 60 * 1000);
  const elevenMinutesFromNow = new Date(now.getTime() + 11 * 60 * 1000);

  // Find schedules where nextSessionAt is within the next 10-11 minutes
  const upcomingSchedules = await prisma.sessionSchedule.findMany({
    where: {
      isActive: true,
      nextSessionAt: {
        gte: tenMinutesFromNow,
        lt: elevenMinutesFromNow,
      },
    },
    include: {
      user: { select: { id: true, name: true, vapidSubscription: true } },
      hire: {
        include: { role: { select: { name: true, companionName: true } } },
      },
    },
  });

  for (const schedule of upcomingSchedules) {
    // Check if we already sent a reminder for this time slot
    const existingNotif = await prisma.notification.findFirst({
      where: {
        userId: schedule.userId,
        type: 'SESSION_REMINDER',
        createdAt: { gte: new Date(now.getTime() - 60 * 60 * 1000) },
        data: { path: ['scheduleId'], equals: schedule.id },
      },
    });

    if (existingNotif) continue;

    const roleName = schedule.hire.role.companionName || schedule.hire.role.name;

    // Create in-app notification
    await prisma.notification.create({
      data: {
        userId: schedule.userId,
        type: 'SESSION_REMINDER',
        title: 'Session Starting Soon',
        body: `Your session with ${roleName} starts in 10 minutes. Ready to learn?`,
        data: {
          hireId: schedule.hireId,
          scheduleId: schedule.id,
        },
        priority: 'high',
      },
    });

    // Send push notification if subscription exists
    await sendPushNotification(
      schedule.user.vapidSubscription,
      'Session Starting Soon',
      `Your session with ${roleName} starts in 10 minutes.`
    );
  }
}

// ---------------------------------------------------------------------------
// Process inactive users (no session in 3+ days)
// ---------------------------------------------------------------------------

async function processInactiveUsers(now: Date): Promise<void> {
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

  // Find active hires where last session was 3+ days ago
  const inactiveHires = await prisma.hire.findMany({
    where: {
      status: 'ACTIVE',
      OR: [
        { lastSessionAt: { lt: threeDaysAgo } },
        { lastSessionAt: null, createdAt: { lt: threeDaysAgo } },
      ],
    },
    include: {
      user: { select: { id: true, name: true, vapidSubscription: true } },
      role: { select: { name: true, companionName: true } },
    },
    take: 100, // Process in batches
  });

  for (const hire of inactiveHires) {
    // Check if we already sent a streak-at-risk notification in the last 24 hours
    const recentNotif = await prisma.notification.findFirst({
      where: {
        userId: hire.userId,
        type: 'STREAK_AT_RISK',
        createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
      },
    });

    if (recentNotif) continue;

    const roleName = hire.role.companionName || hire.role.name;
    const daysSince = hire.lastSessionAt
      ? Math.floor((now.getTime() - hire.lastSessionAt.getTime()) / (24 * 60 * 60 * 1000))
      : Math.floor((now.getTime() - hire.createdAt.getTime()) / (24 * 60 * 60 * 1000));

    // Create in-app notification
    await prisma.notification.create({
      data: {
        userId: hire.userId,
        type: 'STREAK_AT_RISK',
        title: 'Your streak is at risk',
        body: `It has been ${daysSince} days since your last session with ${roleName}. A quick 10-minute session can keep your momentum going.`,
        data: { hireId: hire.id },
        priority: 'high',
      },
    });

    // Send push notification
    await sendPushNotification(
      hire.user.vapidSubscription,
      'Your streak is at risk',
      `${daysSince} days since your last session with ${roleName}. Keep your momentum going!`
    );
  }
}

// ---------------------------------------------------------------------------
// Push notification helper
// ---------------------------------------------------------------------------

async function sendPushNotification(
  subscription: any,
  title: string,
  body: string
): Promise<void> {
  if (!subscription || !process.env.VAPID_PUBLIC_KEY) return;

  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify({
        title,
        body,
        icon: '/icons/trust-agent-192.png',
        badge: '/icons/trust-agent-badge.png',
        tag: 'micro-moment',
      })
    );
  } catch (err: any) {
    // If subscription is expired/invalid, clear it
    if (err.statusCode === 410 || err.statusCode === 404) {
      console.log('Push subscription expired, clearing...');
    } else {
      console.error('Push notification failed:', err.message);
    }
  }
}
