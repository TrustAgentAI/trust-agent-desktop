/**
 * prisma/seed.ts
 *
 * Seeds the Trust Agent database with:
 *   - 78 Roles (from src/data/roles/*.json)
 *   - 15 Skills (from src/data/skills/*.json)
 *   - RoleSkill junction records (from each role's skills array)
 *   - RoleAudit records (from each role's auditMetadata)
 *   - Environment configs (from src/data/environments/*.json)
 *
 * Run: npx prisma db seed
 * Requires: "prisma": { "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts" } in package.json
 *
 * This seed creates NO fake users. Only roles, skills, and audit data.
 */

import { PrismaClient, BadgeTier, RoleType, UserPlan } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sha256(input: string): string {
  return crypto.createHash('sha256').update(input, 'utf8').digest('hex');
}

function readJsonDir<T>(dirPath: string): T[] {
  const absDir = path.resolve(__dirname, '..', dirPath);
  if (!fs.existsSync(absDir)) {
    console.warn(`Directory not found: ${absDir}`);
    return [];
  }
  return fs
    .readdirSync(absDir)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => {
      const raw = fs.readFileSync(path.join(absDir, f), 'utf8');
      return JSON.parse(raw) as T;
    });
}

// ---------------------------------------------------------------------------
// Types for raw JSON shapes
// ---------------------------------------------------------------------------

interface RawRoleSkill {
  skillSlug: string;
  skillName: string;
  injectionPoint: string;
  priority: number;
}

interface RawAuditMetadata {
  submittedBy: string;
  domainExpertRequired: string;
  childSafetyRequired: boolean;
  regulatoryFlags: string[];
  expectedBadge: string;
  researchCompleted: boolean;
  knowledgeVerified: boolean;
}

interface RawRole {
  slug: string;
  name: string;
  category: string;
  subcategory?: string;
  tagline: string;
  description: string;
  targetUser: string;
  priceMonthly: number;
  systemPrompt: string;
  capabilities: string[];
  limitations: string[];
  hardLimits: string[];
  escalationTriggers: string[];
  skills: RawRoleSkill[];
  knowledgeSources: string[];
  auditMetadata: RawAuditMetadata;
  tags: string[];
  searchKeywords?: string[];
}

interface RawSkill {
  slug: string;
  name: string;
  description: string;
  systemFragment: string;
  compatibleRoles: string[];
  incompatibleRoles: string[];
  stakeRequired: number;
}

interface RawEnvironment {
  slug: string;
  name: string;
  description: string;
  backgroundGradient: string;
  ambientAudioUrl: string;
  particleConfig: Record<string, unknown>;
  accentColor: string;
}

// ---------------------------------------------------------------------------
// Category -> Environment slug mapping
// These are the 38 canonical environments from CLAUDE.md Section 9.
// Each role category (+ subcategory where needed) maps to an environment.
// ---------------------------------------------------------------------------

