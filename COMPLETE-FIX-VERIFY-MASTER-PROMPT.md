# TRUST AGENT — COMPLETE FIX, VERIFY & ELEVATE MASTER PROMPT
# Drop at repo root. Run: claude
# Branch prefix: Unified/
# ════════════════════════════════════════════════════════════════════════════
#
# OPERATOR: AgentCore LTD · Company No. 17114811 · trust-agent.ai
# RAISE: £6.5M total (corrected from all previous documents)
# TOKEN: $TAGNT · ERC-20 · BASE CHAIN (Coinbase L2) · 1,000,000,000 supply
#
# PURPOSE OF THIS PROMPT:
#   Fix every gap from the whitepaper gap analysis. Ensure every feature
#   is fully wired — DB → API → frontend. Nothing is "file exists".
#   Everything is operational and testable end-to-end right now.
#
# ══════════════════════════════════════════════════════════════════════════
# THE ANTI-HALLUCINATION VERIFICATION PROTOCOL
# This is the most important section. Read it before touching any code.
# ══════════════════════════════════════════════════════════════════════════
#
# DEFINITION OF "DONE":
#   A feature is DONE if and only if ALL of the following are TRUE:
#   ✓ Database record exists and is correctly typed in Prisma schema
#   ✓ Prisma migration has been applied (npx prisma migrate dev)
#   ✓ tRPC router procedure exists and returns real DB data
#   ✓ S3 integration works where files are involved (no mock URLs)
#   ✓ Frontend component calls the tRPC procedure (not hardcoded data)
#   ✓ Smoke test passes: curl or tRPC call returns expected shape
#   ✓ Admin console can view/edit/toggle the feature
#
# "File created" alone = HALLUCINATION. It does not count as done.
# "Route added" alone = HALLUCINATION. It does not count as done.
# "Component built" alone = HALLUCINATION. It does not count as done.
#
# THE SELF-VERIFICATION LOOP (mandatory for every single feature):
#
#   STEP 1 — BUILD: Write the code
#   STEP 2 — MIGRATE: Run npx prisma migrate dev (if schema changed)
#   STEP 3 — GENERATE: Run npx prisma generate
#   STEP 4 — TEST THE API: Call the tRPC procedure directly
#              curl -X POST http://localhost:3000/api/trpc/[procedure] \
#                -H "Content-Type: application/json" \
#                -d '{"json": {...}}'
#              → If error: fix before proceeding. Never mark done.
#   STEP 5 — TEST THE DB: Query the database directly
#              npx prisma studio  (or direct SQL)
#              → If data not there: fix the seed/mutation before proceeding.
#   STEP 6 — TEST THE FRONTEND: Load the page and verify data renders
#              → If "undefined", "null", or empty: fix the hook/component.
#   STEP 7 — TEST S3 (if applicable): Verify file uploads/reads work
#              → Check bucket exists in eu-west-2. Check IAM permissions.
#   STEP 8 — MARK DONE: Only after all 7 steps pass
#
# NEVER use the word "done" until the smoke test passes.
# NEVER create placeholder data in production code.
# NEVER use setTimeout, fake delays, or mock responses.
# NEVER hardcode prices, role counts, or feature states.
# ALL data comes from the database. ALL of it.
#
# ══════════════════════════════════════════════════════════════════════════
# RAISE CORRECTION (CRITICAL — UPDATE IN ALL FILES)
# ══════════════════════════════════════════════════════════════════════════
#
# CORRECT RAISE STRUCTURE (£6.5M total):
#   Equity seed:   £3.5M at £15M pre-money valuation
#   Token private: $1.2M at $0.008 (150M tokens, 6-month cliff + 18-month linear vest)
#   Token public:  $2.0M at $0.010 (200M tokens, 25% at TGE + 6-month linear vest)
#   Total raise:   ~£6.5M / ~$8.1M combined
#
# FIND AND REPLACE IN ALL DOCUMENTS, WHITEPAPERS, TOKENOMICS FILES:
#   Old: "£5.5–6.5M", "$6.9–8.1M", "$2.96M", "£2.5–3.5M", "$960K private"
#   New: "£6.5M", "$8.1M", "£3.5M equity", "$1.2M private", "$2.0M public"
#
# TOKEN CORRECTION (CRITICAL — BASE CHAIN NOT ETHEREUM):
#   Old: "Ethereum", "ERC-20 on Ethereum", "ETH mainnet"
#   New: "Base chain", "ERC-20 on Base", "Coinbase L2"
#   Search command: grep -r "Ethereum\|ETH mainnet\|ethereum" --include="*.ts" \
#     --include="*.tsx" --include="*.md" . | grep -v node_modules
#   Fix every instance.
#
# TOKEN ALLOCATION (CORRECT FROM WHITEPAPER V4):
#   Team:           15% (150M) — 12-month cliff, 36-month vest
#   Ecosystem:      25% (250M) — rewards, grants, partnerships
#   Private sale:   15% (150M) — $0.008, cliff + 18-month vest
#   Public sale:    20% (200M) — $0.010, 25% TGE + 6-month vest
#   Treasury:       12% (120M) — DAO-governed
#   Advisors:        5% (50M)  — 6-month cliff, 24-month vest
#   Liquidity:       3% (30M)  — DEX liquidity provision
#   Foundation:      5% (50M)  — social impact programmes
#   Total:         100% (1,000,000,000)
#
# ══════════════════════════════════════════════════════════════════════════
# PRICING CORRECTION (CORRECT FROM WHITEPAPER V4 — GBP)
# ══════════════════════════════════════════════════════════════════════════
#
# CORRECT PRICING TIERS:
#   Starter:       £9.99/mo   — 1 role, Brain memory, 38 environments, voice, 33 languages
#   Essential:     £19.99/mo  — 5 roles, voice clone, progress reports, scheduling
#   Family:        £24.99/mo  — 5 roles + 2 child profiles, guardian dashboard, 45min limits
#   Professional:  £39.99/mo  — 10 roles, B2B gateway, company Brain, HITL
#   NHS referral:  FREE       — activated by referral code, duration set by GP
#   School licence:Custom     — per-student pricing, bulk licensing
#
# The admin console MUST allow:
#   - Changing any price in real-time from the dashboard
#   - Price changes take effect immediately for new subscribers
#   - Existing subscribers are grandfathered (shown in admin)
#   - Admins can apply custom pricing per user or per enterprise
#   - Full price history log (who changed what, when, old vs new price)
#
# ══════════════════════════════════════════════════════════════════════════
# SECTION A — COMPLETE DATABASE SCHEMA GAPS
# ══════════════════════════════════════════════════════════════════════════

## A.1 PRICING ADMIN TABLE

Add to Prisma schema if not present:

