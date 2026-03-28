/**
 * BullMQ Notification Worker
 * Processes notification jobs: sends email notifications and creates in-app Notification records.
 */

import { Queue, Worker, type Job } from 'bullmq';
import IORedis from 'ioredis';
import nodemailer from 'nodemailer';
import { prisma } from '../lib/prisma';

// ---------------------------------------------------------------------------
// Redis connection for BullMQ
// ---------------------------------------------------------------------------

const redisConnection = new IORedis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
});

// ---------------------------------------------------------------------------
// Email transporter (configured via environment)
// ---------------------------------------------------------------------------

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.sendgrid.net',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || 'apikey',
    pass: process.env.SMTP_PASS || process.env.SENDGRID_API_KEY || '',
  },
});

const FROM_EMAIL = process.env.FROM_EMAIL || 'notifications@trust-agent.ai';
const FROM_NAME = process.env.FROM_NAME || 'Trust Agent';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EmailNotificationJob {
  type: 'hitl_alert' | 'audit_complete' | 'generic_email';
  to: string;
  subject: string;
  body: string;
}

export interface InAppNotificationJob {
  type: 'audit_complete' | 'session_reminder' | 'streak_at_risk' | 'milestone_reached' |
        'progress_update' | 'guardian_alert' | 'wellbeing_signal' | 'brain_sync_failed' |
        'payout_ready';
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  priority?: 'normal' | 'high';
}

export type NotificationJobData = EmailNotificationJob | InAppNotificationJob;

// Type guard
function isEmailJob(job: NotificationJobData): job is EmailNotificationJob {
  return 'to' in job && 'subject' in job;
}

// Map internal types to Prisma NotifType enum
const NOTIF_TYPE_MAP: Record<string, string> = {
  audit_complete: 'AUDIT_COMPLETE',
  session_reminder: 'SESSION_REMINDER',
  streak_at_risk: 'STREAK_AT_RISK',
  milestone_reached: 'MILESTONE_REACHED',
  progress_update: 'PROGRESS_UPDATE',
  guardian_alert: 'GUARDIAN_ALERT',
  wellbeing_signal: 'WELLBEING_SIGNAL',
  brain_sync_failed: 'BRAIN_SYNC_FAILED',
  payout_ready: 'PAYOUT_READY',
};

// ---------------------------------------------------------------------------
// Queue
// ---------------------------------------------------------------------------

export const notificationQueue = new Queue<NotificationJobData>('notifications', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 3000 },
    removeOnComplete: { count: 500 },
    removeOnFail: { count: 100 },
  },
});

/**
 * Add a notification job to the queue.
 */
export async function addNotificationJob(data: NotificationJobData): Promise<string> {
  const job = await notificationQueue.add('send-notification', data, {
    priority: (!isEmailJob(data) && data.priority === 'high') ? 1 : 10,
  });
  return job.id!;
}

// ---------------------------------------------------------------------------
// Worker
// ---------------------------------------------------------------------------

export const notificationWorker = new Worker<NotificationJobData>(
  'notifications',
  async (job: Job<NotificationJobData>) => {
    const data = job.data;

    if (isEmailJob(data)) {
      await processEmailNotification(data);
    } else {
      await processInAppNotification(data);
    }
  },
  {
    connection: redisConnection,
    concurrency: 5,
    limiter: { max: 20, duration: 60000 }, // Max 20 notifications per minute
  }
);

notificationWorker.on('completed', (job) => {
  console.log(`Notification job ${job.id} completed`);
});

notificationWorker.on('failed', (job, err) => {
  console.error(`Notification job ${job?.id} failed:`, err.message);
});

// ---------------------------------------------------------------------------
// Email notification processor
// ---------------------------------------------------------------------------

async function processEmailNotification(data: EmailNotificationJob): Promise<void> {
  await transporter.sendMail({
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to: data.to,
    subject: data.subject,
    text: data.body,
    html: wrapEmailHtml(data.subject, data.body),
  });
}

// ---------------------------------------------------------------------------
// In-app notification processor
// ---------------------------------------------------------------------------

async function processInAppNotification(data: InAppNotificationJob): Promise<void> {
  const notifType = NOTIF_TYPE_MAP[data.type];
  if (!notifType) {
    throw new Error(`Unknown notification type: ${data.type}`);
  }

  await prisma.notification.create({
    data: {
      userId: data.userId,
      type: notifType as any,
      title: data.title,
      body: data.body,
      data: data.data ?? undefined,
      priority: data.priority || 'normal',
    },
  });
}

// ---------------------------------------------------------------------------
// Simple HTML email wrapper
// ---------------------------------------------------------------------------

function wrapEmailHtml(subject: string, body: string): string {
  const escapedBody = body
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${subject}</title></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <div style="background: #1a1a2e; padding: 24px; border-radius: 12px; color: #fff; margin-bottom: 24px;">
    <h1 style="margin: 0; font-size: 20px; font-weight: 600;">Trust Agent</h1>
  </div>
  <div style="padding: 16px 0;">
    <p style="font-size: 15px; line-height: 1.6;">${escapedBody}</p>
  </div>
  <div style="border-top: 1px solid #eee; padding-top: 16px; margin-top: 24px; font-size: 12px; color: #999;">
    <p>AgentCore LTD - trust-agent.ai</p>
  </div>
</body>
</html>`;
}