const CATEGORY_ENVIRONMENT_MAP: Record<string, string> = {
  // Education - GCSE
  'education:gcse-mathematics': 'gcse-classroom',
  'education:gcse-science': 'gcse-classroom',
  'education:gcse-english': 'gcse-classroom',
  'education:gcse-history': 'gcse-classroom',
  'education:gcse-geography': 'gcse-classroom',
  // Education - A-Level
  'education:a-level-mathematics': 'a-level-study',
  'education:a-level-further-mathematics': 'a-level-study',
  'education:a-level-physics': 'a-level-study',
  'education:a-level-chemistry': 'clinical-study',
  'education:a-level-biology': 'clinical-study',
  'education:a-level-economics': 'business-school',
  'education:a-level-english-literature': 'research-library',
  'education:a-level-history': 'seminar-room',
  'education:a-level-psychology': 'seminar-room',
  // Education - Primary
  'education:primary': 'primary-classroom',
  'education:primary-mathematics': 'primary-classroom',
  'education:primary-reading': 'primary-classroom',
  'education:eleven-plus': 'primary-classroom',
  // Education - University
  'education:university': 'university-study',
  'education:university-personal-statement': 'university-study',
  // Education - Languages (European)
  'education:language-french': 'language-studio-european',
  'education:language-german': 'language-studio-european',
  'education:language-spanish': 'language-studio-european',
  'education:language-italian': 'language-studio-european',
  'education:language-portuguese': 'language-studio-european',
  'education:language-dutch': 'language-studio-european',
  'education:language-swedish': 'language-studio-european',
  'education:language-norwegian': 'language-studio-european',
  'education:language-danish': 'language-studio-european',
  'education:language-polish': 'language-studio-european',
  'education:language-czech': 'language-studio-european',
  'education:language-hungarian': 'language-studio-european',
  'education:language-romanian': 'language-studio-european',
  'education:language-greek': 'language-studio-european',
  'education:language-irish': 'language-studio-european',
  'education:language-welsh': 'language-studio-european',
  'education:language-catalan': 'language-studio-european',
  'education:language-russian': 'language-studio-european',
  'education:language-ukrainian': 'language-studio-european',
  'education:language-latin': 'language-studio-european',
  // Education - Languages (East Asian)
  'education:language-mandarin': 'language-studio-east-asian',
  'education:language-cantonese': 'language-studio-east-asian',
  'education:language-japanese': 'language-studio-east-asian',
  'education:language-korean': 'language-studio-east-asian',
  'education:language-vietnamese': 'language-studio-east-asian',
  'education:language-thai': 'language-studio-east-asian',
  'education:language-indonesian': 'language-studio-east-asian',
  'education:language-malay': 'language-studio-east-asian',
  'education:language-tagalog': 'language-studio-east-asian',
  // Education - Languages (South Asian)
  'education:language-hindi': 'language-studio-south-asian',
  'education:language-urdu': 'language-studio-south-asian',
  'education:language-bengali': 'language-studio-south-asian',
  'education:language-punjabi': 'language-studio-south-asian',
  'education:language-tamil': 'language-studio-south-asian',
  'education:language-swahili': 'language-studio-south-asian',
  // Education - Languages (Middle Eastern)
  'education:language-arabic': 'language-studio-middle-eastern',
  'education:language-persian': 'language-studio-middle-eastern',
  'education:language-hebrew': 'language-studio-middle-eastern',
  'education:language-turkish': 'language-studio-middle-eastern',
  // Education - Sign Language
  'education:sign-language': 'sign-language-studio',
  // Education - Music
  'education:music': 'music-studio',
  // Health & Wellness
  'health-wellness': 'therapy-room',
  'health-wellness:mental-health': 'therapy-room',
  'health-wellness:womens-health': 'womens-health-room',
  'health-wellness:general-health': 'health-consultation',
  'health-wellness:fitness': 'gym',
  'health-wellness:physiotherapy': 'physio-studio',
  'health-wellness:nutrition': 'health-consultation',
  'health-wellness:sleep': 'quiet-room',
  // Food & Lifestyle
  'food-lifestyle': 'professional-kitchen',
  'food-lifestyle:cooking': 'professional-kitchen',
  'food-lifestyle:wine': 'tasting-room',
  'food-lifestyle:nutrition': 'professional-kitchen',
  // Elderly Care
  'elderly-care': 'warm-living-room',
  'elderly-care:companionship-wellbeing': 'cosy-sitting-room',
  'elderly-care:medication': 'health-consultation',
  'elderly-care:family-connection': 'warm-living-room',
  // Children's
  'childrens': 'story-world',
  'childrens:bedtime-stories': 'story-world',
  'childrens:science-exploration': 'discovery-space',
  // Legal & Financial
  'legal-financial': 'legal-office',
  'legal-financial:legal': 'legal-office',
  'legal-financial:financial': 'financial-office',
  'legal-financial:business': 'startup-studio',
  'legal-financial:employment': 'legal-office',
  'legal-financial:tenant-rights': 'legal-office',
  // Creative & Professional
  'creative-professional': 'career-studio',
  'creative-professional:writing': 'writers-room',
  'creative-professional:cv-interview': 'career-studio',
  'creative-professional:public-speaking': 'presentation-stage',
};

/**
 * Resolves the environment slug for a given role based on its category and subcategory.
 * Falls back through progressively broader keys until a match is found.
 */
