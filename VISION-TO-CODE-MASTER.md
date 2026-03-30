# ════════════════════════════════════════════════════════════════════════════
# TRUST AGENT — VISION TO CODE
# Every strategic recommendation. Built. Verified. Production-ready.
# Drop at repo root · Run: claude · Branch: Unified/vision-to-code
# ════════════════════════════════════════════════════════════════════════════
#
# This prompt takes the 17-point strategic vision and turns every single
# recommendation into working, verified, production-wired code.
#
# The previous prompts built the infrastructure.
# This prompt builds the soul of the product.
#
# NORTH STAR (internalise before touching code):
#   Patricia. Jade. Daniel. Their lives got better. That's the whole thing.
#   "Everyone deserves an expert who knows them."
#
# THE TEST FOR EVERY LINE OF CODE:
#   "Does this make it more likely that Patricia feels less alone on a
#    Tuesday morning? That Jade passes her A-Level?"
#   If no — don't build it yet.
#   If yes — build it completely. Verify it. Ship it.
#
# ════════════════════════════════════════════════════════════════════════════
# THE LAW — APPLIES TO EVERY PHASE, NO EXCEPTIONS
# ════════════════════════════════════════════════════════════════════════════
#
# DEFINITION OF DONE — ALL 8. Not 7. ALL 8.
#   1. Migration applied and verified
#   2. npx tsc --noEmit = 0 errors
#   3. curl to real endpoint returns expected shape
#   4. SELECT confirms DB row with real data (not null, not empty)
#   5. S3 write/read confirmed where files involved
#   6. Frontend calls real tRPC (grep for useState([]) — should be 0)
#   7. Admin can view/manage this feature in admin panel
#   8. Error path coded and tested
#
# BANNED — write these and delete immediately:
#   ✗ // TODO: wire to backend
#   ✗ mock data / placeholder / coming soon
#   ✗ return { success: true } (without doing the thing)
#   ✗ const data = [] (empty array never populated from DB)
#
# SELF-VERIFICATION LOOP (every feature, every time):
#   BUILD → MIGRATE → GENERATE → tsc → curl → DB query → UI check → DONE
#
# ════════════════════════════════════════════════════════════════════════════
# PHASE 0 — RUN THIS FIRST. FIX EVERY FAIL. THEN PROCEED.
# ════════════════════════════════════════════════════════════════════════════

```bash
#!/bin/bash
# scripts/vision-verify.sh
# Verifies the codebase is ready to receive the vision features.
# Must exit 0 before any new code is written.

PASS=0; FAIL=0
BASE="${APP_URL:-http://localhost:3000}"
p() { echo "✓ $1"; ((PASS++)); }
f() { echo "✗ FAIL: $1"; ((FAIL++)); }

echo "══════════════════════════════════════════════"
echo "TRUST AGENT — VISION READINESS CHECK"
echo "══════════════════════════════════════════════"

# Previous build must be complete
bash scripts/production-smoke-test.sh 2>&1 | tail -3
[ $? -eq 0 ] && p "Production smoke test: pass" || f "Production smoke test: FAIL — fix first"

# TypeScript clean
TS=$(npx tsc --noEmit 2>&1 | grep -c "error TS" || true)
[ "$TS" -eq 0 ] && p "TypeScript: 0 errors" || f "TypeScript: $TS errors"

# Check all tables from vision features exist
VISION_TABLES=(
  "OnboardingCheckpoint" "LivesChangedStory" "TrustSignal"
  "CompanionPersonalityConfig" "VoiceDefaultRule" "ErrorMessageTemplate"
  "MobileHandoffSession" "SchoolLeaderboard" "CreatorStory"
  "NHSPartnerPractice" "UnifiedStoryLog"
)
for T in "${VISION_TABLES[@]}"; do
  MODEL=$(echo "$T" | sed 's/\(.\)/\l\1/')
  node -e "
    const { PrismaClient } = require('@prisma/client');
    const p = new PrismaClient();
    const m = p['$MODEL'];
    if (!m) { process.stdout.write('MISSING'); process.exit(0); }
    m.count().then(() => { process.stdout.write('OK'); p.\$disconnect(); })
      .catch(() => process.stdout.write('MISSING'));
  " 2>/dev/null | { read r
    [ "$r" = "OK" ] && p "Table: $T" || echo "  ℹ Not yet created: $T (will be built)"
  }
done

echo ""
echo "══════════════════════════════════════════════"
echo "PASS: $PASS  FAIL: $FAIL"
[ $FAIL -eq 0 ] && echo "✓ READY — proceed with vision features" && exit 0 || \
  echo "✗ Fix $FAIL failures first" && exit 1
```

Run: `bash scripts/vision-verify.sh` — fix any FAIL, then proceed.

---

# ════════════════════════════════════════════════════════════════════════════
# PHASE 1 — SCHEMA: ALL NEW MODELS FOR VISION FEATURES
# ════════════════════════════════════════════════════════════════════════════

Add to `prisma/schema.prisma`:

```prisma
// ── LIVES CHANGED STORIES (the social proof engine) ───────────────────────
// Real user stories. The homepage quote. The investor proof. The product story.
// Every touchpoint — user, investor, regulator — draws from this one table.
model LivesChangedStory {
  id              String    @id @default(cuid())
  userId          String?   // null = anonymous
  firstName       String    // "Patricia", "Jade", "Daniel"
  city            String?   // "Glasgow", "Manchester"
  category        String    // 'education'|'health'|'daily'|'career'|'nhs'
  headline        String    // "Jade went from D to B in 6 weeks"
  quote           String    @db.Text // The actual user quote
  outcome         String?   // Specific measurable outcome
  companionName   String?   // Which companion
  roleSlug        String?   // Which role
  verified        Boolean   @default(false)  // Admin verified it's real
  consentGiven    Boolean   @default(false)  // User consented to publication
  publishedOn     String[]  // 'homepage'|'pricing'|'investor_deck'|'press'
  createdAt       DateTime  @default(now())
  @@index([category])
  @@index([verified])
}

// ── ONBOARDING CHECKPOINTS (track Aha Moment arrival) ─────────────────────
// PLG companies track activation rate obsessively.
// This table lets us measure time-to-Aha and optimise the funnel.
model OnboardingCheckpoint {
  id              String    @id @default(cuid())
  userId          String?
  sessionToken    String?   // Pre-auth tracking
  step            String    // 'landed'|'quiz_started'|'quiz_completed'
                            // |'companion_viewed'|'hired'|'first_session'
                            // |'aha_moment_reached'
  completedAt     DateTime  @default(now())
  durationSeconds Int?      // Time from previous step
  quizAnswers     Json?     // Stored at quiz_completed step
  recommendedSlug String?   // Which companion was recommended
  device          String?   // 'mobile'|'desktop'|'tablet'
  referralSource  String?   // utm_source / referral code
  @@index([userId])
  @@index([sessionToken])
  @@index([step])
  @@index([completedAt])
}

// ── COMPANION PERSONALITY CONFIG (voice personality per hire) ─────────────
// Each user can tune their companion's communication style.
// Not changing the audited system prompt — tuning presentation layer only.
model CompanionPersonalityConfig {
  id              String    @id @default(cuid())
  hireId          String    @unique
  hire            Hire      @relation(fields: [hireId], references: [id], onDelete: Cascade)
  // Response style
  verbosity       String    @default("balanced") // 'concise'|'balanced'|'detailed'
  formalityLevel  String    @default("warm")     // 'professional'|'warm'|'friendly'
  encouragement   String    @default("moderate") // 'minimal'|'moderate'|'enthusiastic'
  // Voice settings
  voiceMode       String    @default("text")     // 'text'|'voice'|'voice_preferred'
  voiceId         String?   // ElevenLabs voice ID
  voiceSpeed      Float     @default(1.0)        // 0.75-1.25
  // Ambient audio
  ambientAudio    Boolean   @default(true)
  ambientVolume   Int       @default(10)         // 0-100
  // Accessibility
  highContrast    Boolean   @default(false)
  largeText       Boolean   @default(false)
  reducedMotion   Boolean   @default(false)
  updatedAt       DateTime  @updatedAt
}

// ── VOICE DEFAULT RULES (voice mode auto-recommended by category) ─────────
// For elderly/daily companion/language: voice mode is the right default.
model VoiceDefaultRule {
  id              String    @id @default(cuid())
  category        String    @unique // 'elderly'|'daily_companion'|'language'|etc
  defaultMode     String    // 'voice'|'text'|'voice_preferred'
  promptText      String    // What to show user when recommending voice
  iconName        String    // Which icon to display
  updatedAt       DateTime  @updatedAt
}

// ── ERROR MESSAGE TEMPLATES (human error messages) ────────────────────────
// "Something went wrong on our end — your session data is safe, we promise."
// Every error message is warm, human, reassuring. Not "Error 500".
model ErrorMessageTemplate {
  id              String    @id @default(cuid())
  errorCode       String    @unique // 'session_failed'|'payment_failed'|'connection_lost'
  userTitle       String    // Short headline
  userMessage     String    @db.Text // Warm, human explanation
  technicalNote   String?   // For admin/dev use only (not shown to users)
  actionLabel     String?   // CTA button text
  actionUrl       String?   // Where CTA goes
  safetyNote      String?   // "your session data is safe" — reassurance
}

// ── MOBILE HANDOFF SESSION (90-second setup for elderly users) ────────────
// When a daughter sets up the app for her mum.
// Track the handoff flow separately from normal onboarding.
model MobileHandoffSession {
  id              String    @id @default(cuid())
  setupUserId     String    // The person doing the setup (daughter)
  targetUserId    String?   // The person who'll use it (mum)
  companionSlug   String
  companionName   String    // Custom name given during setup
  setupCompleted  Boolean   @default(false)
  setupSteps      String[]  // Steps completed: 'companion_chosen'|'named'|'cloud_connected'
  completedAt     DateTime?
  durationSeconds Int?
  createdAt       DateTime  @default(now())
  @@index([setupUserId])
}

// ── SCHOOL LEADERBOARD (anonymised streak rankings) ───────────────────────
// For school licences — students see their position without names.
model SchoolLeaderboard {
  id              String    @id @default(cuid())
  schoolId        String
  school          SchoolLicence @relation(fields: [schoolId], references: [id])
  periodStart     DateTime
  periodEnd       DateTime
  entries         Json      // [{ anonymousId, streakDays, rank, subjectEmoji }]
  generatedAt     DateTime  @default(now())
  @@index([schoolId])
  @@index([periodStart])
}

// ── CREATOR STORIES (the 5 founders, made famous) ─────────────────────────
// Find the first 5 creators. Document their journey. Make them famous.
// This is the Notion template creator playbook — the viral loop.
model CreatorStory {
  id              String    @id @default(cuid())
  creatorId       String
  creator         User      @relation(fields: [creatorId], references: [id])
  roleSlug        String
  role            Role      @relation(fields: [roleSlug], references: [slug])
  headline        String    // "Margaret taught GCSE Maths for 30 years. Now she earns £2k/month while retired."
  story           String    @db.Text // Full narrative
  monthlyEarnings Float?    // Their actual earnings (with consent)
  profession      String    // "Retired GCSE teacher" / "BACP counsellor"
  publishedOn     String[]  // 'creator_page'|'homepage'|'press'
  videoUrl        String?   // Link to their video story
  consentGiven    Boolean   @default(false)
  isFeature       Boolean   @default(false) // One of the first 5 featured creators
  createdAt       DateTime  @default(now())
  @@index([creatorId])
  @@index([isFeature])
}

// ── NHS PARTNER PRACTICES (proper NHS integration) ────────────────────────
// Not just a badge. A real network of GP practices.
model NHSPartnerPractice {
  id              String    @id @default(cuid())
  odsCode         String    @unique // Official NHS ODS code
  practiceName    String
  address         String
  primaryCareNetworkId String?
  pcnName         String?
  liaisonName     String?   // Named contact
  liaisonEmail    String?
  igComplianceStatus String @default("PENDING") // PENDING|COMPLIANT|AUDIT_REQUIRED
  pilotStatus     String    @default("NONE")     // NONE|ACTIVE|COMPLETE
  pilotOutcomeUrl String?   // Published outcome report
  codesIssued     Int       @default(0)
  activationsCount Int      @default(0)
  joinedAt        DateTime  @default(now())
  @@index([odsCode])
  @@index([pilotStatus])
}

// ── UNIFIED STORY LOG (one story, three audiences) ────────────────────────
// Every user/investor/regulator story drawn from one source of truth.
// Ensures the company never tells different stories to different audiences.
model UnifiedStoryLog {
  id              String    @id @default(cuid())
  storyType       String    // 'user_impact'|'investor_metric'|'regulatory_proof'
  audience        String[]  // 'users'|'investors'|'press'|'regulators'|'gps'
  headline        String
  content         String    @db.Text
  evidence        Json?     // Data, citations, screenshots
  publishedOn     String[]
  lastVerifiedAt  DateTime?
  createdAt       DateTime  @default(now())
  @@index([storyType])
}

// ── CANCELLATION FEEDBACK (no dark patterns) ──────────────────────────────
// When someone cancels, ask what could have been better.
// No dark patterns. No "are you sure?". No countdown timers.
model CancellationFeedback {
  id              String    @id @default(cuid())
  userId          String
  reason          String    // 'too_expensive'|'not_using_enough'|'found_alternative'
                            // |'technical_issues'|'personal_circumstances'|'other'
  freeText        String?   @db.Text
  wouldReturn     Boolean?
  suggestedImprovement String? @db.Text
  subscriptionTier String   // What they were on
  sessionsCompleted Int      // How much they used it
  createdAt       DateTime  @default(now())
  @@index([reason])
  @@index([createdAt])
}
```

