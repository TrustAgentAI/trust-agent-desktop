/**
 * trackCheckpoint.ts - Aha Moment Funnel Tracking
 *
 * Called at every step of the onboarding funnel.
 * This data tells us exactly where users drop off and why.
 *
 * PLG benchmark: 65%+ activation rate. Time-to-Aha: under 3 minutes.
 */

import { prisma } from '../prisma';

export type CheckpointStep =
  | 'landed'           // Hit homepage
  | 'quiz_started'     // Started the 8-question quiz
  | 'quiz_completed'   // Finished quiz, got recommendation
  | 'companion_viewed' // Clicked into recommended companion
  | 'hired'            // Completed hire
  | 'first_session'    // Started first session
  | 'aha_moment_reached'; // Companion referenced quiz data in first message

export async function trackCheckpoint(
  step: CheckpointStep,
  context: {
    userId?: string;
    sessionToken?: string;
    quizAnswers?: Record<string, unknown>;
    recommendedSlug?: string;
    device?: string;
    referralSource?: string;
  },
): Promise<void> {
  // Get previous checkpoint to compute duration
  const previous = await prisma.onboardingCheckpoint.findFirst({
    where: {
      ...(context.userId ? { userId: context.userId } : { sessionToken: context.sessionToken }),
    },
    orderBy: { completedAt: 'desc' },
    select: { completedAt: true },
  });

  const durationSeconds = previous
    ? Math.round((Date.now() - previous.completedAt.getTime()) / 1000)
    : null;

  await prisma.onboardingCheckpoint.create({
    data: {
      userId: context.userId ?? null,
      sessionToken: context.sessionToken ?? null,
      step,
      durationSeconds,
      quizAnswers: context.quizAnswers as any ?? null,
      recommendedSlug: context.recommendedSlug ?? null,
      device: context.device ?? null,
      referralSource: context.referralSource ?? null,
    },
  });
}

// Admin: funnel analysis query
export async function getOnboardingFunnelData(days = 30) {
  const since = new Date(Date.now() - days * 86400000);

  const steps: CheckpointStep[] = [
    'landed', 'quiz_started', 'quiz_completed',
    'companion_viewed', 'hired', 'first_session', 'aha_moment_reached',
  ];

  const counts = await Promise.all(
    steps.map(step =>
      prisma.onboardingCheckpoint.count({
        where: { step, completedAt: { gte: since } },
      })
    )
  );

  const avgTimes = await Promise.all(
    steps.map(step =>
      prisma.onboardingCheckpoint.aggregate({
        where: { step, completedAt: { gte: since }, durationSeconds: { not: null } },
        _avg: { durationSeconds: true },
      })
    )
  );

  return steps.map((step, i) => ({
    step,
    count: counts[i],
    conversionFromPrevious: i > 0 && counts[i - 1] > 0
      ? Math.round((counts[i] / counts[i - 1]) * 100)
      : 100,
    avgSecondsFromPrevious: Math.round(avgTimes[i]._avg.durationSeconds ?? 0),
  }));
}