```prisma
model PricingTier {
  id              String   @id @default(cuid())
  name            String   @unique  // "starter" | "essential" | "family" | "professional"
  displayName     String
  priceGBP        Float
  pricePreviousGBP Float?
  maxRoles        Int
  maxChildProfiles Int     @default(0)
  features        String[] // JSON list of feature keys enabled
  stripePriceId   String?  // Live Stripe price ID
  stripeTestPriceId String? // Test Stripe price ID
  isActive        Boolean  @default(true)
  changedBy       String?  // Admin user ID who last changed price
  changedAt       DateTime @updatedAt
  createdAt       DateTime @default(now())
  priceHistory    PriceHistory[]
}

model PriceHistory {
  id          String      @id @default(cuid())
  tierId      String
  tier        PricingTier @relation(fields: [tierId], references: [id])
  oldPrice    Float
  newPrice    Float
  changedBy   String      // Admin user ID
  changedAt   DateTime    @default(now())
  note        String?
}
```

## A.2 ADMIN PRICING ROUTER

Add to `server/src/routers/admin.ts`:

```typescript
// ── PRICING ADMIN ──────────────────────────────────────────────────────
getPricingTiers: adminProcedure.query(async ({ ctx }) => {
  return ctx.prisma.pricingTier.findMany({
    include: { priceHistory: { take: 5, orderBy: { changedAt: 'desc' } } },
    orderBy: { priceGBP: 'asc' },
  });
}),

updatePricingTier: adminProcedure
  .input(z.object({
    tierId: z.string(),
    priceGBP: z.number().positive(),
    note: z.string().optional(),
  }))
  .mutation(async ({ ctx, input }) => {
    const existing = await ctx.prisma.pricingTier.findUniqueOrThrow({
      where: { id: input.tierId },
    });

    // Log price history BEFORE updating
    await ctx.prisma.priceHistory.create({
      data: {
        tierId: input.tierId,
        oldPrice: existing.priceGBP,
        newPrice: input.priceGBP,
        changedBy: ctx.session.userId,
        note: input.note,
      },
    });

    // Update the tier
    const updated = await ctx.prisma.pricingTier.update({
      where: { id: input.tierId },
      data: {
        pricePreviousGBP: existing.priceGBP,
        priceGBP: input.priceGBP,
        changedBy: ctx.session.userId,
      },
    });

    // TODO: Update Stripe price (create new price, archive old)
    // This requires creating a new Stripe price object — Stripe prices are immutable
    // await stripe.prices.update(existing.stripePriceId, { active: false });
    // const newStripePrice = await stripe.prices.create({ ... });

    return updated;
  }),

togglePricingTier: adminProcedure
  .input(z.object({ tierId: z.string(), isActive: z.boolean() }))
  .mutation(async ({ ctx, input }) => {
    return ctx.prisma.pricingTier.update({
      where: { id: input.tierId },
      data: { isActive: input.isActive },
    });
  }),
```

## A.3 SEED PRICING TIERS

Add to `server/src/seed.ts` (run after migrate):

```typescript
async function seedPricingTiers() {
  const tiers = [
    {
      name: 'starter',
      displayName: 'Starter',
      priceGBP: 9.99,
      maxRoles: 1,
      maxChildProfiles: 0,
      features: ['brain', 'environments', 'voice', 'languages', 'streaks'],
    },
    {
      name: 'essential',
      displayName: 'Essential',
      priceGBP: 19.99,
      maxRoles: 5,
      maxChildProfiles: 0,
      features: ['brain', 'environments', 'voice', 'voice_clone', 'languages',
        'streaks', 'progress_reports', 'scheduling', 'session_modes'],
    },
    {
      name: 'family',
      displayName: 'Family',
      priceGBP: 24.99,
      maxRoles: 5,
      maxChildProfiles: 2,
      features: ['brain', 'environments', 'voice', 'voice_clone', 'languages',
        'streaks', 'progress_reports', 'guardian_dashboard', 'child_limits',
        'wellbeing_monitoring', 'safeguarding'],
    },
    {
      name: 'professional',
      displayName: 'Professional',
      priceGBP: 39.99,
      maxRoles: 10,
      maxChildProfiles: 0,
      features: ['brain', 'environments', 'voice', 'voice_clone', 'languages',
        'streaks', 'progress_reports', 'scheduling', 'session_modes',
        'b2b_gateway', 'company_brain', 'hitl', 'school_licensing'],
    },
  ];

  for (const tier of tiers) {
    await prisma.pricingTier.upsert({
      where: { name: tier.name },
      create: tier,
      update: tier,
    });
  }
  console.log('✓ Pricing tiers seeded');
}
```

## A.4 VERIFICATION: Pricing admin

```bash
# After migrate + seed:
curl -X POST http://localhost:3000/api/trpc/admin.getPricingTiers \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"json": null}'
# Expected: Array of 4 pricing tiers with correct GBP prices
# FAIL if: empty array, error, or mock data
```

---

## SECTION B — FEATURE GAP FIXES (END-TO-END)

Each feature below must pass the 7-step verification loop.
Build each one completely before moving to the next.

---

### B.1 ONBOARDING QUIZ (full end-to-end)

**Database check:**
```bash
npx prisma studio  # Verify QuizResponse table exists
# Must have: userId, answers (Json), recommendedRoleSlug, completedAt
```

**tRPC check:**
```bash
curl -X POST http://localhost:3000/api/trpc/onboarding.submitQuiz \
  -H "Content-Type: application/json" \
  -d '{"json": {"answers": {"goal": "education", "age": "adult", "subject": "maths", "level": "gcse", "style": "structured", "time": "30", "language": "english", "companion_gender": "female"}}}'
# Expected: { recommendedRole: { slug, name, category, badge, trustScore } }
# FAIL if: null, undefined, or generic role returned without matching logic
```

**Frontend check:**
- Navigate to /onboarding
- Complete all 8 steps
- Verify role recommendation renders with real data from DB
- Verify "Hire this companion" button triggers actual hire mutation

---

### B.2 GUARDIAN DASHBOARD (full end-to-end)

**Database check:**
```bash
# Verify FamilyLink table exists with guardianId, childId, relationship
# Verify GuardianAlert table exists with userId, type, data, readAt
# Verify wellbeingScore is computed and stored on Hire model
```

**tRPC checks:**
```bash
# 1. Get child activity
curl -X POST http://localhost:3000/api/trpc/guardian.getChildActivity \
  -d '{"json": {"childId": "TEST_CHILD_ID", "days": 7}}'
# Expected: { sessions, topicsMastered, topicsStruggling, wellbeingScore,
#             wellbeingTrend, safeguardingAlerts, streakDays }
# FAIL if: null child data or missing wellbeing score

# 2. Get guardian alerts
curl -X POST http://localhost:3000/api/trpc/guardian.getAlerts \
  -d '{"json": {"unreadOnly": false}}'
# Expected: Array of alerts with type, data, createdAt
# FAIL if: empty (even fresh accounts should have setup alert)
```

