/**
 * nhs.ts - Phase 12: NHS Partner Network Router
 * Proper integration, not just a badge.
 * A real network of GP practices.
 */

import { z } from 'zod';
import { router, publicProcedure, adminProcedure } from '../trpc';

export const nhsRouter = router({
  // Admin: add an NHS partner practice
  addPartnerPractice: adminProcedure
    .input(z.object({
      odsCode: z.string().min(6).max(10),
      practiceName: z.string(),
      address: z.string(),
      primaryCareNetworkId: z.string().optional(),
      pcnName: z.string().optional(),
      liaisonName: z.string().optional(),
      liaisonEmail: z.string().email().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.nHSPartnerPractice.upsert({
        where: { odsCode: input.odsCode.toUpperCase() },
        create: {
          ...input,
          odsCode: input.odsCode.toUpperCase(),
          igComplianceStatus: 'PENDING',
          pilotStatus: 'NONE',
        },
        update: input,
      });
    }),

  // GP: verify their practice is a partner
  verifyPracticePartner: publicProcedure
    .input(z.object({ odsCode: z.string() }))
    .query(async ({ ctx, input }) => {
      const practice = await ctx.prisma.nHSPartnerPractice.findUnique({
        where: { odsCode: input.odsCode.toUpperCase() },
        select: {
          practiceName: true,
          igComplianceStatus: true,
          pilotStatus: true,
          codesIssued: true,
        },
      });

      if (!practice) {
        return { isPartner: false, practice: null };
      }

      return {
        isPartner: practice.igComplianceStatus === 'COMPLIANT',
        practice: {
          name: practice.practiceName,
          igCompliant: practice.igComplianceStatus === 'COMPLIANT',
          inPilot: practice.pilotStatus === 'ACTIVE',
          codesAvailable: true,
        },
      };
    }),

  // Public: NHS partner count for homepage / investor deck
  getNHSPartnerStats: publicProcedure
    .query(async ({ ctx }) => {
      const [partners, activations, compliant] = await Promise.all([
        ctx.prisma.nHSPartnerPractice.count(),
        ctx.prisma.nHSReferralActivation.count(),
        ctx.prisma.nHSPartnerPractice.count({ where: { igComplianceStatus: 'COMPLIANT' } }),
      ]);
      return {
        partnerPractices: partners,
        patientsSupported: activations,
        igCompliantPractices: compliant,
      };
    }),

  // Admin: update partner compliance status
  updatePartnerCompliance: adminProcedure
    .input(z.object({
      odsCode: z.string(),
      igComplianceStatus: z.enum(['PENDING', 'COMPLIANT', 'AUDIT_REQUIRED']),
      pilotStatus: z.enum(['NONE', 'ACTIVE', 'COMPLETE']).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.nHSPartnerPractice.update({
        where: { odsCode: input.odsCode.toUpperCase() },
        data: {
          igComplianceStatus: input.igComplianceStatus,
          ...(input.pilotStatus && { pilotStatus: input.pilotStatus }),
        },
      });
    }),
});
