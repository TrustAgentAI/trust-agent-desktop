import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc';

export const brainRouter = router({
  // ── Existing: Cloud sync status ──────────────────────────────────────────
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

  // ── Existing: Log sync event ─────────────────────────────────────────────
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

  // ── Existing: Generate summary ───────────────────────────────────────────
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
        return { status: 'no_data' as const, message: 'No session memory available yet. Complete a session first.' };
      }

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

  // ════════════════════════════════════════════════════════════════════════
  // VISIBLE BRAIN - Memory Notes (Relationship Journal)
  // ════════════════════════════════════════════════════════════════════════

  // Get all memory notes for a hire - the relationship journal (paginated)
  getMemoryNotes: protectedProcedure
    .input(z.object({
      hireId: z.string(),
      limit: z.number().int().min(1).max(100).default(20),
      cursor: z.string().optional(),
      entryType: z.string().optional(), // Filter by type
    }))
    .query(async ({ ctx, input }) => {
      // Verify ownership
      await ctx.prisma.hire.findFirstOrThrow({
        where: { id: input.hireId, userId: ctx.user.id },
      });

      const where: Record<string, unknown> = { hireId: input.hireId };
      if (input.entryType) {
        where.entryType = input.entryType;
      }

      const items = await ctx.prisma.brainMemoryEntry.findMany({
        where,
        orderBy: { entryDate: 'desc' },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        select: {
          id: true,
          entryType: true,
          entryDate: true,
          content: true,
          topicsCovered: true,
          nextFocus: true,
          correctRate: true,
          breakthrough: true,
          userEdited: true,
          userAddedNote: true,
          sessionId: true,
        },
      });

      const hasMore = items.length > input.limit;
      const notes = hasMore ? items.slice(0, -1) : items;

      return {
        notes,
        nextCursor: hasMore ? notes[notes.length - 1]?.id : null,
        total: await ctx.prisma.brainMemoryEntry.count({ where }),
      };
    }),

  // User edits a memory note (their right - it is their Brain)
  editMemoryNote: protectedProcedure
    .input(z.object({
      entryId: z.string(),
      content: z.string().min(1).max(3000).optional(),
      userAddedNote: z.string().max(1000).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership through hire chain
      const entry = await ctx.prisma.brainMemoryEntry.findFirstOrThrow({
        where: {
          id: input.entryId,
          hire: { userId: ctx.user.id },
        },
      });

      return ctx.prisma.brainMemoryEntry.update({
        where: { id: entry.id },
        data: {
          ...(input.content !== undefined && { content: input.content }),
          ...(input.userAddedNote !== undefined && { userAddedNote: input.userAddedNote }),
          userEdited: true,
          userEditAt: new Date(),
        },
      });
    }),

  // Get Brain summary for a hire (shown on companion card and journal header)
  getBrainSummary: protectedProcedure
    .input(z.object({ hireId: z.string() }))
    .query(async ({ ctx, input }) => {
      const hire = await ctx.prisma.hire.findFirstOrThrow({
        where: { id: input.hireId, userId: ctx.user.id },
        include: {
          role: { select: { companionName: true, name: true, category: true } },
          memory: true,
          brainMemoryEntries: {
            take: 1,
            orderBy: { entryDate: 'desc' },
            select: { content: true, nextFocus: true, entryDate: true },
          },
          milestones: { orderBy: { achievedAt: 'desc' }, take: 5 },
        },
      });

      // Count entries by type for the overview
      const entryCounts = await ctx.prisma.brainMemoryEntry.groupBy({
        by: ['entryType'],
        where: { hireId: input.hireId },
        _count: { id: true },
      });

      const countsByType: Record<string, number> = {};
      for (const row of entryCounts) {
        countsByType[row.entryType] = row._count.id;
      }

      // Get all unique topics covered
      const allEntries = await ctx.prisma.brainMemoryEntry.findMany({
        where: { hireId: input.hireId },
        select: { topicsCovered: true },
      });
      const allTopics = new Set<string>();
      for (const entry of allEntries) {
        for (const topic of entry.topicsCovered) {
          allTopics.add(topic);
        }
      }

      return {
        companionName: hire.role.companionName,
        roleName: hire.role.name,
        category: hire.role.category,
        sessionCount: hire.sessionCount,
        totalMinutes: hire.totalMinutes,
        streakDays: hire.streakDays,
        lastSessionAt: hire.lastSessionAt,
        lastNote: hire.brainMemoryEntries[0] ?? null,
        milestones: hire.milestones,
        wellbeingScore: hire.memory?.wellbeingScore ?? null,
        wellbeingTrend: hire.memory?.wellbeingTrend ?? null,
        entryCounts: countsByType,
        topicsCovered: Array.from(allTopics),
        totalEntries: Object.values(countsByType).reduce((a, b) => a + b, 0),
      };
    }),

  // Get relationship journal - a formatted narrative of the companion relationship
  getRelationshipJournal: protectedProcedure
    .input(z.object({ hireId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Verify ownership
      const hire = await ctx.prisma.hire.findFirstOrThrow({
        where: { id: input.hireId, userId: ctx.user.id },
        include: {
          role: { select: { companionName: true, name: true } },
        },
      });

      // Get all breakthroughs
      const breakthroughs = await ctx.prisma.brainMemoryEntry.findMany({
        where: { hireId: input.hireId, entryType: 'BREAKTHROUGH' },
        orderBy: { entryDate: 'asc' },
        select: { content: true, entryDate: true },
      });

      // Get all topics mastered
      const mastered = await ctx.prisma.brainMemoryEntry.findMany({
        where: { hireId: input.hireId, entryType: 'TOPIC_MASTERED' },
        orderBy: { entryDate: 'asc' },
        select: { content: true, entryDate: true },
      });

      // Get struggles that were later resolved (appeared in mastered)
      const struggles = await ctx.prisma.brainMemoryEntry.findMany({
        where: { hireId: input.hireId, entryType: 'STRUGGLE_NOTED' },
        orderBy: { entryDate: 'asc' },
        select: { content: true, entryDate: true },
      });

      // Get goals
      const goals = await ctx.prisma.brainMemoryEntry.findMany({
        where: { hireId: input.hireId, entryType: 'GOAL_SET' },
        orderBy: { entryDate: 'asc' },
        select: { content: true, entryDate: true },
      });

      return {
        companionName: hire.role.companionName,
        roleName: hire.role.name,
        sessionCount: hire.sessionCount,
        totalMinutes: hire.totalMinutes,
        streakDays: hire.streakDays,
        activeSince: hire.activatedAt,
        breakthroughs,
        mastered,
        struggles,
        goals,
      };
    }),
});