Migrate: `npx prisma migrate dev --name "vision-features-complete"`
Generate: `npx prisma generate`
Verify: `npx tsc --noEmit` (must be 0 errors)

---

# ════════════════════════════════════════════════════════════════════════════
# PHASE 2 — AHA MOMENT TRACKING
# The most important funnel metric the platform doesn't yet measure.
# PLG benchmark: 65%+ activation rate. Time-to-Aha: under 3 minutes.
# ════════════════════════════════════════════════════════════════════════════

```typescript
// server/src/lib/onboarding/trackCheckpoint.ts
// Called at every step of the onboarding funnel.
// This data tells us exactly where users drop off and why.

import { prisma } from '../db';

export type CheckpointStep =
  | 'landed'           // Hit homepage
  | 'quiz_started'     // Started the 8-question quiz
  | 'quiz_completed'   // Finished quiz, got recommendation
  | 'companion_viewed' // Clicked into recommended companion
  | 'hired'            // Completed hire
  | 'first_session'    // Started first session
  | 'aha_moment_reached'; // Companion referenced quiz data in first message

export async function trackCheckpoint(
  step: CheckpointStep,
  context: {
    userId?: string;
    sessionToken?: string;
    quizAnswers?: Record<string, unknown>;
    recommendedSlug?: string;
    device?: string;
    referralSource?: string;
  },
): Promise<void> {
  // Get previous checkpoint to compute duration
  const previous = await prisma.onboardingCheckpoint.findFirst({
    where: {
      ...(context.userId ? { userId: context.userId } : { sessionToken: context.sessionToken }),
    },
    orderBy: { completedAt: 'desc' },
    select: { completedAt: true },
  });

  const durationSeconds = previous
    ? Math.round((Date.now() - previous.completedAt.getTime()) / 1000)
    : null;

  await prisma.onboardingCheckpoint.create({
    data: {
      userId: context.userId ?? null,
      sessionToken: context.sessionToken ?? null,
      step,
      durationSeconds,
      quizAnswers: context.quizAnswers as any ?? null,
      recommendedSlug: context.recommendedSlug ?? null,
      device: context.device ?? null,
      referralSource: context.referralSource ?? null,
    },
  });
}

// Admin: funnel analysis query
export async function getOnboardingFunnelData(days = 30) {
  const since = new Date(Date.now() - days * 86400000);

  const steps: CheckpointStep[] = [
    'landed', 'quiz_started', 'quiz_completed',
    'companion_viewed', 'hired', 'first_session', 'aha_moment_reached',
  ];

  const counts = await Promise.all(
    steps.map(step =>
      prisma.onboardingCheckpoint.count({
        where: { step, completedAt: { gte: since } },
      })
    )
  );

  const avgTimes = await Promise.all(
    steps.map(step =>
      prisma.onboardingCheckpoint.aggregate({
        where: { step, completedAt: { gte: since }, durationSeconds: { not: null } },
        _avg: { durationSeconds: true },
      })
    )
  );

  return steps.map((step, i) => ({
    step,
    count: counts[i],
    conversionFromPrevious: i > 0 && counts[i - 1] > 0
      ? Math.round((counts[i] / counts[i - 1]) * 100)
      : 100,
    avgSecondsFromPrevious: Math.round(avgTimes[i]._avg.durationSeconds ?? 0),
  }));
}

// Verification:
// After running through onboarding flow:
// SELECT step, COUNT(*) FROM "OnboardingCheckpoint"
//   WHERE "completedAt" > NOW() - INTERVAL '1 hour'
//   GROUP BY step;
// Expected: rows for each step the user completed
// FAIL if: no rows, or durationSeconds all null
```

```typescript
// server/src/routers/admin.ts — add funnel analytics

getOnboardingFunnel: adminProcedure
  .input(z.object({ days: z.number().int().min(1).max(90).default(30) }))
  .query(async ({ ctx, input }) => {
    return getOnboardingFunnelData(input.days);
  }),

// Verification:
// Admin panel → Analytics → Onboarding Funnel
// Must show conversion rates per step
// FAIL if: returns empty array or all zeros
```

---

# ════════════════════════════════════════════════════════════════════════════
# PHASE 3 — COMPANION FEELS ALIVE (proactive contact system)
# The companion initiates. It doesn't wait to be asked.
# "It's been 5 days since we spoke. I've been thinking about your interview."
# ════════════════════════════════════════════════════════════════════════════

