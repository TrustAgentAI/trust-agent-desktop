import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc';

export const sessionsRouter = router({
  startSession: protectedProcedure
    .input(
      z.object({
        hireId: z.string(),
        inputMode: z.enum(['TEXT', 'VOICE', 'MIXED']).default('TEXT'),
        examMode: z.boolean().default(false),
        redTeamMode: z.boolean().default(false),
        presenceMode: z.boolean().default(false),
        timeBudgetMins: z.number().int().min(5).max(180).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Verify the hire belongs to this user and is active
      const hire = await ctx.prisma.hire.findFirst({
        where: { id: input.hireId, userId: ctx.user.id, status: 'ACTIVE' },
        include: { role: true },
      });
      if (!hire) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Active hire not found' });
      }

      // Check daily session limits (for child accounts)
      if (hire.role.maxDailySessionMins) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todaySessions = await ctx.prisma.agentSession.aggregate({
          where: {
            hireId: hire.id,
            startedAt: { gte: today },
            status: { in: ['ACTIVE', 'COMPLETED'] },
          },
          _sum: { durationSeconds: true },
        });
        const usedMins = Math.floor((todaySessions._sum.durationSeconds || 0) / 60);
        if (usedMins >= hire.role.maxDailySessionMins) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: `Daily session limit of ${hire.role.maxDailySessionMins} minutes reached`,
          });
        }
      }

      // Check for already active sessions on this hire
      const activeSession = await ctx.prisma.agentSession.findFirst({
        where: { hireId: hire.id, status: 'ACTIVE' },
      });
      if (activeSession) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'An active session already exists for this hire. End it before starting a new one.',
        });
      }

      const session = await ctx.prisma.agentSession.create({
        data: {
          userId: ctx.user.id,
          hireId: hire.id,
          status: 'ACTIVE',
          inputMode: input.inputMode,
          environmentSlug: hire.customEnvironment || hire.role.environmentSlug,
          examMode: input.examMode,
          redTeamMode: input.redTeamMode,
          presenceMode: input.presenceMode,
          timeBudgetMins: input.timeBudgetMins,
        },
      });

      // Return session metadata - NEVER return systemPrompt
      return {
        sessionId: session.id,
        environmentSlug: session.environmentSlug,
        environmentConfig: hire.role.environmentConfig,
        inputMode: session.inputMode,
        companionName: hire.customCompanionName || hire.role.companionName,
        roleName: hire.role.name,
        maxSessionMinutes: hire.role.maxSessionMinutes,
      };
    }),

  endSession: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const session = await ctx.prisma.agentSession.findFirst({
        where: { id: input.sessionId, userId: ctx.user.id, status: 'ACTIVE' },
      });
      if (!session) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Active session not found' });
      }

      const endedAt = new Date();
      const durationSeconds = Math.floor((endedAt.getTime() - session.startedAt.getTime()) / 1000);

      // Update session
      const updated = await ctx.prisma.agentSession.update({
        where: { id: session.id },
        data: {
          status: 'COMPLETED',
          endedAt,
          durationSeconds,
        },
      });

      // Update hire stats
      const durationMins = Math.ceil(durationSeconds / 60);
      await ctx.prisma.hire.update({
        where: { id: session.hireId },
        data: {
          sessionCount: { increment: 1 },
          totalMinutes: { increment: durationMins },
          lastSessionAt: endedAt,
        },
      });

      // Return metadata only - NO message content
      return {
        sessionId: updated.id,
        durationSeconds,
        messageCount: updated.messageCount,
        status: updated.status,
        endedAt: updated.endedAt,
      };
    }),

  listSessions: protectedProcedure
    .input(
      z.object({
        hireId: z.string().optional(),
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(50).default(20),
      })
    )
    .query(async ({ input, ctx }) => {
      const where: Record<string, unknown> = { userId: ctx.user.id };
      if (input.hireId) where.hireId = input.hireId;

      const skip = (input.page - 1) * input.limit;

      const [sessions, total] = await Promise.all([
        ctx.prisma.agentSession.findMany({
          where,
          select: {
            id: true,
            hireId: true,
            status: true,
            inputMode: true,
            environmentSlug: true,
            examMode: true,
            startedAt: true,
            endedAt: true,
            durationSeconds: true,
            messageCount: true,
            deviceType: true,
            // NO message content - metadata only
          },
          skip,
          take: input.limit,
          orderBy: { startedAt: 'desc' },
        }),
        ctx.prisma.agentSession.count({ where }),
      ]);

      return {
        sessions,
        total,
        page: input.page,
        totalPages: Math.ceil(total / input.limit),
      };
    }),

  getSessionMeta: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ input, ctx }) => {
      const session = await ctx.prisma.agentSession.findFirst({
        where: { id: input.sessionId, userId: ctx.user.id },
        select: {
          id: true,
          hireId: true,
          status: true,
          inputMode: true,
          environmentSlug: true,
          examMode: true,
          redTeamMode: true,
          presenceMode: true,
          startedAt: true,
          endedAt: true,
          durationSeconds: true,
          messageCount: true,
          deviceType: true,
          sessionMinsToday: true,
          dependencyFlag: true,
          // NO message content
        },
      });

      if (!session) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Session not found' });
      }

      return session;
    }),
});
