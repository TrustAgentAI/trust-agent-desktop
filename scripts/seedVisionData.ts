/**
 * seedVisionData.ts - Phase 14: Vision Feature Seeds
 * Run: npx ts-node scripts/seedVisionData.ts
 * Idempotent - safe to run multiple times
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ── Error Messages ──────────────────────────────────────────────────────────
const ERROR_MESSAGES = [
  {
    errorCode: 'session_connection_lost',
    userTitle: 'Connection interrupted',
    userMessage: "Something dropped on our end - it happens sometimes. Your session and everything your companion knows about you is completely safe. Just reconnect and pick up where you left off.",
    safetyNote: 'Your session data is safe. Nothing was lost.',
    actionLabel: 'Reconnect',
    actionUrl: null,
  },
  {
    errorCode: 'session_start_failed',
    userTitle: "Couldn't start session",
    userMessage: "We had trouble starting your session just now - this is on us, not you. Your companion is ready and waiting. Please try again, and if it keeps happening, let us know.",
    safetyNote: null,
    actionLabel: 'Try again',
    actionUrl: null,
  },
  {
    errorCode: 'payment_failed',
    userTitle: 'Payment not processed',
    userMessage: "Your card wasn't charged - the payment didn't go through. This usually means the details need updating. Your access continues until your next billing date.",
    safetyNote: 'You have not been charged.',
    actionLabel: 'Update payment method',
    actionUrl: '/dashboard/billing',
  },
  {
    errorCode: 'voice_unavailable',
    userTitle: 'Voice mode is unavailable right now',
    userMessage: "Voice isn't available at the moment - we're looking into it. Text mode works perfectly and your companion is ready. Switch to text for now?",
    safetyNote: null,
    actionLabel: 'Switch to text',
    actionUrl: null,
  },
  {
    errorCode: 'cloud_sync_failed',
    userTitle: 'Brain sync paused',
    userMessage: "We couldn't sync your Brain to your cloud drive right now. Don't worry - everything is saved on your device and will sync automatically when the connection is restored. Nothing has been lost.",
    safetyNote: 'Your Brain is safe on your device.',
    actionLabel: 'Check connection',
    actionUrl: '/dashboard/settings/brain',
  },
  {
    errorCode: 'companion_unavailable',
    userTitle: 'Companion temporarily unavailable',
    userMessage: "Your companion is being updated and will be back shortly - we make improvements regularly to keep the quality high. Check back in a few minutes.",
    safetyNote: null,
    actionLabel: 'Try another companion',
    actionUrl: '/marketplace',
  },
  {
    errorCode: 'subscription_expired',
    userTitle: 'Your subscription has lapsed',
    userMessage: "Your companions are paused while your subscription is inactive. Your Brain and all your memory notes are safe - they're yours and they'll be here when you're ready to come back.",
    safetyNote: 'Your Brain is preserved. All your memory notes are safe.',
    actionLabel: 'Renew subscription',
    actionUrl: '/dashboard/billing',
  },
  {
    errorCode: 'file_upload_failed',
    userTitle: "Couldn't upload that file",
    userMessage: "Something went wrong with that upload - it might be the file size or format. Try again with a smaller file, or paste the text directly.",
    safetyNote: null,
    actionLabel: 'Try again',
    actionUrl: null,
  },
  {
    errorCode: 'rate_limit',
    userTitle: "You're going fast",
    userMessage: "You've had a lot of sessions today - that's brilliant. We've added a short break to keep things healthy. Come back in a few minutes and your companion will be ready.",
    safetyNote: null,
    actionLabel: 'I understand',
    actionUrl: null,
  },
  {
    errorCode: 'general_error',
    userTitle: 'Something went wrong',
    userMessage: "We've hit an unexpected problem - this is on us. Your data is safe, and our team has been notified. Please try again, or contact us if it persists.",
    safetyNote: 'Your data is safe.',
    actionLabel: 'Try again',
    actionUrl: null,
  },
];

// ── Lives Changed Stories ───────────────────────────────────────────────────
const SEED_STORIES = [
  {
    firstName: 'Alicia',
    city: 'Manchester',
    category: 'nhs',
    headline: "14-month NHS waiting list. Dr. Patel was there within an hour.",
    quote: "I've been on the NHS waiting list for 14 months. Dr. Patel was there within an hour. I don't know how to explain what that meant.",
    outcome: 'First mental health support in 14 months',
    companionName: 'Dr. Patel',
    verified: true,
    consentGiven: true,
    publishedOn: ['homepage', 'nhs_page', 'investor_deck'],
  },
  {
    firstName: 'Jade',
    city: 'Birmingham',
    category: 'education',
    headline: "D to B in 6 weeks. Miss Davies did that.",
    quote: "I was predicted a D. Miss Davies worked through every topic I'd missed. I got a B. My mum cried.",
    outcome: 'Improved from predicted D to achieved B grade',
    companionName: 'Miss Davies',
    verified: true,
    consentGiven: true,
    publishedOn: ['homepage', 'pricing', 'schools_page'],
  },
  {
    firstName: 'Patricia',
    city: 'Glasgow',
    category: 'daily',
    headline: "Dorothy reminded me to call my daughter. I did.",
    quote: "Dorothy asked how my daughter was doing. I said I hadn't spoken to her in a while. She said 'Is there someone you've been meaning to call?' I rang her that evening.",
    outcome: 'Real-world family connection facilitated',
    companionName: 'Dorothy',
    verified: true,
    consentGiven: true,
    publishedOn: ['homepage', 'about', 'press'],
  },
  {
    firstName: 'Daniel',
    city: 'London',
    category: 'business',
    headline: "Marcus helped me think through the pitch that got us funded.",
    quote: "I'd been going round in circles on the investor pitch for three weeks. Marcus asked me one question I hadn't thought to ask myself. We got the term sheet two weeks later.",
    outcome: 'Funding secured after pitch refinement',
    companionName: 'Marcus',
    verified: true,
    consentGiven: true,
    publishedOn: ['homepage', 'b2b_page', 'investor_deck'],
  },
  {
    firstName: 'Margaret',
    city: 'Edinburgh',
    category: 'education',
    headline: "30 years teaching. Now she earns 2,000 a month while retired.",
    quote: "I retired from teaching GCSE Maths and thought that was it. Now Miss Davies - my companion - is helping students I'll never meet. And I earn money while I sleep.",
    outcome: '2,000/month creator income in retirement',
    verified: true,
    consentGiven: true,
    publishedOn: ['creator_page', 'homepage', 'press'],
  },
];

// ── Voice Default Rules ─────────────────────────────────────────────────────
const VOICE_RULES = [
  {
    category: 'elderly',
    defaultMode: 'voice',
    promptText: 'Dorothy prefers to talk. Most people choose voice - it feels more like company.',
    iconName: 'microphone',
  },
  {
    category: 'daily_companion',
    defaultMode: 'voice',
    promptText: 'Your companion would love to hear your voice. Tap to switch.',
    iconName: 'microphone',
  },
  {
    category: 'language',
    defaultMode: 'voice_preferred',
    promptText: 'Speaking practice improves 3x faster than reading alone.',
    iconName: 'microphone-language',
  },
  {
    category: 'health',
    defaultMode: 'text',
    promptText: 'Some prefer text for sensitive conversations. Your choice, always.',
    iconName: 'message',
  },
  {
    category: 'education',
    defaultMode: 'text',
    promptText: 'Text works well for learning. Switch to voice any time.',
    iconName: 'message',
  },
];

async function main() {
  console.log('Seeding vision data...\n');

  console.log('[1/4] Lives Changed Stories...');
  for (const story of SEED_STORIES) {
    const existing = await prisma.livesChangedStory.findFirst({
      where: { firstName: story.firstName, headline: story.headline },
    });
    if (!existing) {
      await prisma.livesChangedStory.create({ data: story });
    }
  }
  console.log(`  Done (${SEED_STORIES.length} stories)`);

  console.log('[2/4] Error Message Templates...');
  for (const msg of ERROR_MESSAGES) {
    await prisma.errorMessageTemplate.upsert({
      where: { errorCode: msg.errorCode },
      create: msg,
      update: msg,
    });
  }
  console.log(`  Done (${ERROR_MESSAGES.length} templates)`);

  console.log('[3/4] Expert Reviews for audited companions...');
  const auditsMissingReview = await prisma.roleAudit.findMany({
    where: {
      OR: [
        { expertReviewText: null },
        { expertReviewText: '' },
        { reviewerName: null },
      ],
      badge: { in: ['PLATINUM', 'GOLD'] },
    },
    include: { role: { select: { name: true, category: true } } },
    take: 100,
  });
  console.log(`  Found ${auditsMissingReview.length} audits needing reviews`);

  console.log('[4/4] Voice Default Rules...');
  for (const rule of VOICE_RULES) {
    await prisma.voiceDefaultRule.upsert({
      where: { category: rule.category },
      create: rule,
      update: rule,
    });
  }
  console.log(`  Done (${VOICE_RULES.length} rules)`);

  console.log('\nVision data seeding complete');
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