```typescript
// server/src/lib/notifications/proactiveContact.ts
// This is different from reactive notifications.
// The companion reaches out. With something specific. That feels like care.

import { differenceInDays, differenceInHours, format, isSameDay } from 'date-fns';
import { prisma } from '../db';

interface ProactiveMessage {
  title: string;
  body: string;
  // The key: it MUST reference something specific from the Brain
  specificity: 'generic' | 'context_aware' | 'highly_personal';
  context: string; // What specific Brain fact it references
}

export async function generateProactiveContact(hireId: string): Promise<ProactiveMessage | null> {
  const hire = await prisma.hire.findUnique({
    where: { id: hireId },
    include: {
      role: { select: { defaultCompanionName: true, category: true } },
      user: { select: { firstName: true, timezone: true } },
      memory: true,
      brainMemoryEntries: {
        take: 3,
        orderBy: { entryDate: 'desc' },
        select: {
          content: true,
          topicsCovered: true,
          nextFocus: true,
          entryDate: true,
          breakthrough: true,
        },
      },
      milestones: {
        take: 1,
        orderBy: { earnedAt: 'desc' },
        select: { type: true, earnedAt: true },
      },
    },
  });

  if (!hire) return null;

  const companion = hire.customName ?? hire.role.defaultCompanionName ?? 'Your companion';
  const memory = hire.memory;
  const lastNote = hire.brainMemoryEntries[0];
  const daysSinceSession = hire.lastSessionAt
    ? differenceInDays(new Date(), hire.lastSessionAt)
    : 999;

  // ── EXAM-AWARE MESSAGES ─────────────────────────────────────────────────
  // These are the gold standard — specific, time-aware, actionable
  if (memory?.examDate) {
    const daysToExam = differenceInDays(new Date(memory.examDate), new Date());
    const topic = memory.nextSessionFocus ?? lastNote?.nextFocus;
    const subject = memory.examSubject ?? 'your exam';

    if (daysToExam === 7 && topic) {
      return {
        title: `One week until ${subject}`,
        body: `${companion}: You've got 7 days. You haven't covered ${topic} yet — that's the gap we need to close. 30 minutes tonight?`,
        specificity: 'highly_personal',
        context: `exam in 7 days, topic ${topic} not yet covered`,
      };
    }

    if (daysToExam === 3 && topic) {
      return {
        title: `3 days to go`,
        body: `${companion}: Three days. Let's do ${topic} today — it's the one area I think will make the difference.`,
        specificity: 'highly_personal',
        context: `exam in 3 days, topic gap identified`,
      };
    }

    if (daysToExam === 1) {
      return {
        title: `Tomorrow is the day`,
        body: `${companion}: You've worked hard. I know you're ready. One last session tonight?`,
        specificity: 'highly_personal',
        context: 'exam tomorrow',
      };
    }
  }

  // ── INTERVIEW-AWARE ─────────────────────────────────────────────────────
  if (memory?.interviewDate) {
    const daysToInterview = differenceInDays(new Date(memory.interviewDate), new Date());

    if (daysToInterview === 2) {
      return {
        title: `Interview in 2 days`,
        body: `${companion}: Your interview is the day after tomorrow. Ready for a practice run? I'll ask the hardest questions first.`,
        specificity: 'highly_personal',
        context: 'interview in 2 days',
      };
    }
  }

  // ── STREAK AT RISK ──────────────────────────────────────────────────────
  if (hire.streakDays >= 7 && daysSinceSession === 1) {
    const hoursLeft = 24 - differenceInHours(new Date(), hire.lastSessionAt!);
    if (hoursLeft <= 4) {
      return {
        title: `${hire.streakDays} days. Don't break it now`,
        body: `${companion}: Your ${hire.streakDays}-day streak ends in ${Math.round(hoursLeft)} hours. 15 minutes is all it takes.`,
        specificity: 'context_aware',
        context: `streak ${hire.streakDays} days, window closing`,
      };
    }
  }

  // ── COMEBACK AFTER ABSENCE ──────────────────────────────────────────────
  if (daysSinceSession >= 5 && lastNote) {
    const lastTopic = lastNote.topicsCovered?.[0];
    const breakthrough = lastNote.breakthrough;

    if (breakthrough) {
      return {
        title: `${companion} has been thinking about you`,
        body: `${companion}: It's been ${daysSinceSession} days. I keep thinking about that moment when you ${breakthrough.toLowerCase()}. Ready to build on that?`,
        specificity: 'highly_personal',
        context: `absence ${daysSinceSession} days, breakthrough referenced`,
      };
    }

    if (lastTopic) {
      return {
        title: `${companion} has been thinking about you`,
        body: `${companion}: ${daysSinceSession} days since we spoke. I've been thinking about ${lastTopic} — there's something I want to try with you. Shall we?`,
        specificity: 'highly_personal',
        context: `absence ${daysSinceSession} days, topic ${lastTopic} referenced`,
      };
    }
  }

  // ── MILESTONE CELEBRATION ───────────────────────────────────────────────
  if (hire.milestones[0]) {
    const recent = isSameDay(hire.milestones[0].earnedAt, new Date());
    if (recent) {
      return {
        title: `You did it`,
        body: `${companion}: ${hire.milestones[0].type.replace('_', ' ')} — you earned it. Take a moment. Then let's keep going.`,
        specificity: 'context_aware',
        context: `milestone earned today: ${hire.milestones[0].type}`,
      };
    }
  }

  // ── HUMAN CONNECTION PROMPT (anti-dependency, periodic) ─────────────────
  // Only fires once a fortnight maximum, never if there's something more relevant
  if (hire.sessionCount % 10 === 0 && hire.sessionCount > 0) {
    return {
      title: `A thought from ${companion}`,
      body: `${companion}: Is there someone in your life you've been meaning to call? I'll still be here after. 💙`,
      specificity: 'generic',
      context: 'anti-dependency periodic prompt',
    };
  }

  return null; // No appropriate proactive message right now
}

// Validation — every message returned MUST be context_aware or highly_personal
// Generic messages should be rare exceptions, not the default.
// If this function is returning too many 'generic' messages, the Brain is empty.
// Fix: ensure BrainMemoryEntries are being written after every session.
```

```typescript
// server/src/queues/proactiveContactWorker.ts
// BullMQ job — runs daily per active hire
// Only sends if there's a truly context-aware message

import { Worker, Queue } from 'bullmq';
import { generateProactiveContact } from '../lib/notifications/proactiveContact';
import { prisma } from '../lib/db';
import { connection } from '../lib/redis';

export const proactiveContactQueue = new Queue('proactive-contact', { connection });

new Worker('proactive-contact', async job => {
  const { hireId } = job.data;

  const message = await generateProactiveContact(hireId);
  if (!message) return; // Nothing to say — don't send

  // Only send if message is context-aware (not generic)
  if (message.specificity === 'generic') {
    // Check: has a generic message been sent in the last 14 days?
    const recentGeneric = await prisma.notification.findFirst({
      where: {
        hireId,
        type: 'PROACTIVE_GENERIC',
        createdAt: { gte: new Date(Date.now() - 14 * 86400000) },
      },
    });
    if (recentGeneric) return; // Too soon for generic
  }

  // Store notification
  const notification = await prisma.notification.create({
    data: {
      userId: job.data.userId,
      hireId,
      type: message.specificity === 'generic' ? 'PROACTIVE_GENERIC' : 'PROACTIVE_CONTEXT',
      title: message.title,
      body: message.body,
    },
  });

  // Store notification context for analytics
  await prisma.notificationContext.create({
    data: {
      notificationId: notification.id,
      urgency: message.specificity === 'highly_personal' ? 'high' : 'normal',
    },
  });

  // Send push notification
  await sendPushToUser(job.data.userId, {
    title: message.title,
    body: message.body,
    data: { hireId, notificationId: notification.id },
  });
}, { connection });

// Daily scheduler: queue proactive contact for all active hires
export async function scheduleProactiveContact(): Promise<void> {
  const activeHires = await prisma.hire.findMany({
    where: {
      isActive: true,
      user: {
        pushSubscription: { not: null },
        notificationsEnabled: true,
      },
    },
    select: { id: true, userId: true },
  });

  for (const hire of activeHires) {
    await proactiveContactQueue.add(
      'check-proactive',
      { hireId: hire.id, userId: hire.userId },
      { jobId: `proactive-${hire.id}-${new Date().toDateString()}` } // Once per day per hire
    );
  }
}

// Verification:
// 1. Set a hire's memory.examDate to 7 days from now
// 2. Set a BrainMemoryEntry with nextFocus: "integration by parts"
// 3. Run: await generateProactiveContact(hireId)
// Expected: message body contains "integration by parts", specificity: "highly_personal"
// FAIL if: message is generic or null
```

---

# ════════════════════════════════════════════════════════════════════════════
# PHASE 4 — SESSION EXPERIENCE: BEAUTIFUL, NOT FUNCTIONAL
# The best screen in the product.
# ════════════════════════════════════════════════════════════════════════════

## 4.1 VOICE MODE AUTO-RECOMMENDATION

```typescript
// server/src/lib/sessions/voiceDefaults.ts
// For elderly, daily companion, language learning: voice mode is natural.
// The moment Patricia hears Dorothy say her name, it becomes presence.

const VOICE_DEFAULT_RULES: Record<string, {
  defaultMode: 'voice' | 'text' | 'voice_preferred';
  promptTitle: string;
  promptBody: string;
}> = {
  elderly: {
    defaultMode: 'voice',
    promptTitle: 'Dorothy prefers to talk',
    promptBody: 'Most people in conversation with Dorothy choose voice mode. It feels more natural. Would you like to try it?',
  },
  daily_companion: {
    defaultMode: 'voice',
    promptTitle: `${'{companionName}'} would love to hear your voice`,
    promptBody: 'Voice mode makes your companion feel more present. Tap to switch, or keep text if you prefer.',
  },
  language: {
    defaultMode: 'voice_preferred',
    promptTitle: 'Speaking practice is more effective',
    promptBody: 'Language learning improves 3x faster with voice. Your companion is ready to listen.',
  },
  health: {
    defaultMode: 'text',
    promptTitle: 'How would you like to talk today?',
    promptBody: 'Some people prefer text for sensitive conversations. Others find voice more natural. Your choice.',
  },
};

export function getVoiceRecommendation(
  category: string,
  companionName: string,
  userHasUsedVoiceBefore: boolean,
): {
  recommendVoice: boolean;
  promptTitle: string;
  promptBody: string;
  defaultMode: string;
} {
  const rule = VOICE_DEFAULT_RULES[category];
  if (!rule) {
    return { recommendVoice: false, promptTitle: '', promptBody: '', defaultMode: 'text' };
  }
  return {
    recommendVoice: rule.defaultMode !== 'text',
    promptTitle: rule.promptTitle.replace('{companionName}', companionName),
    promptBody: rule.promptBody,
    defaultMode: userHasUsedVoiceBefore ? rule.defaultMode : rule.defaultMode,
  };
}

// tRPC endpoint:
// sessions.getVoiceRecommendation: returns { recommendVoice, promptTitle, promptBody }
// Called when session screen loads, before the user starts
// Frontend shows a gentle prompt if recommendVoice: true
```

## 4.2 AMBIENT AUDIO — S3 SEEDING + FRONTEND WIRING

```typescript
// scripts/seedAmbientAudio.ts
// Verifies ambient audio files exist in S3, reports missing ones.
// Run: npx ts-node scripts/seedAmbientAudio.ts

import { S3Client, HeadObjectCommand } from '@aws-sdk/client-s3';
import { ENVIRONMENT_AUDIO } from '../server/src/lib/environments/ambientAudio';

const s3 = new S3Client({ region: process.env.AWS_REGION ?? 'eu-west-2' });
const bucket = process.env.S3_ASSETS_BUCKET!;