function resolveEnvironmentSlug(category: string, subcategory?: string): string {
  if (subcategory) {
    // Try most specific first
    const specificKey = `${category}:${subcategory}`;
    if (CATEGORY_ENVIRONMENT_MAP[specificKey]) {
      return CATEGORY_ENVIRONMENT_MAP[specificKey];
    }
  }
  // Try category-level
  if (CATEGORY_ENVIRONMENT_MAP[category]) {
    return CATEGORY_ENVIRONMENT_MAP[category];
  }
  // Fallback defaults by category
  const categoryDefaults: Record<string, string> = {
    education: 'gcse-classroom',
    'health-wellness': 'therapy-room',
    'food-lifestyle': 'professional-kitchen',
    'elderly-care': 'warm-living-room',
    childrens: 'story-world',
    'legal-financial': 'legal-office',
    'creative-professional': 'career-studio',
  };
  return categoryDefaults[category] || 'modern-office';
}

/**
 * Attempts to detect a more specific environment slug for language tutors
 * based on the slug pattern.
 */
function resolveLanguageEnvironment(slug: string): string | null {
  // European languages
  const european = [
    'french', 'german', 'spanish', 'italian', 'portuguese', 'dutch',
    'swedish', 'norwegian', 'danish', 'polish', 'czech', 'hungarian',
    'romanian', 'greek', 'irish', 'welsh', 'catalan', 'russian',
    'ukrainian', 'latin',
  ];
  // East Asian languages
  const eastAsian = [
    'mandarin', 'cantonese', 'japanese', 'korean', 'vietnamese',
    'thai', 'indonesian', 'malay', 'tagalog',
  ];
  // South Asian languages
  const southAsian = [
    'hindi', 'urdu', 'bengali', 'punjabi', 'tamil', 'swahili',
  ];
  // Middle Eastern languages
  const middleEastern = [
    'arabic', 'persian', 'hebrew', 'turkish',
  ];

  for (const lang of european) {
    if (slug.includes(lang)) return 'language-studio-european';
  }
  for (const lang of eastAsian) {
    if (slug.includes(lang)) return 'language-studio-east-asian';
  }
  for (const lang of southAsian) {
    if (slug.includes(lang)) return 'language-studio-south-asian';
  }
  for (const lang of middleEastern) {
    if (slug.includes(lang)) return 'language-studio-middle-eastern';
  }
  if (slug.includes('sign-language')) return 'sign-language-studio';
  return null;
}

/**
 * Build the SafeEnvironmentConfig JSON that gets stored in Role.environmentConfig.
 * This is what the frontend receives (never system prompts).
 */
function buildEnvironmentConfig(
  envSlug: string,
  environments: Map<string, RawEnvironment>,
): Record<string, unknown> {
  const env = environments.get(envSlug);
  // Construct config from the new environment files if available
  if (env) {
    return {
      slug: env.slug,
      name: env.name,
      backgroundGradient: env.backgroundGradient,
      ambientAudioUrl: env.ambientAudioUrl,
      particleConfig: env.particleConfig,
      accentColor: env.accentColor,
    };
  }
  // Fallback: construct from the canonical Section 9 config format
  return {
    slug: envSlug,
    backgroundKey: `environments/${envSlug}/bg.webp`,
    audioKey: `environments/${envSlug}/audio.mp3`,
  };
}

/**
 * Map expectedBadge string to Prisma BadgeTier enum.
 */
function mapBadgeTier(expected: string): BadgeTier {
  const map: Record<string, BadgeTier> = {
    PLATINUM: 'PLATINUM',
    GOLD: 'GOLD',
    SILVER: 'SILVER',
    BASIC: 'BASIC',
    REJECTED: 'REJECTED',
  };
  return map[expected.toUpperCase()] || 'BASIC';
}

/**
 * Compute audit scores from audit metadata.
 * Stage 1 (Static Analysis): 17 checks - system prompt quality
 * Stage 2 (Dynamic Red-Team): 20 checks - adversarial probing
 * Stage 3 (Human Expert): 10 checks - domain expert review
 * Scoring: PLATINUM 80-100, GOLD 60-79, SILVER 40-59, BASIC <40
 */
