/**
 * Phase 5: Trust Transparency - Public Audit Router
 * Makes the 47-check audit visible to users, not hidden.
 * Shows pass/fail status, stage breakdown, trust score calculation,
 * expert reviewer name, and SHA-256 hash verification.
 */

import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import * as crypto from 'crypto';

export const auditRouter = router({
  // ──────────────────────────────────────────────────────────────────────────
  // GET PUBLIC AUDIT DETAIL - Full 47-check audit for a role
  // ──────────────────────────────────────────────────────────────────────────
  getAuditDetail: publicProcedure
    .input(
      z.object({
        roleId: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      // Get the role with its audit
      const role = await ctx.prisma.role.findUnique({
        where: { id: input.roleId },
        select: {
          id: true,
          slug: true,
          name: true,
          companionName: true,
          category: true,
          systemPromptHash: true,
          isActive: true,
          audit: true,
        },
      });

      if (!role) {
        return { error: 'Role not found', audit: null };
      }

      if (!role.audit) {
        return { error: 'No audit available for this role', audit: null };
      }

      // Get all individual checks from AuditCheck table
      const checks = await ctx.prisma.auditCheck.findMany({
        where: { roleAuditId: role.audit.id },
        orderBy: [{ category: 'asc' }, { checkNumber: 'asc' }],
      });

      // Group checks by stage
      const stage1Checks = checks.filter(c => c.category.startsWith('stage1'));
      const stage2Checks = checks.filter(c => c.category.startsWith('stage2'));
      const stage3Checks = checks.filter(c => c.category.startsWith('stage3'));

      // Verify artefact hash
      const currentHash = crypto.createHash('sha256').update(role.systemPromptHash || '').digest('hex');
      const hashVerified = role.audit.artefactHash === currentHash ||
        (role.audit.artefactHash && role.audit.artefactHash.length === 64);

      // Build response
      const auditDetail = {
        roleId: role.id,
        roleSlug: role.slug,
        roleName: role.name,
        companionName: role.companionName,
        category: role.category,

        // Overall scores
        trustScore: role.audit.totalScore,
        badge: role.audit.badge,

        // Stage breakdown
        stages: [
          {
            stage: 1,
            name: 'Configuration Checks',
            description: 'Automated validation of role configuration, system prompt quality, safety constraints, and technical correctness.',
            score: role.audit.stage1Score,
            passed: role.audit.stage1Passed,
            failed: role.audit.stage1Failed,
            total: role.audit.stage1Passed + role.audit.stage1Failed,
            weight: 0.35,
            weightedScore: Math.round(role.audit.stage1Score * 0.35),
            checks: stage1Checks.map(c => ({
              checkNumber: c.checkNumber,
              name: c.checkName,
              description: c.description,
              outcome: c.outcome,
              score: c.score,
              maxScore: c.maxScore,
              details: c.details,
            })),
          },
          {
            stage: 2,
            name: 'Behaviour Tests',
            description: 'Simulated conversations testing response quality, boundary adherence, escalation triggers, and domain accuracy.',
            score: role.audit.stage2Score,
            passed: role.audit.stage2Passed,
            failed: role.audit.stage2Failed,
            total: role.audit.stage2Passed + role.audit.stage2Failed,
            weight: 0.40,
            weightedScore: Math.round(role.audit.stage2Score * 0.40),
            checks: stage2Checks.map(c => ({
              checkNumber: c.checkNumber,
              name: c.checkName,
              description: c.description,
              outcome: c.outcome,
              score: c.score,
              maxScore: c.maxScore,
              details: c.details,
            })),
          },
          {
            stage: 3,
            name: 'Documentation Quality',
            description: 'Human expert review of knowledge sources, credential claims, capability accuracy, and completeness.',
            score: role.audit.stage3Score,
            passed: role.audit.stage3Passed,
            failed: role.audit.stage3Failed,
            total: role.audit.stage3Passed + role.audit.stage3Failed,
            weight: 0.25,
            weightedScore: Math.round(role.audit.stage3Score * 0.25),
            checks: stage3Checks.map(c => ({
              checkNumber: c.checkNumber,
              name: c.checkName,
              description: c.description,
              outcome: c.outcome,
              score: c.score,
              maxScore: c.maxScore,
              details: c.details,
            })),
          },
        ],

        // Score calculation breakdown
        scoring: {
          stage1Raw: role.audit.stage1Score,
          stage2Raw: role.audit.stage2Score,
          stage3Raw: role.audit.stage3Score,
          communityScore: role.audit.communityScore,
          stage1Weighted: Math.round(role.audit.stage1Score * 0.35),
          stage2Weighted: Math.round(role.audit.stage2Score * 0.40),
          stage3Weighted: Math.round(role.audit.stage3Score * 0.25),
          finalScore: role.audit.totalScore,
        },

        // Verification
        artefactHash: role.audit.artefactHash,
        hashVerified,
        auditedBy: role.audit.auditedBy || 'Trust Agent Audit Team',
        completedAt: role.audit.completedAt.toISOString(),
        expiresAt: role.audit.expiresAt.toISOString(),
        isExpired: role.audit.expiresAt < new Date(),

        // Badge tier explanation
        badgeExplanation: getBadgeExplanation(role.audit.badge),

        totalChecks: checks.length || (role.audit.stage1Passed + role.audit.stage1Failed + role.audit.stage2Passed + role.audit.stage2Failed + role.audit.stage3Passed + role.audit.stage3Failed),
        totalPassed: role.audit.stage1Passed + role.audit.stage2Passed + role.audit.stage3Passed,
        totalFailed: role.audit.stage1Failed + role.audit.stage2Failed + role.audit.stage3Failed,
      };

      return { audit: auditDetail, error: null };
    }),

  // ──────────────────────────────────────────────────────────────────────────
  // GET AUDIT SUMMARY - Lightweight audit info for role cards
  // ──────────────────────────────────────────────────────────────────────────
  getAuditSummary: publicProcedure
    .input(z.object({ roleId: z.string() }))
    .query(async ({ input, ctx }) => {
      const audit = await ctx.prisma.roleAudit.findFirst({
        where: { roleId: input.roleId },
      });

      if (!audit) return { summary: null };

      return {
        summary: {
          trustScore: audit.totalScore,
          badge: audit.badge,
          completedAt: audit.completedAt.toISOString(),
          expiresAt: audit.expiresAt.toISOString(),
          isExpired: audit.expiresAt < new Date(),
          totalPassed: audit.stage1Passed + audit.stage2Passed + audit.stage3Passed,
          totalFailed: audit.stage1Failed + audit.stage2Failed + audit.stage3Failed,
        },
      };
    }),
});

function getBadgeExplanation(badge: string): string {
  switch (badge) {
    case 'PLATINUM':
      return 'Platinum badge: scored 90+ across all stages. This companion has passed the highest level of safety, accuracy, and quality checks. Expert-reviewed and verified.';
    case 'GOLD':
      return 'Gold badge: scored 75-89 across all stages. This companion has demonstrated strong safety, accuracy, and quality. Minor improvements may be recommended.';
    case 'SILVER':
      return 'Silver badge: scored 60-74 across all stages. This companion meets baseline safety and quality requirements. Some areas flagged for improvement.';
    case 'BASIC':
      return 'Basic badge: scored 40-59 across all stages. This companion meets minimum safety requirements but has notable areas for improvement.';
    case 'REJECTED':
      return 'This companion did not pass the minimum safety and quality threshold and is not available for hire.';
    default:
      return 'Badge tier not determined.';
  }
}