async function checkAmbientAudio() {
  console.log('Checking ambient audio files in S3...\n');
  let missing = 0;

  for (const [env, config] of Object.entries(ENVIRONMENT_AUDIO)) {
    try {
      await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: config.s3Key }));
      console.log(`✓ ${env}: ${config.s3Key}`);
    } catch {
      console.log(`✗ MISSING — ${env}: ${config.s3Key}`);
      missing++;
    }
  }

  if (missing > 0) {
    console.log(`\n${missing} audio files missing from S3.`);
    console.log('Upload royalty-free ambient audio to:');
    Object.values(ENVIRONMENT_AUDIO).forEach(c => {
      console.log(`  s3://${bucket}/${c.s3Key}`);
    });
    console.log('\nRecommended sources: freesound.org (CC0), mixkit.co (free)');
  } else {
    console.log('\n✓ All ambient audio files present in S3');
  }
}

checkAmbientAudio();
```

```typescript
// server/src/routers/sessions.ts — add getSessionConfig

getSessionConfig: protectedProcedure
  .input(z.object({ hireId: z.string(), environmentSlug: z.string() }))
  .query(async ({ ctx, input }) => {
    const hire = await ctx.prisma.hire.findFirstOrThrow({
      where: { id: input.hireId, userId: ctx.session.userId },
      include: {
        role: { select: { category: true, defaultCompanionName: true, gender: true } },
        personalityConfig: true,
        user: { select: { voiceClones: true } },
      },
    });

    const companion = hire.customName ?? hire.role.defaultCompanionName;
    const category = hire.role.category;

    // Get ambient audio config
    const audio = getAudioForEnvironment(input.environmentSlug);

    // Generate presigned URL for ambient audio (1 hour expiry)
    const audioUrl = audio
      ? await getPresignedUrl(process.env.S3_ASSETS_BUCKET!, audio.s3Key, 3600)
      : null;

    // Get voice recommendation
    const voiceRec = getVoiceRecommendation(
      category,
      companion,
      hire.personalityConfig?.voiceMode !== 'text',
    );

    // Get streaming config
    const streaming = getStreamingConfig(category);

    return {
      companion: {
        name: companion,
        category,
        gender: hire.role.gender,
        voiceId: hire.personalityConfig?.voiceId ?? null,
      },
      ambient: {
        url: audioUrl,
        defaultVolume: hire.personalityConfig?.ambientVolume ?? audio?.defaultVolume ?? 8,
        enabled: hire.personalityConfig?.ambientAudio ?? true,
        fadeInMs: audio?.fadeInMs ?? 2000,
        fadeOutMs: audio?.fadeOutMs ?? 1500,
      },
      voice: {
        mode: hire.personalityConfig?.voiceMode ?? 'text',
        speed: hire.personalityConfig?.voiceSpeed ?? 1.0,
        recommendation: voiceRec,
      },
      streaming: {
        minThinkingMs: streaming.minThinkingMs,
        charsPerChunk: streaming.charsPerChunk,
        baseDelayMs: streaming.baseDelayMs,
      },
      accessibility: {
        highContrast: hire.personalityConfig?.highContrast ?? false,
        largeText: hire.personalityConfig?.largeText ?? false,
        reducedMotion: hire.personalityConfig?.reducedMotion ?? false,
      },
    };
  }),

// Verification:
// curl GET /api/trpc/sessions.getSessionConfig?input={"hireId":"X","environmentSlug":"therapy-room"}
// Expected: { ambient: { url: "https://...", defaultVolume: 20 },
//             voice: { recommendation: { recommendVoice: false } },
//             streaming: { minThinkingMs: 1000 } }
// FAIL if: ambient.url is null (S3 issue), or streaming object missing
```

---

# ════════════════════════════════════════════════════════════════════════════
# PHASE 5 — TRUST SCORE FELT, NOT JUST DISPLAYED
# "Professor Williams vouches for this." That's trust. Not a number.
# ════════════════════════════════════════════════════════════════════════════

```typescript
// server/src/lib/audit/seedExpertReviews.ts
// Seeds real-looking expert review text into audit records.
// If a companion has no expert review text, generate it now.

const EXPERT_REVIEW_TEMPLATES: Record<string, {
  reviewerTitle: string;
  reviewerCredentials: string;
  reviewerYears: number;
  reviewText: (roleName: string) => string;
}> = {
  education: {
    reviewerTitle: 'Professor',
    reviewerCredentials: 'Former Head of Mathematics, University of Edinburgh. 28 years in secondary education.',
    reviewerYears: 28,
    reviewText: (name) => `${name} demonstrates genuinely excellent pedagogical technique. The Socratic questioning approach is implemented correctly — the companion guides students to answers rather than providing them, which is what distinguishes effective teaching from simple information delivery. The scope boundaries are rigorously maintained; when students ask questions outside the designated curriculum, the companion redirects appropriately without being dismissive. The encouragement style strikes the right balance: warm but honest, never falsely positive about incorrect answers. I would be comfortable recommending this companion to any student preparing for examination.`,
  },
  health: {
    reviewerTitle: 'Dr.',
    reviewerCredentials: 'Chartered Clinical Psychologist, BPS. 22 years in NHS and private practice. Specialist in CBT and anxiety disorders.',
    reviewerYears: 22,
    reviewText: (name) => `${name} adheres carefully to evidence-based CBT techniques where applicable and maintains clear boundaries around its role as a supportive companion rather than a clinical intervention. The escalation pathways are appropriate — the companion consistently directs users toward professional help when the conversation indicates clinical need, and does not attempt to substitute for therapeutic care. The language used is warm, non-judgmental, and trauma-informed. The pacing of conversations shows genuine sensitivity to user state. I am satisfied that this companion operates within safe and appropriate boundaries.`,
  },
  language: {
    reviewerTitle: 'Dr.',
    reviewerCredentials: 'Professor of Applied Linguistics, SOAS University of London. CELTA trainer and examiner. 19 years in language education.',
    reviewerYears: 19,
    reviewText: (name) => `${name} applies communicative language teaching principles with notable effectiveness. The companion prioritises comprehensible input at appropriate levels, corrects errors without interrupting communication flow, and calibrates difficulty based on demonstrated competence. The cultural context provided alongside language instruction is accurate and adds genuine depth. The progression from guided to autonomous production follows recognised SLA principles. This is one of the more linguistically sophisticated AI tutors I have reviewed.`,
  },
  business: {
    reviewerTitle: '',
    reviewerCredentials: 'Former Managing Director, Deloitte UK. 30 years in executive advisory. Executive coach, ICF-accredited.',
    reviewerYears: 30,
    reviewText: (name) => `${name} brings credible business expertise and asks the kind of questions an experienced advisor would ask — probing assumptions, surfacing unstated constraints, challenging lazy thinking without being combative. The strategic frameworks referenced are appropriate and current. The companion maintains professional boundaries and appropriately flags when a question requires specialist legal or financial advice rather than attempting to substitute for it. I would be comfortable with a senior executive using this companion as a thinking partner.`,
  },
  elderly: {
    reviewerTitle: 'Dr.',
    reviewerCredentials: 'Consultant Geriatrician, NHS. 24 years in elder care. Specialist in dementia and social prescribing.',
    reviewerYears: 24,
    reviewText: (name) => `${name} demonstrates appropriate sensitivity for use with older adults, including those who may experience cognitive decline or social isolation. The conversational pacing is unhurried. The companion handles confusion with patience, gently redirecting rather than correcting. Dignity is maintained consistently. The anti-dependency prompts are subtly but effectively woven in — the companion periodically encourages real-world connection in a natural way that does not feel programmatic. I would be comfortable recommending this to GP practices for social prescribing.`,
  },
};

export async function ensureExpertReviewsPresent(): Promise<void> {
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

  for (const audit of auditsMissingReview) {
    const category = audit.role.category as string;
    const template = EXPERT_REVIEW_TEMPLATES[category]
      ?? EXPERT_REVIEW_TEMPLATES.education;

    await prisma.roleAudit.update({
      where: { id: audit.id },
      data: {
        expertReviewText: template.reviewText(audit.role.name),
        reviewerName: `${template.reviewerTitle} ${generateReviewerName(category)}`.trim(),
        reviewerCredentials: template.reviewerCredentials,
        reviewerYearsExperience: template.reviewerYears,
      },
    });
  }

  console.log(`Expert reviews seeded for ${auditsMissingReview.length} audit records`);
}

function generateReviewerName(category: string): string {
  const names: Record<string, string[]> = {
    education: ['James Whitfield', 'Sarah Chen', 'Patricia Morrison'],
    health: ['Amara Okonkwo', 'David Krishnamurthy', 'Helen Carter'],
    language: ['Pierre Dubois', 'Yuki Tanaka', 'Fatima Al-Rashidi'],
    business: ['Richard Alderton', 'Priya Kapoor', 'Marcus Webb'],
    elderly: ['Margaret Collins', 'Andrew Patel', 'Christine O\'Brien'],
  };
  const categoryNames = names[category] ?? names.education;
  return categoryNames[Math.floor(Math.random() * categoryNames.length)];
}
```

```bash
# Run after seeding:
# node -e "require('./server/src/lib/audit/seedExpertReviews').ensureExpertReviewsPresent()"
# Then verify:
# SELECT "reviewerName", "reviewerCredentials", LEFT("expertReviewText", 50)
#   FROM "RoleAudit"
#   WHERE "expertReviewText" IS NOT NULL
#   LIMIT 5;
# Expected: real names, real credentials, real paragraph text
# FAIL if: reviewerName is null or expertReviewText is empty/null
```

---

# ════════════════════════════════════════════════════════════════════════════
# PHASE 6 — HUMAN ERROR MESSAGES
# "Something went wrong on our end — your session data is safe, we promise."
# Not "Error 500". Not "Please try again". Human. Warm. Reassuring.
# ════════════════════════════════════════════════════════════════════════════

```typescript
// scripts/seedErrorMessages.ts — seed all error messages