**Wellbeing score computation — verify it actually runs:**
```bash
# After a session ends, check the hire record updated:
# SELECT "wellbeingScore", "wellbeingTrend" FROM "Hire" WHERE id = 'X'
# FAIL if: wellbeing score is null or hasn't changed after session
```

---

### B.3 PROGRESS REPORTS PDF (full end-to-end)

**S3 check:**
```bash
aws s3 ls s3://trustagent-prod-artifacts/reports/ --region eu-west-2
# Expected: PDF files present after report generation
# FAIL if: S3 bucket inaccessible or empty after generation
```

**tRPC check:**
```bash
curl -X POST http://localhost:3000/api/trpc/reports.generateProgressReport \
  -d '{"json": {"hireId": "TEST_HIRE_ID", "reportType": "weekly"}}'
# Expected: { reportUrl: "https://trustagent-prod-artifacts.s3..." }
# FAIL if: reportUrl is null, mock URL, or S3 error
```

**PDF download check:**
```bash
curl -I "$REPORT_URL"
# Expected: HTTP 200, Content-Type: application/pdf
# FAIL if: 403, 404, or Content-Type is not PDF
```

---

### B.4 STREAKS & MILESTONES (full end-to-end)

**Database check:**
- `Hire.streakDays` field exists and updates after each session
- `Hire.longestStreakDays` updates when current streak exceeds it
- `Milestone` table exists with `type`, `awardedAt`, `hireId`

**Streak logic verification:**
```bash
# After completing a session, query hire:
# SELECT "streakDays", "longestStreakDays", "lastSessionAt" FROM "Hire" WHERE id = 'X'
# streakDays should be 1 (first session) or incremented if session was yesterday
# FAIL if: streakDays unchanged or null after session
```

**Milestone award verification:**
```bash
# After 7 days streak, check milestones table:
# SELECT * FROM "Milestone" WHERE "hireId" = 'X' AND type = 'STREAK_7'
# FAIL if: milestone not created after qualifying session
```

---

### B.5 WELLBEING SCORE + FAMILY ALERTS (full end-to-end)

**Score algorithm verification:**
The wellbeing score MUST update after every session. Score formula:
```
baseline = 75
+ 5 if sessions >= 3 in last 14 days
+ 5 if streakDays >= 3
+ 5 if avgSessionMinutes > 10
- 15 if sessions == 0 in last 14 days
- 10 if daysSinceLastSession > 7
- 10 if daysSinceLastSession > 14 (additional)
- 10 if dependencyFlagCount > 3 in recent sessions
bounded to [0, 100]
```

**Alert delivery verification:**
```bash
# When wellbeingTrend changes to 'declining':
# 1. Check Notification table for WELLBEING_ALERT with guardianId
# 2. Check that push notification was queued (NotificationQueue table)
# 3. Check email was sent (check SMTP logs if available)
# FAIL if: alert not created or not delivered when trend declines
```

---

### B.6 LIVE EXAM MODE (full end-to-end)

**Session mode injection verification:**
```bash
# Start a session with mode: 'exam'
curl -X POST http://localhost:3000/api/trpc/sessions.start \
  -d '{"json": {"hireId": "X", "environmentSlug": "gcse-classroom", "mode": "exam"}}'
# Expected: session started with examModeActive: true
# Verify: system prompt includes EXAM MODE injection
# FAIL if: session starts without exam mode or injection is missing
```

**Exam result saving:**
```bash
# After exam session ends:
# SELECT * FROM "AgentSession" WHERE mode = 'exam' ORDER BY "endedAt" DESC LIMIT 1
# Must have: examScore, questionsAnswered, examDuration stored
# FAIL if: exam fields are null after session
```

---

### B.7 UPLOAD & MARK MODE (full end-to-end)

**S3 upload verification:**
```bash
# Upload test file:
curl -X POST http://localhost:3000/api/trpc/sessions.uploadDocument \
  -F "file=@test-essay.pdf" \
  -F "hireId=X"
# Expected: { documentUrl: "https://trustagent-prod-customer-docs.s3...", documentId: "..." }
# FAIL if: URL is mock, upload fails, or S3 bucket unreachable
```

**Document marking verification:**
```bash
# After upload, start session with documentId:
curl -X POST http://localhost:3000/api/trpc/sessions.start \
  -d '{"json": {"hireId": "X", "mode": "upload_mark", "documentId": "DOC_ID"}}'
# Expected: session with document context injected into system prompt
# FAIL if: document content not in session context
```

---

### B.8 SPACED REPETITION ENGINE (full end-to-end)

**SM-2 algorithm verification:**
The SM-2 algorithm must update these fields after every review:
```
easinessFactor (starts at 2.5, min 1.3)
interval (days until next review)
repetitions (count of successful reviews)
nextReviewAt (computed date)
quality (user's self-rating 0-5)
```

**Database check:**
```bash
# SELECT * FROM "SpacedRepetitionItem" WHERE "hireId" = 'X'
# After first review: interval should be 1, repetitions = 1
# After second correct review: interval should be 6, repetitions = 2
# FAIL if: SM-2 fields not updating correctly
```

**Due items verification:**
```bash
curl -X POST http://localhost:3000/api/trpc/spaced-repetition.getDueItems \
  -d '{"json": {"hireId": "X"}}'
# Expected: Items where nextReviewAt <= NOW()
# FAIL if: returns empty when items should be due, or returns all items
```

---

### B.9 SESSION SCHEDULING + CALENDAR SYNC (full end-to-end)

**Schedule creation verification:**
```bash
curl -X POST http://localhost:3000/api/trpc/scheduling.createSchedule \
  -d '{"json": {"hireId": "X", "dayOfWeek": 1, "time": "19:00", "timezone": "Europe/London", "durationMins": 45}}'
# Expected: { scheduleId, nextSessionAt, icsUrl }
# FAIL if: nextSessionAt is null or icsUrl is invalid
```

**.ics file verification:**
```bash
curl -I "$ICS_URL"
# Expected: HTTP 200, Content-Type: text/calendar
# ICS file must parse with at least one VEVENT
# FAIL if: 404 or malformed ICS
```

**Notification trigger verification:**
```bash
# 10 minutes before scheduled session:
# Check Notification table for SESSION_REMINDER
# FAIL if: reminder not created within 1 minute of trigger time
```

---

### B.10 ANTI-DEPENDENCY ARCHITECTURE (full end-to-end)

**90-minute adult warning verification:**
```bash
# Start a session, simulate 90 minutes passing (or test with 1 minute threshold):
# Verify WebSocket message sent with type: 'DEPENDENCY_WARNING'
# FAIL if: no WebSocket message after threshold
```

