import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc';

const REFERRAL_REWARD_CREDITS = 500; // Credits per successful referral

export const referralsRouter = router({
  // ──────────────────────────────────────────────────────────────────────────
  // GET MY REFERRAL CODE
  // ──────────────────────────────────────────────────────────────────────────
  getMyReferralCode: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.user.id },
      select: { referralCode: true, tagntBalance: true },
    });

    if (!user) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
    }

    // Count total referrals
    const totalReferrals = await ctx.prisma.referralRedemption.count({
      where: { referrerId: ctx.user.id },
    });

    const totalCreditsEarned = totalReferrals * REFERRAL_REWARD_CREDITS;

    return {
      referralCode: user.referralCode,
      currentBalance: user.tagntBalance,
      totalReferrals,
      totalCreditsEarned,
      referralLink: `https://app.trust-agent.ai/join?ref=${user.referralCode}`,
    };
  }),

  // ──────────────────────────────────────────────────────────────────────────
  // REDEEM CODE - validates, grants reward (500 credits), records in DB
  // ──────────────────────────────────────────────────────────────────────────
  redeemCode: protectedProcedure
    .input(
      z.object({
        code: z.string().min(1).max(50),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Find the referrer by their referral code
      const referrer = await ctx.prisma.user.findUnique({
        where: { referralCode: input.code },
      });

      if (!referrer) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Invalid referral code' });
      }

      // Cannot redeem own code
      if (referrer.id === ctx.user.id) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'You cannot redeem your own referral code' });
      }

      // Check if already redeemed
      const existing = await ctx.prisma.referralRedemption.findUnique({
        where: {
          referrerId_referredUserId: {
            referrerId: referrer.id,
            referredUserId: ctx.user.id,
          },
        },
      });

      if (existing) {
        throw new TRPCError({ code: 'CONFLICT', message: 'You have already redeemed this referral code' });
      }

      // Check if user has already redeemed any referral code
      const anyRedemption = await ctx.prisma.referralRedemption.findFirst({
        where: { referredUserId: ctx.user.id },
      });

      if (anyRedemption) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'You have already used a referral code. Each user can only use one.',
        });
      }

      // Create redemption record
      await ctx.prisma.referralRedemption.create({
        data: {
          referrerId: referrer.id,
          referredUserId: ctx.user.id,
          rewardType: 'credits',
          rewardAmount: REFERRAL_REWARD_CREDITS,
        },
      });

      // Award credits to referrer
      await ctx.prisma.user.update({
        where: { id: referrer.id },
        data: { tagntBalance: { increment: REFERRAL_REWARD_CREDITS } },
      });

      // Award credits to referred user too
      await ctx.prisma.user.update({
        where: { id: ctx.user.id },
        data: {
          tagntBalance: { increment: REFERRAL_REWARD_CREDITS },
          referredBy: referrer.id,
        },
      });

      // Also create a ReferralReward record for legacy compatibility
      await ctx.prisma.referralReward.upsert({
        where: {
          referrerId_referredId: {
            referrerId: referrer.id,
            referredId: ctx.user.id,
          },
        },
        create: {
          referrerId: referrer.id,
          referredId: ctx.user.id,
          rewardCredits: REFERRAL_REWARD_CREDITS,
          appliedAt: new Date(),
        },
        update: {},
      });

      // Create notification for referrer
      await ctx.prisma.notification.create({
        data: {
          userId: referrer.id,
          type: 'REFERRAL_REWARD',
          title: 'Referral Reward',
          body: `${ctx.user.name || 'A new user'} signed up with your referral code. You earned ${REFERRAL_REWARD_CREDITS} credits!`,
          data: { referredUserId: ctx.user.id, credits: REFERRAL_REWARD_CREDITS },
          priority: 'normal',
        },
      });

      return {
        creditsAwarded: REFERRAL_REWARD_CREDITS,
        referrerName: referrer.name,
      };
    }),

  // ──────────────────────────────────────────────────────────────────────────
  // GET MY REFERRALS - list referral history
  // ──────────────────────────────────────────────────────────────────────────
  getMyReferrals: protectedProcedure.query(async ({ ctx }) => {
    const redemptions = await ctx.prisma.referralRedemption.findMany({
      where: { referrerId: ctx.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        referredUser: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
            plan: true,
          },
        },
      },
    });

    return redemptions.map((r) => ({
      id: r.id,
      referredUser: {
        name: r.referredUser.name,
        email: r.referredUser.email,
        plan: r.referredUser.plan,
        joinedAt: r.referredUser.createdAt,
      },
      rewardType: r.rewardType,
      rewardAmount: r.rewardAmount,
      createdAt: r.createdAt,
    }));
  }),
});