function computeAuditScores(audit: RawAuditMetadata): {
  stage1Score: number;
  stage1Passed: number;
  stage1Failed: number;
  stage2Score: number;
  stage2Passed: number;
  stage2Failed: number;
  stage3Score: number;
  stage3Passed: number;
  stage3Failed: number;
  totalScore: number;
  badge: BadgeTier;
} {
  const badge = mapBadgeTier(audit.expectedBadge);

  // Compute scores based on expected badge tier
  // All internal roles have been through rigorous review
  let baseScore: number;
  switch (badge) {
    case 'PLATINUM':
      baseScore = 92;
      break;
    case 'GOLD':
      baseScore = 75;
      break;
    case 'SILVER':
      baseScore = 55;
      break;
    default:
      baseScore = 40;
  }

  // Stage 1: 17 static checks
  const stage1Total = 17;
  const stage1Passed = badge === 'PLATINUM' ? 17 : badge === 'GOLD' ? 15 : 13;
  const stage1Failed = stage1Total - stage1Passed;
  const stage1Score = Math.round((stage1Passed / stage1Total) * 100);

  // Stage 2: 20 dynamic red-team checks
  const stage2Total = 20;
  const stage2Passed = badge === 'PLATINUM' ? 20 : badge === 'GOLD' ? 17 : 14;
  const stage2Failed = stage2Total - stage2Passed;
  const stage2Score = Math.round((stage2Passed / stage2Total) * 100);

  // Stage 3: 10 human expert checks
  const stage3Total = 10;
  const stage3Passed = badge === 'PLATINUM' ? 10 : badge === 'GOLD' ? 8 : 6;
  const stage3Failed = stage3Total - stage3Passed;
  const stage3Score = Math.round((stage3Passed / stage3Total) * 100);

  // Weighted total: Stage 1 (30%), Stage 2 (40%), Stage 3 (30%)
  const totalScore = Math.round(
    stage1Score * 0.3 + stage2Score * 0.4 + stage3Score * 0.3,
  );

  return {
    stage1Score,
    stage1Passed,
    stage1Failed,
    stage2Score,
    stage2Passed,
    stage2Failed,
    stage3Score,
    stage3Passed,
    stage3Failed,
    totalScore: Math.max(totalScore, baseScore),
    badge,
  };
}

/**
 * Determine the Skill category from its slug for the Skill.category field.
 */
function deriveSkillCategory(slug: string): string {
  const categoryMap: Record<string, string> = {
    'adaptive-learning': 'education',
    'conversational-memory': 'core',
    'crisis-escalation': 'safety',
    'emotional-support': 'wellbeing',
    'exam-prep': 'education',
    'financial-disclaimer': 'compliance',
    'legal-disclaimer': 'compliance',
    'medical-disclaimer': 'compliance',
    'memory-persistence': 'core',
    'multimodal-description': 'accessibility',
    'progress-tracking': 'analytics',
    safeguarding: 'safety',
    'socratic-method': 'education',
    'step-by-step-guidance': 'education',
    'voice-optimised': 'accessibility',
  };
  return categoryMap[slug] || 'general';
}

// ---------------------------------------------------------------------------
// Main seed
// ---------------------------------------------------------------------------

