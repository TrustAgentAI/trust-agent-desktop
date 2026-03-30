/**
 * Proactive Contact Worker - BullMQ job
 * Runs daily per active hire.
 * Only sends if there's a truly context-aware message.
 *
 * Generic messages are rate-limited to once per fortnight (14 days).
 * Context-aware and highly-personal messages send immediately.
 */

import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { prisma } from '../lib/prisma';
import { generateProactiveContact } from '../lib/notifications/proactiveContact';

// ---------------------------------------------------------------------------
// Redis connection for BullMQ
// ---------------------------------------------------------------------------

const redisConnection = new IORedis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
});

// ---------------------------------------------------------------------------
// Queue
// ---------------------------------------------------------------------------

export const proactiveContactQueue = new Queue('proactive-contact', {
  connection: redisConnection,
});

// ---------------------------------------------------------------------------
// Worker
// ---------------------------------------------------------------------------

const worker = new Worker(
  'proactive-contact',
  async (job) => {
    const { hireId, userId } = job.data as {
      hireId: string;
      userId: string;
    };

    const message = await generateProactiveContact(hireId);
    if (!message) return; // Nothing to say - don't send

    // Only send generic messages if none sent in the last 14 days
    if (message.specificity === 'generic') {
      const recentGeneric = await prisma.notification.findFirst({
        where: {
          userId,
          type: 'MICRO_MOMENT', // Reusing existing enum value for proactive generic
          createdAt: { gte: new Date(Date.now() - 14 * 86400000) },
          data: {
            path: ['proactiveType'],
            equals: 'generic',
          },
        },
      });
      if (recentGeneric) return; // Too soon for generic
    }

    // Store notification using existing NotifType enum values
    const notifType =
      message.specificity === 'generic' ? 'MICRO_MOMENT' : 'STREAK_AT_RISK';

    const notification = await prisma.notification.create({
      data: {
        userId,
        type: notifType,
        title: message.title,
        body: message.body,
        data: {
          hireId,
          proactiveType: message.specificity,
          context: message.context,
        },
        priority:
          message.specificity === 'highly_personal' ? 'high' : 'normal',
      },
    });

    // Store notification context for analytics
    await prisma.notificationContext.create({
      data: {
        userId,
        hireId,
        contextType:
          message.specificity === 'highly_personal'
            ? 'SESSION_INSIGHT'
            : 'WELLBEING_CHECK',
        contextData: {
          notificationId: notification.id,
          specificity: message.specificity,
          context: message.context,
          urgency:
            message.specificity === 'highly_personal' ? 'high' : 'normal',
        },
        scheduledFor: new Date(),
        sentAt: new Date(),
      },
    });

    // Push notification would be sent here via web-push / FCM
    // await sendPushToUser(userId, { title, body, data: { hireId, notificationId } });
    console.log(
      `[proactive-contact] Sent ${message.specificity} message to hire ${hireId}: "${message.title}"`,
    );
  },
  { connection: redisConnection },
);

worker.on('completed', (job) => {
  console.log(`[proactive-contact] Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(
    `[proactive-contact] Job ${job?.id} failed:`,
    err.message,
  );
});

// ---------------------------------------------------------------------------
// Daily scheduler: queue proactive contact for all active hires
// ---------------------------------------------------------------------------

export async function scheduleProactiveContact(): Promise<void> {
  const activeHires = await prisma.hire.findMany({
    where: {
      status: 'ACTIVE',
      user: {
        vapidSubscription: { not: null },
      },
    },
    select: { id: true, userId: true },
  });

  for (const hire of activeHires) {
    await proactiveContactQueue.add(
      'check-proactive',
      { hireId: hire.id, userId: hire.userId },
      {
        jobId: `proactive-${hire.id}-${new Date().toDateString()}`, // Once per day per hire
      },
    );
  }

  console.log(
    `[proactive-contact] Scheduled ${activeHires.length} proactive contact checks`,
  );
}
