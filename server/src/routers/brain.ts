import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc';

export const brainRouter = router({
  getSyncStatus: protectedProcedure
    .input(z.object({ hireId: z.string() }))
    .query(async ({ input, ctx }) => {
      const hire = await ctx.prisma.hire.findFirst({
        where: { id: input.hireId, userId: ctx.user.id },
      });
      if (!hire) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Hire not found' });
      }

      const lastSync = await ctx.prisma.brainSyncLog.findFirst({
        where: { hireId: input.hireId, userId: ctx.user.id },
        orderBy: { syncedAt: 'desc' },
      });

      return {
        synced: !!lastSync && lastSync.syncStatus === 'success',
        lastSync: lastSync?.syncedAt ?? null,
        version: hire.brainVersion,
        fileId: hire.brainFileId,
        lastSyncStatus: lastSync?.syncStatus ?? null,
        lastSyncError: lastSync?.errorMessage ?? null,
      };
    }),

  logSync: protectedProcedure
    .input(
      z.object({
        hireId: z.string(),
        fileId: z.string(),
        fileSizeBytes: z.number().int().positive(),
        cloudDriveType: z.enum(['GOOGLE_DRIVE', 'ICLOUD', 'ONEDRIVE']),
        syncStatus: z.enum(['success', 'failed', 'conflict']),
        errorMessage: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const hire = await ctx.prisma.hire.findFirst({
        where: { id: input.hireId, userId: ctx.user.id },
      });
      if (!hire) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Hire not found' });
      }

      // Record sync log - Trust Agent never touches the Brain file itself
      const log = await ctx.prisma.brainSyncLog.create({
        data: {
          userId: ctx.user.id,
          hireId: input.hireId,
          cloudDriveType: input.cloudDriveType,
          fileId: input.fileId,
          fileSizeBytes: input.fileSizeBytes,
          syncStatus: input.syncStatus,
          errorMessage: input.errorMessage,
        },
      });

      // Update hire with latest sync info
      if (input.syncStatus === 'success') {
        await ctx.prisma.hire.update({
          where: { id: hire.id },
          data: {
            brainFileId: input.fileId,
            brainVersion: { increment: 1 },
            lastBrainSync: new Date(),
          },
        });
      }

      return { logged: true, syncLogId: log.id };
    }),

  generateSummary: protectedProcedure
    .input(z.object({ hireId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const hire = await ctx.prisma.hire.findFirst({
        where: { id: input.hireId, userId: ctx.user.id },
        include: { memory: true },
      });
      if (!hire) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Hire not found' });
      }

      if (!hire.memory) {
        return { status: 'coming_soon' as const, message: 'No session memory available yet. Complete a session first.' };
      }

      // Return the safe summary from SessionMemory
      // Brain data NEVER touches Trust Agent servers
      return {
        status: 'ok' as const,
        summary: {
          sessionCount: hire.memory.sessionCount,
          totalMinutes: hire.memory.totalMinutes,
          wellbeingScore: hire.memory.wellbeingScore,
          wellbeingTrend: hire.memory.wellbeingTrend,
          lastUpdated: hire.memory.lastUpdated,
          memorySummary: hire.memory.memorySummary,
        },
      };
    }),
});