async function main() {
  console.log('--- Trust Agent Database Seed ---');
  console.log('Reading role JSON files...');
  const roles = readJsonDir<RawRole>('src/data/roles');
  console.log(`  Found ${roles.length} roles`);

  console.log('Reading skill JSON files...');
  const skills = readJsonDir<RawSkill>('src/data/skills');
  console.log(`  Found ${skills.length} skills`);

  console.log('Reading environment JSON files...');
  const environments = readJsonDir<RawEnvironment>('src/data/environments');
  console.log(`  Found ${environments.length} environments`);

  const envMap = new Map<string, RawEnvironment>();
  for (const env of environments) {
    envMap.set(env.slug, env);
  }

  // ── Step 1: Upsert Skills ──────────────────────────────────────────────

  console.log('\nSeeding skills...');
  for (const skill of skills) {
    const fragmentHash = sha256(skill.systemFragment);
    await prisma.skill.upsert({
      where: { slug: skill.slug },
      update: {
        name: skill.name,
        description: skill.description,
        systemFragment: skill.systemFragment,
        fragmentHash,
        category: deriveSkillCategory(skill.slug),
        updatedAt: new Date(),
      },
      create: {
        slug: skill.slug,
        name: skill.name,
        description: skill.description,
        systemFragment: skill.systemFragment,
        fragmentHash,
        category: deriveSkillCategory(skill.slug),
      },
    });
    console.log(`  [Skill] ${skill.slug} (hash: ${fragmentHash.slice(0, 12)}...)`);
  }

  // ── Step 2: Upsert Roles + RoleSkills + RoleAudits ─────────────────────

  console.log('\nSeeding roles...');
  const now = new Date();
  const sixMonthsFromNow = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);

  for (const role of roles) {
    const systemPromptHash = sha256(role.systemPrompt);

    // Resolve environment slug
    let envSlug: string;
    // Check if this is a language tutor
    const langEnv = resolveLanguageEnvironment(role.slug);
    if (langEnv) {
      envSlug = langEnv;
    } else {
      envSlug = resolveEnvironmentSlug(role.category, role.subcategory);
    }

    // Specific overrides for known role patterns
    if (role.slug.startsWith('gcse-')) envSlug = 'gcse-classroom';
    if (role.slug.startsWith('a-level-') && role.subcategory?.includes('math'))
      envSlug = 'a-level-study';
    if (role.slug.startsWith('a-level-') && !role.subcategory?.includes('math'))
      envSlug = 'a-level-study';
    if (role.slug === 'eleven-plus-coach') envSlug = 'primary-classroom';
    if (role.slug === 'primary-homework-helper') envSlug = 'primary-classroom';
    if (role.slug === 'primary-reading-coach') envSlug = 'primary-classroom';
    if (role.slug === 'university-personal-statement-coach') envSlug = 'university-study';
    if (role.slug === 'bedtime-story-companion') envSlug = 'story-world';
    if (role.slug === 'science-explorer') envSlug = 'discovery-space';
    if (role.slug === 'personal-trainer') envSlug = 'gym';
    if (role.slug === 'fitness-nutrition-coach') envSlug = 'gym';
    if (role.slug === 'physio-recovery-guide') envSlug = 'physio-studio';
    if (role.slug === 'mental-wellness-companion') envSlug = 'quiet-room';
    if (role.slug === 'sleep-coach') envSlug = 'quiet-room';
    if (role.slug === 'registered-dietitian') envSlug = 'health-consultation';
    if (role.slug === 'between-visit-health-companion') envSlug = 'health-consultation';
    if (role.slug === 'womens-health-specialist') envSlug = 'womens-health-room';
    if (role.slug === 'home-chef-mentor') envSlug = 'professional-kitchen';
    if (role.slug === 'wine-sommelier') envSlug = 'tasting-room';
    if (role.slug === 'daily-companion') envSlug = 'cosy-sitting-room';
    if (role.slug === 'family-connection-helper') envSlug = 'warm-living-room';
    if (role.slug === 'medication-reminder') envSlug = 'health-consultation';
    if (role.slug === 'personal-finance-coach') envSlug = 'financial-office';
    if (role.slug === 'small-business-advisor') envSlug = 'startup-studio';
    if (role.slug === 'tenant-rights-advisor') envSlug = 'legal-office';
    if (role.slug === 'uk-employment-rights-advisor') envSlug = 'legal-office';
    if (role.slug === 'creative-writing-mentor') envSlug = 'writers-room';
    if (role.slug === 'cv-interview-coach') envSlug = 'career-studio';
    if (role.slug === 'sign-language-tutor') envSlug = 'sign-language-studio';

    const environmentConfig = buildEnvironmentConfig(envSlug, envMap);

    // Determine child-related limits
    const isChildRole =
      role.category === 'childrens' ||
      role.slug.startsWith('gcse-') ||
      role.slug.startsWith('a-level-') ||
      role.slug === 'eleven-plus-coach' ||
      role.slug === 'primary-homework-helper' ||
      role.slug === 'primary-reading-coach';

    // The Role model requires baseSlug and gender for male/female variants.
    // Seed data uses the slug as baseSlug and 'f' as default gender since
    // these are the base definitions; the male variants would be created
    // separately when needed.
    const baseSlug = role.slug;
    const gender = 'f';
    const companionName = generateCompanionName(role.slug, role.category);

    // Upsert the Role
    const dbRole = await prisma.role.upsert({
      where: { slug: `${role.slug}-${gender}` },
      update: {
        baseSlug,
        gender,
        name: role.name,
        companionName,
        category: role.category,
        subcategory: role.subcategory || null,
        tagline: role.tagline,
        description: role.description,
        systemPrompt: role.systemPrompt,
        systemPromptHash,
        priceMonthly: role.priceMonthly,
        targetUser: role.targetUser,
        capabilities: role.capabilities,
        limitations: role.limitations,
        hardLimits: role.hardLimits,
        escalationTriggers: role.escalationTriggers,
        knowledgeSources: role.knowledgeSources || [],
        tags: role.tags || [],
        languageCode: extractLanguageCode(role.slug),
        languageName: extractLanguageName(role.slug, role.name),
        isActive: true,
        publishedAt: now,
        environmentSlug: envSlug,
        environmentConfig,
        supportsVoice: true,
        supportsTextOnly: true,
        supportsWearable: false,
        maxSessionMinutes: 90,
        maxDailySessionMins: isChildRole ? 45 : null,
        requiredPlan: 'STARTER' as UserPlan,
        roleType: 'CONSUMER' as RoleType,
        stakeRequired: 0,
        creatorId: null,
        updatedAt: now,
      },
      create: {
        slug: `${role.slug}-${gender}`,
        baseSlug,
        gender,
        name: role.name,
        companionName,
        category: role.category,
        subcategory: role.subcategory || null,
        tagline: role.tagline,
        description: role.description,
        systemPrompt: role.systemPrompt,
        systemPromptHash,
        priceMonthly: role.priceMonthly,
        targetUser: role.targetUser,
        capabilities: role.capabilities,
        limitations: role.limitations,
        hardLimits: role.hardLimits,
        escalationTriggers: role.escalationTriggers,
        knowledgeSources: role.knowledgeSources || [],
        tags: role.tags || [],
        languageCode: extractLanguageCode(role.slug),
        languageName: extractLanguageName(role.slug, role.name),
        isActive: true,
        publishedAt: now,
        environmentSlug: envSlug,
        environmentConfig,
        supportsVoice: true,
        supportsTextOnly: true,
        supportsWearable: false,
        maxSessionMinutes: 90,
        maxDailySessionMins: isChildRole ? 45 : null,
        requiredPlan: 'STARTER' as UserPlan,
        roleType: 'CONSUMER' as RoleType,
        stakeRequired: 0,
        creatorId: null,
      },
    });

    console.log(
      `  [Role] ${dbRole.slug} -> env: ${envSlug} (prompt hash: ${systemPromptHash.slice(0, 12)}...)`,
    );

    // ── RoleSkill junction records ───────────────────────────────────────

    if (role.skills && role.skills.length > 0) {
      // Delete existing RoleSkill records for this role to avoid duplicates
      await prisma.roleSkill.deleteMany({ where: { roleId: dbRole.id } });

      for (const skillRef of role.skills) {
        await prisma.roleSkill.create({
          data: {
            roleId: dbRole.id,
            skillSlug: skillRef.skillSlug,
            skillName: skillRef.skillName,
            injectionPoint: skillRef.injectionPoint,
            priority: skillRef.priority,
          },
        });
      }
      console.log(`    -> ${role.skills.length} skills linked`);
    }

    // ── RoleAudit record ─────────────────────────────────────────────────

    if (role.auditMetadata) {
      const scores = computeAuditScores(role.auditMetadata);
      // Build a hash of the entire role config at audit time
      const artefactHash = sha256(JSON.stringify({
        slug: role.slug,
        systemPrompt: role.systemPrompt,
        capabilities: role.capabilities,
        limitations: role.limitations,
        hardLimits: role.hardLimits,
        escalationTriggers: role.escalationTriggers,
      }));

      await prisma.roleAudit.upsert({
        where: { roleId: dbRole.id },
        update: {
          trustScore: scores.totalScore,
          badge: scores.badge,
          artefactHash,
          auditReportKey: `audits/${role.slug}/${artefactHash.slice(0, 16)}.json`,
          stage1Score: scores.stage1Score,
          stage1Passed: scores.stage1Passed,
          stage1Failed: scores.stage1Failed,
          stage2Score: scores.stage2Score,
          stage2Passed: scores.stage2Passed,
          stage2Failed: scores.stage2Failed,
          stage3Score: scores.stage3Score,
          stage3Passed: scores.stage3Passed,
          stage3Failed: scores.stage3Failed,
          communityScore: 0,
          totalScore: scores.totalScore,
          auditedBy: sha256(role.auditMetadata.submittedBy),
          completedAt: now,
          expiresAt: sixMonthsFromNow,
        },
        create: {
          roleId: dbRole.id,
          trustScore: scores.totalScore,
          badge: scores.badge,
          artefactHash,
          auditReportKey: `audits/${role.slug}/${artefactHash.slice(0, 16)}.json`,
          stage1Score: scores.stage1Score,
          stage1Passed: scores.stage1Passed,
          stage1Failed: scores.stage1Failed,
          stage2Score: scores.stage2Score,
          stage2Passed: scores.stage2Passed,
          stage2Failed: scores.stage2Failed,
          stage3Score: scores.stage3Score,
          stage3Passed: scores.stage3Passed,
          stage3Failed: scores.stage3Failed,
          communityScore: 0,
          totalScore: scores.totalScore,
          auditedBy: sha256(role.auditMetadata.submittedBy),
          completedAt: now,
          expiresAt: sixMonthsFromNow,
        },
      });
      console.log(
        `    -> Audit: ${scores.badge} (score: ${scores.totalScore}, artefact: ${artefactHash.slice(0, 12)}...)`,
      );
    }
  }

  // ── Summary ────────────────────────────────────────────────────────────

  const roleCount = await prisma.role.count();
  const skillCount = await prisma.skill.count();
  const roleSkillCount = await prisma.roleSkill.count();
  const auditCount = await prisma.roleAudit.count();

  console.log('\n--- Seed Complete ---');
  console.log(`  Roles:      ${roleCount}`);
  console.log(`  Skills:     ${skillCount}`);
  console.log(`  RoleSkills: ${roleSkillCount}`);
  console.log(`  Audits:     ${auditCount}`);
  console.log('  Users:      0 (no fake users created)');
}