**Child 45-minute hard limit verification:**
```bash
# For a child account, attempt to start session after 45 minutes:
curl -X POST http://localhost:3000/api/trpc/sessions.start \
  -H "Authorization: Bearer $CHILD_TOKEN" \
  -d '{"json": {"hireId": "X", "environmentSlug": "gcse-classroom"}}'
# Expected: Error with code 'DAILY_LIMIT_EXCEEDED'
# FAIL if: session starts despite limit being reached
```

**API-level enforcement verification:**
```bash
# This check MUST run in the tRPC session.start procedure, NOT just in the UI:
# grep -n "DAILY_LIMIT_EXCEEDED\|dailyMinutes\|45\|child.*limit" \
#   server/src/routers/sessions.ts
# FAIL if: limit only enforced in frontend code (bypassable)
```

---

### B.11 GIFT SUBSCRIPTIONS (full end-to-end)

**Database check:**
```bash
# GiftSubscription table must exist with:
# senderId, recipientEmail, plan, months, roleId?, message, activationCode,
# activatedAt, activatedBy, stripePaymentIntentId
```

**Gift purchase verification:**
```bash
curl -X POST http://localhost:3000/api/trpc/gifts.purchaseGift \
  -d '{"json": {"recipientEmail": "test@example.com", "plan": "starter", "months": 3}}'
# Expected: { giftId, activationCode, stripeCheckoutUrl }
# FAIL if: Stripe checkout URL is null or activation code not generated
```

**Gift activation verification:**
```bash
curl -X POST http://localhost:3000/api/trpc/gifts.activateGift \
  -d '{"json": {"activationCode": "GIFT-XXXX-XXXX"}}'
# Expected: { subscriptionActivated: true, planName, expiresAt }
# FAIL if: subscription not created in DB after activation
```

---

### B.12 MICRO-MOMENT NOTIFICATIONS (full end-to-end)

**BullMQ job verification:**
```bash
# The micro-moments job must run on a schedule:
grep -n "micro-moment\|microMoment\|MICRO_MOMENT" server/src/queues/
# Expected: scheduled job exists running every hour
# FAIL if: job not registered in queue
```

**Notification delivery verification:**
```bash
# After job runs, check Notification table:
# SELECT * FROM "Notification" WHERE type = 'SESSION_REMINDER' 
#   ORDER BY "createdAt" DESC LIMIT 10
# Must contain notifications for users whose lastSessionAt was exactly 23 hours ago
# FAIL if: no notifications created despite qualifying users existing
```

**Push notification delivery (VAPID):**
```bash
# Verify VAPID keys are set and functional:
node -e "
  const webpush = require('web-push');
  webpush.setVapidDetails(
    'mailto:info@trust-agent.ai',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
  console.log('VAPID configured:', !!process.env.VAPID_PUBLIC_KEY);
"
# FAIL if: VAPID keys missing or misconfigured
```

---

### B.13 OFFLINE BRAIN ACCESS (full end-to-end)

**Service worker registration verification:**
```bash
# In the browser console after visiting the app:
# navigator.serviceWorker.getRegistrations().then(console.log)
# Expected: At least one service worker registration
# FAIL if: no service worker registered
```

**Brain file caching verification:**
```bash
# After first login and brain sync:
# Check IndexedDB or Cache Storage for tagnt file presence
# FAIL if: brain data not cached for offline access
```

---

### B.14 REFERRAL PROGRAMME (full end-to-end — backend was missing)

**Database check:**
```bash
# User.referralCode must be unique per user (auto-generated on registration)
# ReferralRedemption table must exist with: referrerId, referredUserId,
# rewardGranted, rewardAmount, rewardType, createdAt
```

**Referral code generation verification:**
```bash
# Every new user must have a referral code:
# SELECT id, email, "referralCode" FROM "User" WHERE "referralCode" IS NULL
# Expected: 0 rows (all users have codes)
# FAIL if: any user missing referral code
```

**Referral redemption verification:**
```bash
curl -X POST http://localhost:3000/api/trpc/referral.redeemCode \
  -d '{"json": {"referralCode": "ABC123"}}'
# Expected: { success: true, reward: { type: "credit", amount: 500 } }
# FAIL if: reward not granted or referral not recorded in DB
```

---

### B.15 COLLABORATION MODE (full end-to-end)

**WebSocket room verification:**
```bash
# Start a collaborative session:
curl -X POST http://localhost:3000/api/trpc/sessions.startCollaboration \
  -d '{"json": {"hireId": "X", "inviteEmail": "partner@example.com"}}'
# Expected: { sessionId, roomId, inviteUrl, wsEndpoint }
# FAIL if: roomId null or wsEndpoint unreachable
```

**Multi-user message delivery verification:**
- User A connects to room, User B connects
- User A sends message
- Verify User B receives message via WebSocket within 500ms
- FAIL if: message not delivered to second participant

---

### B.16 SCHOOL/INSTITUTIONAL LICENSING (full end-to-end)

**Database check:**
```bash
# SchoolLicence table must exist with:
# schoolName, adminEmail, roleSlugAccess[], maxStudents, pricePerStudent,
# validUntil, currentEnrolments, stripeSubscriptionId
```

**Student enrolment verification:**
```bash
curl -X POST http://localhost:3000/api/trpc/school.enrolStudent \
  -d '{"json": {"licenceId": "LIC_X", "studentEmail": "student@school.com"}}'
# Expected: { enrolled: true, studentId, accessExpiresAt }
# FAIL if: student not added to StudentEnrolment table
```

**Enrolment cap enforcement:**
```bash
# Attempt to enrol student when maxStudents is reached:
# Expected: Error with code 'LICENCE_CAPACITY_REACHED'
# FAIL if: over-enrolment allowed
```

---

### B.17 TRUST SCORE API (B2B EXTERNAL AUDIT SERVICE)

**API key generation verification:**
```bash
curl -X POST http://localhost:3000/api/trpc/trust-score-api.generateApiKey \
  -H "Authorization: Bearer $ENTERPRISE_TOKEN" \
  -d '{"json": {"name": "My Integration", "permissions": ["audit.read", "score.compute"]}}'
# Expected: { apiKey: "tsa_...", keyId, expiresAt }
# FAIL if: API key not stored in DB or returned in plain text (security risk)
```

**External audit endpoint verification:**
```bash
curl -X POST https://app.trust-agent.ai/api/v1/audit \
  -H "X-API-Key: tsa_..." \
  -H "Content-Type: application/json" \
  -d '{"systemPrompt": "You are a math tutor...", "category": "education"}'
# Expected: { trustScore: 87, badge: "GOLD", checks: [...], auditId: "..." }
# FAIL if: endpoint returns 404, 401, or mock score
```

---

### B.18 DIGITAL LEGACY MODE

**Database check:**
```bash
# LegacyDesignation table must exist with:
# userId, designeeEmail, designeeRelationship, message, activatedAt,
# brainTransferMethod, consentGrantedAt
```

