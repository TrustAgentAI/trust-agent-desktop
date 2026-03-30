/**
 * creator.ts - Phase 11: Creator Stories Router
 * Find the first 5 creators. Document their journey. Make them famous.
 * This is the Notion template creator playbook - the viral loop.
 */

import { z } from 'zod';
import { router, publicProcedure, adminProcedure } from '../trpc';

export const creatorRouter = router({
  // Public: get creator stories (featured or all)
  getCreatorStories: publicProcedure
    .input(z.object({ featuredOnly: z.boolean().default(true) }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.creatorStory.findMany({
        where: {
          ...(input.featuredOnly && { isFeature: true }),
          consentGiven: true,
        },
        include: {
          creator: { select: { firstName: true, city: true, name: true } },
          role: {
            select: {
              name: true,
              slug: true,
              emoji: true,
              _count: { select: { hires: true } },
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      });
    }),

  // Admin: create a creator story (after interviewing the creator)
  createCreatorStory: adminProcedure
    .input(z.object({
      creatorId: z.string(),
      roleSlug: z.string(),
      headline: z.string(),
      story: z.string().min(100),
      profession: z.string(),
      monthlyEarnings: z.number().optional(),
      isFeature: z.boolean().default(false),
      videoUrl: z.string().url().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.creatorStory.create({
        data: {
          creatorId: input.creatorId,
          roleSlug: input.roleSlug,
          headline: input.headline,
          story: input.story,
          profession: input.profession,
          monthlyEarnings: input.monthlyEarnings,
          isFeature: input.isFeature,
          videoUrl: input.videoUrl,
          consentGiven: false, // Admin must get creator's explicit consent
          publishedOn: [],
        },
      });
    }),

  // Admin: approve a creator story for publication (with consent confirmation)
  approveCreatorStory: adminProcedure
    .input(z.object({
      storyId: z.string(),
      publishOn: z.array(z.string()),
      consentConfirmed: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!input.consentConfirmed) {
        return { success: false, message: 'Creator consent must be confirmed before publishing' };
      }
      return ctx.prisma.creatorStory.update({
        where: { id: input.storyId },
        data: {
          consentGiven: true,
          publishedOn: input.publishOn,
        },
      });
    }),
});