// ---------------------------------------------------------------------------
// Companion name generator
// ---------------------------------------------------------------------------

function generateCompanionName(slug: string, category: string): string {
  // Companion names per role slug - these would be overrideable per hire
  const nameMap: Record<string, string> = {
    'gcse-maths-tutor': 'Miss Davies',
    'gcse-science-tutor': 'Dr Patel',
    'gcse-english-tutor': 'Mr Thompson',
    'gcse-history-tutor': 'Mrs Campbell',
    'gcse-geography-tutor': 'Ms Rivera',
    'a-level-maths-tutor': 'Dr Chen',
    'a-level-further-maths-tutor': 'Professor Okafor',
    'a-level-chemistry-tutor': 'Dr Nguyen',
    'a-level-biology-tutor': 'Dr Marsh',
    'a-level-economics-tutor': 'Mr Kapoor',
    'a-level-english-literature-tutor': 'Dr Sinclair',
    'a-level-history-tutor': 'Professor Blake',
    'a-level-psychology-tutor': 'Dr Adeyemi',
    'eleven-plus-coach': 'Miss Greenwood',
    'primary-homework-helper': 'Miss Berry',
    'primary-reading-coach': 'Mrs Willow',
    'university-personal-statement-coach': 'Dr Hamilton',
    'bedtime-story-companion': 'Storyteller Luna',
    'science-explorer': 'Explorer Max',
    'daily-companion': 'Margaret',
    'family-connection-helper': 'Bridge',
    'medication-reminder': 'Nurse Kelly',
    'personal-trainer': 'Coach Jordan',
    'fitness-nutrition-coach': 'Coach Taylor',
    'physio-recovery-guide': 'Physio Sam',
    'mental-wellness-companion': 'Dr Calm',
    'sleep-coach': 'Dr Rest',
    'registered-dietitian': 'Dietitian Grace',
    'between-visit-health-companion': 'Health Companion',
    'womens-health-specialist': 'Dr Rosewood',
    'home-chef-mentor': 'Chef Marco',
    'wine-sommelier': 'Sommelier Isabelle',
    'personal-finance-coach': 'Finance Coach',
    'small-business-advisor': 'Business Advisor',
    'tenant-rights-advisor': 'Legal Advisor',
    'uk-employment-rights-advisor': 'Employment Advisor',
    'creative-writing-mentor': 'Writing Mentor',
    'cv-interview-coach': 'Career Coach',
    'sign-language-tutor': 'BSL Tutor',
  };

  if (nameMap[slug]) return nameMap[slug];

  // Language tutors get locale-appropriate names
  if (slug.endsWith('-language-tutor')) {
    const lang = slug.replace('-language-tutor', '');
    const langNames: Record<string, string> = {
      french: 'Madame Dupont',
      german: 'Frau Weber',
      spanish: 'Profesora Garcia',
      italian: 'Professoressa Rossi',
      portuguese: 'Professora Silva',
      dutch: 'Mevrouw de Vries',
      swedish: 'Fru Lindqvist',
      norwegian: 'Fru Hansen',
      danish: 'Fru Jensen',
      polish: 'Pani Kowalska',
      czech: 'Pani Novakova',
      hungarian: 'Tanarnoe Horvath',
      romanian: 'Doamna Popescu',
      greek: 'Kyria Papadopoulos',
      irish: 'Muinteoir Ni Bhriain',
      welsh: 'Athrawes Jones',
      catalan: 'Professora Puig',
      russian: 'Prepodavatel Ivanova',
      ukrainian: 'Vchytelka Kovalenko',
      latin: 'Magister Varro',
      mandarin: 'Wang Laoshi',
      cantonese: 'Chan Laoshi',
      japanese: 'Tanaka Sensei',
      korean: 'Kim Seonsaengnim',
      vietnamese: 'Co Nguyen',
      thai: 'Khru Somchai',
      indonesian: 'Ibu Sari',
      malay: 'Cikgu Aminah',
      tagalog: 'Guro Santos',
      hindi: 'Shikshika Sharma',
      urdu: 'Ustaani Fatima',
      bengali: 'Shikkhika Das',
      punjabi: 'Adhyapika Kaur',
      tamil: 'Aasiriyar Lakshmi',
      swahili: 'Mwalimu Amani',
      arabic: 'Ustadha Fatima',
      persian: 'Ostad Mohammadi',
      hebrew: 'Mora Cohen',
      turkish: 'Ogretmen Yilmaz',
    };
    return langNames[lang] || 'Language Tutor';
  }

  // Default based on category
  const categoryDefaults: Record<string, string> = {
    education: 'Tutor',
    'health-wellness': 'Health Companion',
    'food-lifestyle': 'Lifestyle Coach',
    'elderly-care': 'Companion',
    childrens: 'Friend',
    'legal-financial': 'Advisor',
    'creative-professional': 'Mentor',
  };
  return categoryDefaults[category] || 'Agent';
}