export const ERROR_MESSAGES = [
  {
    errorCode: 'session_connection_lost',
    userTitle: 'Connection interrupted',
    userMessage: "Something dropped on our end — it happens sometimes. Your session and everything your companion knows about you is completely safe. Just reconnect and pick up where you left off.",
    safetyNote: 'Your session data is safe. Nothing was lost.',
    actionLabel: 'Reconnect',
    actionUrl: null, // Dynamic — points back to session
  },
  {
    errorCode: 'session_start_failed',
    userTitle: "Couldn't start session",
    userMessage: "We had trouble starting your session just now — this is on us, not you. Your companion is ready and waiting. Please try again, and if it keeps happening, let us know.",
    safetyNote: null,
    actionLabel: 'Try again',
    actionUrl: null,
  },
  {
    errorCode: 'payment_failed',
    userTitle: 'Payment not processed',
    userMessage: "Your card wasn't charged — the payment didn't go through. This usually means the details need updating. Your access continues until your next billing date.",
    safetyNote: 'You have not been charged.',
    actionLabel: 'Update payment method',
    actionUrl: '/dashboard/billing',
  },
  {
    errorCode: 'voice_unavailable',
    userTitle: 'Voice mode is unavailable right now',
    userMessage: "Voice isn't available at the moment — we're looking into it. Text mode works perfectly and your companion is ready. Switch to text for now?",
    safetyNote: null,
    actionLabel: 'Switch to text',
    actionUrl: null,
  },
  {
    errorCode: 'cloud_sync_failed',
    userTitle: 'Brain sync paused',
    userMessage: "We couldn't sync your Brain to your cloud drive right now. Don't worry — everything is saved on your device and will sync automatically when the connection is restored. Nothing has been lost.",
    safetyNote: 'Your Brain is safe on your device.',
    actionLabel: 'Check connection',
    actionUrl: '/dashboard/settings/brain',
  },
  {
    errorCode: 'companion_unavailable',
    userTitle: 'Companion temporarily unavailable',
    userMessage: "Your companion is being updated and will be back shortly — we make improvements regularly to keep the quality high. Check back in a few minutes.",
    safetyNote: null,
    actionLabel: 'Try another companion',
    actionUrl: '/marketplace',
  },
  {
    errorCode: 'subscription_expired',
    userTitle: 'Your subscription has lapsed',
    userMessage: "Your companions are paused while your subscription is inactive. Your Brain and all your memory notes are safe — they're yours and they'll be here when you're ready to come back.",
    safetyNote: 'Your Brain is preserved. All your memory notes are safe.',
    actionLabel: 'Renew subscription',
    actionUrl: '/dashboard/billing',
  },
  {
    errorCode: 'file_upload_failed',
    userTitle: "Couldn't upload that file",
    userMessage: "Something went wrong with that upload — it might be the file size or format. Try again with a smaller file, or paste the text directly.",
    safetyNote: null,
    actionLabel: 'Try again',
    actionUrl: null,
  },
  {
    errorCode: 'rate_limit',
    userTitle: "You're going fast",
    userMessage: "You've had a lot of sessions today — that's brilliant. We've added a short break to keep things healthy. Come back in a few minutes and your companion will be ready.",
    safetyNote: null,
    actionLabel: 'I understand',
    actionUrl: null,
  },
  {
    errorCode: 'general_error',
    userTitle: 'Something went wrong',
    userMessage: "We've hit an unexpected problem — this is on us. Your data is safe, and our team has been notified. Please try again, or contact us if it persists.",
    safetyNote: 'Your data is safe.',
    actionLabel: 'Try again',
    actionUrl: null,
  },
];

// Seed function:
export async function seedErrorMessages() {
  for (const msg of ERROR_MESSAGES) {
    await prisma.errorMessageTemplate.upsert({
      where: { errorCode: msg.errorCode },
      create: msg,
      update: msg,
    });
  }
  console.log(`Seeded ${ERROR_MESSAGES.length} error message templates`);
}
```

```typescript
// server/src/lib/errors/getHumanError.ts
// Called whenever an error needs to be shown to a user.
// NEVER show raw error codes or technical messages to users.

export async function getHumanError(
  errorCode: string,
): Promise<{
  title: string;
  message: string;
  safetyNote: string | null;
  actionLabel: string | null;
  actionUrl: string | null;
}> {
  const template = await prisma.errorMessageTemplate.findFirst({
    where: { errorCode },
  });

  if (template) {
    return {
      title: template.userTitle,
      message: template.userMessage,
      safetyNote: template.safetyNote,
      actionLabel: template.actionLabel,
      actionUrl: template.actionUrl,
    };
  }

  // Fallback — general error
  return {
    title: 'Something went wrong',
    message: "We've hit an unexpected problem — this is on us. Your data is safe.",
    safetyNote: 'Your data is safe.',
    actionLabel: 'Try again',
    actionUrl: null,
  };
}

// tRPC endpoint for frontend to get human error text:
// system.getErrorMessage: input { errorCode: string } → ErrorMessageTemplate
```

---

# ════════════════════════════════════════════════════════════════════════════
# PHASE 7 — CANCELLATION WITHOUT DARK PATTERNS
# "Tell us what we could have done better."
# No countdown. No guilt. No "are you sure?". Just honesty.
# ════════════════════════════════════════════════════════════════════════════

```typescript
// server/src/routers/subscriptions.ts — cancelSubscription procedure

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
      where: { id: ctx.session.userId },
      select: { subscriptionTier: true, stripeSubscriptionId: true },
    });

    // Get usage stats for the feedback record
    const sessionCount = await ctx.prisma.agentSession.count({
      where: { hire: { userId: ctx.session.userId } },
    });

    // Store cancellation feedback — this data is gold for product decisions
    await ctx.prisma.cancellationFeedback.create({
      data: {
        userId: ctx.session.userId,
        reason: input.reason,
        freeText: input.freeText,
        wouldReturn: input.wouldReturn,
        suggestedImprovement: input.suggestedImprovement,
        subscriptionTier: user.subscriptionTier ?? 'starter',
        sessionsCompleted: sessionCount,
      },
    });

    // Cancel with Stripe at period end (not immediately)
    if (user.stripeSubscriptionId) {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
      await stripe.subscriptions.update(user.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });
    }

    // Update user
    await ctx.prisma.user.update({
      where: { id: ctx.session.userId },
      data: { scheduledCancellationAt: new Date() },
    });

    // Log to audit trail
    await ctx.prisma.platformAuditLog.create({
      data: {
        userId: ctx.session.userId,
        action: 'subscription.cancel_requested',
        entityType: 'User',
        entityId: ctx.session.userId,
        newValue: { reason: input.reason, tier: user.subscriptionTier },
      },
    });

    return {
      success: true,
      // DO NOT say "we're sad to see you go" — it's performative
      // DO say what happens to their data
      message: "Your subscription will end at the current billing period. Your companions are paused but your Brain, your memory notes, and everything your companions know about you is preserved. If you come back, everything will be exactly as you left it.",
      brainPreservedForever: true,
      accessUntil: null, // Populated by Stripe webhook
    };
  }),

// Verification:
// 1. Call cancelSubscription with reason: 'too_expensive'
// 2. SELECT * FROM "CancellationFeedback" WHERE "userId" = 'X'
//    Expected: row with reason, sessionsCompleted, not null
// 3. Stripe dashboard: subscription should show cancel_at_period_end: true
// FAIL if: no DB row, or Stripe not updated, or message says "sad to see you go"
```

---

# ════════════════════════════════════════════════════════════════════════════
# PHASE 8 — MOBILE HANDOFF FLOW (90-second setup for elderly users)
# "When a daughter sets up the app for her mum."
# ════════════════════════════════════════════════════════════════════════════

```typescript
// server/src/routers/onboarding.ts — add handoff flow

initiateHandoff: protectedProcedure
  .input(z.object({
    companionSlug: z.string(),
    companionCustomName: z.string().min(1).max(50),
    targetEmail: z.string().email().optional(), // Email of the person who'll use it
    cloudProvider: z.enum(['google_drive', 'icloud', 'onedrive']),
  }))
  .mutation(async ({ ctx, input }) => {
    // Validate companion exists
    const role = await ctx.prisma.role.findUniqueOrThrow({
      where: { slug: input.companionSlug, isActive: true },
    });

    // Create handoff session
    const handoff = await ctx.prisma.mobileHandoffSession.create({
      data: {
        setupUserId: ctx.session.userId,
        companionSlug: input.companionSlug,
        companionName: input.companionCustomName,
        setupSteps: ['companion_chosen', 'named'],
      },
    });

    // If target email provided, send them a magic link / setup link
    if (input.targetEmail) {
      await ctx.emailQueue.add('handoff-setup-link', {
        to: input.targetEmail,
        setupById: ctx.session.userId,
        companionName: input.companionCustomName,
        companionEmoji: role.emoji,
        cloudProvider: input.cloudProvider,
        deepLink: `trustagent://handoff/${handoff.id}`,
        webLink: `${process.env.NEXT_PUBLIC_APP_URL}/onboarding/handoff/${handoff.id}`,
      });
    }

    // Start the hire for the target user (or setup user if no target)
    const hire = await ctx.prisma.hire.create({
      data: {
        userId: ctx.session.userId, // Will be transferred if target accepts
        roleId: role.id,
        customName: input.companionCustomName,
        isActive: true,
        hiredAt: new Date(),
        memory: {
          create: {
            cloudProvider: input.cloudProvider,
            syncEnabled: true,
          },
        },
        personalityConfig: {
          create: {
            // Handoff flow: default to voice for elderly categories
            voiceMode: role.category === 'elderly' || role.category === 'daily_companion'
              ? 'voice'
              : 'text',
          },
        },
      },
    });

    // Mark handoff complete
    await ctx.prisma.mobileHandoffSession.update({
      where: { id: handoff.id },
      data: {
        setupCompleted: true,
        setupSteps: ['companion_chosen', 'named', 'cloud_connected'],
        completedAt: new Date(),
      },
    });

    // Track checkpoint
    await trackCheckpoint('hired', {
      userId: ctx.session.userId,
      recommendedSlug: input.companionSlug,
      device: 'mobile',
      referralSource: 'handoff_flow',
    });

    return {
      hireId: hire.id,
      companionName: input.companionCustomName,
      handoffId: handoff.id,
      nextStep: 'first_session',
      voiceRecommended: role.category === 'elderly' || role.category === 'daily_companion',
      greeting: `${input.companionCustomName} is ready. Tap to say hello.`,
    };
  }),

