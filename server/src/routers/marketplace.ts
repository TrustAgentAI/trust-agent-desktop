import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, publicProcedure } from '../trpc';
import { safeRoleSelect } from '../lib/safe-role';

export const marketplaceRouter = router({
  listRoles: publicProcedure
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(100).default(20),
        category: z.string().optional(),
        badge: z.enum(['PLATINUM', 'GOLD', 'SILVER', 'BASIC']).optional(),
        minScore: z.number().int().min(0).max(100).optional(),
        language: z.string().optional(),
        search: z.string().optional(),
        roleType: z.enum(['CONSUMER', 'B2B_CSUITE', 'B2B_MGMT', 'B2B_SPEC', 'B2B_AGENT', 'B2B_SKILL']).optional(),
      }).optional()
    )
    .query(async ({ input, ctx }) => {
      const page = input?.page ?? 1;
      const limit = input?.limit ?? 20;
      const skip = (page - 1) * limit;

      const where: Record<string, unknown> = {
        isActive: true,
        publishedAt: { not: null },
      };

      if (input?.category) where.category = input.category;
      if (input?.language) where.languageCode = input.language;
      if (input?.roleType) where.roleType = input.roleType;
      if (input?.badge || input?.minScore) {
        const auditWhere: Record<string, unknown> = {};
        if (input?.badge) auditWhere.badge = input.badge;
        if (input?.minScore) auditWhere.totalScore = { gte: input.minScore };
        where.audit = auditWhere;
      }
      if (input?.search) {
        where.OR = [
          { name: { contains: input.search, mode: 'insensitive' } },
          { description: { contains: input.search, mode: 'insensitive' } },
          { tagline: { contains: input.search, mode: 'insensitive' } },
          { tags: { has: input.search.toLowerCase() } },
        ];
      }

      const [roles, total] = await Promise.all([
        ctx.prisma.role.findMany({
          where,
          select: safeRoleSelect,
          skip,
          take: limit,
          orderBy: { publishedAt: 'desc' },
        }),
        ctx.prisma.role.count({ where }),
      ]);

      return {
        roles,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    }),

  filterByCategory: publicProcedure
    .input(z.object({ category: z.string() }))
    .query(async ({ input, ctx }) => {
      const roles = await ctx.prisma.role.findMany({
        where: {
          isActive: true,
          publishedAt: { not: null },
          category: input.category,
        },
        select: safeRoleSelect,
        orderBy: { audit: { totalScore: 'desc' } },
      });

      return roles;
    }),

  sortByTrustScore: publicProcedure
    .input(
      z.object({
        direction: z.enum(['asc', 'desc']).default('desc'),
        limit: z.number().int().min(1).max(100).default(20),
      }).optional()
    )
    .query(async ({ input, ctx }) => {
      const roles = await ctx.prisma.role.findMany({
        where: {
          isActive: true,
          publishedAt: { not: null },
          audit: { isNot: null },
        },
        select: safeRoleSelect,
        take: input?.limit ?? 20,
        orderBy: { audit: { totalScore: input?.direction ?? 'desc' } },
      });

      return roles;
    }),

  getFeatured: publicProcedure.query(async ({ ctx }) => {
    const roles = await ctx.prisma.role.findMany({
      where: {
        isActive: true,
        isFeatured: true,
        publishedAt: { not: null },
      },
      select: safeRoleSelect,
      take: 12,
      orderBy: { audit: { totalScore: 'desc' } },
    });

    return roles;
  }),
});