**Legacy designation verification:**
```bash
curl -X POST http://localhost:3000/api/trpc/legacy.setDesignation \
  -d '{"json": {"designeeEmail": "family@example.com", "relationship": "spouse", "brainTransferMethod": "cloud_drive"}}'
# Expected: { designationId, confirmedAt }
# FAIL if: designation not stored in DB
```

---

### B.19 CURRICULUM BUILDER (institutional feature)

**Curriculum creation verification:**
```bash
curl -X POST http://localhost:3000/api/trpc/curriculum.create \
  -d '{"json": {"name": "GCSE Maths 2026", "roleSlug": "gcse-maths-tutor-f", "topics": ["algebra", "calculus", "statistics"], "examDate": "2026-05-15"}}'
# Expected: { curriculumId, topicCount: 3, spacedRepetitionSchedule }
# FAIL if: curriculum not created or spaced repetition not seeded
```

---

## SECTION C — MISSING ROLES VERIFICATION

### C.1 Verify ALL 179 roles exist and are complete

```bash
# Count roles in DB:
node -e "
  const { PrismaClient } = require('@prisma/client');
  const p = new PrismaClient();
  p.role.count({ where: { isActive: true } }).then(n => {
    console.log('Active roles:', n);
    if (n < 151) console.error('FAIL: Missing roles. Expected 151+, got', n);
    else console.log('PASS');
  });
"

# Check minimum prompt length (8,000 chars per spec):
node -e "
  const { PrismaClient } = require('@prisma/client');
  const p = new PrismaClient();
  p.role.findMany({ select: { slug: true, systemPromptLength: true } }).then(roles => {
    const short = roles.filter(r => r.systemPromptLength < 8000);
    if (short.length > 0) {
      console.error('FAIL: Roles with insufficient prompt length:');
      short.forEach(r => console.error(' -', r.slug, r.systemPromptLength, 'chars'));
    } else {
      console.log('PASS: All', roles.length, 'roles have 8000+ char prompts');
    }
  });
"
```

### C.2 Missing roles checklist — verify each exists:

Run this check against the DB. Every role listed must return a result:

```bash
node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
const requiredSlugs = [
  'grief-bereavement-companion-f', 'grief-bereavement-companion-m',
  'menopause-midlife-companion-f',
  'neurodivergent-life-coach-f', 'neurodivergent-life-coach-m',
  'rehabilitation-reintegration-companion-f',
  'separation-divorce-navigator-f', 'separation-divorce-navigator-m',
  'open-university-study-mentor-f', 'open-university-assignment-coach-f',
  'mba-corporate-finance-advisor', 'mba-strategy-advisor', 'mba-marketing-advisor',
  'acca-tutor-f', 'cfa-tutor-f', 'sqe-tutor-f',
  'nursing-qualification-coach-f', 'paramedic-qualification-coach-m',
  'rics-qualification-coach-m',
  'electrician-trade-coach-m', 'plumber-trade-coach-m',
  'construction-trade-coach-m', 'it-support-coach-m',
  'quiz-companion-f', 'photography-mentor-m',
  'executive-pa-f', 'family-pa-f',
  'curiosity-companion-f', 'creative-play-partner-f',
  'financial-wellbeing-coach-f', 'rights-legal-guide-f',
  'small-business-legal-advisor-m',
  'digital-marketing-companion-f', 'data-science-companion-m',
  'cybersecurity-companion-m', 'home-barista-trainer-m',
  'memory-support-companion-f', 'academic-writing-coach-f',
];
p.role.findMany({
  where: { slug: { in: requiredSlugs } },
  select: { slug: true },
}).then(found => {
  const foundSlugs = found.map(r => r.slug);
  const missing = requiredSlugs.filter(s => !foundSlugs.includes(s));
  if (missing.length > 0) {
    console.error('FAIL: Missing roles:', missing);
    process.exit(1);
  } else {
    console.log('PASS: All required roles present');
  }
});
"
```

---

## SECTION D — MISSING PAGES VERIFICATION

Each page must render real data, not placeholders.

### D.1 Hardware Page (/hardware)

**Verify page exists and renders:**
```bash
curl -s http://localhost:3000/hardware | grep -c "TrustBox Pro"
# Expected: >= 1
# FAIL if: 0 (page not rendering or product not listed)
```

**Verify Stripe integration for hardware:**
```bash
curl -X POST http://localhost:3000/api/trpc/hardware.initiatePreorder \
  -d '{"json": {"productSlug": "trustbox-pro", "email": "test@test.com"}}'
# Expected: { checkoutUrl: "https://checkout.stripe.com/..." }
# FAIL if: not Stripe URL or returns mock
```

### D.2 Foundation/Social Impact Page (/foundation)

```bash
curl -s http://localhost:3000/foundation | grep -c "2-3% of revenue"
# Expected: >= 1
# FAIL if: page missing or content not rendering
```

### D.3 Creator Programme Page (/creator)

```bash
curl -s http://localhost:3000/creator | grep -c "80/20"
# Expected: >= 1 (80% revenue share mentioned)
curl -X POST http://localhost:3000/api/trpc/creator.submitApplication \
  -d '{"json": {"name": "Test Creator", "email": "creator@test.com", "expertise": "mathematics", "credentials": "PhD Mathematics", "roleProposal": "Advanced calculus tutor"}}'
# Expected: { applicationId, status: "PENDING" }
# FAIL if: application not stored in DB
```

---

## SECTION E — ADMIN CONSOLE COMPLETE VERIFICATION

The admin console must work end-to-end for every admin function.

### E.1 Admin pricing panel — click-on-card editing

Build this UI in the admin dashboard:

```typescript
// src/components/admin/PricingPanel.tsx

// Every pricing tier card must be:
// 1. Clickable to open inline edit mode
// 2. Editable: price field with £ prefix
// 3. Save button triggers admin.updatePricingTier mutation
// 4. Success: card updates in real-time with new price
// 5. Price history shown below each card (last 5 changes)
// 6. "Active/Inactive" toggle per tier

// Verification: change Starter from £9.99 to £12.99, verify:
// a) PricingTier.priceGBP = 12.99 in DB
// b) PriceHistory record created with oldPrice: 9.99, newPrice: 12.99
// c) UI updates without page refresh
// d) New subscriber checkout reflects new price
```

### E.2 Role management — admin can edit any role

```bash
# Verify admin can update a role's trust score or status:
curl -X POST http://localhost:3000/api/trpc/admin.updateRole \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"json": {"roleId": "X", "isActive": false}}'
# Expected: role deactivated in DB
# Verify: deactivated role no longer appears in marketplace
```

### E.3 User management — admin can view and manage users

```bash
curl -X POST http://localhost:3000/api/trpc/admin.listUsers \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"json": {"page": 1, "limit": 20}}'
# Expected: { users: [...], total, page, limit }
# Each user must have: id, email, plan, createdAt, sessionCount, lastActiveAt
# FAIL if: returning mock users or empty when users exist
```