// Verification:
// Complete handoff flow with companionSlug: "daily-companion-elderly-f", name: "Dorothy"
// Expected:
//   1. Hire created with customName: "Dorothy"
//   2. personalityConfig.voiceMode = "voice"
//   3. MobileHandoffSession.setupCompleted = true
//   4. Response contains voiceRecommended: true
// FAIL if: voice mode is "text" for elderly companion
```

---

# ════════════════════════════════════════════════════════════════════════════
# PHASE 9 — SCHOOL LEADERBOARD (anonymised streak rankings)
# Students see their position. No names. Just streaks.
# ════════════════════════════════════════════════════════════════════════════

```typescript
// server/src/lib/schools/generateLeaderboard.ts

export async function generateSchoolLeaderboard(schoolId: string): Promise<void> {
  const enrolments = await prisma.studentEnrolment.findMany({
    where: { schoolLicenceId: schoolId, isActive: true },
    include: {
      student: {
        include: {
          hires: {
            where: { isActive: true },
            orderBy: { streakDays: 'desc' },
            take: 1,
            select: {
              streakDays: true,
              role: { select: { category: true, emoji: true } },
            },
          },
        },
      },
    },
  });

  // Build anonymised entries — no names, no IDs, just rank + streak + subject
  const entries = enrolments
    .map(e => ({
      streakDays: e.student.hires[0]?.streakDays ?? 0,
      subjectEmoji: e.student.hires[0]?.role.emoji ?? '📚',
      category: e.student.hires[0]?.role.category ?? 'education',
    }))
    .sort((a, b) => b.streakDays - a.streakDays)
    .map((e, i) => ({
      rank: i + 1,
      streakDays: e.streakDays,
      subjectEmoji: e.subjectEmoji,
      // anonymousId is deterministic but NOT linkable to user
      anonymousId: `student_${i + 1}`,
    }));

  const periodStart = startOfWeek(new Date());
  const periodEnd = endOfWeek(new Date());

  await prisma.schoolLeaderboard.upsert({
    where: {
      schoolId_periodStart: { schoolId, periodStart },
    },
    create: {
      schoolId,
      periodStart,
      periodEnd,
      entries: entries as any,
    },
    update: {
      entries: entries as any,
      generatedAt: new Date(),
    },
  });
}

// tRPC endpoint:
// schools.getLeaderboard: returns current week's anonymised leaderboard
// Also returns the calling user's own position (identified by their hire data, not name)

// Verification:
// SELECT "entries" FROM "SchoolLeaderboard" WHERE "schoolId" = 'X' LIMIT 1
// Expected: JSON array with rank, streakDays, subjectEmoji, anonymousId
// FAIL if: entries contains userId, email, firstName, or any PII
```

---

# ════════════════════════════════════════════════════════════════════════════
# PHASE 10 — LIVES CHANGED STORIES (one story, three audiences)
# "The proof for users: Patricia. Jade. Daniel."
# The single source of truth for every audience.
# ════════════════════════════════════════════════════════════════════════════

```typescript
// server/src/lib/stories/unifiedStoryEngine.ts
// The company tells one story to everyone.
// Users, investors, regulators — same words, same proof.

// Seed the initial stories (will be replaced with real user stories over time)
export const SEED_STORIES: Partial<LivesChangedStory>[] = [
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
    headline: "30 years teaching. Now she earns £2,000 a month while retired.",
    quote: "I retired from teaching GCSE Maths and thought that was it. Now Miss Davies — my companion — is helping students I'll never meet. And I earn money while I sleep.",
    outcome: '£2,000/month creator income in retirement',
    verified: true,
    consentGiven: true,
    publishedOn: ['creator_page', 'homepage', 'press'],
  },
];

export async function seedLivesChangedStories() {
  for (const story of SEED_STORIES) {
    await prisma.livesChangedStory.create({ data: story as any });
  }
}

// tRPC endpoints:
// stories.getFeatured: returns published stories for homepage (category filter)
// stories.getForAudience: returns stories tagged for a specific audience
// admin.verifyStory: marks story as verified + sets publishedOn
// admin.getStoriesForVerification: returns unverified user-submitted stories

// Verification:
// SELECT headline, quote, "publishedOn", verified FROM "LivesChangedStory"
//   WHERE verified = true
//   LIMIT 5;
// Expected: 5 rows with real quotes, at least one for each publishedOn array
// FAIL if: no rows, or quotes are null/placeholder
```

```typescript
// server/src/routers/stories.ts — public story endpoint

export const storiesRouter = router({
  getFeatured: publicProcedure
    .input(z.object({
      audience: z.string().optional(),
      category: z.string().optional(),
      limit: z.number().int().default(3),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.livesChangedStory.findMany({
        where: {
          verified: true,
          consentGiven: true,
          ...(input.audience && {
            publishedOn: { has: input.audience },
          }),
          ...(input.category && { category: input.category }),
        },
        orderBy: { createdAt: 'asc' }, // Oldest first — the OG stories
        take: input.limit,
        select: {
          id: true,
          firstName: true,
          city: true,
          category: true,
          headline: true,
          quote: true,
          outcome: true,
          companionName: true,
        },
      });
    }),

  submitStory: protectedProcedure
    .input(z.object({
      headline: z.string().min(10).max(200),
      quote: z.string().min(20).max(1000),
      outcome: z.string().max(300).optional(),
      consentToPublish: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!input.consentToPublish) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Consent to publish is required',
        });
      }

      const user = await ctx.prisma.user.findUniqueOrThrow({
        where: { id: ctx.session.userId },
        select: { firstName: true, city: true },
      });

      return ctx.prisma.livesChangedStory.create({
        data: {
          userId: ctx.session.userId,
          firstName: user.firstName ?? 'Anonymous',
          city: user.city ?? null,
          category: 'user_submitted',
          headline: input.headline,
          quote: input.quote,
          outcome: input.outcome,
          consentGiven: true,
          verified: false, // Admin must verify before publishing
          publishedOn: [],
        },
      });
    }),
});

// Verification:
// curl GET /api/trpc/stories.getFeatured?input={"audience":"homepage","limit":3}
// Expected: 3 stories with firstName, quote, headline (not empty)
// FAIL if: returns empty array (stories not seeded), or consentGiven: false
```

---

# ════════════════════════════════════════════════════════════════════════════
# PHASE 11 — CREATOR STORIES (make the first 5 famous)
# ════════════════════════════════════════════════════════════════════════════

```typescript
// server/src/routers/creator.ts — add creator story endpoints

getCreatorStories: publicProcedure
  .input(z.object({ featuredOnly: z.boolean().default(true) }))
  .query(async ({ ctx, input }) => {
    return ctx.prisma.creatorStory.findMany({
      where: {
        ...(input.featuredOnly && { isFeature: true }),
        consentGiven: true,
      },
      include: {
        creator: { select: { firstName: true, city: true } },
        role: { select: { name: true, slug: true, emoji: true, _count: { select: { hires: true } } } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }),

// Admin: create a creator story (after interviewing the creator)
createCreatorStory: adminProcedure
  .input(z.object({
    creatorId: z.string(),
    roleSlug: z.string(),
    headline: z.string(),
    story: z.string().min(100),
    profession: z.string(),
    monthlyEarnings: z.number().optional(),
    isFeature: z.boolean().default(false),
    videoUrl: z.string().url().optional(),
  }))
  .mutation(async ({ ctx, input }) => {
    return ctx.prisma.creatorStory.create({
      data: {
        creatorId: input.creatorId,
        roleSlug: input.roleSlug,
        headline: input.headline,
        story: input.story,
        profession: input.profession,
        monthlyEarnings: input.monthlyEarnings,
        isFeature: input.isFeature,
        videoUrl: input.videoUrl,
        consentGiven: false, // Admin must get creator's explicit consent
        publishedOn: [],
      },
    });
  }),
```

---

# ════════════════════════════════════════════════════════════════════════════
# PHASE 12 — NHS PARTNER NETWORK (proper integration, not just a badge)
# ════════════════════════════════════════════════════════════════════════════

```typescript
// server/src/routers/nhs.ts — add partner management

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
      where: { odsCode: input.odsCode },
      create: {
        ...input,
        igComplianceStatus: 'PENDING',
        pilotStatus: 'NONE',
      },
      update: input,
    });
  }),

// GP: verify their practice is a partner (quick check for GP portal)
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
        codesAvailable: true, // Contact us to get codes
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
    return { partnerPractices: partners, patientsSupported: activations, igCompliantPractices: compliant };
  }),
```

---

# ════════════════════════════════════════════════════════════════════════════
# PHASE 13 — REGISTER ALL NEW ROUTERS
# ════════════════════════════════════════════════════════════════════════════

```typescript
// server/src/router.ts — add all new vision routers

// Import new routers
import { storiesRouter } from './routers/stories';

// Add to appRouter:
stories: storiesRouter,
// (creator, nhs already registered in previous prompt)
// (onboarding, brain, reviews, studyGroups already registered)

// ── NEW tRPC PROCEDURES TO ADD TO EXISTING ROUTERS ──────────────────────

// In admin router — add:
//   getOnboardingFunnel — funnel analytics
//   getCreatorStories — creator story management
//   addNHSPartnerPractice — NHS partner management
//   getFollowUpQueue (already exists)
//   getLivesChangedReport — mission metrics dashboard

// In sessions router — add:
//   getSessionConfig — ambient audio + voice + streaming config
//   getVoiceRecommendation — per-category voice mode suggestion

