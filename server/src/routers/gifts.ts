import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc';
import Stripe from 'stripe';
import crypto from 'crypto';

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-03-25.dahlia' })
  : null;

/**
 * Generate a unique activation code in GIFT-XXXX-XXXX format.
 */
function generateGiftCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I, O, 0, 1 for clarity
  let part1 = '';
  let part2 = '';
  const bytes = crypto.randomBytes(8);
  for (let i = 0; i < 4; i++) {
    part1 += chars[bytes[i] % chars.length];
    part2 += chars[bytes[i + 4] % chars.length];
  }
  return `GIFT-${part1}-${part2}`;
}

const GIFT_PLAN_PRICES: Record<string, number> = {
  STARTER: 999,       // pence
  ESSENTIAL: 1999,
  FAMILY: 2499,
  PROFESSIONAL: 3999,
};

export const giftsRouter = router({
  // ──────────────────────────────────────────────────────────────────────────
  // PURCHASE GIFT - creates DB record + Stripe checkout
  // ──────────────────────────────────────────────────────────────────────────
  purchaseGift: protectedProcedure
    .input(
      z.object({
        recipientEmail: z.string().email(),
        plan: z.enum(['STARTER', 'ESSENTIAL', 'FAMILY', 'PROFESSIONAL']),
        months: z.number().int().min(1).max(12),
        message: z.string().max(500).optional(),
        successUrl: z.string().url(),
        cancelUrl: z.string().url(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!stripe) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Payment service unavailable' });
      }

      // Cannot gift to yourself
      if (input.recipientEmail.toLowerCase() === ctx.user.email.toLowerCase()) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'You cannot gift a subscription to yourself' });
      }

      // Generate unique activation code (retry on collision)
      let activationCode = generateGiftCode();
      let attempts = 0;
      while (attempts < 10) {
        const existing = await ctx.prisma.giftSubscription.findUnique({
          where: { activationCode },
        });
        if (!existing) break;
        activationCode = generateGiftCode();
        attempts++;
      }

      const totalAmount = GIFT_PLAN_PRICES[input.plan] * input.months;

      // Create Stripe payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: totalAmount,
        currency: 'gbp',
        metadata: {
          userId: ctx.user.id,
          type: 'gift_subscription',
          plan: input.plan,
          months: input.months.toString(),
          recipientEmail: input.recipientEmail,
          activationCode,
        },
      });

      // Calculate expiry (activation code valid for 1 year from purchase)
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      // Create DB record
      const gift = await ctx.prisma.giftSubscription.create({
        data: {
          senderId: ctx.user.id,
          recipientEmail: input.recipientEmail.toLowerCase(),
          plan: input.plan,
          durationMonths: input.months,
          personalMessage: input.message,
          activationCode,
          stripePaymentIntentId: paymentIntent.id,
          expiresAt,
        },
      });

      return {
        giftId: gift.id,
        activationCode: gift.activationCode,
        clientSecret: paymentIntent.client_secret,
        totalAmount,
      };
    }),

  // ──────────────────────────────────────────────────────────────────────────
  // ACTIVATE GIFT - validates code, creates subscription, marks activated
  // ──────────────────────────────────────────────────────────────────────────
  activateGift: protectedProcedure
    .input(
      z.object({
        activationCode: z.string().min(1).max(20),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const gift = await ctx.prisma.giftSubscription.findUnique({
        where: { activationCode: input.activationCode.toUpperCase() },
      });

      if (!gift) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Invalid gift activation code' });
      }

      if (gift.activatedAt) {
        throw new TRPCError({ code: 'CONFLICT', message: 'This gift has already been activated' });
      }

      if (new Date() > gift.expiresAt) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'This gift code has expired' });
      }

      // Calculate subscription period
      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setMonth(periodEnd.getMonth() + gift.durationMonths);

      // Mark gift as activated
      await ctx.prisma.giftSubscription.update({
        where: { id: gift.id },
        data: {
          activatedAt: now,
          activatedBy: ctx.user.id,
          recipientId: ctx.user.id,
        },
      });

      // Upsert subscription for the user
      await ctx.prisma.subscription.upsert({
        where: { userId: ctx.user.id },
        create: {
          userId: ctx.user.id,
          stripeSubId: `gift_${gift.id}`,
          stripeCustomerId: `gift_customer_${ctx.user.id}`,
          plan: gift.plan,
          status: 'ACTIVE',
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        },
        update: {
          plan: gift.plan,
          status: 'ACTIVE',
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        },
      });

      // Update user plan
      await ctx.prisma.user.update({
        where: { id: ctx.user.id },
        data: { plan: gift.plan },
      });

      // Create notification for recipient
      await ctx.prisma.notification.create({
        data: {
          userId: ctx.user.id,
          type: 'GIFT_RECEIVED',
          title: 'Gift Subscription Activated',
          body: `You have activated a ${gift.plan} plan gift for ${gift.durationMonths} month(s). ${gift.personalMessage ? `Message: "${gift.personalMessage}"` : ''}`,
          priority: 'high',
        },
      });

      return {
        plan: gift.plan,
        durationMonths: gift.durationMonths,
        periodEnd,
        message: gift.personalMessage,
      };
    }),

  // ──────────────────────────────────────────────────────────────────────────
  // GET MY GIFTS - list sent and received gifts
  // ──────────────────────────────────────────────────────────────────────────
  getMyGifts: protectedProcedure.query(async ({ ctx }) => {
    const [sent, received] = await Promise.all([
      ctx.prisma.giftSubscription.findMany({
        where: { senderId: ctx.user.id },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          recipientEmail: true,
          plan: true,
          durationMonths: true,
          personalMessage: true,
          activationCode: true,
          activatedAt: true,
          expiresAt: true,
          createdAt: true,
        },
      }),
      ctx.prisma.giftSubscription.findMany({
        where: {
          OR: [
            { recipientId: ctx.user.id },
            { recipientEmail: ctx.user.email.toLowerCase() },
          ],
        },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          plan: true,
          durationMonths: true,
          personalMessage: true,
          activationCode: true,
          activatedAt: true,
          expiresAt: true,
          createdAt: true,
          sender: { select: { id: true, name: true, email: true } },
        },
      }),
    ]);

    return { sent, received };
  }),
});
