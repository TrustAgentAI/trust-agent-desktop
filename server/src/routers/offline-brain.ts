import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc';

/**
 * Offline Brain Access router.
 *
 * Provides endpoints for the client to sync Brain data for offline use.
 * The client-side service worker caches the Brain summary in IndexedDB.
 * When offline, the cached data is served instead.
 */
export const offlineBrainRouter = router({
  // ──────────────────────────────────────────────────────────────────────────
  // GET BRAIN SUMMARY FOR CACHING
  // Returns a cacheable summary of all user's Brain data per hire
  // ──────────────────────────────────────────────────────────────────────────
  getBrainSummary: protectedProcedure
    .input(
      z.object({
        hireId: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      const hire = await ctx.prisma.hire.findFirst({
        where: { id: input.hireId, userId: ctx.user.id },
        include: {
          role: {
            select: {
              id: true,
              name: true,
              companionName: true,
              category: true,
              environmentSlug: true,
              environmentConfig: true,
            },
          },
        },
      });

      if (!hire) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Hire not found' });
      }

      // Get session memory (Brain summary)
      const memory = await ctx.prisma.sessionMemory.findUnique({
        where: { hireId: input.hireId },
      });

      // Get latest sync log
      const lastSync = await ctx.prisma.brainSyncLog.findFirst({
        where: { hireId: input.hireId, userId: ctx.user.id },
        orderBy: { syncedAt: 'desc' },
      });

      // Get spaced repetition items due
      const dueItems = await ctx.prisma.spacedRepetitionItem.findMany({
        where: {
          hireId: input.hireId,
          dueAt: { lte: new Date(Date.now() + 24 * 60 * 60 * 1000) }, // Due within 24h
        },
        orderBy: { dueAt: 'asc' },
        take: 20,
      });

      // Get progress score
      const progressScore = await ctx.prisma.learnerProgressScore.findUnique({
        where: { hireId: input.hireId },
      });

      return {
        hireId: hire.id,
        role: hire.role,
        brainVersion: hire.brainVersion,
        lastBrainSync: hire.lastBrainSync,
        sessionCount: hire.sessionCount,
        totalMinutes: hire.totalMinutes,
        streakDays: hire.streakDays,
        memory: memory ? {
          memorySummary: memory.memorySummary,
          sessionCount: memory.sessionCount,
          totalMinutes: memory.totalMinutes,
          wellbeingScore: memory.wellbeingScore,
          wellbeingTrend: memory.wellbeingTrend,
          lastUpdated: memory.lastUpdated,
        } : null,
        lastSyncStatus: lastSync ? {
          syncStatus: lastSync.syncStatus,
          syncedAt: lastSync.syncedAt,
        } : null,
        dueReviewItems: dueItems.map((item) => ({
          id: item.id,
          concept: item.concept,
          context: item.context,
          dueAt: item.dueAt,
          repetitions: item.repetitions,
        })),
        progressScore: progressScore ? {
          overallReadiness: progressScore.overallReadiness,
          topicScores: progressScore.topicScores,
          engagementScore: progressScore.engagementScore,
          cefrLevel: progressScore.cefrLevel,
        } : null,
        // Cache metadata
        cachedAt: new Date().toISOString(),
        cacheVersion: 1,
      };
    }),

  // ──────────────────────────────────────────────────────────────────────────
  // GET ALL BRAIN SUMMARIES (for full offline cache sync)
  // ──────────────────────────────────────────────────────────────────────────
  getAllBrainSummaries: protectedProcedure.query(async ({ ctx }) => {
    const hires = await ctx.prisma.hire.findMany({
      where: { userId: ctx.user.id, status: 'ACTIVE' },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            companionName: true,
            category: true,
          },
        },
      },
    });

    const summaries = await Promise.all(
      hires.map(async (hire) => {
        const memory = await ctx.prisma.sessionMemory.findUnique({
          where: { hireId: hire.id },
        });

        return {
          hireId: hire.id,
          roleName: hire.role.name,
          companionName: hire.role.companionName,
          category: hire.role.category,
          brainVersion: hire.brainVersion,
          sessionCount: hire.sessionCount,
          totalMinutes: hire.totalMinutes,
          streakDays: hire.streakDays,
          wellbeingScore: memory?.wellbeingScore ?? null,
          lastSessionAt: hire.lastSessionAt,
          lastBrainSync: hire.lastBrainSync,
        };
      })
    );

    return {
      summaries,
      cachedAt: new Date().toISOString(),
      cacheVersion: 1,
    };
  }),

  // ──────────────────────────────────────────────────────────────────────────
  // SYNC OFFLINE ACTIONS - upload actions recorded while offline
  // ──────────────────────────────────────────────────────────────────────────
  syncOfflineActions: protectedProcedure
    .input(
      z.object({
        actions: z.array(
          z.object({
            type: z.enum(['spaced_rep_review', 'session_note']),
            hireId: z.string(),
            data: z.record(z.string(), z.any()),
            timestamp: z.string().datetime(),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      let synced = 0;

      for (const action of input.actions) {
        // Verify hire ownership
        const hire = await ctx.prisma.hire.findFirst({
          where: { id: action.hireId, userId: ctx.user.id },
        });
        if (!hire) continue;

        if (action.type === 'spaced_rep_review' && action.data.itemId && action.data.quality != null) {
          // Update spaced repetition item
          const item = await ctx.prisma.spacedRepetitionItem.findFirst({
            where: { id: action.data.itemId as string, hireId: action.hireId },
          });

          if (item) {
            const quality = Math.min(5, Math.max(0, action.data.quality as number));
            // SM-2 algorithm update
            let newEf = item.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
            if (newEf < 1.3) newEf = 1.3;

            let newInterval: number;
            let newReps: number;
            if (quality < 3) {
              newInterval = 1;
              newReps = 0;
            } else {
              newReps = item.repetitions + 1;
              if (newReps === 1) newInterval = 1;
              else if (newReps === 2) newInterval = 6;
              else newInterval = Math.round(item.interval * newEf);
            }

            const dueAt = new Date(Date.now() + newInterval * 24 * 60 * 60 * 1000);

            await ctx.prisma.spacedRepetitionItem.update({
              where: { id: item.id },
              data: {
                easeFactor: newEf,
                interval: newInterval,
                repetitions: newReps,
                dueAt,
                lastReview: new Date(action.timestamp),
              },
            });

            synced++;
          }
        }
      }

      return { synced, total: input.actions.length };
    }),
});