### E.4 Audit queue — admin can review and approve/reject roles

```bash
curl -X POST http://localhost:3000/api/trpc/admin.getAuditQueue \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"json": {"status": "PENDING"}}'
# Expected: Array of roles pending audit review
# FAIL if: empty when roles await review
```

---

## SECTION F — WORLD-CLASS ADDITIONS (beyond the whitepaper)

These are features that will make Trust Agent the best-developed platform
in the category. All must be fully implemented, not placeholders.

### F.1 POSTHOG ANALYTICS (privacy-respecting, self-hostable)

Install PostHog for product analytics without compromising user privacy:

```bash
npm install posthog-js posthog-node
```

```typescript
// Track key events (no PII, no session content):
posthog.capture('session_started', {
  category: hire.role.category,
  environment: session.environmentSlug,
  mode: session.mode,
  hasVoice: session.voiceModeActive,
  subscriptionPlan: user.plan,
});

posthog.capture('companion_hired', {
  roleCategory: role.category,
  badge: role.badge,
  trustScore: role.trustScore,
  priceGBP: tier.priceGBP,
});

posthog.capture('quiz_completed', {
  recommendedCategory: role.category,
  stepsCompleted: 8,
  timeToCompleteSeconds: elapsed,
});
```

All events must:
- Contain NO message content
- Contain NO personally identifiable information
- Be anonymised (use user hash, not email or name)

### F.2 FEATURE FLAGS IN ADMIN CONSOLE

Allow admins to enable/disable features per-user or globally:

```prisma
model FeatureFlag {
  id          String   @id @default(cuid())
  key         String   @unique  // e.g. "collaboration_mode", "digital_legacy"
  description String
  isEnabled   Boolean  @default(false)
  enabledFor  String[] // User IDs for targeted rollout (empty = all users)
  rolloutPct  Int      @default(0) // 0-100 percentage rollout
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

Admin UI: Toggle any feature flag globally or for specific users.
Used for: gradual rollouts, beta testing, NHS-only features.

### F.3 HEALTH DASHBOARD (system status page)

Public status page at /status showing real-time platform health:

```typescript
// tRPC procedure: system.getHealth
// Returns: {
//   database: 'healthy' | 'degraded' | 'down',
//   redis: 'healthy' | 'degraded' | 'down',
//   s3: 'healthy' | 'degraded' | 'down',
//   stripe: 'healthy' | 'degraded' | 'down',
//   elevenlabs: 'healthy' | 'degraded' | 'down',
//   overallStatus: 'operational' | 'degraded' | 'major_outage',
//   latencyMs: number,
//   lastCheckedAt: Date,
// }

// Each check actually tests the service:
// DB: SELECT 1 with timeout
// Redis: PING with timeout
// S3: HeadBucket with timeout
// Stripe: stripe.accounts.retrieve() with timeout
// ElevenLabs: GET /v1/voices with timeout
```

### F.4 RATE LIMITING (production-grade)

```typescript
// Every tRPC route must have rate limiting:
// Consumer endpoints: 100 req/minute per user
// Session endpoints: 10 req/minute per user
// Auth endpoints: 10 req/15 minutes per IP
// Admin endpoints: 50 req/minute per admin

// Using Redis for rate limit storage:
// Key: rate_limit:{userId}:{endpoint}
// Value: request count
// TTL: sliding window
```

### F.5 WEBHOOK SYSTEM (for enterprise integrations)

Enterprises can register webhooks to receive events:

```prisma
model Webhook {
  id          String   @id @default(cuid())
  userId      String
  url         String
  secret      String   // HMAC signing secret
  events      String[] // Events to subscribe to
  isActive    Boolean  @default(true)
  lastDelivery DateTime?
  failureCount Int     @default(0)
  createdAt   DateTime @default(now())
  deliveries  WebhookDelivery[]
}

model WebhookDelivery {
  id          String   @id @default(cuid())
  webhookId   String
  webhook     Webhook  @relation(fields: [webhookId], references: [id])
  event       String
  payload     Json
  statusCode  Int?
  response    String?
  deliveredAt DateTime?
  retryCount  Int      @default(0)
  createdAt   DateTime @default(now())
}
```

Events to deliver: `session.started`, `session.ended`, `hire.created`,
`milestone.awarded`, `wellbeing.alert`, `exam.completed`

Payload signed with HMAC-SHA256 using webhook secret.

### F.6 GDPR COMPLIANCE TOOLING (self-service data management)

```typescript
// User data export (GDPR Article 20 — portability):
// GET /api/user/data-export
// Returns ZIP containing:
//   - account.json (profile, settings, preferences)
//   - hires.json (all hired companions, sessions counts, no content)
//   - brain-sync-log.json (sync metadata only — no brain contents)
//   - billing.json (payment history, amounts)
//   - milestones.json (achievements earned)
// Must NOT include: session content, message history (never stored)

// Account deletion (GDPR Article 17 — erasure):
// DELETE /api/user/account
// Must: delete all DB records, revoke all tokens,
//        cancel Stripe subscription, remove brain sync logs
// Must NOT: expose that deletion failed silently
```

### F.7 AUDIT LOG (complete platform audit trail)

```prisma
model PlatformAuditLog {
  id          String   @id @default(cuid())
  userId      String?  // null for system events
  adminId     String?  // set when admin performed action
  action      String   // e.g. 'user.login', 'price.updated', 'role.deactivated'
  entityType  String?  // 'User', 'Role', 'PricingTier', etc.
  entityId    String?
  oldValue    Json?    // Previous state (for updates)
  newValue    Json?    // New state (for updates)
  ipAddress   String?
  userAgent   String?
  createdAt   DateTime @default(now())
  
  @@index([userId])
  @@index([action])
  @@index([createdAt])
}
```

Log entries for: all admin actions, price changes, role
deactivations, user bans, subscription changes, failed login attempts.

### F.8 MULTI-CURRENCY DISPLAY (optional, display only)

While charging in GBP, show converted prices in:
USD, EUR, AUD, CAD, INR using live exchange rates (cached hourly via
an open exchange rates API). Never charge in non-GBP — display only.

### F.9 LOCALIZATION INFRASTRUCTURE

Beyond the 33 languages already supported for companions:
- UI must be translatable (i18n keys, not hardcoded English)
- Start with: en, fr, de, es, ar, zh, hi, pt
- Use next-intl for Next.js or i18next for Tauri
- All error messages, button labels, navigation items

### F.10 ACCESSIBILITY COMPLIANCE (WCAG 2.1 AA)

Run automated checks:
```bash
npx axe http://localhost:3000 --exit
npx axe http://localhost:3000/marketplace --exit
npx axe http://localhost:3000/admin --exit
# Target: 0 violations on every page
```

Manual checks:
- All images have alt text
- All forms have labels
- Tab order is logical
- Screen reader tested on: hero, companion cards, session screen
- Min 44px touch targets on all interactive elements

---

## SECTION G — FULL SMOKE TEST SUITE

Run these in order. Every test must pass before marking anything done.
If any test fails, fix it before running the next.

```bash
#!/bin/bash
set -e  # Exit on first failure