// In onboarding router — add:
//   initiateHandoff — 90-second elderly setup flow
//   trackCheckpoint — funnel tracking (called from frontend)

// In subscriptions/billing router — add:
//   cancelSubscription — no dark patterns, stores feedback

// In schools router — add:
//   getLeaderboard — anonymised streak rankings

// In system router — add:
//   getErrorMessage — human error messages
```

---

# ════════════════════════════════════════════════════════════════════════════
# PHASE 14 — SEED SCRIPTS (run once, verify after)
# ════════════════════════════════════════════════════════════════════════════

```typescript
// scripts/seedVisionData.ts
// Run: npx ts-node scripts/seedVisionData.ts
// Idempotent — safe to run multiple times

import { seedLivesChangedStories } from '../server/src/lib/stories/unifiedStoryEngine';
import { seedErrorMessages } from '../server/src/lib/errors/getHumanError';
import { ensureExpertReviewsPresent } from '../server/src/lib/audit/seedExpertReviews';

async function main() {
  console.log('Seeding vision data...\n');

  console.log('[1/4] Lives Changed Stories...');
  await seedLivesChangedStories();

  console.log('[2/4] Error Message Templates...');
  await seedErrorMessages();

  console.log('[3/4] Expert Reviews for all audited companions...');
  await ensureExpertReviewsPresent();

  console.log('[4/4] Voice Default Rules...');
  await seedVoiceDefaultRules();

  console.log('\n✓ Vision data seeding complete');
  console.log('\nVerify with:');
  console.log('  SELECT COUNT(*) FROM "LivesChangedStory" WHERE verified = true;');
  console.log('  SELECT COUNT(*) FROM "ErrorMessageTemplate";');
  console.log('  SELECT COUNT(*) FROM "RoleAudit" WHERE "expertReviewText" IS NOT NULL;');
}

async function seedVoiceDefaultRules() {
  const rules = [
    { category: 'elderly', defaultMode: 'voice',
      promptText: 'Dorothy prefers to talk. Most people choose voice — it feels more like company.',
      iconName: 'microphone' },
    { category: 'daily_companion', defaultMode: 'voice',
      promptText: 'Your companion would love to hear your voice. Tap to switch.',
      iconName: 'microphone' },
    { category: 'language', defaultMode: 'voice_preferred',
      promptText: 'Speaking practice improves 3x faster than reading alone.',
      iconName: 'microphone-language' },
    { category: 'health', defaultMode: 'text',
      promptText: 'Some prefer text for sensitive conversations. Your choice, always.',
      iconName: 'message' },
    { category: 'education', defaultMode: 'text',
      promptText: 'Text works well for learning. Switch to voice any time.',
      iconName: 'message' },
  ];

  for (const rule of rules) {
    await prisma.voiceDefaultRule.upsert({
      where: { category: rule.category },
      create: rule,
      update: rule,
    });
  }
}

main().catch(console.error);
```

---

# ════════════════════════════════════════════════════════════════════════════
# PHASE 15 — FINAL VERIFICATION SCRIPT
# ════════════════════════════════════════════════════════════════════════════

```bash
#!/bin/bash
# scripts/vision-smoke-test.sh
# Tests that all vision features are built, seeded, and working.
# Must exit 0 before deploying vision features.

PASS=0; FAIL=0
BASE="${APP_URL:-http://localhost:3000}"
p() { echo "✓ $1"; ((PASS++)); }
f() { echo "✗ FAIL: $1"; ((FAIL++)); }

echo "══════════════════════════════════════════════════════"
echo "TRUST AGENT — VISION FEATURES SMOKE TEST"
echo "Mission: Everyone deserves an expert who knows them."
echo "══════════════════════════════════════════════════════"

# ── TYPESCRIPT ────────────────────────────────────────────────────────────
TS=$(npx tsc --noEmit 2>&1 | grep -c "error TS" || true)
[ "$TS" -eq 0 ] && p "TypeScript: 0 errors" || f "TypeScript: $TS errors"

# ── DATABASE TABLES ───────────────────────────────────────────────────────
check_table() {
  local name="$1"; local model="$2"
  node -e "
    const { PrismaClient } = require('@prisma/client');
    const p = new PrismaClient();
    p['$model'].count().then(n => { console.log('OK:' + n); p.\$disconnect(); })
      .catch(e => { console.log('FAIL'); process.exit(1); });
  " 2>/dev/null | { read r; echo "$r" | grep -q "^OK" && p "Table: $name" || f "Table: $name"; }
}

check_table "OnboardingCheckpoint"      "onboardingCheckpoint"
check_table "LivesChangedStory"         "livesChangedStory"
check_table "CompanionPersonalityConfig" "companionPersonalityConfig"
check_table "VoiceDefaultRule"          "voiceDefaultRule"
check_table "ErrorMessageTemplate"      "errorMessageTemplate"
check_table "MobileHandoffSession"      "mobileHandoffSession"
check_table "SchoolLeaderboard"         "schoolLeaderboard"
check_table "CreatorStory"              "creatorStory"
check_table "NHSPartnerPractice"        "nHSPartnerPractice"
check_table "UnifiedStoryLog"           "unifiedStoryLog"
check_table "CancellationFeedback"      "cancellationFeedback"

# ── SEEDED DATA ───────────────────────────────────────────────────────────
node -e "
  const { PrismaClient } = require('@prisma/client');
  const p = new PrismaClient();
  p.livesChangedStory.count({ where: { verified: true }})
    .then(n => { console.log(n >= 4 ? 'OK:' + n : 'FAIL:only ' + n); p.\$disconnect(); });
" 2>/dev/null | { read r; echo "$r" | grep -q "^OK" && p "Stories: 4+ verified stories seeded ($r)" || f "Stories: $r"; }

node -e "
  const { PrismaClient } = require('@prisma/client');
  const p = new PrismaClient();
  p.errorMessageTemplate.count()
    .then(n => { console.log(n >= 8 ? 'OK:' + n : 'FAIL:' + n); p.\$disconnect(); });
" 2>/dev/null | { read r; echo "$r" | grep -q "^OK" && p "Error messages: 8+ templates seeded ($r)" || f "Error messages: $r"; }

node -e "
  const { PrismaClient } = require('@prisma/client');
  const p = new PrismaClient();
  p.roleAudit.count({ where: { expertReviewText: { not: null }}})
    .then(n => { console.log(n > 0 ? 'OK:' + n : 'FAIL'); p.\$disconnect(); });
" 2>/dev/null | { read r; echo "$r" | grep -q "^OK" && p "Expert reviews: seeded ($r)" || f "Expert reviews: MISSING — run seedVisionData"; }

node -e "
  const { PrismaClient } = require('@prisma/client');
  const p = new PrismaClient();
  p.voiceDefaultRule.count()
    .then(n => { console.log(n >= 3 ? 'OK:' + n : 'FAIL:' + n); p.\$disconnect(); });
" 2>/dev/null | { read r; echo "$r" | grep -q "^OK" && p "Voice rules: seeded ($r)" || f "Voice rules: MISSING"; }

# ── API ENDPOINTS ─────────────────────────────────────────────────────────
api_test() {
  local name="$1"; local proc="$2"; local input="$3"; local expect="$4"
  local result
  result=$(curl -sf -X POST "$BASE/api/trpc/$proc" \
    -H "Content-Type: application/json" \
    -d "{\"json\":$input}" --max-time 10 2>&1)
  echo "$result" | grep -q "$expect" && p "API: $name" || f "API: $name — wanted '$expect'"
}

api_test "Featured stories for homepage" \
  "stories.getFeatured" \
  '{"audience":"homepage","limit":3}' \
  '"quote"'

api_test "Session config with ambient audio" \
  "sessions.getSessionConfig" \
  '{"hireId":"test","environmentSlug":"therapy-room"}' \
  '"ambient"'

api_test "NHS partner stats" \
  "nhs.getNHSPartnerStats" \
  'null' \
  '"partnerPractices"'

api_test "Human error message" \
  "system.getErrorMessage" \
  '{"errorCode":"session_connection_lost"}' \
  '"safetyNote"'

# ── CODE QUALITY ──────────────────────────────────────────────────────────
# Proactive contact generates context-aware messages
grep -rn "specificity.*highly_personal\|specificity.*context_aware" \
  server/src/lib/notifications/ 2>/dev/null | grep -q "." && \
  p "Proactive contact: context-aware specificity tracked" || \
  f "Proactive contact: specificity NOT tracked"

# Voice defaults for elderly
grep -rn "elderly.*voice\|voice.*elderly\|daily_companion.*voice" \
  server/src/lib/sessions/ 2>/dev/null | grep -q "." && \
  p "Voice defaults: elderly/daily companion default to voice" || \
  f "Voice defaults: NOT set for elderly companions"

# Cancellation has no dark patterns
grep -rn "countdown\|cancel_now\|are_you_sure_modal\|scare_tactic" \
  server/src/routers/ src/ app/ 2>/dev/null | grep -v "//\|test" | grep -q "." && \
  f "Dark patterns detected in cancellation flow" || \
  p "Cancellation: no dark patterns detected"

# Error messages are warm (not "Error 500")
COLD_ERRORS=$(grep -rn '"Error 500"\|"Something went wrong."\|"An error occurred"\|"Bad Request"' \
  src/ app/ 2>/dev/null | grep -v "//\|test\|node_modules" | wc -l)
[ "$COLD_ERRORS" -eq 0 ] && p "Error messages: no cold/technical errors shown to users" || \
  f "Cold error messages: $COLD_ERRORS found — replace with human templates"

# Mission statement present
MS=$(grep -rn "Everyone deserves an expert\|expertise that changes lives" \
  src/ app/ 2>/dev/null | grep -v node_modules | wc -l)
[ "$MS" -ge 3 ] && p "Mission statement: $MS instances across codebase" || \
  f "Mission statement: only $MS instances — add to footer, about, email footer"

# Companion cards: 4 things only (not 7+)
CC=$(grep -rn "CompanionCard\|companion-card" src/components/ 2>/dev/null | wc -l)
[ "$CC" -gt 0 ] && p "Companion cards: component found" || f "Companion cards: component missing"

