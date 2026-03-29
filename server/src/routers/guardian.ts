import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc';

export const guardianRouter = router({
  // ── Get child activity summary ──────────────────────────────────────────
  getChildActivity: protectedProcedure
    .input(
      z.object({
        childId: z.string(),
        days: z.number().int().min(1).max(90).default(7),
      }),
    )
    .query(async ({ input, ctx }) => {
      // Verify guardian relationship
      const link = await ctx.prisma.familyLink.findFirst({
        where: { guardianId: ctx.user.id, childId: input.childId },
      });
      if (!link) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No guardian link found for this child' });
      }

      const since = new Date();
      since.setDate(since.getDate() - input.days);

      // Fetch child's sessions within the date range
      const sessions = await ctx.prisma.agentSession.findMany({
        where: {
          userId: input.childId,
          startedAt: { gte: since },
          status: { in: ['COMPLETED', 'ACTIVE'] },
        },
        select: {
          id: true,
          hireId: true,
          startedAt: true,
          endedAt: true,
          durationSeconds: true,
          messageCount: true,
          environmentSlug: true,
          dependencyFlag: true,
        },
        orderBy: { startedAt: 'desc' },
      });

      // Fetch child's hires with streak data
      const hires = await ctx.prisma.hire.findMany({
        where: { userId: input.childId, status: 'ACTIVE' },
        select: {
          id: true,
          streakDays: true,
          longestStreakDays: true,
          lastSessionAt: true,
          sessionCount: true,
          totalMinutes: true,
          role: { select: { name: true, companionName: true, category: true } },
        },
      });

      // Fetch wellbeing data from SessionMemory
      const memories = await ctx.prisma.sessionMemory.findMany({
        where: { hireId: { in: hires.map((h) => h.id) } },
        select: {
          hireId: true,
          wellbeingScore: true,
          wellbeingTrend: true,
        },
      });

      // Fetch safeguarding alerts for this guardian link
      const safeguardingAlerts = await ctx.prisma.guardianAlert.findMany({
        where: { familyLinkId: link.id },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });

      const totalSessionMins = sessions.reduce(
        (sum, s) => sum + Math.ceil((s.durationSeconds || 0) / 60),
        0,
      );
      const dependencyFlagCount = sessions.filter((s) => s.dependencyFlag).length;

      // Aggregate wellbeing across all hires
      const avgWellbeing =
        memories.length > 0
          ? Math.round(memories.reduce((sum, m) => sum + m.wellbeingScore, 0) / memories.length)
          : 75;
      const wellbeingTrends = memories.map((m) => m.wellbeingTrend);
      const overallTrend = wellbeingTrends.includes('declining')
        ? 'declining'
        : wellbeingTrends.includes('improving')
          ? 'improving'
          : 'stable';

      return {
        childId: input.childId,
        days: input.days,
        sessions: sessions.map((s) => ({
          id: s.id,
          hireId: s.hireId,
          startedAt: s.startedAt,
          endedAt: s.endedAt,
          durationSeconds: s.durationSeconds,
          messageCount: s.messageCount,
          environmentSlug: s.environmentSlug,
        })),
        hires: hires.map((h) => ({
          id: h.id,
          roleName: h.role.name,
          companionName: h.role.companionName,
          category: h.role.category,
          streakDays: h.streakDays,
          longestStreakDays: h.longestStreakDays,
          lastSessionAt: h.lastSessionAt,
          sessionCount: h.sessionCount,
          totalMinutes: h.totalMinutes,
        })),
        totalSessionCount: sessions.length,
        totalSessionMinutes: totalSessionMins,
        dependencyFlagCount,
        wellbeingScore: avgWellbeing,
        wellbeingTrend: overallTrend,
        safeguardingAlerts: safeguardingAlerts.map((a) => ({
          id: a.id,
          type: a.type,
          message: a.message,
          readAt: a.readAt,
          createdAt: a.createdAt,
        })),
      };
    }),

  // ── Get guardian alerts ─────────────────────────────────────────────────
  getAlerts: protectedProcedure
    .input(
      z.object({
        unreadOnly: z.boolean().default(false),
      }),
    )
    .query(async ({ input, ctx }) => {
      // Find all family links where this user is guardian
      const links = await ctx.prisma.familyLink.findMany({
        where: { guardianId: ctx.user.id },
        select: { id: true, childId: true, child: { select: { name: true } } },
      });

      if (links.length === 0) return [];

      const where: Record<string, unknown> = {
        familyLinkId: { in: links.map((l) => l.id) },
      };
      if (input.unreadOnly) {
        where.readAt = null;
      }

      const alerts = await ctx.prisma.guardianAlert.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      // Enrich with child name
      const linkMap = new Map(links.map((l) => [l.id, l]));

      return alerts.map((a) => {
        const link = linkMap.get(a.familyLinkId);
        return {
          id: a.id,
          childName: link?.child?.name || 'Unknown',
          childId: link?.childId || '',
          type: a.type,
          message: a.message,
          hireId: a.hireId,
          readAt: a.readAt,
          createdAt: a.createdAt,
        };
      });
    }),

  // ── Set daily session limit ─────────────────────────────────────────────
  setDailyLimit: protectedProcedure
    .input(
      z.object({
        childId: z.string(),
        minutes: z.number().int().min(15).max(180),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const link = await ctx.prisma.familyLink.findFirst({
        where: { guardianId: ctx.user.id, childId: input.childId },
      });
      if (!link) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No guardian link found' });
      }

      // Enforce hard 45-minute cap for children
      const child = await ctx.prisma.user.findUnique({
        where: { id: input.childId },
        select: { accountType: true },
      });
      const maxAllowed = child?.accountType === 'CHILD' ? Math.min(input.minutes, 45) : input.minutes;

      const updated = await ctx.prisma.familyLink.update({
        where: { id: link.id },
        data: { maxDailyMins: maxAllowed },
      });

      return { childId: input.childId, maxDailyMins: updated.maxDailyMins };
    }),

  // ── Dismiss alert ───────────────────────────────────────────────────────
  dismissAlert: protectedProcedure
    .input(z.object({ alertId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // Verify alert belongs to this guardian
      const alert = await ctx.prisma.guardianAlert.findUnique({
        where: { id: input.alertId },
        include: { familyLink: true },
      });
      if (!alert || alert.familyLink.guardianId !== ctx.user.id) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Alert not found' });
      }

      return ctx.prisma.guardianAlert.update({
        where: { id: input.alertId },
        data: { readAt: new Date() },
      });
    }),

  // ── Get linked children ─────────────────────────────────────────────────
  getLinkedChildren: protectedProcedure.query(async ({ ctx }) => {
    const links = await ctx.prisma.familyLink.findMany({
      where: { guardianId: ctx.user.id },
      include: {
        child: {
          select: { id: true, name: true, email: true, accountType: true, createdAt: true },
        },
      },
    });

    return links.map((l) => ({
      linkId: l.id,
      childId: l.childId,
      childName: l.child.name,
      childEmail: l.child.email,
      accountType: l.child.accountType,
      maxDailyMins: l.maxDailyMins,
      createdAt: l.createdAt,
    }));
  }),
});
