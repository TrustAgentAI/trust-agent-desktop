# TRUST AGENT — FRONTEND SELF-AUDIT & BUILD
# Drop at repo root · Run: claude
# Branch: Unified/frontend-complete
# ════════════════════════════════════════════════════════════════════════════
#
# OPERATOR:  AgentCore LTD · Company No. 17114811 · trust-agent.ai
# MISSION:   "Everyone deserves an expert who knows them."
#
# ════════════════════════════════════════════════════════════════════════════
# YOUR FIRST JOB — READ EVERYTHING BEFORE WRITING A LINE OF CODE
# ════════════════════════════════════════════════════════════════════════════
#
# You are rebuilding the complete frontend of trust-agent.ai from the
# inside out. Before you write a single component, you must understand
# exactly what exists and what does not.
#
# This is a billion-pound product. Every screen must be world-class.
# Every user journey must be complete. Nothing can be missing.
#
# ════════════════════════════════════════════════════════════════════════════
# STEP 1 — AUDIT YOUR OWN CODEBASE (run every command, read every output)
# ════════════════════════════════════════════════════════════════════════════

Run the following audit commands in sequence. Read every line of output.
Do not skip any command. Do not proceed to building until all audits complete.

## 1A — MAP THE COMPLETE ROUTE STRUCTURE

```bash
echo "=== ALL EXISTING PAGES/ROUTES ==="
find src/app src/pages -name "page.tsx" -o -name "index.tsx" \
  2>/dev/null | sort

echo "=== ALL EXISTING COMPONENTS ==="
find src/components -name "*.tsx" 2>/dev/null | sort

echo "=== ALL EXISTING LAYOUTS ==="
find src/app -name "layout.tsx" 2>/dev/null | sort
```

Read every file path. Note every route that exists. Note every route that
is referenced in links, buttons, or redirects but has no page.tsx yet.

## 1B — MAP THE COMPLETE tRPC API SURFACE

```bash
echo "=== ALL tRPC ROUTERS ==="
find server/src/routers -name "*.ts" 2>/dev/null | sort

echo "=== ALL tRPC PROCEDURES (every endpoint available) ==="
grep -rn "\.query\|\.mutation\|\.subscription" \
  server/src/routers/ --include="*.ts" | \
  grep -v "//\|import\|type" | \
  awk -F: '{print $1, $2}' | head -200

echo "=== appRouter — every registered router ==="
cat server/src/router.ts 2>/dev/null || cat server/src/routers/index.ts 2>/dev/null
```

Read every procedure. This is every API call available to the frontend.
Any procedure not called by a frontend component is a gap.

## 1C — FIND EVERY FRONTEND-TO-BACKEND GAP

```bash
echo "=== tRPC CALLS ACTUALLY MADE FROM FRONTEND ==="
grep -rn "trpc\.\|api\.\|useQuery\|useMutation\|trpcClient" \
  src/ --include="*.tsx" --include="*.ts" | \
  grep -v "//\|import\|type\|interface\|node_modules" | \
  grep -v "\.d\.ts" | sort | uniq

echo "=== COMPONENTS USING HARDCODED/FAKE DATA (not from API) ==="
grep -rn "useState(\[\])\|useState({})\|const.*= \[\]" \
  src/components/ --include="*.tsx" | \
  grep -v "//\|import\|test\|spec"

echo "=== HARDCODED COLOURS (should be CSS variables) ==="
grep -rn "color:\s*['\"]#\|background:\s*['\"]#\|backgroundColor:\s*['\"]#" \
  src/ --include="*.tsx" | \
  grep -v "//\|tokens\|categoryColour\|catColour\|const "
```

## 1D — AUDIT EVERY EXISTING PAGE FOR COMPLETENESS

For each page file found in 1A, run:

```bash
echo "=== PAGE COMPLETENESS AUDIT ==="
for page in $(find src/app src/pages -name "page.tsx" 2>/dev/null); do
  echo "--- $page ---"
  # Does it fetch real data?
  grep -c "trpc\.\|useQuery\|useMutation\|fetch\|getServerSideProps\|loader" "$page" || echo "  NO API CALLS"
  # Does it have loading state?
  grep -c "isLoading\|Skeleton\|loading\|isPending" "$page" || echo "  NO LOADING STATE"
  # Does it have error state?
  grep -c "isError\|error\|Error\|catch" "$page" || echo "  NO ERROR STATE"
  # Does it have empty state?
  grep -c "Empty\|empty\|length === 0\|!data\|no.*results" "$page" || echo "  NO EMPTY STATE"
done
```

