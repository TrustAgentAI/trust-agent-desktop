/**
 * B.9 Schedule Checker Worker
 *
 * BullMQ repeatable job that checks for upcoming scheduled sessions
 * and creates SESSION_REMINDER notifications 10 minutes before.
 */

import { Queue, Worker, type Job } from 'bullmq';
import IORedis from 'ioredis';
import { prisma } from '../lib/prisma';
import { checkSchedulesAndNotify } from '../routers/scheduling';

// ---------------------------------------------------------------------------
// Redis connection
// ---------------------------------------------------------------------------

const redisConnection = new IORedis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
});

// ---------------------------------------------------------------------------
// Queue
// ---------------------------------------------------------------------------

export const scheduleCheckerQueue = new Queue('schedule-checker', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
});

// ---------------------------------------------------------------------------
// Register repeatable job (runs every 5 minutes)
// ---------------------------------------------------------------------------

export async function registerScheduleChecker(): Promise<void> {
  // Remove any existing repeatable jobs first
  const existing = await scheduleCheckerQueue.getRepeatableJobs();
  for (const job of existing) {
    await scheduleCheckerQueue.removeRepeatableByKey(job.key);
  }

  // Add new repeatable job - every 5 minutes
  await scheduleCheckerQueue.add(
    'check-schedules',
    {},
    {
      repeat: { every: 5 * 60 * 1000 }, // 5 minutes
    }
  );

  console.log('Schedule checker registered: runs every 5 minutes');
}

// ---------------------------------------------------------------------------
// Worker
// ---------------------------------------------------------------------------

export const scheduleCheckerWorker = new Worker(
  'schedule-checker',
  async (_job: Job) => {
    const count = await checkSchedulesAndNotify(prisma);
    if (count > 0) {
      console.log(`Schedule checker: sent ${count} session reminders`);
    }
  },
  {
    connection: redisConnection,
    concurrency: 1,
  }
);

scheduleCheckerWorker.on('completed', (job) => {
  console.log(`Schedule check job ${job.id} completed`);
});

scheduleCheckerWorker.on('failed', (job, err) => {
  console.error(`Schedule check job ${job?.id} failed:`, err.message);
});
