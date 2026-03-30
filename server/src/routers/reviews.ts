import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure, publicProcedure } from '../trpc';

export const reviewsRouter = router({
  /**
   * Submit a review for a companion (via hire).
   * One review per hire per user. Rating 1-5, text required.
   * Also checks for low-rating re-audit triggers.
   */
  submitReview: protectedProcedure
    .input(
      z.object({
        hireId: z.string(),
        rating: z.number().int().min(1).max(5),
        reviewText: z.string().min(10).max(2000),
        isPublic: z.boolean().default(true),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Verify hire belongs to user
      const hire = await ctx.prisma.hire.findFirst({
        where: { id: input.hireId, userId: ctx.user.id },
        include: { role: { select: { id: true, slug: true, name: true } } },
      });

      if (!hire) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Hire not found or does not belong to you',
        });
      }

      // Must have at least 1 session to review
      if (hire.sessionCount < 1) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'You must have at least one session before leaving a review',
        });
      }

      // Check for existing review (upsert pattern)
      const existing = await ctx.prisma.companionReview.findUnique({
        where: { hireId_userId: { hireId: input.hireId, userId: ctx.user.id } },
      });

      let review;
      if (existing) {
        review = await ctx.prisma.companionReview.update({
          where: { id: existing.id },
          data: {
            rating: input.rating,
            reviewText: input.reviewText,
            isPublic: input.isPublic,
          },
        });
      } else {
        review = await ctx.prisma.companionReview.create({
          data: {
            hireId: input.hireId,
            userId: ctx.user.id,
            rating: input.rating,
            reviewText: input.reviewText,
            isPublic: input.isPublic,
          },
        });
      }

      // Check if this triggers a re-audit (low rating detection)
      await checkLowRatingTrigger(ctx.prisma, hire.role.id);

      return {
        id: review.id,
        rating: review.rating,
        reviewText: review.reviewText,
        isPublic: review.isPublic,
        createdAt: review.createdAt,
      };
    }),

  /**
   * Get public reviews for a role (by slug).
   * Returns reviews with anonymized user info.
   */
  getReviews: publicProcedure
    .input(
      z.object({
        roleSlug: z.string(),
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(50).default(10),
      }),
    )
    .query(async ({ input, ctx }) => {
      const role = await ctx.prisma.role.findUnique({
        where: { slug: input.roleSlug },
        select: { id: true, name: true, companionName: true },
      });

      if (!role) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Role not found' });
      }

      const skip = (input.page - 1) * input.limit;

      const [reviews, total] = await Promise.all([
        ctx.prisma.companionReview.findMany({
          where: {
            isPublic: true,
            hire: { roleId: role.id },
          },
          select: {
            id: true,
            rating: true,
            reviewText: true,
            createdAt: true,
            user: {
              select: {
                name: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: input.limit,
        }),
        ctx.prisma.companionReview.count({
          where: {
            isPublic: true,
            hire: { roleId: role.id },
          },
        }),
      ]);

      // Calculate average rating for this role
      const avgResult = await ctx.prisma.companionReview.aggregate({
        where: { hire: { roleId: role.id } },
        _avg: { rating: true },
        _count: { rating: true },
      });

      return {
        reviews: reviews.map((r) => ({
          id: r.id,
          rating: r.rating,
          reviewText: r.reviewText,
          createdAt: r.createdAt,
          // Anonymize: show first name initial + last initial
          authorName: anonymizeName(r.user.name),
        })),
        total,
        page: input.page,
        pages: Math.ceil(total / input.limit),
        averageRating: avgResult._avg.rating ?? 0,
        totalReviews: avgResult._count.rating,
        roleName: role.name,
        companionName: role.companionName,
      };
    }),

  /**
   * Get the current user's own reviews across all hires.
   */
  getMyReviews: protectedProcedure.query(async ({ ctx }) => {
    const reviews = await ctx.prisma.companionReview.findMany({
      where: { userId: ctx.user.id },
      include: {
        hire: {
          select: {
            id: true,
            role: {
              select: {
                slug: true,
                name: true,
                companionName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return reviews.map((r) => ({
      id: r.id,
      hireId: r.hireId,
      rating: r.rating,
      reviewText: r.reviewText,
      isPublic: r.isPublic,
      createdAt: r.createdAt,
      roleSlug: r.hire.role.slug,
      roleName: r.hire.role.name,
      companionName: r.hire.role.companionName,
    }));
  }),
});

/**
 * Anonymize a name for public display: "John Smith" -> "J. S."
 */
function anonymizeName(name: string | null): string {
  if (!name) return 'Anonymous';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0] + '.';
  return parts.map((p) => p[0] + '.').join(' ');
}

/**
 * Check if a role's average review rating has dropped below 3.5 (from 5+ reviews).
 * If so, create a LOW_RATING re-audit trigger (if one doesn't already exist as PENDING).
 */
async function checkLowRatingTrigger(prisma: any, roleId: string): Promise<void> {
  const avgResult = await prisma.companionReview.aggregate({
    where: { hire: { roleId } },
    _avg: { rating: true },
    _count: { rating: true },
  });

  const avgRating = avgResult._avg.rating;
  const reviewCount = avgResult._count.rating;

  // Only trigger if 5+ reviews and average below 3.5
  if (reviewCount >= 5 && avgRating !== null && avgRating < 3.5) {
    // Check if there's already a pending LOW_RATING trigger for this role
    const existingTrigger = await prisma.companionReAuditTrigger.findFirst({
      where: {
        roleId,
        triggerType: 'LOW_RATING',
        status: 'PENDING',
      },
    });

    if (!existingTrigger) {
      await prisma.companionReAuditTrigger.create({
        data: {
          roleId,
          triggerType: 'LOW_RATING',
          triggerData: {
            averageRating: avgRating,
            reviewCount,
            threshold: 3.5,
          },
          status: 'PENDING',
        },
      });
    }
  }
}
