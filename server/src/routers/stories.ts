/**
 * stories.ts - Phase 10: Lives Changed Stories Router
 * One story, three audiences. The proof for users: Patricia. Jade. Daniel.
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, publicProcedure, protectedProcedure, adminProcedure } from '../trpc';

export const storiesRouter = router({
  // Public: get featured stories for homepage / specific audience
  getFeatured: publicProcedure
    .input(z.object({
      audience: z.string().optional(),
      category: z.string().optional(),
      limit: z.number().int().default(3),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.livesChangedStory.findMany({
        where: {
          verified: true,
          consentGiven: true,
          ...(input.audience && {
            publishedOn: { has: input.audience },
          }),
          ...(input.category && { category: input.category }),
        },
        orderBy: { createdAt: 'asc' },
        take: input.limit,
        select: {
          id: true,
          firstName: true,
          city: true,
          category: true,
          headline: true,
          quote: true,
          outcome: true,
          companionName: true,
        },
      });
    }),

  // Protected: user submits their own story
  submitStory: protectedProcedure
    .input(z.object({
      headline: z.string().min(10).max(200),
      quote: z.string().min(20).max(1000),
      outcome: z.string().max(300).optional(),
      consentToPublish: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!input.consentToPublish) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Consent to publish is required',
        });
      }

      const user = await ctx.prisma.user.findUniqueOrThrow({
        where: { id: ctx.user.id },
        select: { firstName: true, city: true },
      });

      return ctx.prisma.livesChangedStory.create({
        data: {
          userId: ctx.user.id,
          firstName: user.firstName ?? 'Anonymous',
          city: user.city ?? null,
          category: 'user_submitted',
          headline: input.headline,
          quote: input.quote,
          outcome: input.outcome,
          consentGiven: true,
          verified: false, // Admin must verify before publishing
          publishedOn: [],
        },
      });
    }),

  // Admin: verify a user-submitted story
  verifyStory: adminProcedure
    .input(z.object({
      storyId: z.string(),
      publishOn: z.array(z.string()),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.livesChangedStory.update({
        where: { id: input.storyId },
        data: {
          verified: true,
          publishedOn: input.publishOn,
        },
      });
    }),

  // Admin: get unverified stories for review
  getUnverified: adminProcedure
    .query(async ({ ctx }) => {
      return ctx.prisma.livesChangedStory.findMany({
        where: { verified: false },
        orderBy: { createdAt: 'desc' },
      });
    }),

  // Public: get stories for a specific audience (investors/regulators/press)
  getForAudience: publicProcedure
    .input(z.object({
      audience: z.enum(['homepage', 'pricing', 'investor_deck', 'nhs_page', 'press', 'about', 'schools_page', 'creator_page', 'b2b_page']),
      limit: z.number().int().default(5),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.livesChangedStory.findMany({
        where: {
          verified: true,
          consentGiven: true,
          publishedOn: { has: input.audience },
        },
        orderBy: { createdAt: 'asc' },
        take: input.limit,
        select: {
          id: true,
          firstName: true,
          city: true,
          category: true,
          headline: true,
          quote: true,
          outcome: true,
          companionName: true,
        },
      });
    }),
});
