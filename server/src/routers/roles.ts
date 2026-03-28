import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, publicProcedure } from '../trpc';
import { safeRoleSelect, toSafeRole } from '../lib/safe-role';

export const rolesRouter = router({
  listPublished: publicProcedure
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(100).default(20),
        category: z.string().optional(),
        badge: z.enum(['PLATINUM', 'GOLD', 'SILVER', 'BASIC']).optional(),
        language: z.string().optional(),
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
      if (input?.badge) {
        where.audit = { badge: input.badge };
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

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input, ctx }) => {
      const role = await ctx.prisma.role.findUnique({
        where: { slug: input.slug },
        include: { audit: true, skills: true },
      });

      if (!role || !role.isActive) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Role not found' });
      }

      // Return SafeRole - NEVER include systemPrompt
      return toSafeRole(role);
    }),

  getCategories: publicProcedure.query(async ({ ctx }) => {
    const categories = await ctx.prisma.role.groupBy({
      by: ['category'],
      where: { isActive: true, publishedAt: { not: null } },
      _count: { id: true },
    });

    return categories.map((c) => ({
      name: c.category,
      count: c._count.id,
    }));
  }),

  getFeatured: publicProcedure.query(async ({ ctx }) => {
    const roles = await ctx.prisma.role.findMany({
      where: { isActive: true, isFeatured: true, publishedAt: { not: null } },
      select: safeRoleSelect,
      take: 12,
      orderBy: { audit: { totalScore: 'desc' } },
    });

    return roles;
  }),

  search: publicProcedure
    .input(
      z.object({
        query: z.string().min(1).max(200),
        limit: z.number().int().min(1).max(50).default(20),
      })
    )
    .query(async ({ input, ctx }) => {
      const roles = await ctx.prisma.role.findMany({
        where: {
          isActive: true,
          publishedAt: { not: null },
          OR: [
            { name: { contains: input.query, mode: 'insensitive' } },
            { description: { contains: input.query, mode: 'insensitive' } },
            { tagline: { contains: input.query, mode: 'insensitive' } },
            { category: { contains: input.query, mode: 'insensitive' } },
            { tags: { has: input.query.toLowerCase() } },
          ],
        },
        select: safeRoleSelect,
        take: input.limit,
      });

      return roles;
    }),
});
