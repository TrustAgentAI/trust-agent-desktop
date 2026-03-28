import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { signJWT, signRefreshToken, verifyRefreshToken, hashPassword, verifyPassword } from '../lib/auth';

export const authRouter = router({
  register: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(8).max(128),
        name: z.string().min(1).max(100),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const existing = await ctx.prisma.user.findUnique({
        where: { email: input.email.toLowerCase() },
      });
      if (existing) {
        throw new TRPCError({ code: 'CONFLICT', message: 'An account with this email already exists' });
      }

      const passwordHash = await hashPassword(input.password);
      const user = await ctx.prisma.user.create({
        data: {
          email: input.email.toLowerCase(),
          passwordHash,
          name: input.name,
        },
      });

      const token = signJWT({ userId: user.id, email: user.email });
      const refreshToken = signRefreshToken({ userId: user.id });

      return {
        token,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          plan: user.plan,
          accountType: user.accountType,
          onboardingDone: user.onboardingDone,
          createdAt: user.createdAt,
        },
      };
    }),

  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { email: input.email.toLowerCase() },
      });
      if (!user || !user.passwordHash) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid email or password' });
      }

      const valid = await verifyPassword(input.password, user.passwordHash);
      if (!valid) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid email or password' });
      }

      const token = signJWT({ userId: user.id, email: user.email });
      const refreshToken = signRefreshToken({ userId: user.id });

      return {
        token,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          plan: user.plan,
          accountType: user.accountType,
          onboardingDone: user.onboardingDone,
          avatarUrl: user.avatarUrl,
          createdAt: user.createdAt,
        },
      };
    }),

  refreshToken: publicProcedure
    .input(z.object({ refreshToken: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const payload = verifyRefreshToken(input.refreshToken);
      if (!payload) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid or expired refresh token' });
      }

      const user = await ctx.prisma.user.findUnique({ where: { id: payload.userId } });
      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      }

      const token = signJWT({ userId: user.id, email: user.email });
      const newRefreshToken = signRefreshToken({ userId: user.id });

      return { token, refreshToken: newRefreshToken };
    }),

  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.user.id },
      include: {
        preferences: true,
        subscription: true,
      },
    });
    if (!user) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      plan: user.plan,
      accountType: user.accountType,
      onboardingDone: user.onboardingDone,
      cloudDriveType: user.cloudDriveType,
      tagntBalance: user.tagntBalance,
      referralCode: user.referralCode,
      createdAt: user.createdAt,
      preferences: user.preferences,
      subscription: user.subscription
        ? {
            plan: user.subscription.plan,
            status: user.subscription.status,
            currentPeriodEnd: user.subscription.currentPeriodEnd,
            cancelAtPeriodEnd: user.subscription.cancelAtPeriodEnd,
          }
        : null,
    };
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100).optional(),
        avatarUrl: z.string().url().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const user = await ctx.prisma.user.update({
        where: { id: ctx.user.id },
        data: {
          ...(input.name !== undefined && { name: input.name }),
          ...(input.avatarUrl !== undefined && { avatarUrl: input.avatarUrl }),
        },
      });

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        plan: user.plan,
      };
    }),

  deleteAccount: protectedProcedure.mutation(async ({ ctx }) => {
    // Cancel all active hires
    await ctx.prisma.hire.updateMany({
      where: { userId: ctx.user.id, status: 'ACTIVE' },
      data: { status: 'CANCELLED' },
    });

    // Delete the user (cascades preferences, etc.)
    await ctx.prisma.user.delete({ where: { id: ctx.user.id } });

    return { deleted: true, message: 'Account deleted. Please delete your .tagnt Brain files from your cloud drive manually.' };
  }),
});
