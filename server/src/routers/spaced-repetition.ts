/**
 * B.8 Spaced Repetition Router
 *
 * SM-2 algorithm runs SERVER-SIDE. The client sends quality ratings (0-5),
 * the server computes the next interval, ease factor, and review date.
 */
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc';

// ── SM-2 Algorithm (server-side only) ─────────────────────────────────────
// Reference: https://www.supermemo.com/en/archives1990-2015/english/ol/sm2

interface SM2Result {
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReviewAt: Date;
}

function computeSM2(
  quality: number, // 0-5 rating
  prevEaseFactor: number,
  prevInterval: number,
  prevRepetitions: number
): SM2Result {
  // Clamp quality to 0-5
  const q = Math.max(0, Math.min(5, quality));

  let easeFactor = prevEaseFactor;
  let interval = prevInterval;
  let repetitions = prevRepetitions;

  if (q < 3) {
    // Failed review - reset repetitions, interval goes to 1
    repetitions = 0;
    interval = 1;
  } else {
    // Successful review
    repetitions += 1;

    if (repetitions === 1) {
      interval = 1;
    } else if (repetitions === 2) {
      interval = 6;
    } else {
      interval = Math.round(prevInterval * easeFactor);
    }
  }

  // Update ease factor using SM-2 formula
  easeFactor = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));

  // Enforce minimum ease factor of 1.3
  if (easeFactor < 1.3) easeFactor = 1.3;

  // Compute next review date
  const nextReviewAt = new Date();
  nextReviewAt.setDate(nextReviewAt.getDate() + interval);

  return { easeFactor, interval, repetitions, nextReviewAt };
}

export const spacedRepetitionRouter = router({
  // ── Get due items for a hire ──
  getDueItems: protectedProcedure
    .input(z.object({ hireId: z.string() }))
    .query(async ({ input, ctx }) => {
      // Verify hire belongs to user
      const hire = await ctx.prisma.hire.findFirst({
        where: { id: input.hireId, userId: ctx.user.id },
      });
      if (!hire) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Hire not found' });
      }

      const now = new Date();
      const items = await ctx.prisma.spacedRepetitionItem.findMany({
        where: {
          hireId: input.hireId,
          dueAt: { lte: now },
        },
        orderBy: { dueAt: 'asc' },
      });

      return items;
    }),

  // ── Review an item (SM-2 runs here, server-side) ──
  reviewItem: protectedProcedure
    .input(
      z.object({
        itemId: z.string(),
        quality: z.number().int().min(0).max(5),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Fetch the item and verify ownership
      const item = await ctx.prisma.spacedRepetitionItem.findUnique({
        where: { id: input.itemId },
        include: { hire: true },
      });
      if (!item || item.hire.userId !== ctx.user.id) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Item not found' });
      }

      // Run SM-2 algorithm server-side
      const result = computeSM2(
        input.quality,
        item.easeFactor,
        item.interval,
        item.repetitions
      );

      // Update item in DB
      const updated = await ctx.prisma.spacedRepetitionItem.update({
        where: { id: input.itemId },
        data: {
          easeFactor: result.easeFactor,
          interval: result.interval,
          repetitions: result.repetitions,
          quality: input.quality,
          dueAt: result.nextReviewAt,
          lastReview: new Date(),
        },
      });

      return {
        id: updated.id,
        easeFactor: updated.easeFactor,
        interval: updated.interval,
        repetitions: updated.repetitions,
        quality: updated.quality,
        dueAt: updated.dueAt,
        lastReview: updated.lastReview,
      };
    }),

  // ── Batch add items after a session ──
  addItems: protectedProcedure
    .input(
      z.object({
        hireId: z.string(),
        items: z.array(
          z.object({
            question: z.string().min(1),
            answer: z.string().min(1),
            topic: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Verify hire belongs to user
      const hire = await ctx.prisma.hire.findFirst({
        where: { id: input.hireId, userId: ctx.user.id },
      });
      if (!hire) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Hire not found' });
      }

      // Batch create
      const created = await ctx.prisma.spacedRepetitionItem.createMany({
        data: input.items.map((item) => ({
          hireId: input.hireId,
          concept: item.question,
          context: item.answer,
          topic: item.topic ?? null,
          easeFactor: 2.5,
          interval: 1,
          repetitions: 0,
          dueAt: new Date(), // Due immediately for first review
        })),
      });

      return { count: created.count };
    }),

  // ── Get stats for a hire's items ──
  getStats: protectedProcedure
    .input(z.object({ hireId: z.string() }))
    .query(async ({ input, ctx }) => {
      // Verify hire belongs to user
      const hire = await ctx.prisma.hire.findFirst({
        where: { id: input.hireId, userId: ctx.user.id },
      });
      if (!hire) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Hire not found' });
      }

      const now = new Date();

      const [total, due, mastered, reviewed] = await Promise.all([
        ctx.prisma.spacedRepetitionItem.count({
          where: { hireId: input.hireId },
        }),
        ctx.prisma.spacedRepetitionItem.count({
          where: { hireId: input.hireId, dueAt: { lte: now } },
        }),
        // Mastered: interval >= 21 days (3 weeks) and ease factor >= 2.0
        ctx.prisma.spacedRepetitionItem.count({
          where: {
            hireId: input.hireId,
            interval: { gte: 21 },
            easeFactor: { gte: 2.0 },
          },
        }),
        // Items that have been reviewed at least once
        ctx.prisma.spacedRepetitionItem.count({
          where: {
            hireId: input.hireId,
            lastReview: { not: null },
          },
        }),
      ]);

      const learning = total - mastered;
      const retentionRate = reviewed > 0 ? Math.round((mastered / reviewed) * 100) : 0;

      return {
        total,
        due,
        mastered,
        learning,
        reviewed,
        retentionRate,
      };
    }),

  // ── Get all items for a hire (for admin/debug) ──
  getAllItems: protectedProcedure
    .input(
      z.object({
        hireId: z.string(),
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(100).default(50),
      })
    )
    .query(async ({ input, ctx }) => {
      const hire = await ctx.prisma.hire.findFirst({
        where: { id: input.hireId, userId: ctx.user.id },
      });
      if (!hire) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Hire not found' });
      }

      const skip = (input.page - 1) * input.limit;
      const [items, total] = await Promise.all([
        ctx.prisma.spacedRepetitionItem.findMany({
          where: { hireId: input.hireId },
          orderBy: { dueAt: 'asc' },
          skip,
          take: input.limit,
        }),
        ctx.prisma.spacedRepetitionItem.count({
          where: { hireId: input.hireId },
        }),
      ]);

      return {
        items,
        total,
        page: input.page,
        totalPages: Math.ceil(total / input.limit),
      };
    }),

  // ── Delete a single item ──
  deleteItem: protectedProcedure
    .input(z.object({ itemId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const item = await ctx.prisma.spacedRepetitionItem.findUnique({
        where: { id: input.itemId },
        include: { hire: true },
      });
      if (!item || item.hire.userId !== ctx.user.id) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Item not found' });
      }

      await ctx.prisma.spacedRepetitionItem.delete({
        where: { id: input.itemId },
      });

      return { deleted: true };
    }),
});
