import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { randomBytes } from 'crypto';
import { router, protectedProcedure, publicProcedure } from '../trpc';

/**
 * Generate a unique share URL slug (12 chars, URL-safe)
 */
function generateShareSlug(): string {
  return randomBytes(9).toString('base64url').slice(0, 12);
}

export const progressSharingRouter = router({
  /**
   * Create a shareable link for a progress milestone, streak, exam result, or brain summary.
   * Generates a unique URL slug and assembles safe share data (no private info).
   * Links expire after 30 days by default.
   */
  createShare: protectedProcedure
    .input(
      z.object({
        hireId: z.string(),
        shareType: z.enum(['MILESTONE', 'STREAK', 'EXAM_RESULT', 'BRAIN_SUMMARY']),
        expiresInDays: z.number().int().min(1).max(90).default(30),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Verify hire belongs to user
      const hire = await ctx.prisma.hire.findFirst({
        where: { id: input.hireId, userId: ctx.user.id },
        include: {
          role: {
            select: {
              name: true,
              companionName: true,
              category: true,
              slug: true,
            },
          },
          milestones: {
            orderBy: { achievedAt: 'desc' },
            take: 5,
          },
        },
      });

      if (!hire) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Hire not found or does not belong to you',
        });
      }

      // Build safe share data based on type (NEVER include private info)
      const shareData = buildShareData(input.shareType, hire, ctx.user.name);

      // Generate unique slug with collision check
      let shareUrl = generateShareSlug();
      let attempts = 0;
      while (attempts < 5) {
        const exists = await ctx.prisma.progressShare.findUnique({
          where: { shareUrl },
        });
        if (!exists) break;
        shareUrl = generateShareSlug();
        attempts++;
      }

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + input.expiresInDays);

      const share = await ctx.prisma.progressShare.create({
        data: {
          userId: ctx.user.id,
          hireId: input.hireId,
          shareType: input.shareType,
          shareData: shareData as object,
          shareUrl,
          expiresAt,
        },
      });

      return {
        id: share.id,
        shareUrl: share.shareUrl,
        shareType: share.shareType,
        expiresAt: share.expiresAt,
        fullUrl: `${process.env.NEXTAUTH_URL || 'https://app.trust-agent.ai'}/shared/${share.shareUrl}`,
      };
    }),

  /**
   * View a shared progress link (public - no auth required).
   * Increments view count. Returns safe share data only.
   * Returns 404 if expired or not found.
   */
  viewShare: publicProcedure
    .input(z.object({ shareUrl: z.string() }))
    .query(async ({ input, ctx }) => {
      const share = await ctx.prisma.progressShare.findUnique({
        where: { shareUrl: input.shareUrl },
        include: {
          hire: {
            select: {
              role: {
                select: {
                  name: true,
                  companionName: true,
                  category: true,
                  slug: true,
                },
              },
            },
          },
        },
      });

      if (!share) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Share link not found' });
      }

      // Check expiry
      if (new Date() > share.expiresAt) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'This share link has expired' });
      }

      // Increment view count (fire and forget)
      ctx.prisma.progressShare
        .update({
          where: { id: share.id },
          data: { viewCount: { increment: 1 } },
        })
        .catch(() => {
          /* non-critical */
        });

      return {
        shareType: share.shareType,
        shareData: share.shareData,
        viewCount: share.viewCount + 1,
        createdAt: share.createdAt,
        roleName: share.hire.role.name,
        companionName: share.hire.role.companionName,
        category: share.hire.role.category,
      };
    }),

  /**
   * Get user's own share links.
   */
  getMyShares: protectedProcedure.query(async ({ ctx }) => {
    const shares = await ctx.prisma.progressShare.findMany({
      where: { userId: ctx.user.id },
      include: {
        hire: {
          select: {
            role: {
              select: { name: true, companionName: true, slug: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return shares.map((s) => ({
      id: s.id,
      shareUrl: s.shareUrl,
      shareType: s.shareType,
      viewCount: s.viewCount,
      expiresAt: s.expiresAt,
      createdAt: s.createdAt,
      isExpired: new Date() > s.expiresAt,
      fullUrl: `${process.env.NEXTAUTH_URL || 'https://app.trust-agent.ai'}/shared/${s.shareUrl}`,
      roleName: s.hire.role.name,
      companionName: s.hire.role.companionName,
    }));
  }),
});

/**
 * Build safe share data based on share type.
 * NEVER includes private information - only achievement metrics.
 */
function buildShareData(
  shareType: string,
  hire: {
    streakDays: number;
    longestStreakDays: number;
    sessionCount: number;
    totalMinutes: number;
    role: { name: string; companionName: string; category: string };
    milestones: Array<{ type: string; achievedAt: Date }>;
  },
  userName: string | null,
): Record<string, unknown> {
  const baseName = userName ? userName.split(' ')[0] : 'A learner';

  switch (shareType) {
    case 'MILESTONE': {
      const latestMilestone = hire.milestones[0];
      return {
        headline: `${baseName} reached a milestone!`,
        milestoneType: latestMilestone?.type || 'FIRST_SESSION',
        milestoneName: formatMilestoneType(latestMilestone?.type || 'FIRST_SESSION'),
        achievedAt: latestMilestone?.achievedAt || new Date(),
        totalSessions: hire.sessionCount,
        companionName: hire.role.companionName,
        category: hire.role.category,
      };
    }

    case 'STREAK': {
      return {
        headline: `${baseName} is on a ${hire.streakDays}-day streak!`,
        currentStreak: hire.streakDays,
        longestStreak: hire.longestStreakDays,
        totalSessions: hire.sessionCount,
        companionName: hire.role.companionName,
        category: hire.role.category,
      };
    }

    case 'EXAM_RESULT': {
      return {
        headline: `${baseName} completed an exam practice!`,
        totalSessions: hire.sessionCount,
        totalMinutes: hire.totalMinutes,
        companionName: hire.role.companionName,
        category: hire.role.category,
      };
    }

    case 'BRAIN_SUMMARY': {
      return {
        headline: `${baseName} has been working with ${hire.role.companionName}`,
        totalSessions: hire.sessionCount,
        totalHours: Math.round(hire.totalMinutes / 60),
        streakDays: hire.streakDays,
        companionName: hire.role.companionName,
        category: hire.role.category,
      };
    }

    default:
      return {
        headline: `${baseName} is making progress!`,
        companionName: hire.role.companionName,
      };
  }
}

function formatMilestoneType(type: string): string {
  const map: Record<string, string> = {
    FIRST_SESSION: 'First Session',
    SESSION_10: '10 Sessions',
    SESSION_25: '25 Sessions',
    SESSION_50: '50 Sessions',
    SESSION_100: '100 Sessions',
    STREAK_3: '3-Day Streak',
    STREAK_7: '7-Day Streak',
    STREAK_14: '14-Day Streak',
    STREAK_30: '30-Day Streak',
    STREAK_100: '100-Day Streak',
    TIME_1H: '1 Hour Total',
    TIME_5H: '5 Hours Total',
    TIME_10H: '10 Hours Total',
    TIME_25H: '25 Hours Total',
  };
  return map[type] || type.replace(/_/g, ' ');
}
