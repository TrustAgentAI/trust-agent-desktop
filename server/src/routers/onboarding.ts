import { z } from 'zod';
import { router, protectedProcedure, publicProcedure } from '../trpc';

// ── Role matching logic ─────────────────────────────────────────────────────
// Maps quiz answers to the best matching role from the DB catalog.
// Uses category + audience + level to score each role.

const GOAL_CATEGORY_MAP: Record<string, string[]> = {
  education: ['education', 'tutoring', 'gcse', 'a-level', 'study'],
  health: ['health', 'wellness', 'fitness', 'mental-health'],
  language: ['language', 'languages', 'translation'],
  career: ['career', 'professional', 'business', 'interview'],
  'life-navigation': ['life', 'navigation', 'financial', 'legal'],
  companionship: ['companionship', 'companion', 'wellbeing', 'daily'],
};

function scoreRole(
  role: { category: string; subcategory: string | null; tags: string[]; name: string; maxDailySessionMins: number | null },
  answers: { goal: string; audience: string; level: string },
): number {
  let score = 0;

  // Category match
  const targetCategories = GOAL_CATEGORY_MAP[answers.goal] || [];
  const roleCatLower = role.category.toLowerCase();
  const roleSubLower = (role.subcategory || '').toLowerCase();
  const roleNameLower = role.name.toLowerCase();

  for (const cat of targetCategories) {
    if (roleCatLower.includes(cat)) score += 10;
    if (roleSubLower.includes(cat)) score += 5;
    if (roleNameLower.includes(cat)) score += 3;
    for (const tag of role.tags) {
      if (tag.toLowerCase().includes(cat)) score += 2;
    }
  }

  // Audience match - child accounts need roles with session limits
  if (answers.audience === 'child' && role.maxDailySessionMins !== null) {
    score += 5;
  }
  if (answers.audience === 'enterprise' && roleCatLower.includes('b2b')) {
    score += 5;
  }

  // Level match - beginner roles tend to have certain keywords
  if (answers.level === 'beginner') {
    if (roleNameLower.includes('beginner') || roleNameLower.includes('intro') || roleNameLower.includes('foundation')) {
      score += 3;
    }
  } else if (answers.level === 'advanced') {
    if (roleNameLower.includes('advanced') || roleNameLower.includes('expert') || roleNameLower.includes('professional')) {
      score += 3;
    }
  }

  return score;
}

export const onboardingRouter = router({
  submitQuiz: protectedProcedure
    .input(
      z.object({
        answers: z.object({
          goal: z.string(),
          audience: z.string(),
          level: z.string(),
        }).passthrough(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { answers } = input;

      // Fetch all active roles from DB
      const roles = await ctx.prisma.role.findMany({
        where: { isActive: true },
        select: {
          id: true,
          slug: true,
          name: true,
          companionName: true,
          category: true,
          subcategory: true,
          tags: true,
          tagline: true,
          maxDailySessionMins: true,
          audit: {
            select: {
              trustScore: true,
              badge: true,
            },
          },
        },
      });

      // Score each role and find best match
      let bestRole = roles[0] || null;
      let bestScore = -1;

      for (const role of roles) {
        const s = scoreRole(
          role,
          { goal: answers.goal as string, audience: answers.audience as string, level: answers.level as string },
        );
        if (s > bestScore) {
          bestScore = s;
          bestRole = role;
        }
      }

      // Persist quiz response
      const quizResponse = await ctx.prisma.quizResponse.create({
        data: {
          userId: ctx.user.id,
          answers: answers as object,
          recommendedRoleSlug: bestRole?.slug || null,
        },
      });

      // Mark onboarding done on the user
      await ctx.prisma.user.update({
        where: { id: ctx.user.id },
        data: { onboardingDone: true },
      });

      return {
        quizResponseId: quizResponse.id,
        recommendedRole: bestRole
          ? {
              id: bestRole.id,
              slug: bestRole.slug,
              name: bestRole.name,
              companionName: bestRole.companionName,
              category: bestRole.category,
              tagline: bestRole.tagline,
              trustScore: bestRole.audit?.trustScore || 0,
              badge: bestRole.audit?.badge || 'BASIC',
            }
          : null,
      };
    }),

  getQuizResult: protectedProcedure.query(async ({ ctx }) => {
    const latest = await ctx.prisma.quizResponse.findFirst({
      where: { userId: ctx.user.id },
      orderBy: { completedAt: 'desc' },
    });

    if (!latest || !latest.recommendedRoleSlug) return null;

    const role = await ctx.prisma.role.findUnique({
      where: { slug: latest.recommendedRoleSlug },
      select: {
        id: true,
        slug: true,
        name: true,
        companionName: true,
        category: true,
        tagline: true,
        audit: { select: { trustScore: true, badge: true } },
      },
    });

    return {
      quizResponseId: latest.id,
      answers: latest.answers,
      completedAt: latest.completedAt,
      recommendedRole: role
        ? {
            id: role.id,
            slug: role.slug,
            name: role.name,
            companionName: role.companionName,
            category: role.category,
            tagline: role.tagline,
            trustScore: role.audit?.trustScore || 0,
            badge: role.audit?.badge || 'BASIC',
          }
        : null,
    };
  }),
});
