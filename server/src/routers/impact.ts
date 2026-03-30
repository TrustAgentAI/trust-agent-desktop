/**
 * Impact / Mission Metrics Router
 * Public-facing impact page and admin mission metrics.
 */

import { z } from 'zod';
import { router, publicProcedure, adminProcedure } from '../trpc';

export const impactRouter = router({
  // Public: get live mission metrics for /impact page
  liveMetrics: publicProcedure
    .input(
      z.object({
        days: z.number().int().min(1).max(365).default(30),
      }).optional()
    )
    .query(async ({ input, ctx }) => {
      const days = input?.days ?? 30;
      const since = new Date(Date.now() - days * 86400000);

      // Count lives changed: users who completed 10+ sessions
      const sessionsByUser = await ctx.prisma.agentSession.groupBy({
        by: ['userId'],
        _count: { id: true },
        where: { status: 'COMPLETED' },
      });
      const livesChanged = sessionsByUser.filter((u) => u._count.id >= 10).length;

      // NHS referrals activated
      const nhsReferrals = await ctx.prisma.nHSReferralActivation.count();

      // Exams supported: exam-mode sessions completed
      const examsSupported = await ctx.prisma.agentSession.count({
        where: {
          examMode: true,
          status: 'COMPLETED',
          startedAt: { gte: since },
        },
      });

      // Loneliness reduced: elderly users with 20+ companion sessions
      const elderlyUsers = await ctx.prisma.user.findMany({
        where: { accountType: 'ELDERLY' },
        select: { id: true },
      });
      let lonelinessReduced = 0;
      if (elderlyUsers.length > 0) {
        const elderlyIds = elderlyUsers.map((u) => u.id);
        const elderlySessions = await ctx.prisma.agentSession.groupBy({
          by: ['userId'],
          _count: { id: true },
          where: {
            userId: { in: elderlyIds },
            status: 'COMPLETED',
          },
        });
        lonelinessReduced = elderlySessions.filter((u) => u._count.id >= 20).length;
      }

      // Skills learned: count of milestone achievements
      const skillsLearned = await ctx.prisma.milestone.count({
        where: { achievedAt: { gte: since } },
      });

      // Total users
      const totalUsers = await ctx.prisma.user.count();

      // Total sessions
      const totalSessions = await ctx.prisma.agentSession.count({
        where: { status: 'COMPLETED' },
      });

      // Stored mission metrics (from daily BullMQ job)
      const storedMetrics = await ctx.prisma.missionMetric.groupBy({
        by: ['metricType'],
        _count: { id: true },
        _sum: { metricValue: true },
        where: { recordedAt: { gte: since } },
      });

      return {
        livesChanged,
        nhsReferrals,
        examsSupported,
        lonelinessReduced,
        skillsLearned,
        totalUsers,
        totalSessions,
        storedMetrics: storedMetrics.map((m) => ({
          type: m.metricType,
          count: m._count.id,
          totalValue: m._sum.metricValue || 0,
        })),
        periodDays: days,
        generatedAt: new Date().toISOString(),
      };
    }),

  // Admin: detailed mission impact report
  adminReport: adminProcedure
    .input(
      z.object({
        days: z.number().int().min(1).max(365).default(30),
      }).optional()
    )
    .query(async ({ input, ctx }) => {
      const days = input?.days ?? 30;
      const since = new Date(Date.now() - days * 86400000);

      const metrics = await ctx.prisma.missionMetric.groupBy({
        by: ['metricType'],
        _count: { id: true },
        _avg: { metricValue: true },
        _sum: { metricValue: true },
        where: { recordedAt: { gte: since } },
        orderBy: { _count: { id: 'desc' } },
      });

      const totalImpactedUsers = await ctx.prisma.missionMetric.findMany({
        where: { recordedAt: { gte: since }, userId: { not: null } },
        distinct: ['userId'],
        select: { userId: true },
      });

      return {
        metrics: metrics.map((m) => ({
          type: m.metricType,
          count: m._count.id,
          averageValue: m._avg.metricValue,
          totalValue: m._sum.metricValue,
        })),
        livesImpacted: totalImpactedUsers.length,
        periodDays: days,
        generatedAt: new Date().toISOString(),
      };
    }),

  // Admin: record a mission metric manually (for curated impact stories)
  recordMetric: adminProcedure
    .input(
      z.object({
        metricType: z.string(),
        metricValue: z.number().default(1),
        description: z.string().optional(),
        userId: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.prisma.missionMetric.create({
        data: {
          metricType: input.metricType,
          metricValue: input.metricValue,
          description: input.description,
          userId: input.userId,
        },
      });
    }),
});
