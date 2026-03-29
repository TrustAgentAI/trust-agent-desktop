import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc';

// ── Milestone definitions ────────────────────────────────────────────────

const STREAK_MILESTONES = [
  { threshold: 3, type: 'STREAK_3', label: '3-Day Streak' },
  { threshold: 7, type: 'STREAK_7', label: '7-Day Streak' },
  { threshold: 14, type: 'STREAK_14', label: '14-Day Streak' },
  { threshold: 30, type: 'STREAK_30', label: '30-Day Streak' },
  { threshold: 100, type: 'STREAK_100', label: '100-Day Streak' },
];

const SESSION_MILESTONES = [
  { threshold: 1, type: 'FIRST_SESSION', label: 'First Session' },
  { threshold: 10, type: 'SESSION_10', label: '10 Sessions' },
  { threshold: 25, type: 'SESSION_25', label: '25 Sessions' },
  { threshold: 50, type: 'SESSION_50', label: '50 Sessions' },
  { threshold: 100, type: 'SESSION_100', label: '100 Sessions' },
];

const TIME_MILESTONES = [
  { threshold: 60, type: 'TIME_1H', label: '1 Hour Total' },
  { threshold: 300, type: 'TIME_5H', label: '5 Hours Total' },
  { threshold: 600, type: 'TIME_10H', label: '10 Hours Total' },
  { threshold: 1500, type: 'TIME_25H', label: '25 Hours Total' },
];

export { STREAK_MILESTONES, SESSION_MILESTONES, TIME_MILESTONES };

/**
 * Checks and awards any newly earned milestones based on hire stats.
 * Called from sessions.endSession after updating streak data.
 */
export async function checkAndAwardMilestones(
  prisma: any,
  userId: string,
  hireId: string,
  hire: { streakDays: number; sessionCount: number; totalMinutes: number },
) {
  const newMilestones: { type: string; hireId: string }[] = [];

  // Check streak milestones
  for (const ms of STREAK_MILESTONES) {
    if (hire.streakDays >= ms.threshold) {
      const exists = await prisma.milestone.findFirst({
        where: { userId, hireId, type: ms.type },
      });
      if (!exists) {
        newMilestones.push({ type: ms.type, hireId });
      }
    }
  }

  // Check session count milestones
  for (const ms of SESSION_MILESTONES) {
    if (hire.sessionCount >= ms.threshold) {
      const exists = await prisma.milestone.findFirst({
        where: { userId, hireId, type: ms.type },
      });
      if (!exists) {
        newMilestones.push({ type: ms.type, hireId });
      }
    }
  }

  // Check time milestones
  for (const ms of TIME_MILESTONES) {
    if (hire.totalMinutes >= ms.threshold) {
      const exists = await prisma.milestone.findFirst({
        where: { userId, hireId, type: ms.type },
      });
      if (!exists) {
        newMilestones.push({ type: ms.type, hireId });
      }
    }
  }

  // Create all new milestones
  if (newMilestones.length > 0) {
    await prisma.milestone.createMany({
      data: newMilestones.map((m) => ({
        userId,
        hireId: m.hireId,
        type: m.type,
      })),
    });
  }

  return newMilestones;
}

export const milestonesRouter = router({
  getMilestones: protectedProcedure
    .input(
      z.object({
        hireId: z.string().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const where: Record<string, unknown> = { userId: ctx.user.id };
      if (input.hireId) where.hireId = input.hireId;

      const milestones = await ctx.prisma.milestone.findMany({
        where,
        orderBy: { achievedAt: 'desc' },
      });

      // Map type to label
      const allDefs = [...STREAK_MILESTONES, ...SESSION_MILESTONES, ...TIME_MILESTONES];
      const labelMap = new Map(allDefs.map((d) => [d.type, d.label]));

      return milestones.map((m) => ({
        id: m.id,
        hireId: m.hireId,
        type: m.type,
        label: labelMap.get(m.type) || m.type.replace(/_/g, ' '),
        achievedAt: m.achievedAt,
        celebrated: m.celebrated,
      }));
    }),

  celebrateMilestone: protectedProcedure
    .input(z.object({ milestoneId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const milestone = await ctx.prisma.milestone.findFirst({
        where: { id: input.milestoneId, userId: ctx.user.id },
      });
      if (!milestone) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Milestone not found' });
      }

      return ctx.prisma.milestone.update({
        where: { id: input.milestoneId },
        data: { celebrated: true },
      });
    }),
});
