import type { Role, RoleAudit } from '@prisma/client';

/**
 * SafeRole excludes systemPrompt, systemPromptHash, hardLimits, and escalationTriggers.
 * System prompts NEVER leave the server per absolute rule #4.
 */
export type SafeRole = Omit<Role, 'systemPrompt' | 'systemPromptHash' | 'hardLimits' | 'escalationTriggers'> & {
  audit?: {
    trustScore: number;
    badge: string;
    totalScore: number;
    completedAt: Date;
    expiresAt: Date;
  } | null;
};

export function toSafeRole(role: Role & { audit?: RoleAudit | null }): SafeRole {
  const {
    systemPrompt: _sp,
    systemPromptHash: _sph,
    hardLimits: _hl,
    escalationTriggers: _et,
    ...safeFields
  } = role;

  return {
    ...safeFields,
    audit: role.audit
      ? {
          trustScore: role.audit.trustScore,
          badge: role.audit.badge,
          totalScore: role.audit.totalScore,
          completedAt: role.audit.completedAt,
          expiresAt: role.audit.expiresAt,
        }
      : null,
  };
}

/**
 * Prisma select object that excludes sensitive fields from the query itself.
 * Use this in prisma.role.findMany({ select: safeRoleSelect }) for efficiency.
 */
export const safeRoleSelect = {
  id: true,
  slug: true,
  baseSlug: true,
  gender: true,
  name: true,
  companionName: true,
  category: true,
  subcategory: true,
  tagline: true,
  description: true,
  // systemPrompt: EXCLUDED
  // systemPromptHash: EXCLUDED
  priceMonthly: true,
  targetUser: true,
  capabilities: true,
  limitations: true,
  // hardLimits: EXCLUDED
  // escalationTriggers: EXCLUDED
  knowledgeSources: true,
  tags: true,
  languageCode: true,
  languageName: true,
  isActive: true,
  publishedAt: true,
  isFeatured: true,
  environmentSlug: true,
  environmentConfig: true,
  supportsVoice: true,
  supportsTextOnly: true,
  supportsWearable: true,
  maxSessionMinutes: true,
  maxDailySessionMins: true,
  requiredPlan: true,
  roleType: true,
  stakeRequired: true,
  creatorId: true,
  createdAt: true,
  updatedAt: true,
  audit: {
    select: {
      trustScore: true,
      badge: true,
      totalScore: true,
      completedAt: true,
      expiresAt: true,
    },
  },
} as const;