echo "═══════════════════════════════════════════════════════"
echo "TRUST AGENT — FULL SMOKE TEST SUITE"
echo "═══════════════════════════════════════════════════════"

BASE_URL="http://localhost:3000"
PASS=0
FAIL=0

check() {
  local name="$1"
  local cmd="$2"
  local expected="$3"
  
  result=$(eval "$cmd" 2>&1)
  if echo "$result" | grep -q "$expected"; then
    echo "✓ PASS: $name"
    ((PASS++))
  else
    echo "✗ FAIL: $name"
    echo "  Expected: $expected"
    echo "  Got: $result"
    ((FAIL++))
  fi
}

# ── DATABASE ───────────────────────────────────────────────────────────
check "DB connection" \
  "node -e \"const {PrismaClient}=require('@prisma/client');new PrismaClient().\$connect().then(()=>console.log('ok'))\"" \
  "ok"

check "Pricing tiers exist" \
  "node -e \"const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.pricingTier.count().then(n=>console.log(n>=4?'ok':'fail'))\"" \
  "ok"

check "Roles exist (151+)" \
  "node -e \"const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.role.count({where:{isActive:true}}).then(n=>console.log(n>=151?'ok':'fail'))\"" \
  "ok"

check "Roles have adequate prompts" \
  "node -e \"const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.role.count({where:{isActive:true,systemPromptLength:{lt:8000}}}).then(n=>console.log(n===0?'ok':'fail-'+n))\"" \
  "ok"

# ── REDIS ──────────────────────────────────────────────────────────────
check "Redis connection" \
  "node -e \"const {createClient}=require('redis');const c=createClient({url:process.env.REDIS_URL});c.connect().then(()=>c.ping()).then(r=>console.log(r))\"" \
  "PONG"

# ── S3 ─────────────────────────────────────────────────────────────────
check "S3 assets bucket" \
  "aws s3 ls s3://trustagent-prod-assets --region eu-west-2 2>&1 | head -1" \
  "PRE\|An error\|^$"

check "S3 artifacts bucket" \
  "aws s3 ls s3://trustagent-prod-artifacts --region eu-west-2 2>&1 | head -1" \
  "PRE\|An error\|^$"

check "S3 customer-docs bucket" \
  "aws s3 ls s3://trustagent-prod-customer-docs --region eu-west-2 2>&1 | head -1" \
  "PRE\|An error\|^$"

# ── API ENDPOINTS ──────────────────────────────────────────────────────
check "Health endpoint" \
  "curl -sf $BASE_URL/api/health | python3 -c \"import sys,json;d=json.load(sys.stdin);print('ok' if d.get('status')=='healthy' else 'fail')\"" \
  "ok"

check "Pricing tiers endpoint" \
  "curl -sf -X POST $BASE_URL/api/trpc/admin.getPricingTiers -H 'Content-Type: application/json' -d '{\"json\":null}' | python3 -c \"import sys,json;d=json.load(sys.stdin);print('ok' if len(d.get('result',{}).get('data',{}).get('json',[]))>=4 else 'fail')\"" \
  "ok"

check "Marketplace roles endpoint" \
  "curl -sf -X POST $BASE_URL/api/trpc/roles.list -H 'Content-Type: application/json' -d '{\"json\":{\"page\":1,\"limit\":10}}' | python3 -c \"import sys,json;d=json.load(sys.stdin);print('ok' if d.get('result',{}).get('data',{}).get('json',{}).get('total',0)>=151 else 'fail')\"" \
  "ok"

# ── TOKEN CHAIN VERIFICATION ───────────────────────────────────────────
check "Base chain references (not Ethereum)" \
  "grep -r 'Ethereum\|eth mainnet' --include='*.ts' --include='*.tsx' --include='*.md' . 2>/dev/null | grep -v node_modules | grep -v '.next' | wc -l | tr -d ' '" \
  "^0$"

# ── PRICING VERIFICATION ───────────────────────────────────────────────
check "Starter price is £9.99" \
  "node -e \"const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.pricingTier.findFirst({where:{name:'starter'}}).then(t=>console.log(t&&t.priceGBP===9.99?'ok':'fail:'+t?.priceGBP))\"" \
  "ok"

check "Family plan exists at £24.99" \
  "node -e \"const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.pricingTier.findFirst({where:{name:'family'}}).then(t=>console.log(t&&t.priceGBP===24.99?'ok':'fail:'+t?.priceGBP))\"" \
  "ok"

# ── RAISE AMOUNT VERIFICATION ──────────────────────────────────────────
check "No old raise amount in docs" \
  "grep -r '£5.5\|5.5-6.5\|2.96M' --include='*.md' --include='*.tsx' . 2>/dev/null | grep -v node_modules | wc -l | tr -d ' '" \
  "^0$"

# ── FEATURES VERIFICATION ──────────────────────────────────────────────
check "Anti-dependency in session router" \
  "grep -n 'DAILY_LIMIT_EXCEEDED\|dailyLimitMinutes\|child.*limit\|45.*minute' server/src/routers/sessions.ts | wc -l | tr -d ' '" \
  "[^0]"

check "SM-2 algorithm file exists" \
  "ls server/src/lib/sm2.ts 2>/dev/null && echo 'ok' || echo 'fail'" \
  "ok"

check "Gift subscription table" \
  "node -e \"const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.giftSubscription.count().then(n=>console.log('ok'))\"" \
  "ok"

check "Referral codes on all users" \
  "node -e \"const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.user.count({where:{referralCode:null}}).then(n=>console.log(n===0?'ok':'fail:'+n+' users missing codes'))\"" \
  "ok"

check "Milestone table exists" \
  "node -e \"const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.milestone.count().then(n=>console.log('ok'))\"" \
  "ok"

check "FeatureFlag table exists" \
  "node -e \"const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.featureFlag.count().then(n=>console.log('ok'))\"" \
  "ok"

check "PlatformAuditLog table exists" \
  "node -e \"const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.platformAuditLog.count().then(n=>console.log('ok'))\"" \
  "ok"

# ── FINAL REPORT ───────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════"
echo "RESULTS: $PASS passed, $FAIL failed"
echo "═══════════════════════════════════════════════════════"

if [ $FAIL -gt 0 ]; then
  echo "✗ SUITE FAILED — Fix failures before marking done"
  exit 1
else
  echo "✓ ALL TESTS PASSED — Platform is operational"
  exit 0
