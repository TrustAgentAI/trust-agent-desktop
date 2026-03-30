import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import Stripe from 'stripe';
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-03-25.dahlia' })
  : null;

const PLAN_PRICE_IDS: Record<string, string> = {
  STARTER: process.env.STRIPE_PRICE_STARTER || '',
  ESSENTIAL: process.env.STRIPE_PRICE_ESSENTIAL || '',
  FAMILY: process.env.STRIPE_PRICE_FAMILY || '',
  PROFESSIONAL: process.env.STRIPE_PRICE_PROFESSIONAL || '',
};

export const paymentsRouter = router({
  createCheckout: protectedProcedure
    .input(
      z.object({
        plan: z.enum(['STARTER', 'ESSENTIAL', 'FAMILY', 'PROFESSIONAL']),
        successUrl: z.string().url(),
        cancelUrl: z.string().url(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Get or create Stripe customer
      let stripeCustomerId: string;
      const existingSub = await ctx.prisma.subscription.findUnique({
        where: { userId: ctx.user.id },
      });

      if (!stripe) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Payment service unavailable' });
      }

      if (existingSub?.stripeCustomerId) {
        stripeCustomerId = existingSub.stripeCustomerId;
      } else {
        const customer = await stripe.customers.create({
          email: ctx.user.email,
          name: ctx.user.name || undefined,
          metadata: { userId: ctx.user.id },
        });
        stripeCustomerId = customer.id;
      }

      const priceId = PLAN_PRICE_IDS[input.plan];
      if (!priceId) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid plan selected' });
      }

      const session = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        mode: 'subscription',
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: input.successUrl,
        cancel_url: input.cancelUrl,
        metadata: {
          userId: ctx.user.id,
          plan: input.plan,
        },
      });

      return { url: session.url };
    }),

  handleWebhook: publicProcedure
    .input(z.object({ rawBody: z.string(), signature: z.string() }))
    .mutation(async ({ input, ctx }) => {
      if (!stripe) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Payment service unavailable' });
      }

      let event: Stripe.Event;
      try {
        event = stripe.webhooks.constructEvent(
          input.rawBody,
          input.signature,
          process.env.STRIPE_WEBHOOK_SECRET!
        );
      } catch {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid webhook signature' });
      }

      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          const userId = session.metadata?.userId;
          const plan = session.metadata?.plan;
          if (!userId || !plan) break;

          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          const subAny = subscription as unknown as Record<string, unknown>;
          const periodStart = (subAny.current_period_start as number) || subscription.start_date || Math.floor(Date.now() / 1000);
          const periodEnd = (subAny.current_period_end as number) || (periodStart + 30 * 24 * 60 * 60);

          await ctx.prisma.subscription.upsert({
            where: { userId },
            create: {
              userId,
              stripeSubId: subscription.id,
              stripeCustomerId: session.customer as string,
              plan: plan as 'STARTER' | 'ESSENTIAL' | 'FAMILY' | 'PROFESSIONAL',
              status: 'ACTIVE',
              currentPeriodStart: new Date(periodStart * 1000),
              currentPeriodEnd: new Date(periodEnd * 1000),
            },
            update: {
              stripeSubId: subscription.id,
              plan: plan as 'STARTER' | 'ESSENTIAL' | 'FAMILY' | 'PROFESSIONAL',
              status: 'ACTIVE',
              currentPeriodStart: new Date(periodStart * 1000),
              currentPeriodEnd: new Date(periodEnd * 1000),
            },
          });

          await ctx.prisma.user.update({
            where: { id: userId },
            data: { plan: plan as 'STARTER' | 'ESSENTIAL' | 'FAMILY' | 'PROFESSIONAL' },
          });
          break;
        }

        case 'invoice.payment_succeeded': {
          const invoiceData = event.data.object as unknown as Record<string, unknown>;
          const subId = (invoiceData.subscription as string) || '';
          if (subId) {
            await ctx.prisma.subscription.updateMany({
              where: { stripeSubId: subId },
              data: { status: 'ACTIVE' },
            });
          }

          // Record payment
          const sub = await ctx.prisma.subscription.findFirst({ where: { stripeSubId: subId } });
          if (sub) {
            await ctx.prisma.payment.create({
              data: {
                userId: sub.userId,
                stripePaymentId: (invoiceData.payment_intent as string) || '',
                amount: (invoiceData.amount_paid as number) || 0,
                currency: (invoiceData.currency as string) || 'gbp',
                status: 'succeeded',
                type: 'subscription',
                description: `${sub.plan} subscription payment`,
              },
            });
          }
          break;
        }

        case 'invoice.payment_failed': {
          const failedInvoiceData = event.data.object as unknown as Record<string, unknown>;
          const subId = (failedInvoiceData.subscription as string) || '';
          if (subId) {
            await ctx.prisma.subscription.updateMany({
              where: { stripeSubId: subId },
              data: { status: 'PAST_DUE' },
            });
          }
          break;
        }

        case 'customer.subscription.deleted': {
          const sub = event.data.object as Stripe.Subscription;
          await ctx.prisma.subscription.updateMany({
            where: { stripeSubId: sub.id },
            data: { status: 'CANCELLED' },
          });

          // Downgrade user plan
          const dbSub = await ctx.prisma.subscription.findFirst({ where: { stripeSubId: sub.id } });
          if (dbSub) {
            await ctx.prisma.user.update({
              where: { id: dbSub.userId },
              data: { plan: 'FREE' },
            });

            // Pause all active hires
            await ctx.prisma.hire.updateMany({
              where: { userId: dbSub.userId, status: 'ACTIVE' },
              data: { status: 'PAUSED' },
            });
          }
          break;
        }
      }

      return { received: true };
    }),

  getSubscription: protectedProcedure.query(async ({ ctx }) => {
    const subscription = await ctx.prisma.subscription.findUnique({
      where: { userId: ctx.user.id },
    });

    if (!subscription) return null;

    return {
      id: subscription.id,
      plan: subscription.plan,
      status: subscription.status,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    };
  }),

  listPayments: protectedProcedure
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(50).default(20),
      }).optional()
    )
    .query(async ({ input, ctx }) => {
      const page = input?.page ?? 1;
      const limit = input?.limit ?? 20;
      const skip = (page - 1) * limit;

      const [payments, total] = await Promise.all([
        ctx.prisma.payment.findMany({
          where: { userId: ctx.user.id },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        ctx.prisma.payment.count({ where: { userId: ctx.user.id } }),
      ]);

      return {
        payments,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    }),

  topUpCredits: protectedProcedure
    .input(
      z.object({
        amount: z.number().int().min(100).max(1000000),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!stripe) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Payment service unavailable' });
      }
      // Create a Stripe payment intent for credit top-up
      const paymentIntent = await stripe.paymentIntents.create({
        amount: input.amount,
        currency: 'gbp',
        customer: (await ctx.prisma.subscription.findUnique({ where: { userId: ctx.user.id } }))?.stripeCustomerId || undefined,
        metadata: {
          userId: ctx.user.id,
          type: 'credit_topup',
          creditAmount: input.amount.toString(),
        },
      });

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      };
    }),

  // ── Phase 7: Cancellation without dark patterns ─────────────────────────
  // "Tell us what we could have done better."
  // No countdown. No guilt. No "are you sure?". Just honesty.
  cancelSubscription: protectedProcedure
    .input(z.object({
      reason: z.enum([
        'too_expensive',
        'not_using_enough',
        'found_alternative',
        'technical_issues',
        'personal_circumstances',
        'other',
      ]),
      freeText: z.string().max(1000).optional(),
      wouldReturn: z.boolean().optional(),
      suggestedImprovement: z.string().max(1000).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUniqueOrThrow({
        where: { id: ctx.user.id },
        select: { subscriptionTier: true, stripeSubscriptionId: true },
      });

      // Get usage stats for the feedback record
      const sessionCount = await ctx.prisma.agentSession.count({
        where: { hire: { userId: ctx.user.id } },
      });

      // Store cancellation feedback - this data is gold for product decisions
      await ctx.prisma.cancellationFeedback.create({
        data: {
          userId: ctx.user.id,
          reason: input.reason,
          freeText: input.freeText,
          wouldReturn: input.wouldReturn,
          suggestedImprovement: input.suggestedImprovement,
          subscriptionTier: user.subscriptionTier ?? 'starter',
          sessionsCompleted: sessionCount,
        },
      });

      // Cancel with Stripe at period end (not immediately)
      if (stripe && user.stripeSubscriptionId) {
        await stripe.subscriptions.update(user.stripeSubscriptionId, {
          cancel_at_period_end: true,
        });
      }

      // Update user
      await ctx.prisma.user.update({
        where: { id: ctx.user.id },
        data: { scheduledCancellationAt: new Date() },
      });

      // Log to audit trail
      await ctx.prisma.platformAuditLog.create({
        data: {
          userId: ctx.user.id,
          action: 'subscription.cancel_requested',
          resource: `user:${ctx.user.id}`,
          details: { reason: input.reason, tier: user.subscriptionTier },
        },
      });

      return {
        success: true,
        message: "Your subscription will end at the current billing period. Your companions are paused but your Brain, your memory notes, and everything your companions know about you is preserved. If you come back, everything will be exactly as you left it.",
        brainPreservedForever: true,
        accessUntil: null,
      };
    }),
});
