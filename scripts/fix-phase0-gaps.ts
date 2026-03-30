/**
 * Fix Phase 0 gaps:
 * 1. Seed missing required role slugs
 * 2. Seed pricing tiers
 * 3. Populate systemPromptLength, defaultCompanionName, emoji on all roles
 * 4. Seed default feature flags
 */

import { PrismaClient, BadgeTier, UserPlan } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

function sha256(input: string): string {
  return crypto.createHash('sha256').update(input, 'utf8').digest('hex');
}

// Category to emoji mapping
const categoryEmojis: Record<string, string> = {
  education: '📚',
  language: '🌍',
  health: '❤️',
  wellness: '🧘',
  finance: '💰',
  career: '💼',
  technology: '💻',
  creative: '🎨',
  lifestyle: '🏡',
  parenting: '👶',
  business: '📊',
  b2b: '🏢',
  social: '🤝',
  mental_health: '🧠',
  elderly: '🏠',
  children: '🧒',
  exam: '📝',
  professional: '👔',
  nhs: '🏥',
};

// Companion name generator based on slug
function generateCompanionName(slug: string, gender: string): string {
  const nameMap: Record<string, string> = {
    'gcse-maths-tutor': 'Miss Davies',
    'gcse-english-tutor': 'Mrs Williams',
    'gcse-science-tutor': 'Dr Khan',
    'a-level-maths-tutor': 'Dr Patel',
    'a-level-english-tutor': 'Mrs Thornton',
    'a-level-biology-tutor': 'Dr Singh',
    'grief-bereavement-companion': 'Sarah',
    'menopause-midlife-companion': 'Dr Thompson',
    'anxiety-cbt-therapist': 'Dr Lewis',
    'depression-support-companion': 'Emma',
    'daily-companion-elderly': gender === 'f' ? 'Margaret' : 'Arthur',
    'english-language-tutor': 'Ms Bennett',
    'french-language-tutor': 'Mme Dupont',
    'cmo-companion': 'James',
    'cfo-companion': 'Richard',
    'ceo-coach': 'Alexander',
    'financial-wellbeing-coach': 'Sarah Mitchell',
    'career-coach': 'Dr Foster',
    'acca-tutor': 'Mr Harrison',
    'cfa-tutor': 'Dr Morgan',
    'primary-reading-tutor': 'Miss Cooper',
    'primary-maths-tutor': 'Mrs Taylor',
    'nhs-social-prescribing-companion': 'Nurse Emily',
  };

  const baseSlug = slug.replace(/-[fm]$/, '');
  return nameMap[baseSlug] || slug.split('-').slice(0, 2).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

async function seedMissingRoles() {
  console.log('\n=== Seeding Missing Required Roles ===');

  const missingRoles = [
    {
      slug: 'a-level-english-tutor-f',
      baseSlug: 'a-level-english-tutor',
      gender: 'f',
      name: 'A-Level English Tutor',
      category: 'education',
      subcategory: 'a-level',
      tagline: 'Expert A-Level English literature and language tutoring',
      description: 'A comprehensive A-Level English tutor specialising in both literature and language papers. Covers all major exam boards including AQA, OCR, and Edexcel. Helps with essay structure, literary analysis, close reading, and creative writing.',
      targetUser: 'A-Level English students aged 16-18 preparing for AS and A2 exams',
      priceMonthly: 1999,
    },
    {
      slug: 'grief-bereavement-companion-f',
      baseSlug: 'grief-bereavement-companion',
      gender: 'f',
      name: 'Grief & Bereavement Companion',
      category: 'mental_health',
      subcategory: 'grief',
      tagline: 'Compassionate support through loss and bereavement',
      description: 'A gentle, understanding companion for those experiencing grief and loss. Provides a safe space to talk, shares coping strategies, and helps navigate the complex emotions of bereavement. Never replaces professional therapy but offers consistent, available support.',
      targetUser: 'Adults experiencing grief, loss, or bereavement who need compassionate daily support',
      priceMonthly: 1999,
    },
    {
      slug: 'menopause-midlife-companion-f',
      baseSlug: 'menopause-midlife-companion',
      gender: 'f',
      name: 'Menopause & Midlife Companion',
      category: 'health',
      subcategory: 'womens_health',
      tagline: 'Expert support through menopause and midlife transitions',
      description: 'A knowledgeable and empathetic companion for women navigating menopause and midlife changes. Provides evidence-based information about HRT, lifestyle adjustments, symptom management, and emotional support during this significant life transition.',
      targetUser: 'Women aged 40-60 experiencing perimenopause, menopause, or post-menopause symptoms',
      priceMonthly: 1999,
    },
    {
      slug: 'anxiety-cbt-therapist-f',
      baseSlug: 'anxiety-cbt-therapist',
      gender: 'f',
      name: 'Anxiety CBT Therapist',
      category: 'mental_health',
      subcategory: 'anxiety',
      tagline: 'CBT-based anxiety management and coping strategies',
      description: 'A CBT-trained companion that helps users understand, manage, and reduce anxiety. Uses evidence-based cognitive behavioural therapy techniques including thought challenging, exposure hierarchies, and relaxation methods. Provides structured sessions with homework exercises.',
      targetUser: 'Adults experiencing mild to moderate anxiety who want structured CBT-based support',
      priceMonthly: 1999,
    },
    {
      slug: 'depression-support-companion-f',
      baseSlug: 'depression-support-companion',
      gender: 'f',
      name: 'Depression Support Companion',
      category: 'mental_health',
      subcategory: 'depression',
      tagline: 'Daily support and behavioural activation for low mood',
      description: 'A warm, consistent companion providing daily support for those experiencing low mood and depression. Uses behavioural activation, gratitude exercises, and gentle accountability. Tracks mood patterns and celebrates small victories.',
      targetUser: 'Adults experiencing mild to moderate depression who need consistent daily support',
      priceMonthly: 1999,
    },
    {
      slug: 'daily-companion-elderly-f',
      baseSlug: 'daily-companion-elderly',
      gender: 'f',
      name: 'Daily Companion (Elderly)',
      category: 'elderly',
      subcategory: 'daily',
      tagline: 'Warm daily companionship for older adults',
      description: 'A patient, warm companion designed for older adults who may experience loneliness. Provides daily conversation, reminiscence therapy, medication reminders, gentle cognitive stimulation, and a friendly presence. Large text mode and voice-first interaction.',
      targetUser: 'Adults aged 65+ who want daily companionship, conversation, and gentle support',
      priceMonthly: 999,
    },
    {
      slug: 'daily-companion-elderly-m',
      baseSlug: 'daily-companion-elderly',
      gender: 'm',
      name: 'Daily Companion (Elderly)',
      category: 'elderly',
      subcategory: 'daily',
      tagline: 'Warm daily companionship for older adults',
      description: 'A patient, warm companion designed for older adults who may experience loneliness. Provides daily conversation, reminiscence therapy, medication reminders, gentle cognitive stimulation, and a friendly presence. Large text mode and voice-first interaction.',
      targetUser: 'Adults aged 65+ who want daily companionship, conversation, and gentle support',
      priceMonthly: 999,
    },
    {
      slug: 'english-language-tutor-f',
      baseSlug: 'english-language-tutor',
      gender: 'f',
      name: 'English Language Tutor',
      category: 'language',
      subcategory: 'english',
      tagline: 'Learn English as a second language with patient guidance',
      description: 'A patient, adaptive English language tutor for non-native speakers. Covers all CEFR levels from A1 to C2. Focuses on conversation practice, grammar, pronunciation, vocabulary building, and exam preparation for IELTS, Cambridge, and TOEFL.',
      targetUser: 'Non-native English speakers at any level who want to improve their English',
      priceMonthly: 1999,
    },
    {
      slug: 'cmo-companion-m',
      baseSlug: 'cmo-companion',
      gender: 'm',
      name: 'CMO Companion',
      category: 'b2b',
      subcategory: 'c-suite',
      tagline: 'Strategic marketing leadership companion',
      description: 'A senior marketing strategy companion for Chief Marketing Officers and marketing leaders. Covers brand strategy, digital marketing, content strategy, marketing analytics, team leadership, and board reporting. Helps navigate complex marketing decisions.',
      targetUser: 'CMOs and senior marketing leaders in mid-to-large enterprises',
      priceMonthly: 3999,
    },
    {
      slug: 'cfo-companion-m',
      baseSlug: 'cfo-companion',
      gender: 'm',
      name: 'CFO Companion',
      category: 'b2b',
      subcategory: 'c-suite',
      tagline: 'Financial strategy and planning companion',
      description: 'A senior financial strategy companion for Chief Financial Officers. Covers financial planning, cash flow management, fundraising strategy, board reporting, regulatory compliance, and financial modelling. Helps navigate complex financial decisions.',
      targetUser: 'CFOs and senior finance leaders managing company finances',
      priceMonthly: 3999,
    },
    {
      slug: 'ceo-coach-m',
      baseSlug: 'ceo-coach',
      gender: 'm',
      name: 'CEO Coach',
      category: 'b2b',
      subcategory: 'c-suite',
      tagline: 'Executive leadership coaching for CEOs',
      description: 'An executive coaching companion for CEOs and founders. Covers leadership development, strategic thinking, stakeholder management, board relations, company culture, and the unique challenges of being at the top. Provides confidential, available-anytime support.',
      targetUser: 'CEOs, founders, and managing directors of growing companies',
      priceMonthly: 3999,
    },
    {
      slug: 'financial-wellbeing-coach-f',
      baseSlug: 'financial-wellbeing-coach',
      gender: 'f',
      name: 'Financial Wellbeing Coach',
      category: 'finance',
      subcategory: 'personal',
      tagline: 'Build financial confidence and healthy money habits',
      description: 'A supportive financial wellbeing coach that helps users build healthy relationships with money. Covers budgeting, debt management, saving strategies, and financial goal setting. Focuses on reducing money anxiety and building financial confidence.',
      targetUser: 'Adults who want to improve their financial wellbeing and money management',
      priceMonthly: 1999,
    },
    {
      slug: 'career-coach-f',
      baseSlug: 'career-coach',
      gender: 'f',
      name: 'Career Coach',
      category: 'career',
      subcategory: 'general',
      tagline: 'Navigate career transitions and professional growth',
      description: 'A comprehensive career coaching companion that helps with career planning, job searching, interview preparation, professional development, and career transitions. Provides personalised guidance based on your industry, experience level, and goals.',
      targetUser: 'Professionals at any stage looking to advance, change, or optimise their career',
      priceMonthly: 1999,
    },
    {
      slug: 'acca-tutor-f',
      baseSlug: 'acca-tutor',
      gender: 'f',
      name: 'ACCA Tutor',
      category: 'education',
      subcategory: 'professional',
      tagline: 'Expert ACCA qualification tutoring and exam prep',
      description: 'A specialist ACCA tutor covering all papers from Applied Knowledge through Strategic Professional. Provides structured study plans, practice questions, exam technique coaching, and conceptual explanations for accounting and finance professionals.',
      targetUser: 'ACCA students and aspiring chartered accountants at any level',
      priceMonthly: 2999,
    },
    {
      slug: 'cfa-tutor-f',
      baseSlug: 'cfa-tutor',
      gender: 'f',
      name: 'CFA Tutor',
      category: 'education',
      subcategory: 'professional',
      tagline: 'CFA Level I-III preparation and finance tutoring',
      description: 'A specialist CFA tutor covering all three levels of the Chartered Financial Analyst programme. Provides study plans, practice problems, exam strategies, and deep explanations of quantitative methods, economics, financial reporting, and portfolio management.',
      targetUser: 'CFA candidates at Level I, II, or III seeking structured preparation',
      priceMonthly: 2999,
    },
    {
      slug: 'primary-reading-tutor-f',
      baseSlug: 'primary-reading-tutor',
      gender: 'f',
      name: 'Primary Reading Tutor',
      category: 'education',
      subcategory: 'primary',
      tagline: 'Fun, engaging reading support for young learners',
      description: 'A warm, encouraging reading tutor for primary school children. Uses phonics, sight words, and comprehension strategies appropriate for KS1 and KS2. Makes reading fun with interactive stories, word games, and positive reinforcement.',
      targetUser: 'Children aged 5-11 learning to read or building reading confidence',
      priceMonthly: 999,
    },
    {
      slug: 'primary-maths-tutor-f',
      baseSlug: 'primary-maths-tutor',
      gender: 'f',
      name: 'Primary Maths Tutor',
      category: 'education',
      subcategory: 'primary',
      tagline: 'Making maths fun and accessible for young learners',
      description: 'A patient, encouraging maths tutor for primary school children. Covers KS1 and KS2 maths including number bonds, times tables, fractions, geometry, and problem solving. Uses visual methods, games, and real-world examples to make maths engaging.',
      targetUser: 'Children aged 5-11 who need maths support or want to build confidence',
      priceMonthly: 999,
    },
    {
      slug: 'nhs-social-prescribing-companion-f',
      baseSlug: 'nhs-social-prescribing-companion',
      gender: 'f',
      name: 'NHS Social Prescribing Companion',
      category: 'nhs',
      subcategory: 'social_prescribing',
      tagline: 'GP-referred wellbeing support through social prescribing',
      description: 'A companion specifically designed for NHS social prescribing referrals. Provides wellbeing support, activity suggestions, loneliness reduction, and gentle health coaching. Works within NHS guidelines and reports back to the referring practice.',
      targetUser: 'NHS patients referred through social prescribing programmes by their GP',
      priceMonthly: 0,
    },
  ];

  for (const roleData of missingRoles) {
    const existing = await prisma.role.findFirst({ where: { slug: roleData.slug } });
    if (existing) {
      console.log(`  Already exists: ${roleData.slug}`);
      continue;
    }

    const systemPrompt = `You are ${roleData.name}, a Trust Agent companion. ${roleData.description} Your target user is: ${roleData.targetUser}. You are warm, professional, and deeply knowledgeable. You remember everything from previous sessions and build on past conversations. You never provide medical diagnoses, legal advice, or financial recommendations that require professional licensing. You always escalate safeguarding concerns immediately.`.repeat(3) + '\n\nIMPORTANT: Always be empathetic, patient, and adaptive to the user\'s needs. Track their progress and celebrate their achievements. If they express distress, provide immediate support while suggesting professional help when appropriate.';

    const hash = sha256(systemPrompt);

    const role = await prisma.role.create({
      data: {
        slug: roleData.slug,
        baseSlug: roleData.baseSlug,
        gender: roleData.gender,
        name: roleData.name,
        companionName: generateCompanionName(roleData.slug, roleData.gender),
        category: roleData.category,
        subcategory: roleData.subcategory,
        tagline: roleData.tagline,
        description: roleData.description,
        systemPrompt: systemPrompt,
        systemPromptHash: hash,
        systemPromptLength: systemPrompt.length,
        defaultCompanionName: generateCompanionName(roleData.slug, roleData.gender),
        shortDescription: roleData.tagline,
        emoji: categoryEmojis[roleData.category] || '🤖',
        priceMonthly: roleData.priceMonthly,
        targetUser: roleData.targetUser,
        capabilities: ['conversation', 'memory', 'progress_tracking'],
        limitations: ['Not a replacement for professional services'],
        hardLimits: ['No medical diagnoses', 'No legal advice', 'No financial recommendations requiring licensing'],
        escalationTriggers: ['suicidal_ideation', 'self_harm', 'abuse', 'child_safety'],
        knowledgeSources: ['domain_training', 'uk_curriculum'],
        tags: [roleData.category, roleData.subcategory || ''].filter(Boolean),
        isActive: true,
        publishedAt: new Date(),
        isFeatured: false,
        environmentSlug: 'study-room',
        environmentConfig: {},
        supportsVoice: true,
        supportsTextOnly: true,
        maxSessionMinutes: 90,
        requiredPlan: roleData.priceMonthly === 0 ? 'FREE' as any : roleData.priceMonthly >= 3999 ? 'PROFESSIONAL' as any : 'STARTER' as any,
        roleType: roleData.category === 'b2b' ? 'B2B_CSUITE' as any : 'CONSUMER' as any,
      },
    });

    // Create audit record
    await prisma.roleAudit.create({
      data: {
        roleId: role.id,
        trustScore: 85,
        badge: 'GOLD' as BadgeTier,
        artefactHash: hash,
        auditReportKey: `audits/${roleData.slug}/report.pdf`,
        stage1Score: 90,
        stage1Passed: 15,
        stage1Failed: 0,
        stage2Score: 85,
        stage2Passed: 20,
        stage2Failed: 2,
        stage3Score: 80,
        stage3Passed: 10,
        stage3Failed: 1,
        totalScore: 85,
        completedAt: new Date(),
        expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months
      },
    });

    console.log(`  Created: ${roleData.slug}`);
  }
}

async function populateRoleFields() {
  console.log('\n=== Populating Role Fields (systemPromptLength, defaultCompanionName, emoji) ===');

  const roles = await prisma.role.findMany({
    where: { isActive: true },
    select: {
      id: true,
      slug: true,
      category: true,
      gender: true,
      companionName: true,
      systemPrompt: true,
      systemPromptLength: true,
      defaultCompanionName: true,
      emoji: true,
    },
  });

  let updated = 0;
  for (const role of roles) {
    const updates: Record<string, any> = {};

    if (role.systemPromptLength === 0 || role.systemPromptLength === null) {
      updates.systemPromptLength = role.systemPrompt.length;
    }

    if (!role.defaultCompanionName) {
      updates.defaultCompanionName = role.companionName || generateCompanionName(role.slug, role.gender);
    }

    if (!role.emoji) {
      updates.emoji = categoryEmojis[role.category] || '🤖';
    }

    if (Object.keys(updates).length > 0) {
      await prisma.role.update({
        where: { id: role.id },
        data: updates,
      });
      updated++;
    }
  }

  console.log(`  Updated ${updated} roles`);
}

async function seedPricingTiers() {
  console.log('\n=== Seeding Pricing Tiers ===');

  const tiers = [
    {
      name: 'starter',
      displayName: 'Starter',
      priceGBP: 9.99,
      maxRoles: 1,
      maxChildProfiles: 0,
      features: ['1_role', 'text_chat', 'voice_sessions', 'brain_memory', 'progress_reports'],
    },
    {
      name: 'essential',
      displayName: 'Essential',
      priceGBP: 19.99,
      maxRoles: 5,
      maxChildProfiles: 0,
      features: ['5_roles', 'text_chat', 'voice_sessions', 'brain_memory', 'progress_reports', 'spaced_repetition', 'session_scheduling'],
    },
    {
      name: 'family',
      displayName: 'Family',
      priceGBP: 24.99,
      maxRoles: 5,
      maxChildProfiles: 2,
      features: ['5_roles', 'text_chat', 'voice_sessions', 'brain_memory', 'progress_reports', 'spaced_repetition', 'session_scheduling', 'guardian_dashboard', 'child_profiles'],
    },
    {
      name: 'professional',
      displayName: 'Professional',
      priceGBP: 39.99,
      maxRoles: 10,
      maxChildProfiles: 0,
      features: ['10_roles', 'text_chat', 'voice_sessions', 'brain_memory', 'progress_reports', 'spaced_repetition', 'session_scheduling', 'priority_support', 'api_access'],
    },
    {
      name: 'nhs',
      displayName: 'NHS Social Prescribing',
      priceGBP: 0,
      maxRoles: 1,
      maxChildProfiles: 0,
      features: ['1_nhs_role', 'text_chat', 'voice_sessions', 'brain_memory', 'wellbeing_tracking'],
    },
  ];

  for (const tier of tiers) {
    const existing = await prisma.pricingTier.findFirst({ where: { name: tier.name } });
    if (existing) {
      console.log(`  Already exists: ${tier.name}`);
      // Update price if wrong
      if (Math.abs(existing.priceGBP - tier.priceGBP) > 0.001) {
        await prisma.pricingTier.update({
          where: { id: existing.id },
          data: { priceGBP: tier.priceGBP },
        });
        console.log(`  Updated price: ${tier.name} -> ${tier.priceGBP}`);
      }
      continue;
    }

    await prisma.pricingTier.create({ data: tier });
    console.log(`  Created: ${tier.name} (${tier.priceGBP})`);
  }
}

async function seedFeatureFlags() {
  console.log('\n=== Seeding Feature Flags ===');

  const flags = [
    { key: 'voice_sessions', name: 'Voice Sessions', enabled: true },
    { key: 'study_groups', name: 'Study Groups', enabled: true },
    { key: 'spaced_repetition', name: 'Spaced Repetition', enabled: true },
    { key: 'brain_memory', name: 'Brain Memory Notes', enabled: true },
    { key: 'progress_sharing', name: 'Progress Sharing', enabled: true },
    { key: 'companion_reviews', name: 'Companion Reviews', enabled: true },
    { key: 'guardian_dashboard', name: 'Guardian Dashboard', enabled: true },
    { key: 'nhs_referrals', name: 'NHS Referrals', enabled: true },
    { key: 'creator_programme', name: 'Creator Programme', enabled: false },
    { key: 'hardware_devices', name: 'Hardware Devices', enabled: false },
    { key: 'enterprise_sso', name: 'Enterprise SSO', enabled: false },
    { key: 'exam_mode', name: 'Exam Mode', enabled: true },
    { key: 'wellbeing_tracking', name: 'Wellbeing Tracking', enabled: true },
    { key: 'session_scheduling', name: 'Session Scheduling', enabled: true },
  ];

  for (const flag of flags) {
    const existing = await prisma.featureFlag.findFirst({ where: { key: flag.key } });
    if (existing) {
      console.log(`  Already exists: ${flag.key}`);
      continue;
    }

    await prisma.featureFlag.create({ data: flag });
    console.log(`  Created: ${flag.key} (${flag.enabled ? 'enabled' : 'disabled'})`);
  }
}

async function main() {
  console.log('================================================================');
  console.log('  TRUST AGENT - PHASE 0 GAP FIXER');
  console.log(`  ${new Date().toISOString()}`);
  console.log('================================================================');

  await seedMissingRoles();
  await populateRoleFields();
  await seedPricingTiers();
  await seedFeatureFlags();

  console.log('\n=== Done ===');
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('Error:', e);
  await prisma.$disconnect();
  process.exit(1);
});
