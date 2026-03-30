import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, adminProcedure } from '../trpc';
import { safeRoleSelect } from '../lib/safe-role';
import { getOnboardingFunnelData } from '../lib/onboarding/trackCheckpoint';

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

  // ── Re-Audit Trigger Management (Phase 7 - Quality Drift Prevention) ──

  /**
   * List pending re-audit triggers with role details.
   */
  listReAuditTriggers: adminProcedure
    .input(
      z.object({
        status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'DISMISSED']).optional(),
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(100).default(20),
      }).optional(),
    )
    .query(async ({ input, ctx }) => {
      const page = input?.page ?? 1;
      const limit = input?.limit ?? 20;
      const skip = (page - 1) * limit;

      const where: Record<string, unknown> = {};
      if (input?.status) {
        where.status = input.status;
      }

      const [triggers, total] = await Promise.all([
        ctx.prisma.companionReAuditTrigger.findMany({
          where,
          include: {
            role: {
              select: {
                id: true,
                slug: true,
                name: true,
                companionName: true,
                category: true,
                isActive: true,
                audit: {
                  select: {
                    trustScore: true,
                    badge: true,
                    completedAt: true,
                    expiresAt: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        ctx.prisma.companionReAuditTrigger.count({ where }),
      ]);

      return {
        triggers: triggers.map((t) => ({
          id: t.id,
          roleId: t.roleId,
          roleSlug: t.role.slug,
          roleName: t.role.name,
          companionName: t.role.companionName,
          category: t.role.category,
          triggerType: t.triggerType,
          triggerData: t.triggerData,
          status: t.status,
          createdAt: t.createdAt,
          resolvedAt: t.resolvedAt,
          resolvedBy: t.resolvedBy,
          currentAudit: t.role.audit
            ? {
                trustScore: t.role.audit.trustScore,
                badge: t.role.audit.badge,
                completedAt: t.role.audit.completedAt,
                expiresAt: t.role.audit.expiresAt,
              }
            : null,
        })),
        total,
        page,
        pages: Math.ceil(total / limit),
      };
    }),

  /**
   * Approve a re-audit trigger - starts the re-audit process.
   */
  approveReAudit: adminProcedure
    .input(z.object({ triggerId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const trigger = await ctx.prisma.companionReAuditTrigger.findUnique({
        where: { id: input.triggerId },
      });

      if (!trigger) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Trigger not found' });
      }

      if (trigger.status !== 'PENDING') {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: `Trigger is already ${trigger.status}`,
        });
      }

      // Update trigger to IN_PROGRESS
      const updated = await ctx.prisma.companionReAuditTrigger.update({
        where: { id: input.triggerId },
        data: { status: 'IN_PROGRESS' },
      });

      // Create a new AuditJob for this role
      await ctx.prisma.auditJob.create({
        data: {
          roleId: trigger.roleId,
          submittedBy: 'system',
          status: 'queued',
          priority: 'normal',
        },
      });

      return {
        id: updated.id,
        status: updated.status,
        message: 'Re-audit approved and audit job queued',
      };
    }),

  /**
   * Dismiss a re-audit trigger with reason.
   */
  dismissReAudit: adminProcedure
    .input(
      z.object({
        triggerId: z.string(),
        reason: z.string().min(5).max(500).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const trigger = await ctx.prisma.companionReAuditTrigger.findUnique({
        where: { id: input.triggerId },
      });

      if (!trigger) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Trigger not found' });
      }

      if (trigger.status !== 'PENDING') {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: `Trigger is already ${trigger.status}`,
        });
      }

      const updated = await ctx.prisma.companionReAuditTrigger.update({
        where: { id: input.triggerId },
        data: {
          status: 'DISMISSED',
          resolvedAt: new Date(),
          resolvedBy: 'admin',
        },
      });

      return {
        id: updated.id,
        status: updated.status,
        message: 'Re-audit trigger dismissed',
      };
    }),

  /**
   * Manually trigger a re-audit for any role.
   */
  triggerReAudit: adminProcedure
    .input(
      z.object({
        roleId: z.string(),
        reason: z.string().min(5).max(500),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const role = await ctx.prisma.role.findUnique({
        where: { id: input.roleId },
        select: { id: true, slug: true, name: true },
      });

      if (!role) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Role not found' });
      }

      // Check for existing pending trigger
      const existing = await ctx.prisma.companionReAuditTrigger.findFirst({
        where: {
          roleId: input.roleId,
          triggerType: 'ADMIN',
          status: { in: ['PENDING', 'IN_PROGRESS'] },
        },
      });

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'A pending admin re-audit trigger already exists for this role',
        });
      }

      const trigger = await ctx.prisma.companionReAuditTrigger.create({
        data: {
          roleId: input.roleId,
          triggerType: 'ADMIN',
          triggerData: { reason: input.reason, triggeredAt: new Date().toISOString() },
          status: 'PENDING',
        },
      });

      return {
        id: trigger.id,
        roleSlug: role.slug,
        roleName: role.name,
        status: trigger.status,
        message: 'Manual re-audit trigger created',
      };
    }),

  // ── ONBOARDING FUNNEL ANALYTICS ──────────────────────────────────────────
  getOnboardingFunnel: adminProcedure
    .input(z.object({ days: z.number().int().min(1).max(90).default(30) }))
    .query(async ({ input }) => {
      return getOnboardingFunnelData(input.days);
    }),
});
