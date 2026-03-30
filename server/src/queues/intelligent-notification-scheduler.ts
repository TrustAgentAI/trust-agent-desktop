/**
 * Intelligent Notification Scheduler
 * BullMQ repeatable job that runs hourly to generate context-aware,
 * human-feeling notifications based on user activity patterns.
 *
 * Notification types:
 *   EXAM_APPROACHING  - "Your GCSE Maths exam is in 6 days..."
 *   STREAK_AT_RISK    - "You've been working with Miss Davies for 14 days straight..."
 *   STREAK_MILESTONE  - "That's your longest streak ever."
 *   TOPIC_DUE         - Spaced repetition topics overdue for review
 *   WELLBEING_CHECK   - "Dorothy noticed you seemed quieter than usual..."
 *   MILESTONE_NEAR    - Close to hitting a session count milestone
 *   SESSION_INSIGHT   - Post-session reflection prompt
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
// VAPID setup
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

export const intelligentNotifQueue = new Queue('intelligent-notifications', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
});

/**
 * Register the hourly repeatable job.
 */
export async function registerIntelligentNotificationScheduler(): Promise<void> {
  const existing = await intelligentNotifQueue.getRepeatableJobs();
  for (const job of existing) {
    await intelligentNotifQueue.removeRepeatableByKey(job.key);
  }

  await intelligentNotifQueue.add(
    'check-intelligent-notifications',
    {},
    {
      repeat: { every: 60 * 60 * 1000 }, // Every hour
    }
  );

  console.log('Intelligent notification scheduler registered (runs every hour)');
}

// ---------------------------------------------------------------------------
// Worker
// ---------------------------------------------------------------------------

export const intelligentNotifWorker = new Worker(
  'intelligent-notifications',
  async (_job: Job) => {
    const now = new Date();

    await Promise.allSettled([
      checkExamApproaching(now),
      checkStreaksAtRisk(now),
      checkStreakMilestones(now),
      checkTopicsDue(now),
      checkWellbeingSignals(now),
      checkMilestoneNear(now),
    ]);
  },
  {
    connection: redisConnection,
    concurrency: 1,
    limiter: { max: 1, duration: 60000 },
  }
);

intelligentNotifWorker.on('completed', (job) => {
  console.log(`Intelligent notification job ${job.id} completed`);
});

intelligentNotifWorker.on('failed', (job, err) => {
  console.error(`Intelligent notification job ${job?.id} failed:`, err.message);
});

// ---------------------------------------------------------------------------
// EXAM APPROACHING
// "Your GCSE Maths exam is in 6 days. Miss Davies has a revision session
// ready for integration by parts - your weakest topic."
// ---------------------------------------------------------------------------

