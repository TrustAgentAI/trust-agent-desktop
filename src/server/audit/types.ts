// ============================================================================
// Trust Agent - Audit Pipeline Types
// 47-Check Audit Pipeline - Type Definitions
// ============================================================================

/** Result of a single audit check */
export interface CheckResult {
  checkId: string;
  stage: 1 | 2 | 3;
  passed: boolean;
  score: number; // 0-100
  message: string;
  evidence: string;
}

/** Trust badge levels */
export type TrustBadge = 'PLATINUM' | 'GOLD' | 'SILVER' | 'BASIC' | 'REJECTED';

/** Stage-level summary */
export interface StageSummary {
  stage: 1 | 2 | 3;
  stageName: string;
  checks: CheckResult[];
  averageScore: number;
  passedCount: number;
  totalCount: number;
  weight: number;
  weightedScore: number;
}

/** Complete audit packet output */
export interface AuditPacket {
  roleSlug: string;
  roleName: string;
  auditVersion: string;
  auditTimestamp: string;
  stages: StageSummary[];
  allChecks: CheckResult[];
  scoring: {
    stage1Score: number;
    stage2Score: number;
    stage3Score: number;
    communitySignal: number;
    versionHistory: number;
    stage1Weighted: number;
    stage2Weighted: number;
    stage3Weighted: number;
    communityWeighted: number;
    versionWeighted: number;
    finalScore: number;
  };
  badge: TrustBadge;
  totalChecks: number;
  totalPassed: number;
  summary: string;
}

/** Valid role categories */
export const VALID_CATEGORIES = [
  'education',
  'health-wellness',
  'elderly-care',
  'food-lifestyle',
  'legal-financial',
  'creative-professional',
  'childrens',
  'enterprise',
] as const;

export type RoleCategory = (typeof VALID_CATEGORIES)[number];

/** Skill assignment within a role */
export interface SkillAssignment {
  skillSlug: string;
  skillName: string;
  injectionPoint: 'system' | 'context' | 'tools';
  priority: number;
}

/** Audit metadata embedded in role definitions */
export interface AuditMetadata {
  submittedBy: string;
  domainExpertRequired: string;
  childSafetyRequired: boolean;
  regulatoryFlags: string[];
  expectedBadge: 'PLATINUM' | 'GOLD' | 'SILVER';
  researchCompleted: boolean;
  knowledgeVerified: boolean;
}

/** The full role definition JSON schema */
export interface RoleDefinition {
  slug: string;
  name: string;
  category: RoleCategory;
  subcategory: string;
  tagline: string;
  description: string;
  targetUser: string;
  priceMonthly: number; // GBP pence
  systemPrompt: string;
  capabilities: string[];
  limitations: string[];
  hardLimits: string[];
  escalationTriggers: string[];
  skills: SkillAssignment[];
  knowledgeSources: string[];
  auditMetadata: AuditMetadata;
  tags: string[];
  searchKeywords: string[];
  languageCode?: string;
  languageName?: string;
}

/** Competitor brand names that must not appear in role content */
export const COMPETITOR_NAMES = [
  'chatgpt',
  'openai',
  'gpt-4',
  'gpt-3',
  'gpt4',
  'gpt3',
  'claude',
  'anthropic',
  'gemini',
  'bard',
  'google ai',
  'copilot',
  'bing chat',
  'character.ai',
  'character ai',
  'perplexity',
  'mistral',
  'llama',
  'meta ai',
  'pi ai',
  'inflection',
  'cohere',
  'jasper ai',
];

/** Common placeholder patterns that indicate incomplete content */
export const PLACEHOLDER_PATTERNS = [
  /\[insert\b/i,
  /\[todo\b/i,
  /\[placeholder\b/i,
  /\[fill in\b/i,
  /\[tbd\b/i,
  /\[to be determined\b/i,
  /\[add\s/i,
  /\[replace\b/i,
  /\[your\s/i,
  /lorem\s+ipsum/i,
  /xxx+/i,
  /\.\.\.\s*$/m,
  /placeholder/i,
  /coming\s+soon/i,
  /not\s+yet\s+implemented/i,
  /work\s+in\s+progress/i,
  /TODO:/i,
  /FIXME:/i,
  /HACK:/i,
];

/** Slug format validation regex */
export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