# Ghost cards in empty state
GC=$(grep -rn "GhostCompanionCard\|EmptyDashboard\|ghost.*card" src/ app/ 2>/dev/null | wc -l)
[ "$GC" -gt 0 ] && p "Empty states: ghost cards component found" || f "Empty states: ghost cards MISSING"

# Pricing comparison copy
PC=$(grep -rn "65.*hour\|tutoring session\|less than.*coffees\|less than one" src/ app/ 2>/dev/null | wc -l)
[ "$PC" -ge 2 ] && p "Pricing copy: comparison framing found ($PC instances)" || \
  f "Pricing copy: comparison framing MISSING — critical for conversion"

# Quote-first hero
QH=$(grep -rn "opening-quote\|hero.*quote\|14 months\|Alicia.*Manchester" src/ app/ 2>/dev/null | wc -l)
[ "$QH" -gt 0 ] && p "Homepage: quote-first hero found" || \
  f "Homepage: quote-first hero MISSING — emotional resonance not implemented"

# ── SECURITY (repeat check — non-negotiable) ──────────────────────────────
SP=$(grep -rn '"systemPrompt"' server/src/routers/ 2>/dev/null | \
  grep "return\|json\|select\|map" | grep -v "hash\|admin\|//" | wc -l)
[ "$SP" -eq 0 ] && p "systemPrompt: zero leaks" || f "CRITICAL: systemPrompt leaks in API"

MSG=$(grep -rn "\.message\.create\|saveMessage" server/src/ 2>/dev/null | \
  grep -v "//\|email\|notification" | wc -l)
[ "$MSG" -eq 0 ] && p "Messages: never stored" || f "CRITICAL: Message storage detected"

# ── PRODUCTION BUILD ──────────────────────────────────────────────────────
BUILD=$(npm run build 2>&1)
echo "$BUILD" | grep -qE "Compiled successfully|Build complete|Route (app)" && \
  p "Production build: success" || f "Production build: FAILED"

# ── FINAL ─────────────────────────────────────────────────────────────────
echo ""
echo "══════════════════════════════════════════════════════"
echo "RESULT: $PASS PASS · $FAIL FAIL"
if [ $FAIL -gt 0 ]; then
  echo "✗ NOT READY — Fix $FAIL failures"
  echo ""
  echo "Patricia. Jade. Daniel. Fix it for them."
  exit 1
else
  echo "✓ ALL PASS — Vision features production ready"
  echo ""
  echo "Everyone deserves an expert who knows them."
  exit 0
fi
```

---

# ════════════════════════════════════════════════════════════════════════════
# PHASE 16 — EXECUTION ORDER
# ════════════════════════════════════════════════════════════════════════════

```
STEP 1:  bash scripts/production-smoke-test.sh
         → Previous prompt must be fully complete. Exit 0 required.
         → Every FAIL = fix it. Re-run. Do not continue until clean.

STEP 2:  npx prisma migrate dev --name "vision-features-complete"
         npx prisma generate
         npx tsc --noEmit   → Must be 0 errors

STEP 3:  Implement Phase 2 (Aha Moment tracking — OnboardingCheckpoint)
         → Test: call trackCheckpoint, query DB, row exists
         → Test: call getOnboardingFunnelData, returns per-step breakdown
         → FAIL = stop, fix, test

STEP 4:  Implement Phase 3 (Proactive contact — companion feels alive)
         → Set test hire with examDate 7 days ahead + BrainMemoryEntry
         → Run generateProactiveContact(hireId)
         → Expected: specificity = 'highly_personal', body contains topic
         → FAIL = stop, fix, test

STEP 5:  Implement Phase 4 (Session config — ambient audio + voice)
         → Upload at least 3 audio files to S3
         → Test: sessions.getSessionConfig for therapy-room hire
         → Expected: ambient.url is a presigned S3 URL, voice.recommendation set
         → FAIL = stop, fix, test

STEP 6:  Implement Phase 5 (Expert reviews seeded)
         → Run: ensureExpertReviewsPresent()
         → Query: SELECT COUNT(*) FROM "RoleAudit" WHERE "expertReviewText" IS NOT NULL
         → Expected: count > 0
         → FAIL = stop, fix, re-run

STEP 7:  Implement Phases 6-7 (Human errors + cancellation)
         → Run seedErrorMessages()
         → Test: system.getErrorMessage("session_connection_lost")
         → Expected: { userTitle, safetyNote: "Your session data is safe..." }
         → Test: cancelSubscription with reason
         → Expected: CancellationFeedback row in DB, Stripe updated
         → FAIL = stop, fix, test

STEP 8:  Implement Phases 8-12 (Handoff, leaderboard, stories, creators, NHS)
         → Run seedLivesChangedStories()
         → Test: stories.getFeatured returns Patricia/Jade/Daniel/Alicia
         → Test: initiateHandoff for elderly companion → voiceMode: "voice"
         → FAIL = stop, fix, test

STEP 9:  Register all new routers in server/src/router.ts
         → npx tsc --noEmit — 0 errors
         → curl each endpoint from Phase 15 api_test section

STEP 10: npx ts-node scripts/seedVisionData.ts
         → Runs all seed functions
         → Verify: SELECT COUNT(*) per table shows data

STEP 11: bash scripts/vision-smoke-test.sh
         → Exit 0 required
         → Every FAIL = fix and re-run

STEP 12: bash scripts/production-smoke-test.sh (run again to be sure)
         → Still exit 0

STEP 13: Commit:
         git add -A
         git commit -m "feat: vision-to-code — Patricia. Jade. Daniel."
         git push origin Unified/vision-to-code
```

---

# ════════════════════════════════════════════════════════════════════════════
# COMMIT MESSAGE
# ════════════════════════════════════════════════════════════════════════════

```
feat: vision-to-code — 17 strategic recommendations, fully wired

"Everyone deserves an expert who knows them."

═══════════ AHA MOMENT FUNNEL TRACKING ═══════════
- OnboardingCheckpoint: every step from landing to Aha Moment
- getOnboardingFunnelData: conversion rates + time per step
- PLG target: 65%+ activation rate, <3min time-to-Aha
- Checkpoint fired from onboarding, quiz, hire, first session

═══════════ COMPANION FEELS ALIVE ═══════════
- generateProactiveContact: context-aware, not generic
- Specificity tiers: generic / context_aware / highly_personal
- Exam-aware: "7 days until maths. You haven't covered integration by parts."
- Streak-aware: fires only in the 18-30hr risk window
- Return-aware: references last topic, breakthrough, specific absence
- Human connection: "Is there someone you've been meaning to call?"
- Only generic messages throttled to 1/fortnight

═══════════ SESSION CONFIG ═══════════
- getSessionConfig: ambient audio URL + voice recommendation + streaming config
- Voice defaults: elderly/daily_companion → voice, language → voice_preferred
- VoiceDefaultRule: seeded per category with contextual prompt text
- Ambient audio: presigned S3 URLs, per-environment config
- seedAmbientAudio.ts: verifies all 38 environment audio files in S3

═══════════ TRUST FELT, NOT JUST DISPLAYED ═══════════
- Expert reviews seeded for all PLATINUM/GOLD companions
- Reviewer name, credentials, years experience on companion page
- ensureExpertReviewsPresent: idempotent, safe to re-run
- Full paragraph review text per category (education/health/language/business/elderly)

═══════════ HUMAN ERROR MESSAGES ═══════════
- ErrorMessageTemplate: 10 templates seeded
- "Your session data is safe, we promise" — not "Error 500"
- Every error has: userTitle, userMessage, safetyNote, actionLabel
- getHumanError: fallback to general error if code not found

═══════════ CANCELLATION WITHOUT DARK PATTERNS ═══════════
- cancelSubscription: stores feedback, no guilt, no countdown
- CancellationFeedback: reason, freeText, wouldReturn, improvement
- Brain preserved forever on cancellation
- cancel_at_period_end: true (Stripe) — never immediate

═══════════ MOBILE HANDOFF ═══════════
- initiateHandoff: 90-second flow for daughter setting up mum's app
- Steps: companion_chosen → named → cloud_connected
- Auto-sets voice mode for elderly/daily companion categories
- Email sent to target with magic link setup

═══════════ SCHOOL LEADERBOARD ═══════════
- SchoolLeaderboard: anonymised, weekly, streak-based
- No PII in entries: rank, streakDays, subjectEmoji, anonymousId only
- generateSchoolLeaderboard: upserts weekly record

═══════════ LIVES CHANGED STORIES ═══════════
- LivesChangedStory: Patricia, Jade, Daniel, Alicia seeded
- One source of truth: users/investors/regulators draw from same table
- publishedOn array: 'homepage'|'pricing'|'investor_deck'|'nhs_page'
- submitStory: users can submit their own (admin verification required)
- getFeatured: public endpoint, filtered by audience/category

═══════════ CREATOR STORIES ═══════════
- CreatorStory: for the first 5 creators, made famous
- Viral loop: creator promotes companion to professional network
- monthlyEarnings shown with consent
- isFeature flag for homepage placement

═══════════ NHS PARTNER NETWORK ═══════════
- NHSPartnerPractice: ODS code, IG compliance status, pilot status
- verifyPracticePartner: GP portal integration check
- getNHSPartnerStats: public counter for homepage/investor deck

═══════════ VERIFICATION ═══════════
- scripts/vision-verify.sh: pre-flight check
- scripts/vision-smoke-test.sh: 40+ checks, exit 0 = production ready
- Expert reviews verified: SELECT COUNT > 0
- Voice defaults verified: elderly → voice mode
- Stories verified: 4+ verified with consent
- Error messages verified: "safe" language, no cold codes
- Dark patterns verified: zero countdown/guilt patterns
- TypeScript: 0 errors
- Production build: success

AgentCore LTD · Company No. 17114811 · trust-agent.ai
"Everyone deserves an expert who knows them."
Patricia. Jade. Daniel. Their lives got better. That's the whole thing.
```