async function checkExamApproaching(now: Date): Promise<void> {
  // Find all active notification contexts with exam dates
  const examContexts = await prisma.notificationContext.findMany({
    where: {
      contextType: 'EXAM_APPROACHING',
      isActive: true,
      sentAt: null,
      scheduledFor: { lte: now },
    },
    take: 100,
  });

  for (const ctx of examContexts) {
    const data = ctx.contextData as any;
    const examDate = data?.examDate ? new Date(data.examDate) : null;
    if (!examDate) continue;

    const daysUntil = Math.ceil((examDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntil < 0 || daysUntil > 30) continue;

    // Check we haven't sent a notification for this day count yet
    const alreadySent = await prisma.notification.findFirst({
      where: {
        userId: ctx.userId,
        type: 'EXAM_COUNTDOWN',
        createdAt: { gte: new Date(now.getTime() - 12 * 60 * 60 * 1000) },
      },
    });
    if (alreadySent) continue;

    // Get hire details for companion name and weak topics
    let companionName = data?.companionName || 'your companion';
    let weakTopic = data?.weakestTopic || '';
    let examName = data?.examName || 'your exam';

    if (ctx.hireId) {
      const hire = await prisma.hire.findUnique({
        where: { id: ctx.hireId },
        include: { role: { select: { companionName: true, name: true } } },
      });
      if (hire) {
        companionName = hire.customCompanionName || hire.role.companionName;
      }

      // Find weakest spaced repetition topic
      if (!weakTopic) {
        const weakestItem = await prisma.spacedRepetitionItem.findFirst({
          where: { hireId: ctx.hireId },
          orderBy: { easeFactor: 'asc' },
        });
        if (weakestItem?.topic) {
          weakTopic = weakestItem.topic;
        }
      }
    }

    const topicPhrase = weakTopic
      ? ` ${companionName} has a revision session ready for ${weakTopic} - your weakest topic.`
      : ` ${companionName} is ready to help you prepare.`;

    const body = daysUntil === 0
      ? `Your ${examName} is today. You've got this. ${companionName} believes in you.`
      : daysUntil === 1
        ? `Your ${examName} is tomorrow.${topicPhrase}`
        : `Your ${examName} is in ${daysUntil} days.${topicPhrase}`;

    await createIntelligentNotification(
      ctx.userId,
      'EXAM_COUNTDOWN',
      daysUntil <= 3 ? 'Exam very soon' : 'Exam approaching',
      body,
      { hireId: ctx.hireId, daysUntil, examName, contextId: ctx.id },
      'high'
    );

    // Mark context as sent
    await prisma.notificationContext.update({
      where: { id: ctx.id },
      data: { sentAt: now },
    });
  }
}

// ---------------------------------------------------------------------------
// STREAK AT RISK
// "You've been working with Miss Davies for 14 days straight.
// That's your longest streak ever."
// ---------------------------------------------------------------------------

async function checkStreaksAtRisk(now: Date): Promise<void> {
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  // Find hires where last session was 1-2 days ago (streak about to break)
  const atRiskHires = await prisma.hire.findMany({
    where: {
      status: 'ACTIVE',
      streakDays: { gte: 3 }, // Only alert if they have a meaningful streak
      lastSessionAt: {
        gte: twoDaysAgo,
        lt: oneDayAgo,
      },
    },
    include: {
      user: { select: { id: true, name: true, vapidSubscription: true } },
      role: { select: { name: true, companionName: true } },
    },
    take: 100,
  });

  for (const hire of atRiskHires) {
    // Don't double-send
    const recentNotif = await prisma.notification.findFirst({
      where: {
        userId: hire.userId,
        type: 'STREAK_AT_RISK',
        createdAt: { gte: new Date(now.getTime() - 20 * 60 * 60 * 1000) },
      },
    });
    if (recentNotif) continue;

    const companionName = hire.customCompanionName || hire.role.companionName;
    const isLongest = hire.streakDays >= hire.longestStreakDays;

    let body: string;
    if (isLongest && hire.streakDays >= 7) {
      body = `You've been working with ${companionName} for ${hire.streakDays} days straight. That's your longest streak ever. Don't let it slip - a quick 10-minute session keeps it alive.`;
    } else {
      body = `Your ${hire.streakDays}-day streak with ${companionName} will break if you don't check in today. Even a quick review counts.`;
    }

    await createIntelligentNotification(
      hire.userId,
      'STREAK_AT_RISK',
      'Your streak is at risk',
      body,
      { hireId: hire.id, streakDays: hire.streakDays, isLongest },
      'high'
    );

    // Record in NotificationContext
    await prisma.notificationContext.create({
      data: {
        userId: hire.userId,
        hireId: hire.id,
        contextType: 'STREAK_AT_RISK',
        contextData: { streakDays: hire.streakDays, isLongest },
        scheduledFor: now,
        sentAt: now,
      },
    });

    await sendPush(hire.user.vapidSubscription, 'Streak at risk', body);
  }
}

// ---------------------------------------------------------------------------
// STREAK MILESTONE
// Celebrate when a user hits a new personal best
// ---------------------------------------------------------------------------

async function checkStreakMilestones(now: Date): Promise<void> {
  const MILESTONE_DAYS = [7, 14, 21, 30, 50, 100, 200, 365];

  const activeHires = await prisma.hire.findMany({
    where: {
      status: 'ACTIVE',
      streakDays: { in: MILESTONE_DAYS },
      lastSessionAt: { gte: new Date(now.getTime() - 2 * 60 * 60 * 1000) },
    },
    include: {
      user: { select: { id: true, name: true, vapidSubscription: true } },
      role: { select: { companionName: true } },
    },
    take: 50,
  });

  for (const hire of activeHires) {
    const alreadyCelebrated = await prisma.notification.findFirst({
      where: {
        userId: hire.userId,
        type: 'MILESTONE_REACHED',
        data: { path: ['streakDays'], equals: hire.streakDays },
      },
    });
    if (alreadyCelebrated) continue;

    const companionName = hire.customCompanionName || hire.role.companionName;
    const body = `${hire.streakDays} days in a row with ${companionName}. That kind of consistency changes outcomes. Keep going.`;

    await createIntelligentNotification(
      hire.userId,
      'MILESTONE_REACHED',
      `${hire.streakDays}-day streak!`,
      body,
      { hireId: hire.id, streakDays: hire.streakDays, milestoneType: 'streak' },
      'high'
    );

    await prisma.notificationContext.create({
      data: {
        userId: hire.userId,
        hireId: hire.id,
        contextType: 'STREAK_MILESTONE',
        contextData: { streakDays: hire.streakDays },
        scheduledFor: now,
        sentAt: now,
      },
    });
  }
}

// ---------------------------------------------------------------------------
// TOPIC DUE - Spaced repetition items overdue
// ---------------------------------------------------------------------------

async function checkTopicsDue(now: Date): Promise<void> {
  // Find users with overdue spaced repetition items
  const overdueItems = await prisma.spacedRepetitionItem.groupBy({
    by: ['hireId'],
    where: { dueAt: { lt: now } },
    _count: { id: true },
    having: { id: { _count: { gte: 3 } } }, // At least 3 overdue items
  });

  for (const group of overdueItems) {
    const hire = await prisma.hire.findUnique({
      where: { id: group.hireId },
      include: {
        user: { select: { id: true, vapidSubscription: true } },
        role: { select: { companionName: true } },
      },
    });
    if (!hire || hire.status !== 'ACTIVE') continue;

    // Don't spam - only once per 48 hours
    const recent = await prisma.notification.findFirst({
      where: {
        userId: hire.userId,
        type: 'PROGRESS_UPDATE',
        data: { path: ['topicDue'], equals: true },
        createdAt: { gte: new Date(now.getTime() - 48 * 60 * 60 * 1000) },
      },
    });
    if (recent) continue;

    const companionName = hire.customCompanionName || hire.role.companionName;
    const count = group._count.id;

    // Get the most important overdue topic
    const topItem = await prisma.spacedRepetitionItem.findFirst({
      where: { hireId: hire.id, dueAt: { lt: now } },
      orderBy: { easeFactor: 'asc' }, // Hardest first
    });

    const topicName = topItem?.topic || topItem?.concept?.substring(0, 40) || 'several concepts';

    const body = `You have ${count} topics ready for review with ${companionName}. "${topicName}" is the one that needs the most attention. A 5-minute review now saves 30 minutes later.`;

    await createIntelligentNotification(
      hire.userId,
      'PROGRESS_UPDATE',
      'Topics ready for review',
      body,
      { hireId: hire.id, overdueCount: count, topicDue: true },
      'normal'
    );

    await prisma.notificationContext.create({
      data: {
        userId: hire.userId,
        hireId: hire.id,
        contextType: 'TOPIC_DUE',
        contextData: { overdueCount: count, topTopic: topicName },
        scheduledFor: now,
        sentAt: now,
      },
    });
  }
}

// ---------------------------------------------------------------------------
// WELLBEING CHECK
// "Dorothy noticed you seemed quieter than usual last session. Just checking in."
// ---------------------------------------------------------------------------

async function checkWellbeingSignals(now: Date): Promise<void> {
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Find recent wellbeing signals with declining trends
  const decliningSignals = await prisma.wellbeingSignal.findMany({
    where: {
      trend: 'declining',
      alertSent: false,
      createdAt: { gte: twentyFourHoursAgo },
    },
    include: {
      user: { select: { id: true, name: true, vapidSubscription: true } },
    },
    take: 50,
  });

  for (const signal of decliningSignals) {
    // Don't send wellbeing checks more than once per 3 days
    const recentWellbeingNotif = await prisma.notification.findFirst({
      where: {
        userId: signal.userId,
        type: 'WELLBEING_SIGNAL',
        createdAt: { gte: new Date(now.getTime() - 72 * 60 * 60 * 1000) },
      },
    });
    if (recentWellbeingNotif) continue;

    // Get the companion name from the hire
    let companionName = 'Your companion';
    if (signal.hireId) {
      const hire = await prisma.hire.findUnique({
        where: { id: signal.hireId },
        include: { role: { select: { companionName: true } } },
      });
      if (hire) {
        companionName = hire.customCompanionName || hire.role.companionName;
      }
    }

    const userName = signal.user.name?.split(' ')[0] || '';
    const greeting = userName ? `Hey ${userName}, ` : '';

    const body = `${greeting}${companionName} noticed you seemed quieter than usual last session. Just checking in - there is no pressure to talk about it, but ${companionName} is here whenever you are ready.`;

    await createIntelligentNotification(
      signal.userId,
      'WELLBEING_SIGNAL',
      'Just checking in',
      body,
      { hireId: signal.hireId, wellbeingScore: signal.score, trend: signal.trend },
      'normal'
    );

    // Mark the signal as alert-sent
    await prisma.wellbeingSignal.update({
      where: { id: signal.id },
      data: { alertSent: true },
    });

    await prisma.notificationContext.create({
      data: {
        userId: signal.userId,
        hireId: signal.hireId,
        contextType: 'WELLBEING_CHECK',
        contextData: { score: signal.score, trend: signal.trend },
        scheduledFor: now,
        sentAt: now,
      },
    });
  }
}

// ---------------------------------------------------------------------------
// MILESTONE NEAR
// "You're 2 sessions away from your 50th session with Miss Davies"
// ---------------------------------------------------------------------------

async function checkMilestoneNear(now: Date): Promise<void> {
  const SESSION_MILESTONES = [10, 25, 50, 100, 200, 500, 1000];

  const activeHires = await prisma.hire.findMany({
    where: { status: 'ACTIVE' },
    select: {
      id: true,
      userId: true,
      sessionCount: true,
      customCompanionName: true,
      role: { select: { companionName: true } },
      user: { select: { vapidSubscription: true } },
    },
    take: 500,
  });

  for (const hire of activeHires) {
    // Check if they're within 2 sessions of a milestone
    const nextMilestone = SESSION_MILESTONES.find(m => m > hire.sessionCount && (m - hire.sessionCount) <= 2);
    if (!nextMilestone) continue;

    const sessionsAway = nextMilestone - hire.sessionCount;

    // Don't repeat
    const alreadySent = await prisma.notification.findFirst({
      where: {
        userId: hire.userId,
        type: 'MILESTONE_REACHED',
        data: { path: ['nearMilestone'], equals: nextMilestone },
      },
    });
    if (alreadySent) continue;

    const companionName = hire.customCompanionName || hire.role.companionName;
    const body = sessionsAway === 1
      ? `One more session and you will have reached ${nextMilestone} sessions with ${companionName}. That is real commitment.`
      : `You are ${sessionsAway} sessions away from your ${nextMilestone}th session with ${companionName}. Almost there.`;

    await createIntelligentNotification(
      hire.userId,
      'MILESTONE_REACHED',
      'Milestone approaching',
      body,
      { hireId: hire.id, nearMilestone: nextMilestone, sessionsAway },
      'normal'
    );

    await prisma.notificationContext.create({
      data: {
        userId: hire.userId,
        hireId: hire.id,
        contextType: 'MILESTONE_NEAR',
        contextData: { nearMilestone: nextMilestone, sessionsAway, sessionCount: hire.sessionCount },
        scheduledFor: now,
        sentAt: now,
      },
    });
  }
}

// ---------------------------------------------------------------------------
// Helper: create a Notification record
// ---------------------------------------------------------------------------

async function createIntelligentNotification(
  userId: string,
  type: string,
  title: string,
  body: string,
  data: Record<string, any>,
  priority: 'normal' | 'high'
): Promise<void> {
  await prisma.notification.create({
    data: {
      userId,
      type: type as any,
      title,
      body,
      data,
      priority,
    },
  });
}

// ---------------------------------------------------------------------------
// Push notification helper
// ---------------------------------------------------------------------------

async function sendPush(subscription: any, title: string, body: string): Promise<void> {
  if (!subscription || !process.env.VAPID_PUBLIC_KEY) return;

  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify({
        title,
        body,
        icon: '/icons/trust-agent-192.png',
        badge: '/icons/trust-agent-badge.png',
        tag: 'intelligent-notification',
      })
    );
  } catch (err: any) {
    if (err.statusCode === 410 || err.statusCode === 404) {
      console.log('Push subscription expired, clearing...');
    } else {
      console.error('Push notification failed:', err.message);
    }
  }
}
