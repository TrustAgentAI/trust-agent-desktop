/**
 * BullMQ Daily Mission Metrics Job
 * Calculates and stores mission metrics once per day.
 * Scheduled via BullMQ repeatable job (runs at 02:00 UTC daily).
 */

import { Queue, Worker, type Job } from 'bullmq';
import IORedis from 'ioredis';
import { prisma } from '../lib/prisma';
import { calculateAndStoreMissionMetrics } from '../lib/safeguarding/missionMetrics';

// Redis connection for BullMQ
const redisConnection = new IORedis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
});

// Queue
export const missionMetricsQueue = new Queue('mission-metrics', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { count: 30 },
    removeOnFail: { count: 10 },
  },
});

// Worker
export const missionMetricsWorker = new Worker(
  'mission-metrics',
  async (job: Job) => {
    const period = (job.data?.period as 'daily' | 'weekly' | 'monthly') || 'daily';
    console.log(`[mission-metrics] Starting ${period} metrics calculation...`);

    const result = await calculateAndStoreMissionMetrics(prisma, period);

    console.log(`[mission-metrics] Completed: lives=${result.livesChanged}, nhs=${result.nhsReferrals}, exams=${result.examsSupported}, loneliness=${result.lonelinessReduced}, skills=${result.skillsLearned}`);

    return result;
  },
  {
    connection: redisConnection,
    concurrency: 1,
  },
);

missionMetricsWorker.on('completed', (job) => {
  console.log(`[mission-metrics] Job ${job.id} completed`);
});

missionMetricsWorker.on('failed', (job, err) => {
  console.error(`[mission-metrics] Job ${job?.id} failed:`, err.message);
});

/**
 * Schedule the daily mission metrics job.
 * Call this once at server startup.
 */
export async function scheduleMissionMetricsJob(): Promise<void> {
  // Remove any existing repeatable jobs to avoid duplicates
  const existingJobs = await missionMetricsQueue.getRepeatableJobs();
  for (const job of existingJobs) {
    await missionMetricsQueue.removeRepeatableByKey(job.key);
  }

  // Schedule daily at 02:00 UTC
  await missionMetricsQueue.add(
    'daily-metrics',
    { period: 'daily' },
    {
      repeat: {
        pattern: '0 2 * * *', // Every day at 02:00 UTC
      },
    },
  );

  console.log('[mission-metrics] Daily job scheduled at 02:00 UTC');
}
