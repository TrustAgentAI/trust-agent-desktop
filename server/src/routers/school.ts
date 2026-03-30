import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure, adminProcedure } from '../trpc';
import Stripe from 'stripe';

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-03-25.dahlia' })
  : null;

export const schoolRouter = router({
  // ──────────────────────────────────────────────────────────────────────────
  // CREATE LICENCE (admin only)
  // ──────────────────────────────────────────────────────────────────────────
  createLicence: adminProcedure
    .input(
      z.object({
        schoolName: z.string().min(1).max(200),
        contactEmail: z.string().email(),
        contactName: z.string().min(1).max(100),
        roleSlugAccess: z.array(z.string()).min(1),
        maxStudents: z.number().int().min(1).max(10000),
        pricePerStudent: z.number().int().min(100), // pence
        validMonths: z.number().int().min(1).max(36).default(12),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + input.validMonths);

      // Verify all role slugs exist
      const roles = await ctx.prisma.role.findMany({
        where: { slug: { in: input.roleSlugAccess } },
        select: { slug: true },
      });

      const foundSlugs = new Set(roles.map((r) => r.slug));
      const invalidSlugs = input.roleSlugAccess.filter((s) => !foundSlugs.has(s));
      if (invalidSlugs.length > 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Invalid role slugs: ${invalidSlugs.join(', ')}`,
        });
      }

      // Create Stripe subscription if payment service available
      let stripeSubId: string | undefined;
      if (stripe) {
        try {
          const customer = await stripe.customers.create({
            email: input.contactEmail,
            name: input.schoolName,
            metadata: { type: 'school_licence' },
          });

          // Create a product first, then use its ID in price_data
          const product = await stripe.products.create({
            name: `Trust Agent School Licence - ${input.schoolName}`,
            metadata: { type: 'school_licence', schoolName: input.schoolName },
          });

          const subscription = await stripe.subscriptions.create({
            customer: customer.id,
            items: [{
              price_data: {
                currency: 'gbp',
                unit_amount: input.pricePerStudent,
                recurring: { interval: 'month' },
                product: product.id,
              },
              quantity: input.maxStudents,
            }],
            metadata: { schoolName: input.schoolName },
          });

          stripeSubId = subscription.id;
        } catch (err) {
          console.error('Stripe school licence creation error:', err);
          // Continue without Stripe - licence can be manually managed
        }
      }

      const licence = await ctx.prisma.schoolLicence.create({
        data: {
          schoolName: input.schoolName,
          contactEmail: input.contactEmail,
          contactName: input.contactName,
          roleSlugAccess: input.roleSlugAccess,
          maxStudents: input.maxStudents,
          pricePerStudent: input.pricePerStudent,
          stripeSubId: stripeSubId || null,
          expiresAt,
        },
      });

      return {
        id: licence.id,
        schoolName: licence.schoolName,
        activationCode: licence.activationCode,
        maxStudents: licence.maxStudents,
        expiresAt: licence.expiresAt,
        stripeSubId: licence.stripeSubId,
      };
    }),

  // ──────────────────────────────────────────────────────────────────────────
  // ENROL STUDENT - user-facing, validates licence activation code
  // ──────────────────────────────────────────────────────────────────────────
  enrolStudent: protectedProcedure
    .input(
      z.object({
        activationCode: z.string().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const licence = await ctx.prisma.schoolLicence.findUnique({
        where: { activationCode: input.activationCode },
        include: {
          enrolments: { select: { id: true } },
        },
      });

      if (!licence) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Invalid school licence code' });
      }

      if (licence.status !== 'active') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: `This licence is ${licence.status}` });
      }

      if (new Date() > licence.expiresAt) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'This licence has expired' });
      }

      if (licence.enrolments.length >= licence.maxStudents) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'This licence has reached its student capacity' });
      }

      // Check if already enrolled
      const existing = await ctx.prisma.studentEnrolment.findUnique({
        where: {
          licenceId_userId: {
            licenceId: licence.id,
            userId: ctx.user.id,
          },
        },
      });

      if (existing) {
        throw new TRPCError({ code: 'CONFLICT', message: 'You are already enrolled under this licence' });
      }

      const enrolment = await ctx.prisma.studentEnrolment.create({
        data: {
          licenceId: licence.id,
          userId: ctx.user.id,
          expiresAt: licence.expiresAt,
        },
      });

      return {
        enrolmentId: enrolment.id,
        schoolName: licence.schoolName,
        roleAccess: licence.roleSlugAccess,
        expiresAt: licence.expiresAt,
      };
    }),

  // ──────────────────────────────────────────────────────────────────────────
  // GET ENROLMENTS - for admin: by licenceId; for user: own enrolments
  // ──────────────────────────────────────────────────────────────────────────
  getEnrolments: protectedProcedure
    .input(
      z.object({
        licenceId: z.string().optional(),
      }).optional()
    )
    .query(async ({ input, ctx }) => {
      if (input?.licenceId) {
        // Return enrolments for a specific licence
        const licence = await ctx.prisma.schoolLicence.findUnique({
          where: { id: input.licenceId },
        });

        if (!licence) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Licence not found' });
        }

        const enrolments = await ctx.prisma.studentEnrolment.findMany({
          where: { licenceId: input.licenceId },
          include: {
            user: { select: { id: true, name: true, email: true, plan: true } },
          },
          orderBy: { enrolledAt: 'desc' },
        });

        return {
          licence: {
            id: licence.id,
            schoolName: licence.schoolName,
            maxStudents: licence.maxStudents,
            currentStudents: enrolments.length,
            expiresAt: licence.expiresAt,
          },
          enrolments: enrolments.map((e) => ({
            id: e.id,
            student: e.user,
            enrolledAt: e.enrolledAt,
            expiresAt: e.expiresAt,
          })),
        };
      }

      // Return user's own enrolments
      const myEnrolments = await ctx.prisma.studentEnrolment.findMany({
        where: { userId: ctx.user.id },
        include: {
          licence: {
            select: {
              id: true,
              schoolName: true,
              roleSlugAccess: true,
              status: true,
              expiresAt: true,
            },
          },
        },
        orderBy: { enrolledAt: 'desc' },
      });

      return {
        enrolments: myEnrolments.map((e) => ({
          id: e.id,
          schoolName: e.licence.schoolName,
          roleAccess: e.licence.roleSlugAccess,
          status: e.licence.status,
          enrolledAt: e.enrolledAt,
          expiresAt: e.expiresAt || e.licence.expiresAt,
        })),
      };
    }),

  // ──────────────────────────────────────────────────────────────────────────
  // GET LICENCE STATUS
  // ──────────────────────────────────────────────────────────────────────────
  getLicenceStatus: protectedProcedure
    .input(
      z.object({
        licenceId: z.string().optional(),
        activationCode: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      if (!input.licenceId && !input.activationCode) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Provide licenceId or activationCode' });
      }

      const licence = await ctx.prisma.schoolLicence.findFirst({
        where: {
          ...(input.licenceId ? { id: input.licenceId } : {}),
          ...(input.activationCode ? { activationCode: input.activationCode } : {}),
        },
        include: {
          enrolments: { select: { id: true } },
        },
      });

      if (!licence) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Licence not found' });
      }

      const isExpired = new Date() > licence.expiresAt;
      const effectiveStatus = isExpired ? 'expired' : licence.status;

      return {
        id: licence.id,
        schoolName: licence.schoolName,
        contactEmail: licence.contactEmail,
        contactName: licence.contactName,
        status: effectiveStatus,
        roleSlugAccess: licence.roleSlugAccess,
        maxStudents: licence.maxStudents,
        currentStudents: licence.enrolments.length,
        pricePerStudent: licence.pricePerStudent,
        expiresAt: licence.expiresAt,
        createdAt: licence.createdAt,
        isValid: effectiveStatus === 'active' && !isExpired,
      };
    }),

  // ──────────────────────────────────────────────────────────────────────────
  // CHECK STUDENT ACCESS - verify student has valid licence for a role
  // ──────────────────────────────────────────────────────────────────────────
  checkStudentAccess: protectedProcedure
    .input(
      z.object({
        roleSlug: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      const enrolments = await ctx.prisma.studentEnrolment.findMany({
        where: { userId: ctx.user.id },
        include: {
          licence: {
            select: {
              roleSlugAccess: true,
              status: true,
              expiresAt: true,
            },
          },
        },
      });

      const validEnrolment = enrolments.find((e) => {
        const licenceValid = e.licence.status === 'active' && new Date() < e.licence.expiresAt;
        const enrolmentValid = !e.expiresAt || new Date() < e.expiresAt;
        const hasAccess = e.licence.roleSlugAccess.includes(input.roleSlug);
        return licenceValid && enrolmentValid && hasAccess;
      });

      return {
        hasAccess: !!validEnrolment,
        enrolmentId: validEnrolment?.id || null,
      };
    }),

  // ── Phase 9: School Leaderboard (anonymised streak rankings) ─────────────
  getLeaderboard: protectedProcedure
    .input(z.object({ schoolId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Get current week
      const now = new Date();
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const periodStart = new Date(now);
      periodStart.setDate(diff);
      periodStart.setHours(0, 0, 0, 0);

      const leaderboard = await ctx.prisma.schoolLeaderboard.findFirst({
        where: {
          schoolId: input.schoolId,
          periodStart: { gte: periodStart },
        },
        orderBy: { generatedAt: 'desc' },
      });

      if (!leaderboard) {
        return { entries: [], generatedAt: null, periodStart: null, periodEnd: null };
      }

      // Find calling user's position (by matching their streak data)
      const userHire = await ctx.prisma.hire.findFirst({
        where: { userId: ctx.user.id, status: 'ACTIVE' },
        orderBy: { streakDays: 'desc' },
        select: { streakDays: true },
      });

      const entries = leaderboard.entries as Array<{ rank: number; streakDays: number; subjectEmoji: string; anonymousId: string }>;
      const myPosition = userHire
        ? entries.find(e => e.streakDays === userHire.streakDays)?.rank ?? null
        : null;

      return {
        entries,
        myPosition,
        generatedAt: leaderboard.generatedAt,
        periodStart: leaderboard.periodStart,
        periodEnd: leaderboard.periodEnd,
      };
    }),

  // Admin: generate leaderboard for a school
  generateLeaderboard: adminProcedure
    .input(z.object({ schoolId: z.string() }))
    .mutation(async ({ input }) => {
      const { generateSchoolLeaderboard } = await import('../lib/schools/generateLeaderboard');
      await generateSchoolLeaderboard(input.schoolId);
      return { success: true };
    }),
});
