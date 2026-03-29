import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, adminProcedure } from '../trpc';
import { safeRoleSelect } from '../lib/safe-role';

export const adminRouter = router({
  listUsers: adminProcedure
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(100).default(20),
        search: z.string().optional(),
      }).optional()
    )
    .query(async ({ input, ctx }) => {
      const page = input?.page ?? 1;
      const limit = input?.limit ?? 20;
      const skip = (page - 1) * limit;

      const where: Record<string, unknown> = {};
      if (input?.search) {
        where.OR = [
          { email: { contains: input.search, mode: 'insensitive' } },
          { name: { contains: input.search, mode: 'insensitive' } },
        ];
      }

      const [users, total] = await Promise.all([
        ctx.prisma.user.findMany({
          where,
          select: {
            id: true,
            email: true,
            name: true,
            plan: true,
            accountType: true,
            onboardingDone: true,
            tagntBalance: true,
            createdAt: true,
            updatedAt: true,
            _count: { select: { hires: true, sessions: true } },
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        ctx.prisma.user.count({ where }),
      ]);

      return {
        users,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    }),

  listRoles: adminProcedure
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(100).default(20),
        isActive: z.boolean().optional(),
      }).optional()
    )
    .query(async ({ input, ctx }) => {
      const page = input?.page ?? 1;
      const limit = input?.limit ?? 20;
      const skip = (page - 1) * limit;

      const where: Record<string, unknown> = {};
      if (input?.isActive !== undefined) where.isActive = input.isActive;

      const [roles, total] = await Promise.all([
        ctx.prisma.role.findMany({
          where,
          select: {
            ...safeRoleSelect,
            _count: { select: { hires: true } },
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
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

  updateRole: adminProcedure
    .input(
      z.object({
        roleId: z.string(),
        name: z.string().optional(),
        category: z.string().optional(),
        isActive: z.boolean().optional(),
        isFeatured: z.boolean().optional(),
        description: z.string().optional(),
        tagline: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { roleId, ...data } = input;
      const role = await ctx.prisma.role.findUnique({ where: { id: roleId } });
      if (!role) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Role not found' });
      }

      const updated = await ctx.prisma.role.update({
        where: { id: roleId },
        data: {
          ...data,
          ...(data.isActive === true && !role.publishedAt ? { publishedAt: new Date() } : {}),
        },
        select: safeRoleSelect,
      });

      return updated;
    }),

  toggleRoleActive: adminProcedure
    .input(z.object({ roleId: z.string(), isActive: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      const role = await ctx.prisma.role.findUnique({ where: { id: input.roleId } });
      if (!role) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Role not found' });
      }

      const updated = await ctx.prisma.role.update({
        where: { id: input.roleId },
        data: {
          isActive: input.isActive,
          ...(input.isActive && !role.publishedAt ? { publishedAt: new Date() } : {}),
        },
        select: safeRoleSelect,
      });

      return updated;
    }),

  listAudits: adminProcedure
    .input(
      z.object({
        status: z.string().optional(),
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(50).default(20),
      }).optional()
    )
    .query(async ({ input, ctx }) => {
      const page = input?.page ?? 1;
      const limit = input?.limit ?? 20;
      const skip = (page - 1) * limit;

      const where: Record<string, unknown> = {};
      if (input?.status) where.status = input.status;

      const [jobs, total] = await Promise.all([
        ctx.prisma.auditJob.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        ctx.prisma.auditJob.count({ where }),
      ]);

      return {
        jobs,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    }),

  // ── PRICING ADMIN ──────────────────────────────────────────────────────
  getPricingTiers: adminProcedure.query(async ({ ctx }) => {
    return ctx.prisma.pricingTier.findMany({
      include: { priceHistory: { take: 5, orderBy: { changedAt: 'desc' } } },
      orderBy: { priceGBP: 'asc' },
    });
  }),

  updatePricingTier: adminProcedure
    .input(z.object({
      tierId: z.string(),
      priceGBP: z.number().positive(),
      note: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.pricingTier.findUniqueOrThrow({
        where: { id: input.tierId },
      });

      // Log price history BEFORE updating
      await ctx.prisma.priceHistory.create({
        data: {
          tierId: input.tierId,
          oldPrice: existing.priceGBP,
          newPrice: input.priceGBP,
          changedBy: ctx.session.userId,
          note: input.note,
        },
      });

      // Update the tier
      const updated = await ctx.prisma.pricingTier.update({
        where: { id: input.tierId },
        data: {
          pricePreviousGBP: existing.priceGBP,
          priceGBP: input.priceGBP,
          changedBy: ctx.session.userId,
        },
      });

      // TODO: Update Stripe price (create new price, archive old)
      // Stripe prices are immutable - must create new price object and archive old

      return updated;
    }),

  togglePricingTier: adminProcedure
    .input(z.object({ tierId: z.string(), isActive: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.pricingTier.update({
        where: { id: input.tierId },
        data: { isActive: input.isActive },
      });
    }),

  systemHealth: adminProcedure.query(async ({ ctx }) => {
    const [userCount, roleCount, activeHires, activeSessions] = await Promise.all([
      ctx.prisma.user.count(),
      ctx.prisma.role.count({ where: { isActive: true } }),
      ctx.prisma.hire.count({ where: { status: 'ACTIVE' } }),
      ctx.prisma.agentSession.count({ where: { status: 'ACTIVE' } }),
    ]);

    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      stats: {
        totalUsers: userCount,
        activeRoles: roleCount,
        activeHires,
        activeSessions,
      },
    };
  }),
});