## 1E — AUDIT THE DESIGN SYSTEM

```bash
echo "=== CURRENT DESIGN TOKENS ==="
cat src/styles/tokens.css 2>/dev/null || \
cat src/styles/globals.css 2>/dev/null || \
cat src/index.css 2>/dev/null

echo "=== FONTS CURRENTLY LOADED ==="
grep -rn "font\|@import\|next/font" \
  src/app/layout.tsx src/pages/_app.tsx 2>/dev/null | head -20

echo "=== TAILWIND CONFIG ==="
cat tailwind.config.js 2>/dev/null || cat tailwind.config.ts 2>/dev/null

echo "=== COMPONENT LIBRARY IN USE ==="
grep -rn "from '@radix\|from 'shadcn\|from '@headlessui\|from 'lucide" \
  src/ --include="*.tsx" | head -20
```

## 1F — AUDIT THE NAVIGATION AND LINKING

```bash
echo "=== ALL INTERNAL LINKS (what routes are expected to exist) ==="
grep -rn "href=\|to=\|router.push\|navigate(" \
  src/ --include="*.tsx" | \
  grep -v "//\|import\|http\|#\|mailto" | \
  grep -oP "(?<=href=['\"])[^'\"]*(?=['\"])" | \
  sort | uniq

echo "=== ALL MISSING PAGES (linked but no page.tsx) ==="
# Compare linked hrefs against actual page files
```

## 1G — AUDIT AUTH AND SESSION STATE

```bash
echo "=== HOW AUTH STATE IS MANAGED ==="
grep -rn "useAuth\|useSession\|getSession\|currentUser\|isAuthenticated" \
  src/ --include="*.tsx" --include="*.ts" | \
  grep -v "//\|import\|type" | head -30

echo "=== PROTECTED ROUTES (what requires auth) ==="
grep -rn "redirect\|Redirect\|requireAuth\|ProtectedRoute\|middleware" \
  src/ --include="*.tsx" --include="*.ts" | \
  grep -v "//\|import" | head -20

echo "=== MIDDLEWARE ==="
cat src/middleware.ts 2>/dev/null || cat middleware.ts 2>/dev/null
```

## 1H — AUDIT WHAT'S ACTUALLY WIRED VS WHAT'S FAKED

```bash
echo "=== EVERY PLACE REAL tRPC DATA IS USED ==="
grep -rn "\.data\.\|\.data?\." src/components/ --include="*.tsx" | \
  grep -v "//\|import\|localStorage\|sessionStorage" | head -50

echo "=== EVERY PLACE LOCALSTORAGE IS USED (should be API) ==="
grep -rn "localStorage\|sessionStorage" \
  src/ --include="*.tsx" --include="*.ts" | \
  grep -v "//\|import\|ThemeProvider\|accessibility\|dismiss"

echo "=== MOCK/FAKE DATA IN COMPONENTS ==="
grep -rn "MOCK_\|mock\|fake\|placeholder\|TODO.*backend\|hardcoded" \
  src/ --include="*.tsx" | grep -v "//\|import\|test\|spec"
```

## 1I — AUDIT THE DATABASE SCHEMA (what models exist)

```bash
echo "=== ALL PRISMA MODELS ==="
grep "^model " prisma/schema.prisma | sort

echo "=== MODELS WITH NO API LAYER ==="
# Find models defined in schema but not referenced in any router
for model in $(grep "^model " prisma/schema.prisma | awk '{print $2}'); do
  count=$(grep -rn "$model" server/src/routers/ --include="*.ts" | wc -l)
  [ "$count" -eq 0 ] && echo "  NO ROUTER: $model"
done

echo "=== MODELS WITH API BUT NO FRONTEND ==="
for model in $(grep "^model " prisma/schema.prisma | awk '{print $2}'); do
  router_count=$(grep -rn "$model" server/src/routers/ --include="*.ts" | wc -l)
  frontend_count=$(grep -rn "$model" src/ --include="*.tsx" | wc -l)
  [ "$router_count" -gt 0 ] && [ "$frontend_count" -eq 0 ] && \
    echo "  BACKEND_ONLY: $model"
done
```