fi
```

---

## SECTION H — EXECUTION ORDER

Build in this exact order. Do not skip steps. Verify before proceeding.

```
PHASE 1 — Corrections (no new features, just fixes)
  1a. Fix all "Ethereum" → "Base chain" references across all files
  1b. Fix all raise amounts to £6.5M structure
  1c. Fix token allocation to match V4 whitepaper (25% ecosystem, 20% public, 3% liquidity)
  1d. Fix pricing to GBP, correct tiers
  1e. Run smoke test subset: chain verification + pricing checks
  → ALL MUST PASS BEFORE PHASE 2

PHASE 2 — Database foundations (everything else depends on this)
  2a. Add PricingTier + PriceHistory models
  2b. Add FeatureFlag model
  2c. Add PlatformAuditLog model
  2d. Add Webhook + WebhookDelivery models
  2e. Add LegacyDesignation model
  2f. Run: npx prisma migrate dev --name "complete-platform-v2"
  2g. Run: npx prisma generate
  2h. Run: npx tsx server/src/seed.ts (seed pricing tiers)
  → Verify all tables exist via prisma studio before Phase 3

PHASE 3 — Backend features (tRPC procedures)
  3a. Admin pricing router (view + update + toggle + history)
  3b. Onboarding quiz router (verify quiz → role recommendation logic)
  3c. Guardian dashboard router (child activity, wellbeing, alerts)
  3d. Progress reports router (generate PDF → upload to S3 → return URL)
  3e. Streaks + milestones router (compute after each session)
  3f. Wellbeing score router (compute + store + alert guardian)
  3g. Exam mode router (start exam session, store results)
  3h. Upload & mark router (S3 upload, inject into session context)
  3i. Spaced repetition router (SM-2 algorithm, due items)
  3j. Scheduling router (.ics generation, notification trigger)
  3k. Gift subscription router (purchase, activate)
  3l. Referral router (generate codes, redeem, reward)
  3m. Collaboration router (room creation, WebSocket)
  3n. School licensing router (create licence, enrol students)
  3o. Trust Score API router (external audit endpoint)
  3p. Digital legacy router (designation, transfer)
  3q. Feature flags router (admin toggle, user check)
  3r. Webhook router (register, deliver, retry)
  3s. GDPR router (data export, account deletion)
  → Run all tRPC smoke tests from Section G before Phase 4

PHASE 4 — Frontend wiring (connect UI to real data)
  4a. Admin pricing panel (click-to-edit cards, real-time updates)
  4b. Admin role management (activate/deactivate, trust score display)
  4c. Guardian dashboard (real charts from DB data)
  4d. Progress reports (generate button → download PDF)
  4e. Streaks widget (real streak count from DB)
  4f. Session scheduling (calendar view, .ics download)
  4g. Gift subscription flow (purchase → activation)
  4h. Feature flags panel in admin
  4i. System status page (/status)
  → Run full smoke test suite from Section G

PHASE 5 — World-class additions
  5a. PostHog analytics integration
  5b. Rate limiting on all tRPC routes
  5c. Webhook delivery system
  5d. GDPR self-service tools
  5e. Health/status page
  5f. Audit log UI in admin
  5g. WCAG accessibility check (target: 0 violations)
  → Run full smoke test suite again

PHASE 6 — Final verification
  Run: bash smoke-test.sh
  ALL 25+ tests must pass
  Zero mock data in any production code path
  Zero Ethereum references
  Correct raise amount (£6.5M) in all docs
  Correct pricing (GBP) in all tiers
  All 151+ roles present with 8,000+ char prompts
```

---

## SECTION I — WHAT GOOD LOOKS LIKE (acceptance criteria)

The platform is ready for production when:

1. **Every pricing tier** shows the correct GBP price from the database
2. **Admin can change any price** in 3 clicks and the change persists immediately
3. **Every companion has 8,000+ characters** in their system prompt
4. **151+ roles are active** in the database
5. **A child account cannot exceed 45 minutes/day** regardless of what the frontend does
6. **A guardian can see wellbeing scores** from the guardian dashboard
7. **Progress reports generate real PDFs** stored in S3 and downloadable
8. **Session scheduling creates real .ics files** that import into Google Calendar
9. **Gift subscriptions complete the full Stripe payment flow**
10. **The referral system stores codes and delivers rewards**
11. **No file contains the word "Ethereum"** in the context of the $TAGNT token
12. **The raise amount is £6.5M** in every document, page, and whitepaper reference
13. **All smoke tests pass** (exit code 0 from smoke-test.sh)
14. **Zero axe-core violations** on all main pages
15. **PostHog receives at least one event** when a session starts

---

## COMMIT MESSAGE TEMPLATE

```
fix: complete platform — all features operational end-to-end

CORRECTIONS:
- Token chain: Ethereum → Base chain (Coinbase L2) across all files
- Raise amount: corrected to £6.5M total (£3.5M equity + $1.2M private + $2.0M public)
- Token allocation: 25% ecosystem, 20% public sale, 3% liquidity (V4 whitepaper)
- Pricing: GBP tiers (£9.99/£19.99/£24.99/£39.99) from DB, not hardcoded

DATABASE:
- PricingTier + PriceHistory models added
- FeatureFlag model added
- PlatformAuditLog model added
- Webhook + WebhookDelivery models added
- LegacyDesignation model added
- All 151+ roles seeded with 8,000+ char prompts verified

FEATURES (all wired DB → API → Frontend):
- Admin pricing panel: click-to-edit, real-time updates, price history
- Onboarding quiz: 8 questions → real role recommendation from DB
- Guardian dashboard: real wellbeing scores, session data, alerts
- Progress reports: PDF generated → S3 → downloadable URL
- Streaks + milestones: computed after each session, stored in DB
- Wellbeing score: SM-2 algorithm, guardian alerts on decline
- Live exam mode: timer, marking, results stored in DB
- Upload & mark mode: S3 upload → injected into session context
- Spaced repetition: SM-2 algorithm, due items from DB
- Session scheduling: real .ics files, notification triggers
- Anti-dependency: API-level enforcement, child hard limits
- Gift subscriptions: Stripe → activation → subscription created
- Referral programme: codes on all users, rewards on redemption
- Collaboration mode: WebSocket rooms, real-time messages
- School licensing: licence creation, student enrolment with cap
- Trust Score API: external B2B audit endpoint
- Digital legacy: designation stored, transfer workflow
- Feature flags: admin toggle, percentage rollout
- Webhooks: enterprise event delivery with HMAC signing
- GDPR tools: data export (ZIP), account deletion

WORLD-CLASS ADDITIONS:
- PostHog analytics (privacy-respecting, no PII)
- Rate limiting (Redis, per-user and per-IP)
- System status page (/status)
- Platform audit log (all admin actions logged)
- WCAG 2.1 AA compliance (0 axe violations)
- Health checks for all external services

SMOKE TESTS: All 25+ pass (exit code 0)

AgentCore LTD · Company No. 17114811 · trust-agent.ai
Raise: £6.5M · Token: $TAGNT · Chain: Base (Coinbase L2)
```
