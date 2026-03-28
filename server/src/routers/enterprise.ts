import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc';

export const enterpriseRouter = router({
  createEnterprise: protectedProcedure
    .input(
      z.object({
        companyName: z.string().min(1).max(200),
        companySize: z.string().optional(),
        industry: z.string().optional(),
        billingEmail: z.string().email(),
        maxSeats: z.number().int().min(1).max(10000).default(5),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Check user doesn't already have an enterprise profile
      const existing = await ctx.prisma.enterpriseUser.findUnique({
        where: { userId: ctx.user.id },
      });
      if (existing) {
        throw new TRPCError({ code: 'CONFLICT', message: 'Enterprise profile already exists' });
      }

      const enterprise = await ctx.prisma.enterpriseUser.create({
        data: {
          userId: ctx.user.id,
          companyName: input.companyName,
          companySize: input.companySize,
          industry: input.industry,
          billingEmail: input.billingEmail,
          maxSeats: input.maxSeats,
        },
      });

      // Upgrade user to enterprise account type
      await ctx.prisma.user.update({
        where: { id: ctx.user.id },
        data: { accountType: 'ENTERPRISE', plan: 'ENTERPRISE' },
      });

      return enterprise;
    }),

  addSeat: protectedProcedure
    .input(
      z.object({
        email: z.string().email(),
        role: z.enum(['member', 'admin']).default('member'),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const enterprise = await ctx.prisma.enterpriseUser.findUnique({
        where: { userId: ctx.user.id },
        include: { seats: true },
      });
      if (!enterprise) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Enterprise profile not found' });
      }

      if (enterprise.seats.length >= enterprise.maxSeats) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `Maximum seat limit of ${enterprise.maxSeats} reached`,
        });
      }

      // Check for duplicate
      const existingSeat = enterprise.seats.find((s) => s.email === input.email.toLowerCase());
      if (existingSeat) {
        throw new TRPCError({ code: 'CONFLICT', message: 'This email already has a seat' });
      }

      const seat = await ctx.prisma.enterpriseSeat.create({
        data: {
          enterpriseId: enterprise.id,
          email: input.email.toLowerCase(),
          role: input.role,
        },
      });

      return seat;
    }),

  removeSeat: protectedProcedure
    .input(z.object({ seatId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const enterprise = await ctx.prisma.enterpriseUser.findUnique({
        where: { userId: ctx.user.id },
      });
      if (!enterprise) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Enterprise profile not found' });
      }

      const seat = await ctx.prisma.enterpriseSeat.findFirst({
        where: { id: input.seatId, enterpriseId: enterprise.id },
      });
      if (!seat) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Seat not found' });
      }

      await ctx.prisma.enterpriseSeat.delete({ where: { id: seat.id } });

      return { removed: true };
    }),

  getCompanyBrain: protectedProcedure.query(async ({ ctx }) => {
    const enterprise = await ctx.prisma.enterpriseUser.findUnique({
      where: { userId: ctx.user.id },
      include: { companyBrain: true },
    });
    if (!enterprise) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Enterprise profile not found' });
    }

    if (!enterprise.companyBrain) return null;

    // NEVER return vectorDbApiKey or encrypted credentials
    const brain = enterprise.companyBrain;
    return {
      id: brain.id,
      companyName: brain.companyName,
      companyDescription: brain.companyDescription,
      industry: brain.industry,
      companySize: brain.companySize,
      currentOKRs: brain.currentOKRs,
      brandVoice: brain.brandVoice,
      targetCustomers: brain.targetCustomers,
      topCompetitors: brain.topCompetitors,
      keyPeople: brain.keyPeople,
      topicsToAvoid: brain.topicsToAvoid,
      vectorDbProvider: brain.vectorDbProvider,
      ragEnabled: brain.ragEnabled,
      updatedAt: brain.updatedAt,
      // vectorDbUrl: EXCLUDED
      // vectorDbApiKey: EXCLUDED
    };
  }),

  updateCompanyBrain: protectedProcedure
    .input(
      z.object({
        companyName: z.string().optional(),
        companyDescription: z.string().optional(),
        industry: z.string().optional(),
        companySize: z.string().optional(),
        currentOKRs: z.string().optional(),
        brandVoice: z.string().optional(),
        targetCustomers: z.string().optional(),
        topCompetitors: z.string().optional(),
        keyPeople: z.string().optional(),
        topicsToAvoid: z.string().optional(),
        vectorDbProvider: z.string().optional(),
        vectorDbUrl: z.string().optional(),
        vectorDbApiKey: z.string().optional(),
        vectorDbIndex: z.string().optional(),
        ragEnabled: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const enterprise = await ctx.prisma.enterpriseUser.findUnique({
        where: { userId: ctx.user.id },
        include: { companyBrain: true },
      });
      if (!enterprise) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Enterprise profile not found' });
      }

      if (!enterprise.companyBrain) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Company Brain not set up. Use createEnterprise first.',
        });
      }

      const updated = await ctx.prisma.companyBrain.update({
        where: { id: enterprise.companyBrain.id },
        data: input,
      });

      return {
        id: updated.id,
        companyName: updated.companyName,
        ragEnabled: updated.ragEnabled,
        updatedAt: updated.updatedAt,
      };
    }),

  addHITLRule: protectedProcedure
    .input(
      z.object({
        triggerPattern: z.string().min(1),
        action: z.enum(['pause', 'block', 'escalate']),
        notifyEmail: z.string().email().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const enterprise = await ctx.prisma.enterpriseUser.findUnique({
        where: { userId: ctx.user.id },
        include: { companyBrain: true },
      });
      if (!enterprise?.companyBrain) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Company Brain not found' });
      }

      const rule = await ctx.prisma.hITLRule.create({
        data: {
          companyBrainId: enterprise.companyBrain.id,
          triggerPattern: input.triggerPattern,
          action: input.action,
          notifyEmail: input.notifyEmail,
        },
      });

      return rule;
    }),
});
