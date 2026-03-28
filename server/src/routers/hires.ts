import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc';
import { getMaxHires } from '../lib/plan-limits';
import { safeRoleSelect } from '../lib/safe-role';

export const hiresRouter = router({
  hire: protectedProcedure
    .input(
      z.object({
        roleId: z.string(),
        customCompanionName: z.string().max(50).optional(),
        customVoiceCloneId: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const user = ctx.user;

      // Check cloud drive is connected
      if (!user.cloudDriveType) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'You must connect a cloud drive before hiring a role. Brain data is stored in your personal drive.',
        });
      }

      // Check plan limits
      const activeHires = await ctx.prisma.hire.count({
        where: { userId: user.id, status: 'ACTIVE' },
      });
      const maxHires = getMaxHires(user.plan);
      if (activeHires >= maxHires) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `Your ${user.plan} plan allows ${maxHires} active hire(s). Upgrade your plan to hire more roles.`,
        });
      }

      // Check role exists and is active
      const role = await ctx.prisma.role.findUnique({ where: { id: input.roleId } });
      if (!role || !role.isActive) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Role not found or not available' });
      }

      // Check not already hired
      const existingHire = await ctx.prisma.hire.findUnique({
        where: { userId_roleId: { userId: user.id, roleId: input.roleId } },
      });
      if (existingHire && existingHire.status === 'ACTIVE') {
        throw new TRPCError({ code: 'CONFLICT', message: 'You have already hired this role' });
      }

      // Check plan requirement
      const planRank = ['FREE', 'STARTER', 'ESSENTIAL', 'FAMILY', 'PROFESSIONAL', 'ENTERPRISE'];
      if (planRank.indexOf(user.plan) < planRank.indexOf(role.requiredPlan)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `This role requires a ${role.requiredPlan} plan or higher`,
        });
      }

      // Create the hire
      const hire = await ctx.prisma.hire.create({
        data: {
          userId: user.id,
          roleId: input.roleId,
          status: 'ACTIVE',
          customCompanionName: input.customCompanionName,
          customVoiceCloneId: input.customVoiceCloneId,
          priceMonthly: role.priceMonthly,
          activatedAt: new Date(),
        },
      });

      // Create SessionMemory for this hire
      await ctx.prisma.sessionMemory.create({
        data: {
          hireId: hire.id,
          memorySummary: {
            userName: user.name || 'User',
            goals: [],
            lastSessionSummary: '',
            nextSessionFocus: '',
            motivationalContext: '',
            progressPercent: 0,
            sentimentHistory: [],
            wellbeingNotes: [],
          },
        },
      });

      return hire;
    }),

  listMyHires: protectedProcedure.query(async ({ ctx }) => {
    const hires = await ctx.prisma.hire.findMany({
      where: { userId: ctx.user.id },
      include: {
        role: { select: safeRoleSelect },
        memory: {
          select: {
            wellbeingScore: true,
            wellbeingTrend: true,
            sessionCount: true,
            totalMinutes: true,
          },
        },
      },
      orderBy: { activatedAt: 'desc' },
    });

    return hires;
  }),

  getHire: protectedProcedure
    .input(z.object({ hireId: z.string() }))
    .query(async ({ ctx, input }) => {
      const hire = await ctx.prisma.hire.findFirst({
        where: { id: input.hireId, userId: ctx.user.id },
        include: {
          role: { select: safeRoleSelect },
          memory: true,
          milestones: { orderBy: { achievedAt: 'desc' }, take: 10 },
        },
      });

      if (!hire) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Hire not found' });
      }

      return hire;
    }),

  cancelHire: protectedProcedure
    .input(z.object({ hireId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const hire = await ctx.prisma.hire.findFirst({
        where: { id: input.hireId, userId: ctx.user.id, status: 'ACTIVE' },
      });
      if (!hire) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Active hire not found' });
      }

      await ctx.prisma.hire.update({
        where: { id: hire.id },
        data: { status: 'CANCELLED' },
      });

      return { cancelled: true };
    }),

  updateNickname: protectedProcedure
    .input(
      z.object({
        hireId: z.string(),
        customCompanionName: z.string().min(1).max(50),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const hire = await ctx.prisma.hire.findFirst({
        where: { id: input.hireId, userId: ctx.user.id },
      });
      if (!hire) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Hire not found' });
      }

      const updated = await ctx.prisma.hire.update({
        where: { id: hire.id },
        data: { customCompanionName: input.customCompanionName },
      });

      return updated;
    }),
});
