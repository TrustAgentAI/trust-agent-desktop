/**
 * Mission Metrics Calculator
 * Calculates and stores mission impact metrics.
 * Called by BullMQ daily job and also available for ad-hoc computation.
 *
 * Metric types:
 *   LIVES_CHANGED      - Users who completed 10+ sessions
 *   NHS_REFERRALS      - Count of NHS code activations
 *   EXAMS_PASSED       - Count of exam-mode sessions completed
 *   LONELINESS_REDUCED - Elderly users with 20+ companion sessions
 *   SKILLS_LEARNED     - Count of milestone achievements
 */

import type { PrismaClient } from '@prisma/client';

export interface MissionMetricsResult {
  livesChanged: number;
  nhsReferrals: number;
  examsSupported: number;
  lonelinessReduced: number;
  skillsLearned: number;
  calculatedAt: string;
}

/**
 * Calculate all mission metrics and store them in the database.
 * Called daily by BullMQ job.
 */
export async function calculateAndStoreMissionMetrics(
  prisma: PrismaClient,
  period: 'daily' | 'weekly' | 'monthly' = 'daily',
): Promise<MissionMetricsResult> {
  const now = new Date();

  // Lives changed: count of users who completed 10+ sessions (all time)
  const livesChangedResult = await prisma.agentSession.groupBy({
    by: ['userId'],
    _count: { id: true },
    where: { status: 'COMPLETED' },
    having: { id: { _count: { gte: 10 } } },
  });
  const livesChanged = livesChangedResult.length;

  // NHS referrals activated (all time)
  const nhsReferrals = await prisma.nHSReferralActivation.count();

  // Exams supported: exam-mode sessions completed (all time)
  const examsSupported = await prisma.agentSession.count({
    where: { examMode: true, status: 'COMPLETED' },
  });

  // Loneliness reduced: count distinct elderly users with 20+ sessions
  const elderlyUserSessions = await prisma.agentSession.groupBy({
    by: ['userId'],
    _count: { id: true },
    where: {
      status: 'COMPLETED',
      user: { accountType: 'ELDERLY' },
    },
    having: { id: { _count: { gte: 20 } } },
  });
  const lonelinessReduced = elderlyUserSessions.length;

  // Skills learned: total milestones achieved (all time)
  const skillsLearned = await prisma.milestone.count();

  // Store each metric
  const metrics = [
    { metricType: 'LIVES_CHANGED', metricValue: livesChanged },
    { metricType: 'NHS_REFERRALS', metricValue: nhsReferrals },
    { metricType: 'EXAMS_PASSED', metricValue: examsSupported },
    { metricType: 'LONELINESS_REDUCED', metricValue: lonelinessReduced },
    { metricType: 'SKILLS_LEARNED', metricValue: skillsLearned },
  ];

  for (const metric of metrics) {
    await prisma.missionMetric.create({
      data: {
        metricType: metric.metricType,
        metricValue: metric.metricValue,
        value: metric.metricValue,
        period,
        calculatedAt: now,
        description: `${period} calculation: ${metric.metricType} = ${metric.metricValue}`,
      },
    });
  }

  return {
    livesChanged,
    nhsReferrals,
    examsSupported,
    lonelinessReduced,
    skillsLearned,
    calculatedAt: now.toISOString(),
  };
}