## 1J — CHECK WHAT'S MISSING FROM THE WHITEPAPER SPEC

Read this list. Cross-reference against what you found above.
Note every item that has no corresponding frontend page or component:

CONSUMER FEATURES THAT MUST HAVE FRONTEND:
- [ ] Homepage with quote-first hero (Alicia's story first)
- [ ] Marketplace: 179+ roles, search, filter, category navigation
- [ ] Role detail: trust score, 47 checks expandable, expert review, reviews
- [ ] Onboarding quiz: 8 questions → personalised first message (Aha Moment)
- [ ] Session screen: memory-first opening, env tints, ambient audio, thinking dots
- [ ] Dashboard: companion cards, Brain preview, streaks, notifications
- [ ] Brain journal: dated entries in companion voice, editable
- [ ] Guardian dashboard: child activity, daily limits, alerts
- [ ] Spaced repetition: review flow with SM-2 cards
- [ ] Scheduling: weekly grid, .ics export
- [ ] Progress reports: PDF generation
- [ ] Study groups: create, join, shared sessions
- [ ] Notifications: centre, push subscription
- [ ] Stripe billing: checkout, subscription management, cancellation (no dark patterns)
- [ ] Gift subscriptions: purchase and activate
- [ ] Referral programme: code display, tracking
- [ ] Progress sharing: public shareable link page
- [ ] NHS pathway page: patient activation, GP portal
- [ ] Schools page: institutional enquiry, safeguarding section
- [ ] Creator programme: Margaret's story, earnings calculator, apply form
- [ ] Hardware pages: TrustBox Pro, TrustStick, TrustEdge
- [ ] Impact/mission metrics: lives changed, real-time stats
- [ ] Settings: profile, voice/audio, accessibility, notifications, privacy
- [ ] Admin panel: users, roles, pricing, system health, follow-up queue
- [ ] Error states: human messages (not raw codes)
- [ ] Empty states: ghost cards (not blank screens)
- [ ] Google OAuth: currently MISSING
- [ ] i18n: 26 of 33 language files missing

B2B FEATURES THAT MUST HAVE FRONTEND:
- [ ] B2B role catalogue with Company Brain setup
- [ ] API key management page
- [ ] Enterprise admin dashboard

---

# ════════════════════════════════════════════════════════════════════════════
# STEP 2 — PRODUCE YOUR OWN COMPLETE GAP REPORT
# ════════════════════════════════════════════════════════════════════════════

After running all audit commands above, produce a gap report in this format:

```
FRONTEND GAP REPORT
Generated: [timestamp]

ROUTES THAT EXIST:
  [list every /path → src/app/.../page.tsx]

ROUTES MISSING (linked or required but no page):
  [list every /path that needs building]

tRPC PROCEDURES WITH NO FRONTEND:
  [list every router.procedure that no component calls]

COMPONENTS WITH FAKE/HARDCODED DATA:
  [list every component using useState([]) or localStorage instead of API]

DESIGN SYSTEM GAPS:
  [list missing CSS tokens, wrong fonts, hardcoded colours count]

SUMMARY:
  Routes missing:          [N]
  tRPC gaps:               [N]
  Fake data components:    [N]
  Hardcoded colours:       [N]
  Missing i18n files:      [N]
  TOTAL work items:        [N]
```

Do not proceed to Step 3 until this gap report is complete and accurate.

---

# ════════════════════════════════════════════════════════════════════════════
# STEP 3 — THE LAWS (apply to every component you write)
# ════════════════════════════════════════════════════════════════════════════

DESIGN SYSTEM — use these everywhere, no exceptions:
```
Fonts:      Instrument Serif (headings, quotes) + DM Sans (body, UI)
            Load via next/font/google — not @import
Page bg:    var(--bg-page)       = #FAFAF8
Surface:    var(--bg-surface)    = #F4F3EF
Elevated:   var(--bg-elevated)   = #FFFFFF
Primary:    var(--primary-600)   = #1A5276  (buttons, links, active states)
Accent:     var(--accent-600)    = #1D7A35  (Platinum badge, success)
Text:       var(--text-primary)  = #1A1A18
Radius:     var(--radius-card)   = 20px
            var(--radius-md)     = 12px
            var(--radius-pill)   = 40px
Shadow:     var(--shadow-card)   = 0 8px 28px rgba(12,24,16,0.09)

Category colours (for accent bars, dots, session backgrounds):
  education:  #1A5C4A  (session bg: #F5F9F7)
  health:     #3D7A5E  (session bg: #F2F9F5)
  children:   #9E7209  (session bg: #FEFBF0)
  language:   #5B4A8A  (session bg: #F5F3FC)
  business:   #2E4057  (session bg: #F2F5F9)
  career:     #8B2635  (session bg: #FDF4F5)
  elderly:    #B86E20  (session bg: #FEF8F2)
  navigation: #1A6B7A  (session bg: #EEF8FA)
```

EVERY COMPONENT MUST HAVE:
1. Real data from tRPC (not useState([]) or hardcoded arrays)
2. Loading state: skeleton shimmer (not spinner)
3. Error state: human message from `system.getErrorMessage` (not raw error)
4. Empty state: ghost cards or vision (not blank screen)
5. WCAG 2.1 AA: focus rings, aria labels, min 44px touch targets
6. Mobile responsive: works at 320px minimum
7. TypeScript: no `any`, all props typed

NEVER WRITE:
- useState([]) — empty array that stays empty
- Hardcoded colour hex values in style props
- "Coming soon" text
- onClick={() => alert(...)
- console.log in production code
- any TypeScript type

COMPANION CARD — 4 elements only (EXACTLY this structure):
```tsx
<article className="companion-card">
  {/* 1. Portrait — category-tinted warm background */}
  <div style={{ background: catBg, height: 120, position: 'relative' }}>
    <span style={{ fontSize: 30 }}>{emoji}</span>
    <BadgePill tier={badge} />      {/* top-right absolute */}
    <OnlineDot />                    {/* bottom-right absolute */}
  </div>
  {/* 2. Name */}
  <h3>{companionName}</h3>
  {/* 3. One line */}
  <p>{shortTitle}</p>
  {/* 4. Trust score bar */}
  <TrustScoreBar score={trustScore} colour={catColour} />
  {/* Hire CTA — ALWAYS VISIBLE, never hover-only */}
  <footer>
    <span>From £9.99/mo</span>
    <span>Hire {firstName} →</span>
  </footer>
</article>
```

HERO RULE — FIRST ELEMENT IS ALWAYS A QUOTE:
```tsx
export function Hero({ openingStory }) {
  return (
    <section>
      {/* THIS MUST BE FIRST — the quote, not the headline */}
      <blockquote>
        <p>"{openingStory.quote}"</p>
        <footer>— {openingStory.firstName}, {openingStory.city}</footer>
      </blockquote>

      {/* SECOND — the mission headline */}
      <h1>The expert you always <em>wished you could afford.</em></h1>

      {/* THIRD — one sentence about the product */}
      {/* FOURTH — single CTA */}
    </section>
  );
}
```

SESSION SCREEN RULE — FIRST MESSAGE PROVES MEMORY:
```tsx
// Load Brain summary BEFORE rendering first message
const brainSummary = await trpc.brain.getBrainSummary.query({ hireId });

// For returning users (sessionCount > 0):
// NEVER show "How can I help you today?"
// ALWAYS show something that references what the companion knows
// e.g. "Last time you hesitated on factorising. Your exam is in 23 days."
// The firstMessage comes from brain.getBrainSummary.lastNote or
// from onboarding.getFirstMessage if first session
```

PRICING FRAMING — comparison is the sale:
```tsx
// Each pricing tier MUST have a COMPARISON BOX
// The comparison box is more prominent than the price
const TIER_COMPARISONS = {
  starter:      "Less than one tutoring session.",      // £65/hr vs £9.99/mo
  essential:    "Less than two coffees a week.",
  family:       "Less than one family therapy session.", // £80/hr vs £24.99/mo
  professional: "Less than two hours of a consultant.",  // £250/hr vs £39.99/mo
};
```

BRAIN VIEWER RULE — journal not settings panel:
```tsx
// Journal entries MUST:
// - Show date as relative ("3 days ago") absolute on hover
// - Show companion voice text in Instrument Serif italics
// - Show category left border (coloured dot + left border)
// - Be editable inline (calls brain.editMemoryNote)
// - Show user's own additions in non-italic style
// This is a relationship journal — not a data dashboard
```

CANCELLATION RULE — zero dark patterns:
```tsx
// Cancellation modal MUST NOT:
// - Have a "are you sure?" guilt screen
// - Have countdown timers
// - Use phrases like "you'll lose everything"
// - Have asymmetric button sizes

// Cancellation modal MUST:
// - Ask what could have been better (neutral options)
// - Confirm Brain is preserved forever
// - Have equal-weight confirm/cancel buttons
// - Call payments.cancelSubscription({ reason, freeText })
```

---

# ════════════════════════════════════════════════════════════════════════════
# STEP 4 — BUILD IN THIS EXACT ORDER
# ════════════════════════════════════════════════════════════════════════════

Build phases in sequence. Do not skip ahead. Verify each phase before
moving to the next by running: npx tsc --noEmit (must stay 0 errors).

## PHASE 1: Design tokens + global layout foundation
- Apply/create tokens.css with all Warm Stone variables
- Load Instrument Serif + DM Sans via next/font/google
- Build Nav.tsx: logo, links, auth state, notification bell, mobile menu
- Build Footer.tsx: 4-column, mission statement, trust signals
- Build AnnouncementBar.tsx: dismissible NHS strip
- Build DashboardSidebar.tsx: full navigation tree
- Build Toast.tsx: global human error messages
- Verify: npx tsc --noEmit = 0 errors

## PHASE 2: Homepage (app/page.tsx)
- All data fetched server-side from real tRPC/DB helpers
- Section order: Hero → LivesChangedStrip → TrustStrip → SocialProofBanner
  → CategoryGrid → FeaturedRoles → SessionPreview → NHSSection →
  FeaturesGrid → BrainSection → TrustScoreSection → CreatorSection →
  HardwareSection → PricingSection → TestimonialsSection → CTASection
- Hero: blockquote FIRST (from stories.getFeatured), then h1
- CompanionCards: 4 elements only
- PricingSection: comparison boxes, not subscription cost framing
- TestimonialsSection: from stories.getFeatured DB (not hardcoded)
- Verify: homepage loads, real data, no hardcoded colours

## PHASE 3: Marketplace
- /companions: category sidebar, search, role grid (roles.listPublished)
- /companions/[slug]: full detail, 47 checks expandable (audit.getAuditDetail),
  expert review by name, community reviews (reviews.getReviews)
- Hire flow: HireFlow.tsx → hires.hire → onboarding entry
- Verify: roles display, filter works, detail page has 47 checks

## PHASE 4: Onboarding
- /onboarding: 8-question quiz → onboarding.submitQuiz
- Recommendation screen: firstMessage shown (the Aha Moment)
- Cloud drive setup: connect before first session (mandatory gate)
- Track every step: onboarding.trackOnboardingCheckpoint
- Verify: quiz submits, firstMessage references quiz answers

## PHASE 5: Session screen
- /dashboard/hire/[hireId]/session
- Load Brain summary before rendering: brain.getBrainSummary
- First message for returning users references memory
- Background tint from sessions.getSessionConfig
- Category-coloured thinking dots (not grey)
- Ambient audio from S3 presigned URL (sessions.getSessionConfig)
- Anti-dependency timer: 85min warning, 90min end
- Voice mode recommendation for elderly/daily/language
- End session: sessions.endSession with metadata
- Verify: first message NOT "how can I help", background tinted

## PHASE 6: Dashboard (/dashboard/*)
- /dashboard: companion cards (hires.listMyHires), ghost cards if empty
- /dashboard/brain: journal viewer (brain.getMemoryNotes), editable
- /dashboard/reports: PDF generation (reports.generateProgressReport)
- /dashboard/schedule: weekly grid (scheduling.getMySchedules)
- /dashboard/review: SM-2 cards (spaced-repetition.getDueItems)
- /dashboard/groups: study groups (studyGroups.getMyGroups)
- /dashboard/notifications: notification centre (notifications.getNotifications)
- /dashboard/guardian: child activity (guardian.getChildActivity)
- Verify: all pages load real data, no fake arrays

## PHASE 7: Payments and billing
- /settings/billing: Stripe subscription (payments.getSubscription)
- /checkout/[plan]: create checkout (payments.createCheckout)
- /checkout/success: success page
- Cancellation modal: no dark patterns, stores feedback
  (payments.cancelSubscription)
- /gift: gift purchase (gifts.purchaseGift)
- /gift/activate/[code]: activate gift (gifts.activateGift)
- /dashboard/referrals: referral code (referrals.getMyReferralCode)
- Verify: billing page loads, checkout redirects to Stripe

## PHASE 8: Progress sharing + public routes
- /progress/[shareToken]: public page (progressSharing.viewShare)
  No auth required. Shows Brain summary — never session content.
- /dashboard/shares: manage shares (progressSharing.getMyShares)
- Verify: public token page works without auth

## PHASE 9: Marketing pages
- /nhs: patient activation form, GP portal, compliance section
  (nhs.verifyPracticePartner, nhs.getNHSPartnerStats)
- /schools: safeguarding section, institutional enquiry form
- /creator: Margaret's story, earnings calculator, apply form
  (creator.applyToBeCreator, creator.getCreatorStories)
- /hardware: overview + TrustBox Pro + TrustStick + TrustEdge pages
- /impact: live metrics (impact.liveMetrics), stories (stories.getFeatured),
  submit story (stories.submitStory)
- Verify: all pages return 200, forms submit

## PHASE 10: Admin panel (/admin/*)
- /admin: overview with key stats
- /admin/users: user list (admin.listUsers)
- /admin/roles: role management (admin.listRoles, admin.updateRole)
- /admin/pricing: tier management (admin.getPricingTiers, admin.updatePricingTier)
- /admin/system: health dashboard (admin.systemHealth)
- /admin/followup: follow-up queue — CREATE tRPC router if missing:
  admin.getFollowUpQueue, admin.resolveFollowUp
- /admin/safeguarding: events (safeguarding.listEvents)
- /admin/reaudit: triggers (admin.listReAuditTriggers) — already wired
- /admin/nhs: partner management (nhs.addPartnerPractice)
- /admin/creator: creator applications
- /admin/impact: onboarding funnel (admin.getOnboardingFunnel)
- /admin/flags: feature flags
- Verify: admin pages require admin role, all procedures called

## PHASE 11: Settings
- /settings/profile: auth.updateProfile
- /settings/billing: (already Phase 7)
- /settings/voice: CompanionPersonalityConfig — create tRPC if missing
- /settings/accessibility: surface AccessibilityPanel as page
- /settings/notifications: push subscription (notifications.registerPushSubscription)
- /settings/privacy: data architecture info, account deletion
- Verify: all settings save, accessibility panel works

## PHASE 12: Auth
- /auth/signin: email + Google OAuth (MISSING — must implement)
- /auth/signup: email + Google OAuth
- Wire NextAuth with Google provider
- Redirect new users to /onboarding
- Verify: sign in works, Google OAuth button present

## PHASE 13: Empty states, loading states, error states
- Every page has skeleton loader (shimmer, not spinner)
- Every page has error state (human message from system.getErrorMessage)
- Every empty list has a ghost/vision state (not blank)
- Dashboard with 0 hires shows 3 ghost companion cards
- Verify: loading states visible, no blank screens on error

## PHASE 14: i18n completion
- Check which of 33 target locales have translation files
- Create missing translation JSON files
- Ensure RTL works for ar, he, fa, ur
- Verify: language switcher works, Arabic renders RTL

---

# ════════════════════════════════════════════════════════════════════════════
# STEP 5 — SELF-VERIFY AFTER EVERY PHASE
# ════════════════════════════════════════════════════════════════════════════

After completing each phase, run:

```bash
# TypeScript must stay clean
npx tsc --noEmit 2>&1 | grep "error TS" | wc -l
# Expected: 0

# No new hardcoded colours
grep -rn "color:\s*['\"]#\|background:\s*['\"]#" \
  src/components/ --include="*.tsx" | \
  grep -v "//\|tokens\|categoryColour" | wc -l
# Expected: < 5 (allow for SVG fills and gradients)

# No empty array useState
grep -rn "useState(\[\])" src/ --include="*.tsx" | \
  grep -v "//\|test" | wc -l
# Expected: 0

# Build still works
npm run build 2>&1 | tail -3
# Expected: "Compiled successfully" or equivalent
```

---

# ════════════════════════════════════════════════════════════════════════════
# STEP 6 — FINAL SMOKE TEST (run after all 14 phases complete)
# ════════════════════════════════════════════════════════════════════════════

```bash
#!/bin/bash
# Run: bash scripts/frontend-smoke-test.sh
# Must exit 0 before any deployment

PASS=0; FAIL=0
BASE="${APP_URL:-http://localhost:3000}"
p() { echo "✓ $1"; ((PASS++)); }
f() { echo "✗ FAIL: $1"; ((FAIL++)); }

echo "═══════════════════════════════════════════════"
echo "TRUST AGENT — FRONTEND PRODUCTION READINESS"
echo "═══════════════════════════════════════════════"

# TypeScript
TS=$(npx tsc --noEmit 2>&1 | grep -c "error TS" || true)
[ "$TS" -eq 0 ] && p "TypeScript: 0 errors" || f "TypeScript: $TS errors"

# Build
npm run build 2>&1 | grep -qE "Compiled successfully|Route \(app\)" && \
  p "Production build: success" || f "Production build: FAILED"

# Every required page returns 200
PAGES=(
  "/"
  "/companions"
  "/onboarding"
  "/dashboard"
  "/dashboard/brain"
  "/dashboard/reports"
  "/dashboard/schedule"
  "/dashboard/groups"
  "/dashboard/notifications"
  "/dashboard/review"
  "/dashboard/guardian"
  "/nhs"
  "/schools"
  "/creator"
  "/hardware"
  "/hardware/trustbox"
  "/hardware/truststick"
  "/hardware/trustedge"
  "/pricing"
  "/impact"
  "/gift"
  "/settings"
  "/settings/billing"
  "/settings/voice"
  "/settings/notifications"
  "/settings/privacy"
  "/auth/signin"
  "/auth/signup"
  "/admin"
  "/admin/users"
  "/admin/roles"
  "/admin/pricing"
  "/admin/system"
  "/admin/safeguarding"
  "/admin/followup"
  "/admin/impact"
)
for page in "${PAGES[@]}"; do
  HTTP=$(curl -sf -o /dev/null -w "%{http_code}" \
    "$BASE$page" --max-time 5 2>/dev/null)
  case "$HTTP" in
    200|302|307) p "Page: $page" ;;
    404) f "Page: $page — 404 NOT FOUND (page missing)" ;;
    500) f "Page: $page — 500 SERVER ERROR" ;;
    *) f "Page: $page — HTTP $HTTP" ;;
  esac
done

# Every BACKEND_ONLY tRPC procedure now has a frontend call
REQUIRED_FRONTEND_CALLS=(
  "payments.createCheckout"
  "payments.getSubscription"
  "payments.cancelSubscription"
  "gifts.purchaseGift"
  "gifts.activateGift"
  "referrals.getMyReferralCode"
  "referrals.getMyReferrals"
  "school.getLeaderboard"
  "nhs.verifyPracticePartner"
  "nhs.getNHSPartnerStats"
  "stories.getFeatured"
  "stories.submitStory"
  "admin.listUsers"
  "admin.listRoles"
  "admin.getPricingTiers"
  "admin.updatePricingTier"
  "admin.systemHealth"
  "admin.getOnboardingFunnel"
  "admin.getFollowUpQueue"
  "creator.applyToBeCreator"
  "creator.getCreatorStories"
  "progressSharing.viewShare"
  "progressSharing.getMyShares"
  "onboarding.trackOnboardingCheckpoint"
  "notifications.registerPushSubscription"
  "brain.generateSummary"
  "impact.liveMetrics"
)
for call in "${REQUIRED_FRONTEND_CALLS[@]}"; do
  count=$(grep -rn "$call" src/ --include="*.tsx" | \
    grep -v "//\|import\|type" | wc -l)
  [ "$count" -gt 0 ] && p "Wired: $call" || f "NOT WIRED: $call"
done

# No empty array useState (data must come from API)
EA=$(grep -rn "useState(\[\])" src/ --include="*.tsx" | \
  grep -v "//\|test" | wc -l)
[ "$EA" -eq 0 ] && p "No fake empty arrays" || f "$EA fake empty arrays found"

# Hero has blockquote before h1
HERO=$(grep -n "blockquote\|<h1" src/components/home/Hero.tsx 2>/dev/null | head -5)
echo "$HERO" | grep -q "blockquote" && \
  BLINE=$(echo "$HERO" | grep "blockquote" | head -1 | cut -d: -f1) && \
  HLINE=$(echo "$HERO" | grep "<h1" | head -1 | cut -d: -f1) && \
  [ "$BLINE" -lt "$HLINE" ] && \
  p "Hero: blockquote before h1 (emotional logic correct)" || \
  f "Hero: h1 appears before blockquote (fix emotional order)"

# Session screen does NOT contain "How can I help"
GENERIC=$(grep -rn "How can I help\|how can I help\|how can i help" \
  src/ --include="*.tsx" | grep -v "//\|import" | wc -l)
[ "$GENERIC" -eq 0 ] && p "Session: no generic opening messages" || \
  f "Session: $GENERIC generic 'how can I help' found — remove all"

# Brain viewer uses Instrument Serif
SERIF=$(grep -rn "font-serif\|instrumentSerif\|--font-serif" \
  src/components/brain/ 2>/dev/null | wc -l)
[ "$SERIF" -gt 0 ] && p "Brain: uses Instrument Serif (journal voice)" || \
  f "Brain: not using serif font (not a journal)"

# Google OAuth exists
GOOGLE=$(grep -rn "GoogleProvider\|google\|Google" \
  src/app/api/auth/ pages/api/auth/ 2>/dev/null | wc -l)
[ "$GOOGLE" -gt 0 ] && p "Google OAuth: configured" || \
  f "Google OAuth: MISSING — must implement"

# Hardcoded colours check
HC=$(grep -rn "color:\s*['\"]#\|background:\s*['\"]#\|backgroundColor:\s*['\"]#" \
  src/components/ --include="*.tsx" | \
  grep -v "//\|tokens\|categoryColour\|catColour\|const " | wc -l)
[ "$HC" -lt 10 ] && p "Design tokens: mostly clean ($HC hardcoded)" || \
  f "Too many hardcoded colours: $HC — use CSS variables"

# i18n: at least 20 of 33 languages
I18N=$(find public/locales -name "common.json" 2>/dev/null | wc -l)
[ "$I18N" -ge 20 ] && p "i18n: $I18N language files (target: 33)" || \
  f "i18n: only $I18N languages (need at least 20)"

# ── Summary ──────────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════"
echo "RESULT: $PASS PASS · $FAIL FAIL"
echo ""
if [ "$FAIL" -gt 0 ]; then
  echo "✗ NOT PRODUCTION READY — fix $FAIL failures"
  echo "Patricia. Jade. Daniel. Fix it for them."
  exit 1
else
  echo "✓ PRODUCTION READY"
  echo "Everyone deserves an expert who knows them."
  exit 0
fi
```

---

# ════════════════════════════════════════════════════════════════════════════
# COMMIT MESSAGE (use when all phases complete and smoke test exits 0)
# ════════════════════════════════════════════════════════════════════════════

```
feat: complete frontend — self-audited, self-verified, production-ready

Audit findings resolved:
- [N] routes missing → built
- [N] BACKEND_ONLY tRPC procedures → wired to components
- [N] fake data components → replaced with real API calls
- [N] hardcoded colours → replaced with CSS variables
- [N] missing i18n files → created
- Google OAuth → implemented
- Hardware pages → built
- Admin panel → built
- Cancellation flow → no dark patterns

Design system applied:
- Warm Stone tokens throughout
- Instrument Serif + DM Sans
- Category accent system (8 colours)
- Dark mode adaptive

Emotional logic applied:
- Hero: quote-first (Alicia's story before headline)
- Session: memory-first opening (never "how can I help")
- Brain: journal aesthetic, companion voice in italic serif
- Pricing: comparison framing ("less than one tutoring session")
- Empty states: ghost cards (future vision, not blank screens)

Smoke test: [N] PASS · 0 FAIL · exit 0

AgentCore LTD · Company No. 17114811 · trust-agent.ai
Patricia. Jade. Daniel. Their lives got better. That's the whole thing.
```