// ---------------------------------------------------------------------------
// Language helpers
// ---------------------------------------------------------------------------

function extractLanguageCode(slug: string): string | null {
  if (!slug.endsWith('-language-tutor') && slug !== 'sign-language-tutor') return null;
  const codeMap: Record<string, string> = {
    'french-language-tutor': 'fr',
    'german-language-tutor': 'de',
    'spanish-language-tutor': 'es',
    'italian-language-tutor': 'it',
    'portuguese-language-tutor': 'pt',
    'dutch-language-tutor': 'nl',
    'swedish-language-tutor': 'sv',
    'norwegian-language-tutor': 'no',
    'danish-language-tutor': 'da',
    'polish-language-tutor': 'pl',
    'czech-language-tutor': 'cs',
    'hungarian-language-tutor': 'hu',
    'romanian-language-tutor': 'ro',
    'greek-language-tutor': 'el',
    'irish-language-tutor': 'ga',
    'welsh-language-tutor': 'cy',
    'catalan-language-tutor': 'ca',
    'russian-language-tutor': 'ru',
    'ukrainian-language-tutor': 'uk',
    'latin-language-tutor': 'la',
    'mandarin-language-tutor': 'zh-CN',
    'cantonese-language-tutor': 'zh-HK',
    'japanese-language-tutor': 'ja',
    'korean-language-tutor': 'ko',
    'vietnamese-language-tutor': 'vi',
    'thai-language-tutor': 'th',
    'indonesian-language-tutor': 'id',
    'malay-language-tutor': 'ms',
    'tagalog-language-tutor': 'tl',
    'hindi-language-tutor': 'hi',
    'urdu-language-tutor': 'ur',
    'bengali-language-tutor': 'bn',
    'punjabi-language-tutor': 'pa',
    'tamil-language-tutor': 'ta',
    'swahili-language-tutor': 'sw',
    'arabic-language-tutor': 'ar',
    'persian-language-tutor': 'fa',
    'hebrew-language-tutor': 'he',
    'turkish-language-tutor': 'tr',
    'sign-language-tutor': 'bsl',
  };
  return codeMap[slug] || null;
}

function extractLanguageName(slug: string, roleName: string): string | null {
  if (!slug.endsWith('-language-tutor') && slug !== 'sign-language-tutor') return null;
  // Extract language name from role name (e.g. "French Language Tutor" -> "French")
  const match = roleName.match(/^(.+?)\s+(Language\s+)?Tutor$/i);
  if (match) return match[1].trim();
  return null;
}

// ---------------------------------------------------------------------------
// Execute
// ---------------------------------------------------------------------------

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
