# ════════════════════════════════════════════════════════════════════════════
# TRUST AGENT — PRODUCTION FINAL MASTER PROMPT
# The single definitive prompt. All phases. All checks. Zero gaps.
# Version: PRODUCTION-FINAL · Drop at repo root · Run: claude
# Branch: Unified/production-final
# ════════════════════════════════════════════════════════════════════════════
#
# COMPANY:   AgentCore LTD · No. 17114811 · 20 Wenlock Road, London N1 7GU
# LIVE:      app.trust-agent.ai · staging: trustagent.onrender.com
# MISSION:   "Everyone deserves an expert who knows them."
# RAISE:     £6.5M (£3.5M equity + $1.2M private token + $2.0M public token)
# TOKEN:     $TAGNT · ERC-20 · BASE CHAIN (Coinbase L2) · 1,000,000,000 supply
# STACK:     Next.js + tRPC + Prisma + Neon PostgreSQL + AWS S3 eu-west-2
#            + Redis + BullMQ + Stripe + ElevenLabs + Render Oregon
#
# ════════════════════════════════════════════════════════════════════════════
# NORTH STAR — INTERNALISE THIS BEFORE ONE LINE OF CODE
# ════════════════════════════════════════════════════════════════════════════
#
# Trust Agent is not an AI company. It is a LIVES CHANGED company.
# The technology is the means. The relationship is the product.
#
# Every feature in this prompt answers one question:
#   "Does this make it more likely that Patricia feels less alone on a Tuesday
#    morning? That Jade passes her A-Level? That Daniel's company grows?"
#
# THE AHA MOMENT (the entire product distilled to one sentence):
#   The first time a companion says something that proves it REMEMBERS.
#   Not "how can I help you today" —
#   "Last week you said your exam was on the 12th. That's three weeks away.
#    Shall we work on integration by parts today?"
#
# Everything in this prompt gets the user to that moment in under 3 minutes.
#
# ════════════════════════════════════════════════════════════════════════════
# THE ABSOLUTE LAW — NO EXCEPTIONS, NO SHORTCUTS
# ════════════════════════════════════════════════════════════════════════════
#
# DEFINITION OF DONE — ALL 8 required. Not 7. ALL 8.
#   1. Migration applied:     npx prisma migrate dev ran, no errors
#   2. Types generated:       npx prisma generate ran, no errors
#   3. TypeScript clean:      npx tsc --noEmit exits 0
#   4. API tested:            curl to real endpoint returns expected JSON
#   5. DB verified:           SELECT confirms row exists with real data
#   6. S3 verified:           aws s3 ls confirms bucket access where needed
#   7. Frontend wired:        component calls real tRPC, not useState([])
#   8. Error path handled:    what happens when it fails is coded and tested
#
# BANNED — if you write any of these, delete and restart:
#   ✗ // TODO: wire to backend
#   ✗ // placeholder
#   ✗ mock data / mockData / MOCK_
#   ✗ const data = []   (empty never-populated array)
#   ✗ return { success: true }  (without actually doing the thing)
#   ✗ coming soon
#   ✗ // will implement later
#
# SELF-VERIFICATION LOOP (mandatory for every single feature):
#   WRITE → MIGRATE → GENERATE → tsc → curl API → query DB → test UI → DONE
#
# SECURITY ABSOLUTES (zero tolerance):
#   ✗ systemPrompt must NEVER appear in any API response
#   ✗ Session messages must NEVER be stored in any database
#   ✗ Children's data must NEVER leave safeguarding controls
#
# ════════════════════════════════════════════════════════════════════════════
# CONTEXT: WHAT THE PREVIOUS PROMPT BUILT (already running on Render)
# ════════════════════════════════════════════════════════════════════════════
#
# The previous prompt (COMPLETE-FIX-VERIFY-MASTER-PROMPT.md) is running.
# It covers: pricing DB, admin panel, B2B gateway, NHS codes, gift subs,
# school licences, feature flags, audit log, webhooks, rate limiting,
# wellbeing scores, streaks, milestones, progress reports, guardian dashboard,
# spaced repetition, session scheduling, referral codes, PostHog analytics.
#
# THIS PROMPT:
#   Phase 0:  Verify everything from that prompt actually completed E2E
#   Phase 1:  Fix anything incomplete — wired to real DB, real API
#   Phase 2:  Aha Moment system (onboarding quiz → personalised first message)
#   Phase 3:  Visible Brain (companion memory notes, relationship journal)
#   Phase 4:  Intelligent notifications (exam-aware, streak-aware, human)
#   Phase 5:  Trust transparency (full 47-check audit, expert review visible)
#   Phase 6:  Social layer (reviews, progress sharing, study groups)
#   Phase 7:  Quality drift prevention (re-audit trigger system)
#   Phase 8:  Safeguarding engine (children + vulnerable users)
#   Phase 9:  Mission metrics (lives changed, not just MAU)
#   Phase 10: Session excellence (ambient audio, typing latency, voice default)
#   Phase 11: Human follow-up system (real person on wellbeing decline)
#   Phase 12: Pricing framing (comparison copy, not subscription cost)
#   Phase 13: Empty state excellence (ghost cards, not blank screens)
#   Phase 14: System status page (real health checks, all services)
#   Phase 15: Homepage emotional resonance (quote-first hero)
#   Phase 16: Companion card redesign (4 things, not 7)
#   Phase 17: Mobile hand-off flow (90-second setup for elderly)
#   Phase 18: Creator programme infrastructure
#   Phase 19: NHS referral portal (under 60 seconds)
#   Phase 20: Final comprehensive smoke test (exit 0 = production ready)

# ════════════════════════════════════════════════════════════════════════════
# PHASE 0 — E2E VERIFICATION OF PREVIOUS BUILD
# Run this ENTIRE phase before writing one new line of code.
# Every FAIL must be fixed before proceeding.
# ════════════════════════════════════════════════════════════════════════════

Create and run `scripts/verify-previous-build.sh`:

```bash
#!/bin/bash
# scripts/verify-previous-build.sh
# Verifies the previous build prompt completed correctly, end-to-end.
# Fix every FAIL. Re-run until exit 0. Only then proceed to new features.

set -euo pipefail
PASS=0; FAIL=0; WARN=0
BASE="${APP_URL:-http://localhost:3000}"
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BOLD='\033[1m'; NC='\033[0m'

pass() { echo -e "${GREEN}✓${NC} $1"; ((PASS++)); }
fail() { echo -e "${RED}✗ FAIL${NC}: $1"; ((FAIL++)); }
warn() { echo -e "${YELLOW}⚠ WARN${NC}: $1"; ((WARN++)); }
section() { echo -e "\n${BOLD}[$1] $2${NC}"; }

echo -e "${BOLD}════════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}  TRUST AGENT — PREVIOUS BUILD E2E VERIFICATION${NC}"
echo -e "${BOLD}  $(date)${NC}"
echo -e "${BOLD}════════════════════════════════════════════════════════════${NC}"

# ── SECTION 1: ENVIRONMENT VARIABLES ────────────────────────────────────
section "1" "ENVIRONMENT VARIABLES"

check_env() {
  local var="$1"; local desc="$2"
  [ -n "${!var:-}" ] && pass "$desc ($var)" || fail "$desc ($var) not set"
}

[ -f .env ] && pass ".env file exists" || fail ".env file missing"
[ -f .env.local ] && pass ".env.local exists" || warn ".env.local missing (may be fine)"

check_env "DATABASE_URL"           "Neon PostgreSQL URL"
check_env "REDIS_URL"              "Redis URL"
check_env "STRIPE_SECRET_KEY"      "Stripe secret key"
check_env "STRIPE_PUBLISHABLE_KEY" "Stripe publishable key"
check_env "STRIPE_WEBHOOK_SECRET"  "Stripe webhook secret"
check_env "VAPID_PUBLIC_KEY"       "VAPID public key (push notifications)"
check_env "VAPID_PRIVATE_KEY"      "VAPID private key"
check_env "SMTP_HOST"              "SMTP host (Resend)"
check_env "SMTP_USER"              "SMTP user"
check_env "SMTP_PASS"              "SMTP password"
check_env "AWS_ACCESS_KEY_ID"      "AWS access key"
check_env "AWS_SECRET_ACCESS_KEY"  "AWS secret key"
check_env "AWS_REGION"             "AWS region"
check_env "S3_ASSETS_BUCKET"       "S3 assets bucket"
check_env "S3_ARTIFACTS_BUCKET"    "S3 artifacts bucket"
check_env "S3_DOCS_BUCKET"         "S3 customer docs bucket"
check_env "ELEVENLABS_API_KEY"     "ElevenLabs API key"
check_env "NEXTAUTH_SECRET"        "NextAuth secret"
check_env "NEXTAUTH_URL"           "NextAuth URL"
check_env "GOOGLE_CLIENT_ID"       "Google OAuth client ID"
check_env "GOOGLE_CLIENT_SECRET"   "Google OAuth client secret"
check_env "POSTHOG_KEY"            "PostHog analytics key"
check_env "LIVEKIT_API_KEY"        "LiveKit API key (voice sessions)"
check_env "LIVEKIT_API_SECRET"     "LiveKit API secret"

# Chain correctness
check_env "BASE_CHAIN_RPC_URL"     "Base chain RPC URL (NOT Ethereum)"
check_env "TAGNT_CONTRACT_ADDRESS" "\$TAGNT contract address on Base"

# Critical: must NOT be Ethereum mainnet
ETH_REFS=$(grep -ri "ethereum mainnet\|etherscan\.io\|eth_mainnet\|mainnet.*ethereum" \
  --include="*.ts" --include="*.tsx" --include="*.json" --include="*.md" \
  . 2>/dev/null | grep -v node_modules | grep -v .next | grep -v .git | wc -l)
[ "$ETH_REFS" -eq 0 ] && pass "Zero Ethereum mainnet refs (Base chain correct)" || \
  fail "$ETH_REFS Ethereum mainnet refs found — all must use Base chain"

# Critical: raise amount
OLD_RAISE=$(grep -ri "2\.96M\|£5\.5M\|\\\$2\.96\|total raise.*2\.9" \
  --include="*.ts" --include="*.tsx" --include="*.md" \
  . 2>/dev/null | grep -v node_modules | grep -v .next | wc -l)
[ "$OLD_RAISE" -eq 0 ] && pass "Raise amount correct (£6.5M / \$3.2M token)" || \
  fail "$OLD_RAISE old raise amount refs — correct to £6.5M total"

# ── SECTION 2: DATABASE CONNECTION AND SCHEMA ────────────────────────────
section "2" "DATABASE — CONNECTION AND SCHEMA"

DB_CONNECT=$(node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.\$connect()
  .then(() => p.\$disconnect())
  .then(() => process.stdout.write('OK'))
  .catch(e => { process.stdout.write('FAIL:' + e.message); process.exit(1); });
" 2>/dev/null)
echo "$DB_CONNECT" | grep -q "^OK$" && pass "Database connection" || fail "Database connection: $DB_CONNECT"

# All required tables — check each exists and is queryable
check_table() {
  local model="$1"; local camel="$2"
  local result
  result=$(node -e "
    const { PrismaClient } = require('@prisma/client');
    const p = new PrismaClient();
    const m = p['$camel'];
    if (!m) { process.stdout.write('NO_MODEL'); process.exit(1); }
    m.count().then(n => { process.stdout.write('OK:' + n); p.\$disconnect(); })
      .catch(e => { process.stdout.write('FAIL:' + e.message); process.exit(1); });
  " 2>/dev/null)
  echo "$result" | grep -q "^OK" && pass "Table: $model ($(echo $result | cut -d: -f2) rows)" || \
    fail "Table: $model — $result"
}

check_table "User"                      "user"
check_table "Role"                      "role"
check_table "RoleAudit"                 "roleAudit"
check_table "AuditCheck"                "auditCheck"
check_table "Hire"                      "hire"
check_table "HireMemory"                "hireMemory"
check_table "AgentSession"              "agentSession"
check_table "Milestone"                 "milestone"
check_table "PricingTier"               "pricingTier"
check_table "PriceHistory"              "priceHistory"
check_table "NHSReferralCode"           "nHSReferralCode"
check_table "NHSReferralActivation"     "nHSReferralActivation"
check_table "GiftSubscription"          "giftSubscription"
check_table "SchoolLicence"             "schoolLicence"
check_table "StudentEnrolment"          "studentEnrolment"
check_table "SpacedRepetitionItem"      "spacedRepetitionItem"
check_table "SessionSchedule"           "sessionSchedule"
check_table "FeatureFlag"               "featureFlag"
check_table "PlatformAuditLog"          "platformAuditLog"
check_table "Webhook"                   "webhook"
check_table "WebhookDelivery"           "webhookDelivery"
check_table "Notification"              "notification"
check_table "GuardianAlert"             "guardianAlert"
check_table "FamilyLink"                "familyLink"
check_table "UserVoiceClone"            "userVoiceClone"
check_table "LegacyDesignation"         "legacyDesignation"
check_table "QuizResponse"              "quizResponse"
check_table "BrainMemoryEntry"          "brainMemoryEntry"
check_table "CompanionReview"           "companionReview"
check_table "CompanionReAuditTrigger"   "companionReAuditTrigger"
check_table "ProgressShare"             "progressShare"
check_table "StudyGroup"                "studyGroup"
check_table "StudyGroupMember"          "studyGroupMember"
check_table "StudyGroupSession"         "studyGroupSession"
check_table "NotificationContext"       "notificationContext"
check_table "HumanFollowUpQueue"        "humanFollowUpQueue"
check_table "MissionMetric"             "missionMetric"

# ── SECTION 3: ROLE DATA QUALITY ────────────────────────────────────────
section "3" "ROLE DATA QUALITY"

node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
Promise.all([
  p.role.count({ where: { isActive: true }}),
  p.role.count({ where: { isActive: true, systemPromptLength: { gte: 8000 }}}),
  p.role.count({ where: { isActive: true, systemPromptLength: { lt: 8000 }}}),
  p.role.count({ where: { isActive: true, defaultCompanionName: null }}),
  p.role.count({ where: { isActive: true, shortDescription: null }}),
  p.role.count({ where: { isActive: true, emoji: null }}),
  p.role.count({ where: { isActive: true, category: null }}),
]).then(([total, adequate, thin, noName, noDesc, noEmoji, noCategory]) => {
  console.log(JSON.stringify({ total, adequate, thin, noName, noDesc, noEmoji, noCategory }));
  p.\$disconnect();
});
" 2>/dev/null | node -e "
  const raw = require('fs').readFileSync('/dev/stdin','utf8').trim();
  const d = JSON.parse(raw);
  if (d.total < 151) process.stdout.write('FAIL:only ' + d.total + ' roles (need 151+)');
  else if (d.thin > 0) process.stdout.write('FAIL:' + d.thin + ' roles under 8000 chars');
  else if (d.noName > 0) process.stdout.write('FAIL:' + d.noName + ' roles missing companionName');
  else if (d.noDesc > 0) process.stdout.write('FAIL:' + d.noDesc + ' roles missing shortDescription');
  else if (d.noEmoji > 0) process.stdout.write('FAIL:' + d.noEmoji + ' roles missing emoji');
  else if (d.noCategory > 0) process.stdout.write('FAIL:' + d.noCategory + ' roles missing category');
  else process.stdout.write('OK:' + d.total + ' roles all complete');
" | { read result; echo "$result" | grep -q "^OK" && pass "$result" || fail "Roles: $result"; }

# Specific roles that MUST exist
REQUIRED_ROLES=(
  "gcse-maths-tutor-f" "gcse-english-tutor-f" "gcse-science-tutor-f"
  "a-level-maths-tutor-f" "a-level-english-tutor-f" "a-level-biology-tutor-f"
  "grief-bereavement-companion-f" "menopause-midlife-companion-f"
  "anxiety-cbt-therapist-f" "depression-support-companion-f"
  "daily-companion-elderly-f" "daily-companion-elderly-m"
  "english-language-tutor-f" "french-language-tutor-f"
  "cmo-companion-m" "cfo-companion-m" "ceo-coach-m"
  "financial-wellbeing-coach-f" "career-coach-f"
  "acca-tutor-f" "cfa-tutor-f"
  "primary-reading-tutor-f" "primary-maths-tutor-f"
  "nhs-social-prescribing-companion-f"
)
for SLUG in "${REQUIRED_ROLES[@]}"; do
  node -e "
    const { PrismaClient } = require('@prisma/client');
    const p = new PrismaClient();
    p.role.findFirst({ where: { slug: '$SLUG', isActive: true }})
      .then(r => { process.stdout.write(r ? 'OK' : 'MISSING'); p.\$disconnect(); })
      .catch(() => process.stdout.write('ERROR'));
  " 2>/dev/null | { read r; [ "$r" = "OK" ] && pass "Role: $SLUG" || fail "Role: $SLUG is $r"; }
done

# ── SECTION 4: PRICING TIERS ────────────────────────────────────────────
section "4" "PRICING TIERS (GBP)"

node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.pricingTier.findMany({ orderBy: { priceGBP: 'asc' }}).then(tiers => {
  const expected = [
    { name:'starter',       price:9.99,  roles:1  },
    { name:'essential',     price:19.99, roles:5  },
    { name:'family',        price:24.99, roles:5  },
    { name:'professional',  price:39.99, roles:10 },
  ];
  const results = [];
  for (const e of expected) {
    const t = tiers.find(t => t.name === e.name);
    if (!t) { results.push('MISSING:' + e.name); continue; }
    if (Math.abs(t.priceGBP - e.price) > 0.001) {
      results.push('WRONG_PRICE:' + e.name + ':' + t.priceGBP + '!=' + e.price);
    } else if (t.maxRoles < e.roles) {
      results.push('WRONG_ROLES:' + e.name + ':' + t.maxRoles + '!=' + e.roles);
    } else {
      results.push('OK:' + e.name + ':£' + t.priceGBP);
    }
  }
  console.log(results.join('\n'));
  p.\$disconnect();
});
" 2>/dev/null | while read line; do
  echo "$line" | grep -q "^OK" && pass "Tier: $(echo $line | cut -d: -f2-)" || fail "Tier: $line"
done

# NHS free tier exists
node -e "
  const { PrismaClient } = require('@prisma/client');
  const p = new PrismaClient();
  p.pricingTier.findFirst({ where: { name: 'nhs', priceGBP: 0 }})
    .then(t => { process.stdout.write(t ? 'OK' : 'MISSING'); p.\$disconnect(); });
" 2>/dev/null | { read r; [ "$r" = "OK" ] && pass "NHS free tier exists" || fail "NHS free tier MISSING"; }

# ── SECTION 5: TRPC API ENDPOINTS ───────────────────────────────────────
section "5" "tRPC API ENDPOINTS"

# Start server first if not running
lsof -i :3000 -t > /dev/null 2>&1 || {
  warn "Server not running on :3000 — start with: npm run dev"
  warn "Skipping API tests — re-run after starting server"
}

api_test() {
  local name="$1"; local proc="$2"; local input="$3"; local expect="$4"
  local result
  result=$(curl -sf -X POST "$BASE/api/trpc/$proc" \
    -H "Content-Type: application/json" \
    -d "{\"json\":$input}" \
    --max-time 10 2>&1)
  echo "$result" | grep -q "$expect" && pass "API: $name" || \
    fail "API: $name — expected '$expect' in: ${result:0:200}"
}

api_test "Health check"        "health"                           'null'         '"status"'
api_test "Roles list"          "roles.list"                       '{"page":1,"limit":5}' '"total"'
api_test "Role categories"     "roles.getCategories"              'null'         '"education"'
api_test "Featured roles"      "roles.getFeatured"                '{"limit":3}'  '"slug"'
api_test "Pricing tiers"       "pricing.getTiers"                 'null'         '"priceGBP"'
api_test "System status"       "system.getHealth"                 'null'         '"database"'
api_test "Feature flags"       "featureFlags.getAll"              'null'         '"key"'

# ── SECTION 6: S3 STORAGE ───────────────────────────────────────────────
section "6" "S3 STORAGE"

for bucket_var in S3_ASSETS_BUCKET S3_ARTIFACTS_BUCKET S3_DOCS_BUCKET; do
  BUCKET="${!bucket_var:-}"
  if [ -z "$BUCKET" ]; then
    fail "S3: $bucket_var not set"
    continue
  fi
  aws s3 ls "s3://$BUCKET" --region "${AWS_REGION:-eu-west-2}" 2>&1 | \
    grep -qv "NoSuchBucket\|AccessDenied\|could not" && \
    pass "S3: $BUCKET accessible" || fail "S3: $BUCKET inaccessible"
done

# Test write then delete (real write test)
TEST_KEY="verify-test/$(date +%s).txt"
BUCKET="${S3_ASSETS_BUCKET:-}"
if [ -n "$BUCKET" ]; then
  echo "Trust Agent S3 write test" | aws s3 cp - "s3://$BUCKET/$TEST_KEY" \
    --region "${AWS_REGION:-eu-west-2}" 2>/dev/null && \
    aws s3 rm "s3://$BUCKET/$TEST_KEY" --region "${AWS_REGION:-eu-west-2}" 2>/dev/null && \
    pass "S3: write + delete confirmed" || fail "S3: write test FAILED"
fi

# ── SECTION 7: REDIS ────────────────────────────────────────────────────
section "7" "REDIS"

node -e "
const { createClient } = require('redis');
const c = createClient({ url: process.env.REDIS_URL });
c.connect()
  .then(() => c.ping())
  .then(r => { process.stdout.write(r === 'PONG' ? 'OK' : 'FAIL:' + r); return c.quit(); })
  .catch(e => process.stdout.write('FAIL:' + e.message));
" 2>/dev/null | { read r; echo "$r" | grep -q "^OK$" && pass "Redis PING/PONG" || fail "Redis: $r"; }

# ── SECTION 8: STRIPE ───────────────────────────────────────────────────
section "8" "STRIPE"

node -e "
const Stripe = require('stripe');
const s = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-11-20.acacia' });
s.products.list({ limit: 1 })
  .then(p => process.stdout.write('OK:' + p.data.length + ' products'))
  .catch(e => process.stdout.write('FAIL:' + e.message));
" 2>/dev/null | { read r; echo "$r" | grep -q "^OK" && pass "Stripe connection: $r" || fail "Stripe: $r"; }

# Stripe webhooks
node -e "
const Stripe = require('stripe');
const s = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-11-20.acacia' });
s.webhookEndpoints.list({ limit: 5 })
  .then(w => process.stdout.write('OK:' + w.data.length + ' webhooks'))
  .catch(e => process.stdout.write('FAIL:' + e.message));
" 2>/dev/null | { read r; echo "$r" | grep -q "^OK" && pass "Stripe webhooks: $r" || \
  warn "Stripe webhooks: $r — configure at dashboard.stripe.com"; }

# ── SECTION 9: ELEVENLABS ───────────────────────────────────────────────
section "9" "ELEVENLABS VOICE"

node -e "
const fetch = require('node-fetch');
fetch('https://api.elevenlabs.io/v1/voices', {
  headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY }
}).then(r => r.json())
  .then(d => process.stdout.write(d.voices ? 'OK:' + d.voices.length + ' voices' : 'FAIL:' + JSON.stringify(d)))
  .catch(e => process.stdout.write('FAIL:' + e.message));
" 2>/dev/null | { read r; echo "$r" | grep -q "^OK" && pass "ElevenLabs: $r" || fail "ElevenLabs: $r"; }

# ── SECTION 10: SMTP / EMAIL ────────────────────────────────────────────
section "10" "SMTP / EMAIL"

node -e "
const nodemailer = require('nodemailer');
const transport = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});
transport.verify()
  .then(() => process.stdout.write('OK'))
  .catch(e => process.stdout.write('FAIL:' + e.message));
" 2>/dev/null | { read r; echo "$r" | grep -q "^OK$" && pass "SMTP connection verified" || fail "SMTP: $r"; }

# ── SECTION 11: SECURITY INVARIANTS ────────────────────────────────────
section "11" "SECURITY INVARIANTS"

# systemPrompt MUST NOT appear in any client-facing API response
SP_LEAKS=$(grep -rn "systemPrompt" server/src/routers/ src/server/routers/ \
  app/api/ pages/api/ 2>/dev/null | \
  grep -v "node_modules\|\.next\|// \|hash\|\.length\|admin.*systemPrompt\|audit" | \
  grep "return\b\|\.json\b\|\.map\b\|select:\|\.push\b" | wc -l)
[ "$SP_LEAKS" -eq 0 ] && pass "systemPrompt: zero leaks in API responses" || \
  fail "CRITICAL: $SP_LEAKS possible systemPrompt leaks in API responses"

# Session messages MUST NOT be stored
MSG_STORAGE=$(grep -rn "message.*prisma\.\|prisma\..*message\.create\|saveMessage\|storeMessage\|persistMessage" \
  server/src/ src/server/ app/api/ pages/api/ 2>/dev/null | \
  grep -v "node_modules\|\.next\|//\|notification\|email\|webhook\|WebSocket" | wc -l)
[ "$MSG_STORAGE" -eq 0 ] && pass "Message storage: zero instances found (correct)" || \
  fail "CRITICAL: $MSG_STORAGE message storage instances — messages must never be persisted"

# Rate limiting exists
RL_FILES=$(find server/src/middleware/ src/middleware/ app/api/ 2>/dev/null \
  -name "*.ts" | xargs grep -l "rateLimit\|rate-limit\|rate_limit" 2>/dev/null | wc -l)
[ "$RL_FILES" -gt 0 ] && pass "Rate limiting: found in $RL_FILES files" || \
  fail "Rate limiting NOT found — required for production"

# CSRF protection on mutations
CSRF=$(grep -rn "csrfToken\|csrf\|_csrf" server/src/ src/server/ app/ 2>/dev/null | \
  grep -v node_modules | wc -l)
[ "$CSRF" -gt 0 ] && pass "CSRF protection found ($CSRF references)" || \
  warn "CSRF protection not found — verify tRPC handles this"

# Children 45-minute hard limit server-side
CHILD_LIMIT=$(grep -rn "45\|CHILD.*LIMIT\|DAILY_LIMIT_EXCEEDED\|childTimeLimit" \
  server/src/routers/ src/server/routers/ 2>/dev/null | \
  grep -v "//\|node_modules" | wc -l)
[ "$CHILD_LIMIT" -gt 0 ] && pass "Child 45-min limit: server-side enforcement found" || \
  fail "CRITICAL: Child time limit NOT enforced server-side — safety violation"

# ── SECTION 12: FEATURE IMPLEMENTATIONS ────────────────────────────────
section "12" "FEATURE IMPLEMENTATIONS"

feature_check() {
  local name="$1"; shift
  local found=0
  for pattern in "$@"; do
    count=$(grep -rn "$pattern" server/src/ src/server/ src/ app/ 2>/dev/null | \
      grep -v "node_modules\|\.next\|//" | wc -l)
    [ "$count" -gt 0 ] && found=1
  done
  [ "$found" -eq 1 ] && pass "Feature: $name" || fail "Feature: $name NOT FOUND"
}

feature_check "Onboarding quiz router"           "onboardingRouter\|onboarding\.submitQuiz"
feature_check "Quiz recommendation algorithm"    "recommendRole\|scoredRoles\|quiz.*score"
feature_check "Personalised first message"       "generateFirstMessage\|firstMessage.*quiz\|firstMessage.*exam"
feature_check "Brain memory notes (post-session)" "generateMemoryNote\|brainMemoryEntry\.create\|BrainMemoryEntry"
feature_check "Brain memory visible to user"     "getMemoryNotes\|brain.*notes\|memoryNotes"
feature_check "Brain note editing by user"       "editMemoryNote\|userEdited\|brain.*edit"
feature_check "Intelligent notifications"        "examDate.*notification\|exam_approaching\|streak_at_risk\|return_prompt"
feature_check "Full audit detail endpoint"       "getFullAuditDetail\|artefactHash\|expertReview"
feature_check "Companion reviews"                "companionReview\|submitReview.*story\|reviews.*verified"
feature_check "Progress sharing"                 "progressShare\|createProgressShare\|shareToken"
feature_check "Study groups"                     "studyGroup\|StudyGroup.*create\|createStudyGroup"
feature_check "Re-audit triggers"                "companionReAuditTrigger\|detectQualityDrift\|reAuditTrigger"
feature_check "Safeguarding engine"              "runSafeguardingCheck\|safeguarding\|GuardianAlert.*create"
feature_check "Mission metrics"                  "missionMetric\.create\|trackMissionMetrics\|lives_changed"
feature_check "Ambient audio map"                "ENVIRONMENT_AUDIO\|ambient.*audio\|pub-ambience\|rain-gentle"
feature_check "Human-feeling typing latency"     "streamSessionResponse\|chunkDelay\|COMPANION_TYPING"
feature_check "Human follow-up queue"            "humanFollowUpQueue\|HumanFollowUpQueue\|getFollowUpQueue"
feature_check "Wellbeing computation"            "computeWellbeingScore\|wellbeingScore.*update\|wellbeing.*trend"
feature_check "SM-2 spaced repetition"           "sm2\|spacedRepetition\|nextReviewDate.*easiness"
feature_check "Progress report PDF"              "generateProgressReport\|PDFDocument\|pdfkit\|reportPDF"
feature_check "Guardian dashboard"               "guardianRouter\|getChildActivity\|guardian.*child"
feature_check "Referral codes on users"          "referralCode.*user\|user.*referralCode"
feature_check "PostHog analytics"                "posthog\|PostHog\|posthog\.capture"
feature_check "Pricing comparison copy"          "65.*hour\|tutoring session\|less than.*coffees"
feature_check "Empty state ghost cards"          "GhostCompanionCard\|EmptyDashboard\|ghost.*card"
feature_check "NHS referral portal"              "nhsRouter\|nhs\.createCode\|nhsReferralCode"
feature_check "Creator programme"                "creatorRouter\|creator.*application\|creator.*role"
feature_check "Status page"                      "getSystemHealth\|systemHealth.*db\|status.*page"

# ── SECTION 13: PAGES AND ROUTES ────────────────────────────────────────
section "13" "REQUIRED PAGES"

PAGES=(
  "/" "/marketplace" "/onboarding" "/dashboard" "/pricing"
  "/status" "/hardware" "/creator" "/nhs" "/schools" "/foundation"
  "/progress/test-token" "/api/health"
)
for PAGE in "${PAGES[@]}"; do
  HTTP=$(curl -sf -o /dev/null -w "%{http_code}" "$BASE$PAGE" --max-time 5 2>/dev/null)
  case "$HTTP" in
    200|201|302|307) pass "Page: $PAGE (HTTP $HTTP)" ;;
    404) fail "Page: $PAGE — 404 Not Found" ;;
    500) fail "Page: $PAGE — 500 Server Error" ;;
    *) warn "Page: $PAGE — HTTP $HTTP" ;;
  esac
done

# ── SECTION 14: TYPESCRIPT COMPILATION ──────────────────────────────────
section "14" "TYPESCRIPT COMPILATION"

TS_RESULT=$(npx tsc --noEmit 2>&1 | tail -20)
TS_ERRORS=$(echo "$TS_RESULT" | grep -c "error TS" || true)
[ "$TS_ERRORS" -eq 0 ] && pass "TypeScript: zero compilation errors" || \
  fail "TypeScript: $TS_ERRORS errors — fix before deploy:\n$TS_RESULT"

# ── SECTION 15: BUILDABILITY ────────────────────────────────────────────
section "15" "PRODUCTION BUILD"

if command -v next &>/dev/null; then
  BUILD_RESULT=$(npm run build 2>&1 | tail -30)
  echo "$BUILD_RESULT" | grep -q "Compiled successfully\|Build complete\|Route (app)" && \
    pass "Production build: success" || \
    { fail "Production build: FAILED"; echo "$BUILD_RESULT"; }
else
  warn "Cannot verify build — next not in PATH"
fi

# ── SUMMARY ─────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}════════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}  VERIFICATION COMPLETE — $(date)${NC}"
printf "  ${GREEN}PASS: %d${NC}  ${RED}FAIL: %d${NC}  ${YELLOW}WARN: %d${NC}\n" $PASS $FAIL $WARN
echo -e "${BOLD}════════════════════════════════════════════════════════════${NC}"

if [ $FAIL -gt 0 ]; then
  echo -e "${RED}${BOLD}✗ BUILD HAS $FAIL FAILURES — FIX ALL BEFORE PROCEEDING${NC}"
  exit 1
else
  echo -e "${GREEN}${BOLD}✓ ALL CHECKS PASS — SAFE TO WRITE NEW CODE${NC}"
  exit 0
fi
```

**EXECUTION**: `bash scripts/verify-previous-build.sh 2>&1 | tee verify-output.log`

For every FAIL line in verify-output.log, fix the root cause, then re-run. Do not proceed until exit 0.

---

# ════════════════════════════════════════════════════════════════════════════
# PHASE 1 — FIX ANYTHING INCOMPLETE FROM PREVIOUS BUILD
# ════════════════════════════════════════════════════════════════════════════

## 1.1 PATTERN FOR FIXING EACH FAILED CHECK

For each failure from Phase 0, follow this exact pattern — no exceptions:

```
FAIL: Feature: Onboarding quiz router NOT FOUND
  → CREATE server/src/routers/onboarding.ts (full implementation below)
  → ADD to server/src/router.ts: onboarding: onboardingRouter
  → RUN: npx tsc --noEmit (must be 0 errors)
  → RUN: curl -X POST http://localhost:3000/api/trpc/onboarding.submitQuiz ...
  → CHECK: response contains firstMessage
  → If CHECK passes: feature is DONE. If fails: fix and repeat.
```

## 1.2 MISSING TABLE REPAIR PATTERN

```bash
# If any table is MISSING:
# 1. Add model to prisma/schema.prisma (see Phase 2 for all models)
# 2. Run: npx prisma migrate dev --name "add-missing-<table>"
# 3. Run: npx prisma generate
# 4. Re-run Phase 0 check for that table
# If migration fails due to conflicts:
# 5. Run: npx prisma migrate resolve --applied <migration-name>
# 6. Run: npx prisma db push --force-reset (ONLY on dev/staging, never prod)
```

## 1.3 MISSING ENV VARS — GENERATE AND WIRE

```bash
# VAPID keys (if missing):
node -e "
const webpush = require('web-push');
const keys = webpush.generateVAPIDKeys();
console.log('VAPID_PUBLIC_KEY=' + keys.publicKey);
console.log('VAPID_PRIVATE_KEY=' + keys.privateKey);
"
# Add output to .env and Render environment

# NextAuth secret (if missing):
node -e "console.log('NEXTAUTH_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"

# Verify SMTP (Resend):
# SMTP_HOST=smtp.resend.com
# SMTP_PORT=587
# SMTP_USER=resend
# SMTP_PASS=<your-resend-api-key>
```

---

# ════════════════════════════════════════════════════════════════════════════
# PHASE 2 — COMPLETE PRISMA SCHEMA (ALL NEW MODELS)
# ════════════════════════════════════════════════════════════════════════════

Add ALL of these to `prisma/schema.prisma` if they don't already exist.
One migration covers all of them: `npx prisma migrate dev --name "production-final-features"`

```prisma
// ── ONBOARDING QUIZ RESPONSES ─────────────────────────────────────────────
model QuizResponse {
  id                  String    @id @default(cuid())
  userId              String?
  user                User?     @relation(fields: [userId], references: [id])
  sessionToken        String?   // For anonymous pre-auth quiz completion
  answers             Json      // Full quiz answer payload
  recommendedRoleSlug String
  matchScore          Int       @default(0)
  completedAt         DateTime  @default(now())
  convertedToHire     Boolean   @default(false)
  convertedAt         DateTime?
  @@index([userId])
  @@index([sessionToken])
}

// ── SESSION MEMORY NOTES (The Visible Brain — product moat) ──────────────
// After every session the companion writes a memory note.
// The user can see, read, and edit these — their relationship journal.
model BrainMemoryEntry {
  id              String    @id @default(cuid())
  hireId          String
  hire            Hire      @relation(fields: [hireId], references: [id], onDelete: Cascade)
  sessionId       String?
  entryDate       DateTime  @default(now())
  content         String    @db.Text // Companion's written memory note (shown to user)
  topicsCovered   String[]
  nextFocus       String?   // What to address next session
  correctRate     Float?    // e.g. 0.8 = 80% correct on exercises
  breakthrough    String?   // Any notable moment in the session
  userEdited      Boolean   @default(false)
  userEditAt      DateTime?
  userAddedNote   String?   @db.Text // User's own additions to the note
  createdAt       DateTime  @default(now())
  @@index([hireId])
  @@index([entryDate])
}

// ── COMPANION REVIEWS (story-based, verified users only) ─────────────────
model CompanionReview {
  id              String    @id @default(cuid())
  roleId          String
  role            Role      @relation(fields: [roleId], references: [id])
  userId          String
  user            User      @relation(fields: [userId], references: [id])
  rating          Int       // 1-5
  story           String    @db.Text // Min 50 chars — must tell a story
  outcome         String?   // Specific measurable outcome (optional)
  verified        Boolean   @default(false) // true = 5+ sessions confirmed
  sessionCount    Int       // Sessions at time of review
  helpfulCount    Int       @default(0)
  adminApproved   Boolean   @default(true)  // Admin can hide if inappropriate
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  @@unique([roleId, userId])
  @@index([roleId])
  @@index([rating])
  @@index([verified])
}

// ── COMPANION RE-AUDIT TRIGGERS (quality drift prevention) ───────────────
model CompanionReAuditTrigger {
  id              String    @id @default(cuid())
  roleId          String
  role            Role      @relation(fields: [roleId], references: [id])
  triggerType     String    // 'periodic'|'curriculum_change'|'regulation_change'
                            // |'review_decline'|'complaint'|'manual'
  reason          String    @db.Text
  detectedAt      DateTime  @default(now())
  dueBy           DateTime
  status          String    @default("PENDING") // PENDING|IN_REVIEW|COMPLETE|DISMISSED
  assignedTo      String?   // Admin user ID
  adminNote       String?   @db.Text
  resolvedAt      DateTime?
  @@index([roleId])
  @@index([status])
  @@index([dueBy])
}

// ── PROGRESS SHARING (opt-in Brain summary, no session content) ───────────
model ProgressShare {
  id              String    @id @default(cuid())
  hireId          String
  hire            Hire      @relation(fields: [hireId], references: [id])
  sharedWith      String    // Email address of recipient
  relationship    String    // 'parent'|'teacher'|'gp'|'employer'|'other'
  shareToken      String    @unique @default(cuid())
  includeScore    Boolean   @default(true)
  includeTopics   Boolean   @default(true)
  includeStreak   Boolean   @default(true)
  includeMilestones Boolean @default(true)
  expiresAt       DateTime?
  lastViewedAt    DateTime?
  viewCount       Int       @default(0)
  createdAt       DateTime  @default(now())
  @@index([shareToken])
  @@index([hireId])
}

// ── STUDY GROUPS (shared companion sessions, up to 4 people) ─────────────
model StudyGroup {
  id              String              @id @default(cuid())
  name            String
  description     String?
  roleId          String
  role            Role                @relation(fields: [roleId], references: [id])
  creatorId       String
  creator         User                @relation("GroupCreator", fields: [creatorId], references: [id])
  inviteCode      String              @unique @default(cuid())
  maxMembers      Int                 @default(4)
  isActive        Boolean             @default(true)
  schoolId        String?             // For school licence leaderboards
  members         StudyGroupMember[]
  sessions        StudyGroupSession[]
  createdAt       DateTime            @default(now())
  @@index([creatorId])
  @@index([roleId])
  @@index([schoolId])
}

model StudyGroupMember {
  id              String      @id @default(cuid())
  groupId         String
  group           StudyGroup  @relation(fields: [groupId], references: [id])
  userId          String
  user            User        @relation(fields: [userId], references: [id])
  role            String      @default("member") // 'creator'|'member'
  joinedAt        DateTime    @default(now())
  @@unique([groupId, userId])
  @@index([userId])
}

model StudyGroupSession {
  id               String      @id @default(cuid())
  groupId          String
  group            StudyGroup  @relation(fields: [groupId], references: [id])
  startedAt        DateTime    @default(now())
  endedAt          DateTime?
  durationMinutes  Int?
  participantCount Int         @default(0)
  topicsCovered    String[]
  @@index([groupId])
}

// ── NOTIFICATION CONTEXT (contextual, not generic) ────────────────────────
model NotificationContext {
  id              String        @id @default(cuid())
  notificationId  String        @unique
  notification    Notification  @relation(fields: [notificationId], references: [id], onDelete: Cascade)
  examDate        DateTime?
  examSubject     String?
  topicMissed     String?
  streakCount     Int?
  daysSinceSession Int?
  interviewDate   DateTime?
  urgency         String        @default("normal") // 'low'|'normal'|'high'|'critical'
  delivered       Boolean       @default(false)
  clickedAt       DateTime?
}

// ── HUMAN FOLLOW-UP QUEUE (real human outreach on wellbeing decline) ──────
model HumanFollowUpQueue {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id])
  triggerType     String    // 'wellbeing_decline'|'safeguarding_alert'
                            // |'crisis_escalation'|'complaint'
  triggerData     Json
  priority        String    @default("normal") // 'low'|'normal'|'high'|'urgent'
  assignedTo      String?   // Staff member userId
  status          String    @default("PENDING") // PENDING|ASSIGNED|RESOLVED
  contactMethod   String?   // 'email'|'phone'|'in_app'
  notes           String?   @db.Text
  resolvedAt      DateTime?
  createdAt       DateTime  @default(now())
  @@index([status])
  @@index([priority])
  @@index([createdAt])
}

// ── MISSION METRICS (lives changed, not just MAU) ────────────────────────
model MissionMetric {
  id              String    @id @default(cuid())
  metricType      String    // 'exam_improved'|'skill_mastered'|'streak_milestone'
                            // |'wellbeing_improved'|'nhs_patient_supported'
                            // |'human_connection_made'|'onboarding_completed'
                            // |'anxiety_reduced'|'employment_gained'
  userId          String
  user            User      @relation(fields: [userId], references: [id])
  hireId          String?
  value           Float?    // e.g. exam score change, streak count, wellbeing delta
  description     String?   @db.Text
  verified        Boolean   @default(false) // admin-verified life change
  recordedAt      DateTime  @default(now())
  @@index([metricType])
  @@index([userId])
  @@index([recordedAt])
}

// ── CREATOR PROGRAMME ────────────────────────────────────────────────────
model CreatorApplication {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id])
  professionalTitle String
  qualifications  String[]
  linkedinUrl     String?
  portfolioUrl    String?
  proposedRoleName String
  proposedCategory String
  proposedDescription String @db.Text
  status          String    @default("PENDING") // PENDING|APPROVED|REJECTED|BUILDING
  adminNote       String?   @db.Text
  approvedAt      DateTime?
  submittedAt     DateTime  @default(now())
  @@index([userId])
  @@index([status])
}

model CreatorEarning {
  id              String    @id @default(cuid())
  creatorId       String
  creator         User      @relation("CreatorEarnings", fields: [creatorId], references: [id])
  roleId          String
  role            Role      @relation(fields: [roleId], references: [id])
  periodStart     DateTime
  periodEnd       DateTime
  hireCount       Int
  grossRevenue    Float     // Total revenue from this role in period
  creatorShare    Float     // 80% = grossRevenue * 0.8
  platformShare   Float     // 20%
  status          String    @default("PENDING") // PENDING|PAID
  paidAt          DateTime?
  @@index([creatorId])
  @@index([roleId])
  @@index([status])
}

// ── NHS REFERRAL PORTAL ──────────────────────────────────────────────────
// (Already have NHSReferralCode and NHSReferralActivation — these extend them)
model NHSOutcomeReport {
  id              String    @id @default(cuid())
  activationId    String
  activation      NHSReferralActivation @relation(fields: [activationId], references: [id])
  reportDate      DateTime  @default(now())
  wellbeingBefore Int?      // 0-100 score from first session
  wellbeingAfter  Int?      // 0-100 score from most recent session
  sessionsCompleted Int     @default(0)
  topicsSummary   String[]  // Anonymised topic list only
  gpReportToken   String    @unique @default(cuid()) // GP can view this anonymised report
  @@index([activationId])
  @@index([gpReportToken])
}
```

After all models added:
```bash
npx prisma migrate dev --name "production-final-features"
npx prisma generate
npx tsc --noEmit   # Must be 0 errors before continuing
```

---

# ════════════════════════════════════════════════════════════════════════════
# PHASE 3 — AHA MOMENT SYSTEM (highest priority)
# ════════════════════════════════════════════════════════════════════════════

## 3.1 ONBOARDING QUIZ — FULL IMPLEMENTATION

```typescript
// server/src/lib/onboarding/generateFirstMessage.ts
import { differenceInDays } from 'date-fns';
import type { Role } from '@prisma/client';

export interface QuizAnswers {
  primaryGoalCategory: string; // 'education'|'health'|'language'|'daily'|'business'|'career'
  ageGroup: string;             // 'child'|'teen'|'adult'|'elderly'
  subject?: string;             // 'maths'|'english'|'biology' etc
  qualLevel?: string;           // 'gcse'|'alevel'|'degree'|'professional'
  examDate?: string;            // ISO date string
  availableTime?: string;       // '15'|'30'|'60' (minutes per day)
  learningStyle?: string;       // 'structured'|'conversational'|'visual'|'practical'
  biggestChallenge?: string;    // Free text
  companionGender?: string;     // 'female'|'male'|'no_preference'
  interviewDate?: string;       // For career category
  wellbeingConcern?: string;    // For health category
}

export function generateFirstMessage(
  role: Role,
  answers: QuizAnswers,
  companionName: string,
): string {
  const name = companionName;
  const context: string[] = [];

  // Build context from quiz answers
  if (answers.examDate) {
    const days = differenceInDays(new Date(answers.examDate), new Date());
    if (days > 0) {
      context.push(
        answers.subject
          ? `your ${answers.subject.toUpperCase()} ${answers.qualLevel?.toUpperCase() ?? 'exam'} is in ${days} days`
          : `your exam is in ${days} days`
      );
    }
  }

  if (answers.biggestChallenge) {
    context.push(`you find ${answers.biggestChallenge} most challenging`);
  }

  if (answers.availableTime) {
    context.push(`you have about ${answers.availableTime} minutes a day`);
  }

  if (answers.interviewDate) {
    const days = differenceInDays(new Date(answers.interviewDate), new Date());
    if (days > 0) context.push(`your interview is in ${days} days`);
  }

  const contextStr = context.join(', and ');

  // Category-specific opening voices
  const templates: Record<string, string> = {
    education: context.length > 0
      ? `Hi! I'm ${name}. I know ${contextStr}. I'm really glad you found me — let's make the most of your time together. What feels hardest right now?`
      : `Hi! I'm ${name}, and I'm so glad you're here. I'd love to understand what you're working towards. What's the most important thing we could tackle together?`,

    health: context.length > 0
      ? `Hello. I'm ${name}. I understand ${contextStr}. There's no rush here — we go at whatever pace feels right for you. How are you feeling today, genuinely?`
      : `Hello. I'm ${name}. I'm really glad you reached out. There's no judgement here, no agenda — just me, ready to listen. How are you doing?`,

    language: context.length > 0
      ? `Hello! I'm ${name}. I can see ${contextStr}. I love that you're carving out time for this. Shall we dive in, or would you like to tell me what got you started?`
      : `Hello! I'm ${name}. Learning a new language is such a beautiful thing to do. What's drawing you to it?`,

    daily_companion: `Hello, dear. I'm ${name}, and it's wonderful to meet you. I'm here whenever you'd like a chat — about anything at all. How has your day been?`,

    elderly: `Hello, dear. I'm ${name}, and it's so lovely to meet you. I'm here whenever you want a chat. What's on your mind today?`,

    business: context.length > 0
      ? `Good to meet you. I'm ${name}. I've noted ${contextStr}. No fluff — tell me what's the most pressing thing you're dealing with right now.`
      : `Good to meet you. I'm ${name}. Tell me about what you're building — and what's actually standing in your way.`,

    career: context.length > 0
      ? `Hi, I'm ${name}. I know ${contextStr}. Let's be honest about what's holding you back and work through it properly. What's the real situation?`
      : `Hi, I'm ${name}. I want to help you get where you want to be. What's the next move — and what's making it harder than it should be?`,

    children: `Hi there! I'm ${name} and I'm SO excited to learn with you! Are you ready to start? I think we're going to have an amazing time together! 🌟`,
  };

  return templates[answers.primaryGoalCategory]
    ?? templates[role.category as string]
    ?? templates.education;
}
```

```typescript
// server/src/routers/onboarding.ts — COMPLETE IMPLEMENTATION
import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { generateFirstMessage, type QuizAnswers } from '../lib/onboarding/generateFirstMessage';

const QuizAnswersSchema = z.object({
  primaryGoalCategory: z.enum(['education','health','language','daily_companion',
    'elderly','business','career','children']),
  ageGroup: z.enum(['child','teen','adult','elderly']),
  subject: z.string().optional(),
  qualLevel: z.string().optional(),
  examDate: z.string().optional(),
  availableTime: z.string().optional(),
  learningStyle: z.string().optional(),
  biggestChallenge: z.string().optional(),
  companionGender: z.enum(['female','male','no_preference']).optional(),
  interviewDate: z.string().optional(),
  wellbeingConcern: z.string().optional(),
});

export const onboardingRouter = router({
  submitQuiz: publicProcedure
    .input(QuizAnswersSchema)
    .mutation(async ({ ctx, input }) => {
      // Fetch all active, audited roles
      const roles = await ctx.prisma.role.findMany({
        where: { isActive: true },
        include: {
          audit: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            select: {
              badge: true,
              compositeScore: true,
              createdAt: true,
            },
          },
        },
      });

      if (!roles.length) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'No active roles found' });
      }

      // Score each role against quiz answers
      const scored = roles.map(role => {
        let score = 0;

        // Category match — highest weight
        if (role.category === input.primaryGoalCategory) score += 50;

        // Age group handling
        const tags = (role.tags as string[]) ?? [];
        if (input.ageGroup === 'child' && tags.includes('children')) score += 30;
        if (input.ageGroup === 'elderly' && tags.includes('elderly')) score += 30;
        if (input.ageGroup === 'teen' && tags.includes('teen')) score += 20;

        // Subject/domain match
        if (input.subject && role.domain) {
          const domain = role.domain.toLowerCase();
          const subject = input.subject.toLowerCase();
          if (domain.includes(subject)) score += 25;
          if (domain === subject) score += 10; // exact match bonus
        }

        // Qualification level match
        const qualLevels = (role.qualificationLevels as string[]) ?? [];
        if (input.qualLevel && qualLevels.includes(input.qualLevel)) score += 15;

        // Gender preference
        if (input.companionGender && input.companionGender !== 'no_preference') {
          if (role.gender === input.companionGender) score += 8;
        }

        // Trust Score bonus (quality signal)
        const trustScore = role.audit[0]?.compositeScore ?? 70;
        score += (trustScore - 70) * 0.2; // bonus for above-average trust

        // Badge bonus
        if (role.audit[0]?.badge === 'PLATINUM') score += 5;
        if (role.audit[0]?.badge === 'GOLD') score += 3;

        return { role, score };
      });

      // Sort descending, take top recommendation
      scored.sort((a, b) => b.score - a.score);
      const best = scored[0];

      if (!best || best.score < 20) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'No suitable companion found for these answers. Please try different options.',
        });
      }

      // Generate personalised first message (the Aha Moment trigger)
      const firstMessage = generateFirstMessage(
        best.role as any,
        input as QuizAnswers,
        best.role.defaultCompanionName ?? best.role.name,
      );

      // Store quiz response
      const quizResponse = await ctx.prisma.quizResponse.create({
        data: {
          userId: ctx.session?.userId ?? null,
          sessionToken: ctx.session?.sessionToken ?? null,
          answers: input as any,
          recommendedRoleSlug: best.role.slug,
          matchScore: Math.round(best.score),
        },
      });

      // Track mission metric
      await ctx.prisma.missionMetric.create({
        data: {
          metricType: 'onboarding_completed',
          userId: ctx.session?.userId ?? 'anonymous',
          description: `Quiz completed, routed to ${best.role.slug} (score: ${Math.round(best.score)})`,
        },
      });

      return {
        quizId: quizResponse.id,
        recommendedRole: {
          slug: best.role.slug,
          name: best.role.name,
          companionName: best.role.defaultCompanionName,
          category: best.role.category,
          shortDescription: best.role.shortDescription,
          emoji: best.role.emoji,
          badge: best.role.audit[0]?.badge ?? 'BASIC',
          trustScore: best.role.audit[0]?.compositeScore ?? 0,
        },
        firstMessage,
        matchScore: Math.round(best.score),
        alternativeRoles: scored.slice(1, 3).map(s => ({
          slug: s.role.slug,
          name: s.role.name,
          companionName: s.role.defaultCompanionName,
          emoji: s.role.emoji,
          matchScore: Math.round(s.score),
        })),
      };
    }),

  // Get quiz result after auth (to complete hire flow)
  getQuizResult: publicProcedure
    .input(z.object({ quizId: z.string() }))
    .query(async ({ ctx, input }) => {
      const quiz = await ctx.prisma.quizResponse.findUniqueOrThrow({
        where: { id: input.quizId },
      });
      const role = await ctx.prisma.role.findUniqueOrThrow({
        where: { slug: quiz.recommendedRoleSlug },
        include: { audit: { take: 1, orderBy: { createdAt: 'desc' } } },
      });
      return { quiz, role };
    }),
});

// ── VERIFICATION ──────────────────────────────────────────────────────────
// After implementing, run:
// curl -X POST http://localhost:3000/api/trpc/onboarding.submitQuiz \
//   -H "Content-Type: application/json" \
//   -d '{"json":{"primaryGoalCategory":"education","ageGroup":"teen",
//         "subject":"maths","qualLevel":"gcse","examDate":"2026-09-15",
//         "companionGender":"female","availableTime":"30"}}'
// Expected response MUST contain:
//   - result.data.json.recommendedRole.slug (not null, not empty)
//   - result.data.json.firstMessage (contains exam date reference)
//   - result.data.json.matchScore (> 20)
// FAIL if firstMessage is generic ("how can I help you today") — it must
// reference something from the quiz answers
```

---

# ════════════════════════════════════════════════════════════════════════════
# PHASE 4 — THE VISIBLE BRAIN
# ════════════════════════════════════════════════════════════════════════════

```typescript
// server/src/lib/brain/generateMemoryNote.ts
import { differenceInDays } from 'date-fns';
import { prisma } from '../db';

export interface SessionMetadata {
  sessionId: string;
  durationMinutes: number;
  topicsCovered: string[];
  correctAnswers?: number;
  totalQuestions?: number;
  struggledWith?: string[];
  breakthrough?: string;
  nextFocus?: string;
  examDate?: string;
  examSubject?: string;
  sessionMode: string;
  humanConnectionPromptDelivered?: boolean;
  examScore?: number;
  previousExamScore?: number;
}

export async function generateMemoryNote(
  hireId: string,
  metadata: SessionMetadata,
): Promise<void> {
  const hire = await prisma.hire.findUniqueOrThrow({
    where: { id: hireId },
    include: {
      role: { select: { defaultCompanionName: true, category: true } },
      user: { select: { firstName: true } },
      memory: true,
    },
  });

  const companionName = hire.customName ?? hire.role.defaultCompanionName ?? 'Your companion';
  const userName = hire.user.firstName ?? 'You';
  const parts: string[] = [];

  // Build human-readable memory note in companion voice
  if (metadata.topicsCovered.length > 0) {
    parts.push(`${userName} worked through ${metadata.topicsCovered.join(', ')}`);
  }

  if (metadata.correctAnswers !== undefined && metadata.totalQuestions !== undefined) {
    const pct = Math.round((metadata.correctAnswers / metadata.totalQuestions) * 100);
    parts.push(`${metadata.correctAnswers} of ${metadata.totalQuestions} correct (${pct}%)`);
  }

  if (metadata.breakthrough) {
    parts.push(`breakthrough: ${metadata.breakthrough}`);
  }

  if (metadata.struggledWith && metadata.struggledWith.length > 0) {
    parts.push(`still hesitating on ${metadata.struggledWith.join(' and ')} — worth returning to`);
  }

  if (metadata.examDate) {
    const daysLeft = differenceInDays(new Date(metadata.examDate), new Date());
    if (daysLeft > 0) {
      parts.push(
        metadata.examSubject
          ? `${metadata.examSubject} exam is ${daysLeft} days away`
          : `exam is ${daysLeft} days away`
      );
    }
  }

  const content = parts.length > 0 ? parts.join('. ') + '.' : `Session completed (${metadata.durationMinutes} min).`;

  // Store memory note
  await prisma.brainMemoryEntry.create({
    data: {
      hireId,
      sessionId: metadata.sessionId,
      content,
      topicsCovered: metadata.topicsCovered,
      nextFocus: metadata.nextFocus ?? metadata.struggledWith?.[0] ?? null,
      correctRate: metadata.totalQuestions
        ? (metadata.correctAnswers ?? 0) / metadata.totalQuestions
        : null,
      breakthrough: metadata.breakthrough ?? null,
    },
  });

  // Update hire memory
  const existingMemory = hire.memory;
  if (existingMemory) {
    await prisma.hireMemory.update({
      where: { hireId },
      data: {
        lastSessionSummary: content,
        nextSessionFocus: metadata.nextFocus ?? metadata.struggledWith?.[0] ?? null,
        updatedAt: new Date(),
      },
    });
  }

  // Update hire streak and session count
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const wasYesterday = hire.lastSessionAt && hire.lastSessionAt >= yesterday;

  await prisma.hire.update({
    where: { id: hireId },
    data: {
      lastSessionAt: new Date(),
      sessionCount: { increment: 1 },
      totalMinutes: { increment: metadata.durationMinutes },
      streakDays: wasYesterday ? { increment: 1 } : 1,
    },
  });
}
```

```typescript
// server/src/routers/brain.ts — Brain router (add to existing or create)
import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';

export const brainRouter = router({
  // Get all memory notes for a hire — the relationship journal
  getMemoryNotes: protectedProcedure
    .input(z.object({
      hireId: z.string(),
      limit: z.number().int().min(1).max(100).default(20),
      cursor: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      // Verify ownership
      await ctx.prisma.hire.findFirstOrThrow({
        where: { id: input.hireId, userId: ctx.session.userId },
      });

      const items = await ctx.prisma.brainMemoryEntry.findMany({
        where: { hireId: input.hireId },
        orderBy: { entryDate: 'desc' },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        select: {
          id: true,
          entryDate: true,
          content: true,
          topicsCovered: true,
          nextFocus: true,
          correctRate: true,
          breakthrough: true,
          userEdited: true,
          userAddedNote: true,
        },
      });

      const hasMore = items.length > input.limit;
      const notes = hasMore ? items.slice(0, -1) : items;

      return {
        notes,
        nextCursor: hasMore ? notes[notes.length - 1]?.id : null,
        total: await ctx.prisma.brainMemoryEntry.count({ where: { hireId: input.hireId } }),
      };
    }),

  // User edits a memory note (their right — it's their Brain)
  editMemoryNote: protectedProcedure
    .input(z.object({
      entryId: z.string(),
      content: z.string().min(1).max(3000).optional(),
      userAddedNote: z.string().max(1000).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership through hire chain
      await ctx.prisma.brainMemoryEntry.findFirstOrThrow({
        where: {
          id: input.entryId,
          hire: { userId: ctx.session.userId },
        },
      });

      return ctx.prisma.brainMemoryEntry.update({
        where: { id: input.entryId },
        data: {
          ...(input.content !== undefined && { content: input.content }),
          ...(input.userAddedNote !== undefined && { userAddedNote: input.userAddedNote }),
          userEdited: true,
          userEditAt: new Date(),
        },
      });
    }),

  // Get Brain summary for a hire (shown on companion card)
  getBrainSummary: protectedProcedure
    .input(z.object({ hireId: z.string() }))
    .query(async ({ ctx, input }) => {
      const hire = await ctx.prisma.hire.findFirstOrThrow({
        where: { id: input.hireId, userId: ctx.session.userId },
        include: {
          memory: true,
          brainMemoryEntries: {
            take: 1,
            orderBy: { entryDate: 'desc' },
            select: { content: true, nextFocus: true, entryDate: true },
          },
          milestones: { orderBy: { earnedAt: 'desc' }, take: 5 },
        },
      });

      return {
        sessionCount: hire.sessionCount,
        totalMinutes: hire.totalMinutes,
        streakDays: hire.streakDays,
        lastSessionAt: hire.lastSessionAt,
        nextFocus: hire.memory?.nextSessionFocus ?? null,
        lastNote: hire.brainMemoryEntries[0] ?? null,
        milestones: hire.milestones,
        examDate: hire.memory?.examDate ?? null,
        wellbeingScore: hire.memory?.wellbeingScore ?? null,
      };
    }),

  // Create a progress share token
  createProgressShare: protectedProcedure
    .input(z.object({
      hireId: z.string(),
      sharedWith: z.string().email(),
      relationship: z.enum(['parent','teacher','gp','employer','other']),
      includeScore: z.boolean().default(true),
      includeTopics: z.boolean().default(true),
      includeStreak: z.boolean().default(true),
      expiresInDays: z.number().int().min(1).max(365).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const hire = await ctx.prisma.hire.findFirstOrThrow({
        where: { id: input.hireId, userId: ctx.session.userId },
        include: {
          role: { select: { defaultCompanionName: true, name: true } },
          user: { select: { firstName: true } },
        },
      });

      const share = await ctx.prisma.progressShare.create({
        data: {
          hireId: input.hireId,
          sharedWith: input.sharedWith,
          relationship: input.relationship,
          includeScore: input.includeScore,
          includeTopics: input.includeTopics,
          includeStreak: input.includeStreak,
          expiresAt: input.expiresInDays
            ? new Date(Date.now() + input.expiresInDays * 86400000)
            : null,
        },
      });

      // Send email to recipient (fire-and-forget, don't block)
      void ctx.emailQueue.add('progress-share', {
        to: input.sharedWith,
        relationship: input.relationship,
        userName: hire.user.firstName,
        companionName: hire.customName ?? hire.role.defaultCompanionName,
        shareUrl: `${process.env.NEXT_PUBLIC_APP_URL}/progress/${share.shareToken}`,
      });

      // Log to audit trail
      await ctx.prisma.platformAuditLog.create({
        data: {
          userId: ctx.session.userId,
          action: 'progress_share.created',
          entityType: 'ProgressShare',
          entityId: share.id,
          newValue: { sharedWith: input.sharedWith, relationship: input.relationship },
        },
      });

      return { shareToken: share.shareToken, shareId: share.id };
    }),

  // Public route — view shared progress (no session content ever)
  getSharedProgress: protectedProcedure.meta({ isPublic: true })
    .input(z.object({ token: z.string() }))
    .query(async ({ ctx, input }) => {
      const share = await ctx.prisma.progressShare.findUniqueOrThrow({
        where: { shareToken: input.token },
        include: {
          hire: {
            include: {
              role: { select: { name: true, defaultCompanionName: true, category: true } },
              user: { select: { firstName: true } },
              memory: true,
              milestones: { orderBy: { earnedAt: 'desc' }, take: 5 },
              brainMemoryEntries: {
                take: 5,
                orderBy: { entryDate: 'desc' },
                select: { topicsCovered: true, nextFocus: true, entryDate: true },
              },
            },
          },
        },
      });

      if (share.expiresAt && new Date() > share.expiresAt) {
        throw new Error('This progress share has expired');
      }

      // Update view count
      void ctx.prisma.progressShare.update({
        where: { shareToken: input.token },
        data: { lastViewedAt: new Date(), viewCount: { increment: 1 } },
      });

      return {
        userName: share.hire.user.firstName,
        companionName: share.hire.customName ?? share.hire.role.defaultCompanionName,
        roleName: share.hire.role.name,
        sessionsCompleted: share.hire.sessionCount,
        totalMinutes: share.hire.totalMinutes,
        ...(share.includeStreak && { streakDays: share.hire.streakDays }),
        ...(share.includeScore && {
          wellbeingScore: share.hire.memory?.wellbeingScore ?? null,
        }),
        ...(share.includeTopics && {
          recentTopics: share.hire.brainMemoryEntries.flatMap(e => e.topicsCovered),
          nextFocus: share.hire.memory?.nextSessionFocus ?? null,
        }),
        milestones: share.hire.milestones.map(m => m.type),
        // NEVER includes: session content, messages, systemPrompt, personal details
      };
    }),
});

// ── VERIFICATION ──────────────────────────────────────────────────────────
// 1. End a test session
// 2. SELECT * FROM "BrainMemoryEntry" WHERE "hireId"='<test-hire-id>'
//    Expected: 1 row with content, topicsCovered, nextFocus
// 3. curl GET /api/trpc/brain.getMemoryNotes?input={"hireId":"<id>"}
//    Expected: { notes: [{ content: "...", entryDate: "..." }], total: 1 }
// FAIL if: no row, content is null/empty, or endpoint returns error
```

---

# ════════════════════════════════════════════════════════════════════════════
# PHASE 5 — INTELLIGENT NOTIFICATIONS
# ════════════════════════════════════════════════════════════════════════════

```typescript
// server/src/lib/notifications/intelligentNotifications.ts
// COMPLETE implementation — every notification references specific context.
// Generic "time to learn!" notifications are not acceptable.

import { differenceInDays, differenceInHours } from 'date-fns';
import { prisma } from '../db';
import { notificationQueue } from '../queues/notificationQueue';

export type NotificationType =
  | 'exam_approaching'
  | 'streak_at_risk'
  | 'return_prompt'
  | 'interview_prep'
  | 'human_connection_prompt'
  | 'milestone_earned'
  | 'review_prompt'
  | 'wellbeing_check';

interface NotificationPayload {
  title: string;
  body: string;
  urgency: 'low' | 'normal' | 'high' | 'critical';
  actionUrl?: string;
  contextData: Record<string, unknown>;
}

export async function generateIntelligentNotification(
  hireId: string,
  type: NotificationType,
): Promise<NotificationPayload | null> {
  const hire = await prisma.hire.findUnique({
    where: { id: hireId },
    include: {
      role: { select: { name: true, defaultCompanionName: true, category: true } },
      user: { select: { firstName: true, id: true } },
      memory: true,
      brainMemoryEntries: {
        take: 1,
        orderBy: { entryDate: 'desc' },
        select: { topicsCovered: true, nextFocus: true, content: true },
      },
    },
  });

  if (!hire) return null;

  const companion = hire.customName ?? hire.role.defaultCompanionName ?? 'Your companion';
  const memory = hire.memory;
  const lastNote = hire.brainMemoryEntries[0];

  switch (type) {
    case 'exam_approaching': {
      if (!memory?.examDate) return null;
      const daysLeft = differenceInDays(new Date(memory.examDate), new Date());
      if (daysLeft <= 0 || daysLeft > 14) return null;

      const topicMissed = memory.nextSessionFocus ?? lastNote?.nextFocus;
      if (daysLeft <= 2) {
        return {
          title: `${daysLeft === 1 ? 'Tomorrow' : '2 days'} until your exam`,
          body: topicMissed
            ? `${companion} wants to run through ${topicMissed} with you one more time. 20 minutes could make a difference.`
            : `${companion} is ready for a final revision session. You've prepared well — let's finish strong.`,
          urgency: 'critical',
          actionUrl: `/dashboard/hire/${hireId}/session`,
          contextData: { daysLeft, examDate: memory.examDate, topicMissed },
        };
      }
      if (daysLeft <= 7 && topicMissed) {
        return {
          title: `One week to go`,
          body: `You haven't covered ${topicMissed} yet. ${companion} has a focused plan — 30 minutes tonight?`,
          urgency: 'high',
          actionUrl: `/dashboard/hire/${hireId}/session`,
          contextData: { daysLeft, topicMissed },
        };
      }
      return {
        title: `${daysLeft} days until your exam`,
        body: topicMissed
          ? `${companion} recommends focusing on ${topicMissed} today. You're on track — keep it up.`
          : `${companion} has your revision plan ready. When do you want to start today?`,
        urgency: 'normal',
        actionUrl: `/dashboard/hire/${hireId}/session`,
        contextData: { daysLeft },
      };
    }

    case 'streak_at_risk': {
      if (!hire.streakDays || hire.streakDays < 3) return null;
      const hoursSinceLast = hire.lastSessionAt
        ? differenceInHours(new Date(), hire.lastSessionAt)
        : 999;
      if (hoursSinceLast < 18 || hoursSinceLast > 30) return null; // Only send in the risk window

      return {
        title: `Don't break your ${hire.streakDays}-day streak`,
        body: `${companion} noticed you haven't checked in today. 15 minutes keeps the streak alive.`,
        urgency: 'normal',
        actionUrl: `/dashboard/hire/${hireId}/session`,
        contextData: { streakDays: hire.streakDays, hoursSinceLast },
      };
    }

    case 'return_prompt': {
      if (!hire.lastSessionAt) return null;
      const daysSince = differenceInDays(new Date(), hire.lastSessionAt);
      if (daysSince < 5) return null; // Don't hassle recent users

      const lastTopic = lastNote?.topicsCovered?.[0];
      return {
        title: `${companion} has been thinking about you`,
        body: lastTopic
          ? `It's been ${daysSince} days. ${companion} was thinking about what you covered — ${lastTopic}. Ready to pick up where you left off?`
          : `It's been ${daysSince} days since your last session. ${companion} is here whenever you're ready.`,
        urgency: daysSince > 14 ? 'normal' : 'low',
        actionUrl: `/dashboard/hire/${hireId}/session`,
        contextData: { daysSince, lastTopic },
      };
    }

    case 'interview_prep': {
      if (!memory?.interviewDate) return null;
      const daysLeft = differenceInDays(new Date(memory.interviewDate), new Date());
      if (daysLeft <= 0 || daysLeft > 7) return null;

      return {
        title: `Interview in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`,
        body: `${companion} can run through your toughest questions right now. Every practice rep counts.`,
        urgency: daysLeft <= 2 ? 'high' : 'normal',
        actionUrl: `/dashboard/hire/${hireId}/session`,
        contextData: { daysLeft, interviewDate: memory.interviewDate },
      };
    }

    case 'human_connection_prompt': {
      // Gentle, warm, periodic — never more than once a fortnight per hire
      return {
        title: `A gentle nudge from ${companion}`,
        body: `Is there someone in your life you've been meaning to call? I'll still be here after. 💙`,
        urgency: 'low',
        actionUrl: null,
        contextData: { type: 'anti_dependency' },
      };
    }

    case 'review_prompt': {
      if (hire.sessionCount < 5) return null;
      const alreadyReviewed = await prisma.companionReview.count({
        where: { userId: hire.userId, roleId: hire.roleId },
      });
      if (alreadyReviewed > 0) return null;

      return {
        title: `How has ${companion} been?`,
        body: `You've completed ${hire.sessionCount} sessions together. Your story could help someone else find the right companion.`,
        urgency: 'low',
        actionUrl: `/marketplace/role/${hire.roleId}#review`,
        contextData: { sessionCount: hire.sessionCount },
      };
    }

    default:
      return null;
  }
}

// Scheduler — runs via BullMQ cron jobs
export async function scheduleIntelligentNotifications(): Promise<void> {
  const hires = await prisma.hire.findMany({
    where: {
      isActive: true,
      user: { pushSubscription: { not: null } },
    },
    select: { id: true, memory: true, lastSessionAt: true, streakDays: true },
  });

  for (const hire of hires) {
    // Determine which notification type is most relevant
    let type: NotificationType | null = null;

    const memory = hire.memory as { examDate?: string; interviewDate?: string } | null;

    if (memory?.examDate) {
      const daysToExam = differenceInDays(new Date(memory.examDate), new Date());
      if (daysToExam >= 1 && daysToExam <= 14) type = 'exam_approaching';
    } else if (memory?.interviewDate) {
      const daysToInterview = differenceInDays(new Date(memory.interviewDate), new Date());
      if (daysToInterview >= 1 && daysToInterview <= 7) type = 'interview_prep';
    } else if (hire.lastSessionAt) {
      const hoursSince = differenceInHours(new Date(), hire.lastSessionAt);
      if (hoursSince >= 18 && hoursSince <= 30 && hire.streakDays >= 3) {
        type = 'streak_at_risk';
      } else if (hoursSince >= 120) { // 5 days
        type = 'return_prompt';
      }
    }

    if (!type) continue;

    const payload = await generateIntelligentNotification(hire.id, type);
    if (!payload) continue;

    await notificationQueue.add('send-push', {
      hireId: hire.id,
      ...payload,
    });
  }
}
```

---

# ════════════════════════════════════════════════════════════════════════════
# PHASE 6 — FULL AUDIT TRANSPARENCY
# ════════════════════════════════════════════════════════════════════════════

```typescript
// server/src/routers/roles.ts — add to existing roles router

getFullAuditDetail: publicProcedure
  .input(z.object({ slug: z.string() }))
  .query(async ({ ctx, input }) => {
    const role = await ctx.prisma.role.findUniqueOrThrow({
      where: { slug: input.slug, isActive: true },
      include: {
        audit: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            checks: {
              orderBy: { checkNumber: 'asc' },
              select: {
                checkNumber: true,
                checkName: true,
                category: true,
                passed: true,
                notes: true,
                severity: true,
              },
            },
          },
        },
        reviews: {
          where: { verified: true, adminApproved: true },
          orderBy: [{ helpfulCount: 'desc' }, { createdAt: 'desc' }],
          take: 10,
          select: {
            id: true,
            rating: true,
            story: true,
            outcome: true,
            sessionCount: true,
            createdAt: true,
            user: { select: { firstName: true } },
          },
        },
        hires: { select: { id: true }, take: 1 }, // For count only
        _count: { select: { hires: true, reviews: true } },
      },
    });

    const latestAudit = role.audit[0];

    // Compute review stats
    const avgRating = role.reviews.length > 0
      ? role.reviews.reduce((s, r) => s + r.rating, 0) / role.reviews.length
      : null;

    return {
      // Core
      slug: role.slug,
      name: role.name,
      companionName: role.defaultCompanionName,
      category: role.category,
      shortDescription: role.shortDescription,
      fullDescription: role.fullDescription,
      emoji: role.emoji,
      tags: role.tags,
      skills: role.skills,
      environments: role.environments,
      qualificationLevels: role.qualificationLevels,
      certificationTags: role.certificationTags,
      sessionModes: role.sessionModes,

      // Trust — the full story
      trustScore: latestAudit?.compositeScore ?? null,
      badge: latestAudit?.badge ?? 'BASIC',
      auditDate: latestAudit?.createdAt ?? null,
      nextAuditDue: latestAudit?.nextAuditDate ?? null,

      // Cryptographic proof
      artefactHash: latestAudit?.artefactHash ?? null,
      artefactHashAlgorithm: 'SHA-256',
      artefactHashExplanation: "This hash is computed from the companion's complete system prompt. It proves the companion you're talking to today is byte-for-byte identical to the one reviewed by our expert panel. Any modification would produce a completely different hash.",

      // The 47 checks — visible, expandable
      auditChecks: latestAudit?.checks ?? [],
      checksPassed: latestAudit?.checks.filter(c => c.passed).length ?? 0,
      checksTotal: latestAudit?.checks.length ?? 47,

      // Human expert review — this is what makes it real
      expertReview: latestAudit?.expertReviewText ?? null,
      expertName: latestAudit?.reviewerName ?? null,
      expertCredentials: latestAudit?.reviewerCredentials ?? null,
      expertYearsExperience: latestAudit?.reviewerYearsExperience ?? null,

      // Social proof
      reviews: role.reviews,
      totalReviews: role._count.reviews,
      verifiedReviews: role.reviews.filter(r => r).length,
      averageRating: avgRating ? parseFloat(avgRating.toFixed(1)) : null,
      totalHires: role._count.hires,
    };
  }),

// Verification:
// curl -X POST http://localhost:3000/api/trpc/roles.getFullAuditDetail \
//   -H "Content-Type: application/json" \
//   -d '{"json":{"slug":"gcse-maths-tutor-f"}}'
// MUST return:
//   artefactHash: "sha256:..." (not null)
//   auditChecks: array of 47 items (not [])
//   expertReview: "Professor Williams noted..." (not null)
//   reviews: at least 1 verified review (from seed data)
// FAIL if any of the above is null or empty
```

---

# ════════════════════════════════════════════════════════════════════════════
# PHASE 7 — SOCIAL LAYER (Reviews + Study Groups)
# ════════════════════════════════════════════════════════════════════════════

```typescript
// server/src/routers/reviews.ts — COMPLETE
import { z } from 'zod';
import { router, protectedProcedure, publicProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

export const reviewsRouter = router({
  submit: protectedProcedure
    .input(z.object({
      roleId: z.string(),
      rating: z.number().int().min(1).max(5),
      story: z.string().min(50, 'Please share at least a short story (50+ characters)').max(2000),
      outcome: z.string().max(300).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Must have 5+ sessions with this specific role
      const hire = await ctx.prisma.hire.findFirst({
        where: {
          userId: ctx.session.userId,
          roleId: input.roleId,
          sessionCount: { gte: 5 },
          isActive: true,
        },
      });

      if (!hire) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You must complete at least 5 sessions with this companion before leaving a review. This keeps our reviews meaningful and verified.',
        });
      }

      const review = await ctx.prisma.companionReview.upsert({
        where: { roleId_userId: { roleId: input.roleId, userId: ctx.session.userId } },
        create: {
          roleId: input.roleId,
          userId: ctx.session.userId,
          rating: input.rating,
          story: input.story,
          outcome: input.outcome,
          verified: true,
          sessionCount: hire.sessionCount,
        },
        update: {
          rating: input.rating,
          story: input.story,
          outcome: input.outcome,
          updatedAt: new Date(),
        },
      });

      await ctx.prisma.platformAuditLog.create({
        data: {
          userId: ctx.session.userId,
          action: 'review.submitted',
          entityType: 'CompanionReview',
          entityId: review.id,
          newValue: { rating: input.rating, roleId: input.roleId, verified: true },
        },
      });

      // Check if this review brings average below threshold → trigger re-audit
      const allReviews = await ctx.prisma.companionReview.findMany({
        where: { roleId: input.roleId, verified: true, createdAt: { gte: new Date(Date.now() - 30 * 86400000) } },
        select: { rating: true },
      });
      if (allReviews.length >= 3) {
        const avg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;
        if (avg < 3.5) {
          await ctx.prisma.companionReAuditTrigger.upsert({
            where: { roleId_triggerType: { roleId: input.roleId, triggerType: 'review_decline' } } as any,
            create: {
              roleId: input.roleId,
              triggerType: 'review_decline',
              reason: `Average review dropped to ${avg.toFixed(1)} over last 30 days (${allReviews.length} reviews)`,
              dueBy: new Date(Date.now() + 14 * 86400000),
            },
            update: {
              reason: `Average review dropped to ${avg.toFixed(1)} — updated ${new Date().toISOString()}`,
              status: 'PENDING',
            },
          });
        }
      }

      return review;
    }),

  markHelpful: protectedProcedure
    .input(z.object({ reviewId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.companionReview.update({
        where: { id: input.reviewId },
        data: { helpfulCount: { increment: 1 } },
      });
    }),

  getForRole: publicProcedure
    .input(z.object({
      roleId: z.string(),
      limit: z.number().int().default(10),
      cursor: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const reviews = await ctx.prisma.companionReview.findMany({
        where: { roleId: input.roleId, verified: true, adminApproved: true },
        orderBy: [{ helpfulCount: 'desc' }, { createdAt: 'desc' }],
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        select: {
          id: true,
          rating: true,
          story: true,
          outcome: true,
          sessionCount: true,
          helpfulCount: true,
          createdAt: true,
          user: { select: { firstName: true } },
        },
      });
      const hasMore = reviews.length > input.limit;
      return {
        reviews: hasMore ? reviews.slice(0, -1) : reviews,
        nextCursor: hasMore ? reviews[reviews.length - 2]?.id : null,
      };
    }),
});

// server/src/routers/studyGroups.ts — COMPLETE
export const studyGroupsRouter = router({
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(3).max(100),
      description: z.string().max(500).optional(),
      roleId: z.string(),
      maxMembers: z.number().int().min(2).max(4).default(4),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify user has hired this role
      const hire = await ctx.prisma.hire.findFirst({
        where: { userId: ctx.session.userId, roleId: input.roleId, isActive: true },
      });
      if (!hire) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You must hire this companion before creating a study group',
        });
      }

      const group = await ctx.prisma.studyGroup.create({
        data: {
          name: input.name,
          description: input.description,
          roleId: input.roleId,
          creatorId: ctx.session.userId,
          maxMembers: input.maxMembers,
          members: {
            create: { userId: ctx.session.userId, role: 'creator' },
          },
        },
        include: {
          role: { select: { name: true, defaultCompanionName: true } },
          members: { include: { user: { select: { firstName: true } } } },
        },
      });
      return group;
    }),

  joinByCode: protectedProcedure
    .input(z.object({ inviteCode: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const group = await ctx.prisma.studyGroup.findUniqueOrThrow({
        where: { inviteCode: input.inviteCode, isActive: true },
        include: {
          members: true,
          role: { select: { id: true, name: true } },
        },
      });

      if (group.members.length >= group.maxMembers) {
        throw new TRPCError({ code: 'CONFLICT', message: 'This study group is full' });
      }

      const alreadyMember = group.members.some(m => m.userId === ctx.session.userId);
      if (alreadyMember) {
        throw new TRPCError({ code: 'CONFLICT', message: 'You are already in this group' });
      }

      // Must have hired the same companion
      const hire = await ctx.prisma.hire.findFirst({
        where: { userId: ctx.session.userId, roleId: group.role.id, isActive: true },
      });
      if (!hire) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `You must hire ${group.role.name} before joining this study group`,
        });
      }

      return ctx.prisma.studyGroupMember.create({
        data: { groupId: group.id, userId: ctx.session.userId, role: 'member' },
      });
    }),
});
```

---

# ════════════════════════════════════════════════════════════════════════════
# PHASE 8 — QUALITY DRIFT PREVENTION
# ════════════════════════════════════════════════════════════════════════════

```typescript
// server/src/lib/auditTriggers/detectQualityDrift.ts
// BullMQ job — runs every Monday 9am UTC
import { differenceInMonths, addDays, addMonths } from 'date-fns';
import { prisma } from '../db';
import { notificationQueue } from '../queues/notificationQueue';

export async function detectCompanionsNeedingReaudit(): Promise<{
  triggered: number;
  checked: number;
}> {
  const roles = await prisma.role.findMany({
    where: { isActive: true },
    include: {
      audit: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { createdAt: true, nextAuditDate: true, compositeScore: true },
      },
      _count: {
        select: {
          reAuditTriggers: { where: { status: { in: ['PENDING', 'IN_REVIEW'] } } },
        },
      },
    },
  });

  let triggered = 0;

  for (const role of roles) {
    // Skip if already has a pending trigger
    if (role._count.reAuditTriggers > 0) continue;

    const lastAudit = role.audit[0];

    // Trigger 1: 6-month periodic re-audit
    if (lastAudit) {
      const months = differenceInMonths(new Date(), lastAudit.createdAt);
      if (months >= 6) {
        await createTrigger(role.id, 'periodic',
          `Last audited ${months} months ago — periodic 6-month review due`,
          addMonths(new Date(), 1));
        triggered++;
        continue;
      }
    } else {
      // Never audited — urgent
      await createTrigger(role.id, 'manual',
        'Role has never been audited',
        addDays(new Date(), 7));
      triggered++;
      continue;
    }

    // Trigger 2: Curriculum year change (education roles)
    if (role.category === 'education') {
      const curriculumYear = (role as any).curriculumYear as number | null;
      if (curriculumYear && curriculumYear < new Date().getFullYear()) {
        await createTrigger(role.id, 'curriculum_change',
          `Role uses ${curriculumYear} curriculum — current year is ${new Date().getFullYear()}`,
          addDays(new Date(), 30));
        triggered++;
        continue;
      }
    }

    // Trigger 3: Low recent review score
    const recentReviews = await prisma.companionReview.findMany({
      where: {
        roleId: role.id,
        verified: true,
        createdAt: { gte: new Date(Date.now() - 30 * 86400000) },
      },
      select: { rating: true },
    });
    if (recentReviews.length >= 3) {
      const avg = recentReviews.reduce((s, r) => s + r.rating, 0) / recentReviews.length;
      if (avg < 3.5) {
        await createTrigger(role.id, 'review_decline',
          `Average review score ${avg.toFixed(1)} in last 30 days (${recentReviews.length} reviews) — threshold is 3.5`,
          addDays(new Date(), 14));
        triggered++;
      }
    }
  }

  return { triggered, checked: roles.length };
}

async function createTrigger(
  roleId: string,
  type: string,
  reason: string,
  dueBy: Date,
): Promise<void> {
  await prisma.companionReAuditTrigger.create({
    data: { roleId, triggerType: type, reason, dueBy, status: 'PENDING' },
  });

  // Notify admin immediately
  await notificationQueue.add('admin-alert', {
    type: 'RE_AUDIT_TRIGGERED',
    roleId,
    triggerType: type,
    reason,
    dueBy: dueBy.toISOString(),
    priority: type === 'manual' ? 'urgent' : 'normal',
  });
}
```

---

# ════════════════════════════════════════════════════════════════════════════
# PHASE 9 — SAFEGUARDING ENGINE
# ════════════════════════════════════════════════════════════════════════════

```typescript
// server/src/lib/safeguarding/escalationEngine.ts
// Called at the END of every session for child/vulnerable accounts.
// Analyses session METADATA ONLY — never message content.

import { differenceInHours, subHours } from 'date-fns';
import { prisma } from '../db';
import { notificationQueue } from '../queues/notificationQueue';

export async function runSafeguardingCheck(
  hireId: string,
  sessionMetadata: {
    sessionId: string;
    durationMinutes: number;
  },
): Promise<void> {
  const hire = await prisma.hire.findUnique({
    where: { id: hireId },
    include: {
      user: {
        select: {
          id: true,
          accountType: true,
          vulnerabilityFlag: true,
          dateOfBirth: true,
          familyLinks: {
            include: { guardian: { select: { id: true, email: true, firstName: true } } },
          },
        },
      },
      memory: { select: { wellbeingScore: true, wellbeingTrend: true } },
    },
  });

  if (!hire) return;

  const user = hire.user;
  const isVulnerable = user.accountType === 'CHILD'
    || user.accountType === 'ELDERLY'
    || user.vulnerabilityFlag === true;

  if (!isVulnerable) return;

  const signals: string[] = [];
  let escalationLevel = 0; // 0=none, 1=notify guardian, 2=human queue

  // Signal 1: Session frequency (5+ sessions in 24 hours)
  const recentCount = await prisma.agentSession.count({
    where: {
      hireId,
      startedAt: { gte: subHours(new Date(), 24) },
    },
  });
  if (recentCount >= 5) {
    signals.push(`${recentCount} sessions in last 24 hours`);
    escalationLevel = Math.max(escalationLevel, 1);
  }

  // Signal 2: After-hours access for child accounts
  if (user.accountType === 'CHILD') {
    const hour = new Date().getHours();
    if (hour >= 23 || hour < 6) {
      signals.push(`Session started at ${hour}:00 — outside safe hours for child accounts`);
      escalationLevel = Math.max(escalationLevel, 1);
    }
  }

  // Signal 3: Wellbeing score critically low or rapidly declining
  const wellbeing = hire.memory;
  if (wellbeing) {
    if (wellbeing.wellbeingScore !== null && wellbeing.wellbeingScore < 30) {
      signals.push(`Wellbeing score critically low: ${wellbeing.wellbeingScore}/100`);
      escalationLevel = Math.max(escalationLevel, 2);
    } else if (wellbeing.wellbeingTrend === 'declining' && wellbeing.wellbeingScore < 50) {
      signals.push(`Wellbeing declining: score ${wellbeing.wellbeingScore}/100 with negative trend`);
      escalationLevel = Math.max(escalationLevel, 1);
    }
  }

  if (escalationLevel === 0) return;

  // Notify guardian(s)
  for (const link of user.familyLinks) {
    await prisma.guardianAlert.create({
      data: {
        userId: link.guardianId,
        childId: user.id,
        hireId,
        alertType: escalationLevel >= 2 ? 'WELLBEING_CONCERN' : 'USAGE_PATTERN',
        signals,
        severity: escalationLevel >= 2 ? 'HIGH' : 'MEDIUM',
      },
    });

    await notificationQueue.add('guardian-alert-email', {
      to: link.guardian.email,
      guardianName: link.guardian.firstName,
      childId: user.id,
      signals,
      severity: escalationLevel >= 2 ? 'HIGH' : 'MEDIUM',
      dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/guardian/dashboard`,
    });
  }

  // Level 2+: Add to human follow-up queue (real person will reach out)
  if (escalationLevel >= 2) {
    await prisma.humanFollowUpQueue.create({
      data: {
        userId: user.id,
        triggerType: 'safeguarding_alert',
        triggerData: { signals, sessionId: sessionMetadata.sessionId, escalationLevel },
        priority: escalationLevel >= 3 ? 'urgent' : 'high',
      },
    });
  }
}
```

---

# ════════════════════════════════════════════════════════════════════════════
# PHASE 10 — MISSION METRICS
# ════════════════════════════════════════════════════════════════════════════

```typescript
// server/src/lib/missionMetrics/trackImpact.ts
import { prisma } from '../db';
import { computeWellbeingScore } from '../wellbeing/computeScore';
import { differenceInDays } from 'date-fns';

const STREAK_MILESTONES = [7, 14, 30, 60, 100, 200, 365];

export async function trackMissionMetrics(
  hireId: string,
  sessionMeta: {
    sessionId: string;
    examScore?: number;
    previousExamScore?: number;
    humanConnectionPromptDelivered?: boolean;
  },
): Promise<void> {
  const hire = await prisma.hire.findUniqueOrThrow({
    where: { id: hireId },
    include: {
      user: {
        select: { id: true, nhsActivations: { select: { id: true } } },
      },
    },
  });

  const metrics: Array<{
    metricType: string;
    value?: number;
    description: string;
  }> = [];

  // Exam score improvement
  if (
    sessionMeta.examScore !== undefined
    && sessionMeta.previousExamScore !== undefined
    && sessionMeta.examScore > sessionMeta.previousExamScore
  ) {
    const improvement = sessionMeta.examScore - sessionMeta.previousExamScore;
    metrics.push({
      metricType: 'exam_improved',
      value: improvement,
      description: `Exam score improved by ${improvement} points (${sessionMeta.previousExamScore} → ${sessionMeta.examScore})`,
    });
  }

  // Wellbeing improvement
  const wellbeing = await computeWellbeingScore(hireId);
  if (wellbeing.trend === 'improving' && wellbeing.changeFromBaseline >= 10) {
    metrics.push({
      metricType: 'wellbeing_improved',
      value: wellbeing.changeFromBaseline,
      description: `Wellbeing improved ${wellbeing.changeFromBaseline} points from baseline`,
    });
  }

  // Streak milestone
  if (STREAK_MILESTONES.includes(hire.streakDays)) {
    metrics.push({
      metricType: 'streak_milestone',
      value: hire.streakDays,
      description: `${hire.streakDays}-day streak reached`,
    });

    // Also award milestone badge
    await prisma.milestone.upsert({
      where: {
        hireId_type: { hireId, type: `STREAK_${hire.streakDays}` },
      },
      create: { hireId, type: `STREAK_${hire.streakDays}`, earnedAt: new Date() },
      update: {},
    });
  }

  // Human connection prompt
  if (sessionMeta.humanConnectionPromptDelivered) {
    metrics.push({
      metricType: 'human_connection_made',
      description: 'Companion encouraged real-world human connection',
    });
  }

  // NHS patient session
  if (hire.user.nhsActivations.length > 0) {
    metrics.push({
      metricType: 'nhs_patient_supported',
      description: 'Session completed by NHS-referred patient',
    });
  }

  // Persist all metrics
  for (const metric of metrics) {
    await prisma.missionMetric.create({
      data: {
        ...metric,
        userId: hire.userId,
        hireId,
      },
    });
  }
}

// Admin: get impact dashboard data
export async function getMissionImpactReport(days = 30) {
  const since = new Date(Date.now() - days * 86400000);
  const metrics = await prisma.missionMetric.groupBy({
    by: ['metricType'],
    _count: { id: true },
    _avg: { value: true },
    _sum: { value: true },
    where: { recordedAt: { gte: since } },
    orderBy: { _count: { id: 'desc' } },
  });
  const totalUsers = await prisma.missionMetric.findMany({
    where: { recordedAt: { gte: since } },
    distinct: ['userId'],
    select: { userId: true },
  });
  return {
    metrics,
    livesImpacted: totalUsers.length,
    periodDays: days,
    generatedAt: new Date().toISOString(),
  };
}
```

---

# ════════════════════════════════════════════════════════════════════════════
# PHASE 11 — SESSION EXCELLENCE
# ════════════════════════════════════════════════════════════════════════════

```typescript
// server/src/lib/environments/ambientAudio.ts
// All 38 environments mapped to ambient audio files in S3

export interface EnvironmentAudio {
  s3Key: string;         // Key in S3 assets bucket
  defaultVolume: number; // 0-100, user can adjust
  loop: boolean;
  fadeInMs: number;
  fadeOutMs: number;
}

export const ENVIRONMENT_AUDIO: Record<string, EnvironmentAudio> = {
  // ── SOCIAL ───────────────────────────────────────────────────────────────
  'pub-quiz-corner':      { s3Key: 'audio/ambient/pub-ambience.mp3',       defaultVolume: 15, loop: true, fadeInMs: 2000, fadeOutMs: 1500 },
  'cosy-sitting-room':    { s3Key: 'audio/ambient/fireplace.mp3',           defaultVolume: 18, loop: true, fadeInMs: 3000, fadeOutMs: 2000 },

  // ── EDUCATION ────────────────────────────────────────────────────────────
  'gcse-classroom':       { s3Key: 'audio/ambient/school-ambience.mp3',    defaultVolume: 10, loop: true, fadeInMs: 1500, fadeOutMs: 1000 },
  'a-level-study':        { s3Key: 'audio/ambient/library-ambience.mp3',   defaultVolume: 8,  loop: true, fadeInMs: 2000, fadeOutMs: 1500 },
  'primary-classroom':    { s3Key: 'audio/ambient/primary-school.mp3',     defaultVolume: 12, loop: true, fadeInMs: 1500, fadeOutMs: 1000 },
  'enchanted-classroom':  { s3Key: 'audio/ambient/magical-ambience.mp3',   defaultVolume: 15, loop: true, fadeInMs: 2000, fadeOutMs: 2000 },
  'university-study':     { s3Key: 'audio/ambient/library-deep.mp3',       defaultVolume: 5,  loop: true, fadeInMs: 2000, fadeOutMs: 1500 },
  'research-library':     { s3Key: 'audio/ambient/library-deep.mp3',       defaultVolume: 5,  loop: true, fadeInMs: 2000, fadeOutMs: 1500 },
  'business-school':      { s3Key: 'audio/ambient/office-ambience.mp3',    defaultVolume: 8,  loop: true, fadeInMs: 1500, fadeOutMs: 1000 },
  'seminar-room':         { s3Key: 'audio/ambient/office-ambience.mp3',    defaultVolume: 6,  loop: true, fadeInMs: 1500, fadeOutMs: 1000 },
  'professional-study':   { s3Key: 'audio/ambient/cafe-ambience.mp3',      defaultVolume: 8,  loop: true, fadeInMs: 2000, fadeOutMs: 1500 },
  'workshop':             { s3Key: 'audio/ambient/workshop-ambience.mp3',  defaultVolume: 12, loop: true, fadeInMs: 1500, fadeOutMs: 1000 },
  'clinical-study':       { s3Key: 'audio/ambient/hospital-calm.mp3',      defaultVolume: 5,  loop: true, fadeInMs: 2000, fadeOutMs: 2000 },

  // ── HEALTH ───────────────────────────────────────────────────────────────
  'therapy-room':         { s3Key: 'audio/ambient/rain-gentle.mp3',        defaultVolume: 20, loop: true, fadeInMs: 3000, fadeOutMs: 2000 },
  "women's-health-room":  { s3Key: 'audio/ambient/nature-calm.mp3',        defaultVolume: 15, loop: true, fadeInMs: 3000, fadeOutMs: 2000 },
  'health-consultation':  { s3Key: 'audio/ambient/nature-calm.mp3',        defaultVolume: 10, loop: true, fadeInMs: 2000, fadeOutMs: 1500 },
  'gym':                  { s3Key: 'audio/ambient/gym-ambience.mp3',        defaultVolume: 20, loop: true, fadeInMs: 1000, fadeOutMs: 1000 },
  'physio-studio':        { s3Key: 'audio/ambient/nature-calm.mp3',        defaultVolume: 12, loop: true, fadeInMs: 2000, fadeOutMs: 1500 },

  // ── NAVIGATION ────────────────────────────────────────────────────────────
  'quiet-room':           { s3Key: 'audio/ambient/silence-white-noise.mp3', defaultVolume: 5,  loop: true, fadeInMs: 2000, fadeOutMs: 2000 },
  'fresh-start-room':     { s3Key: 'audio/ambient/morning-birds.mp3',      defaultVolume: 12, loop: true, fadeInMs: 3000, fadeOutMs: 2000 },

  // ── LANGUAGE ─────────────────────────────────────────────────────────────
  'european-language-studio':     { s3Key: 'audio/ambient/cafe-ambience.mp3',   defaultVolume: 10, loop: true, fadeInMs: 2000, fadeOutMs: 1500 },
  'east-asian-language-studio':   { s3Key: 'audio/ambient/tea-house.mp3',       defaultVolume: 10, loop: true, fadeInMs: 2000, fadeOutMs: 1500 },
  'south-asian-language-studio':  { s3Key: 'audio/ambient/market-calm.mp3',     defaultVolume: 10, loop: true, fadeInMs: 2000, fadeOutMs: 1500 },
  'middle-eastern-language-studio': { s3Key: 'audio/ambient/cafe-arabic.mp3',   defaultVolume: 10, loop: true, fadeInMs: 2000, fadeOutMs: 1500 },
  'sign-language-studio':         { s3Key: 'audio/ambient/silence-white-noise.mp3', defaultVolume: 0, loop: true, fadeInMs: 0, fadeOutMs: 0 },

  // Default fallback
  'default':              { s3Key: 'audio/ambient/gentle-nature.mp3',      defaultVolume: 8,  loop: true, fadeInMs: 2000, fadeOutMs: 1500 },
};

export function getAudioForEnvironment(slug: string): EnvironmentAudio {
  // Try exact match, then prefix match, then default
  if (ENVIRONMENT_AUDIO[slug]) return ENVIRONMENT_AUDIO[slug];
  const prefix = Object.keys(ENVIRONMENT_AUDIO).find(k => slug.startsWith(k.split('-')[0]));
  if (prefix) return ENVIRONMENT_AUDIO[prefix];
  return ENVIRONMENT_AUDIO['default'];
}

// tRPC endpoint for frontend to get audio URL
// roles.getEnvironmentAudio: returns presigned S3 URL for ambient audio
```

```typescript
// server/src/lib/sessions/streamingLatency.ts
// Makes the companion feel like it's thinking, not loading.

export interface StreamingConfig {
  minThinkingMs: number;  // Minimum "thinking" time before response begins
  charsPerChunk: number;  // Characters streamed per chunk
  baseDelayMs: number;    // Base delay between chunks
}

const STREAMING_BY_CATEGORY: Record<string, StreamingConfig> = {
  elderly:     { minThinkingMs: 1200, charsPerChunk: 10, baseDelayMs: 80 },  // Slower, warmer
  health:      { minThinkingMs: 1000, charsPerChunk: 12, baseDelayMs: 60 },  // Considered
  education:   { minThinkingMs: 800,  charsPerChunk: 15, baseDelayMs: 40 },
  language:    { minThinkingMs: 600,  charsPerChunk: 18, baseDelayMs: 35 },
  business:    { minThinkingMs: 600,  charsPerChunk: 20, baseDelayMs: 30 },  // Crisp, efficient
  default:     { minThinkingMs: 800,  charsPerChunk: 15, baseDelayMs: 40 },
};

export function getStreamingConfig(category: string): StreamingConfig {
  return STREAMING_BY_CATEGORY[category] ?? STREAMING_BY_CATEGORY.default;
}

export function chunkDelay(chunk: string, baseMs: number): number {
  // Longer pauses at natural boundaries — feels human, not mechanical
  if (/[.!?]/.test(chunk)) return baseMs * 3;    // End of sentence
  if (/[,;:]/.test(chunk)) return baseMs * 1.5;  // Mid-clause pause
  if (/\n/.test(chunk)) return baseMs * 2;        // Paragraph break
  return baseMs;
}
```

---

# ════════════════════════════════════════════════════════════════════════════
# PHASE 12 — NHS REFERRAL PORTAL
# ════════════════════════════════════════════════════════════════════════════

```typescript
// server/src/routers/nhs.ts — NHS referral portal (under 60 seconds for GPs)
import { z } from 'zod';
import { router, protectedProcedure, adminProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import crypto from 'crypto';

export const nhsRouter = router({
  // GP activates a patient referral (< 60 seconds)
  activatePatientCode: protectedProcedure
    .input(z.object({
      code: z.string().min(6).max(20).toUpperCase(),
    }))
    .mutation(async ({ ctx, input }) => {
      const referralCode = await ctx.prisma.nHSReferralCode.findFirst({
        where: {
          code: input.code.toUpperCase(),
          isActive: true,
          expiresAt: { gt: new Date() },
        },
        include: { activations: { select: { id: true } } },
      });

      if (!referralCode) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'This referral code is invalid or has expired. Please ask your GP for a new code.',
        });
      }

      if (referralCode.activations.length >= referralCode.maxActivations) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'This referral code has reached its maximum activations.',
        });
      }

      // Check user hasn't already activated
      const existingActivation = await ctx.prisma.nHSReferralActivation.findFirst({
        where: { codeId: referralCode.id, userId: ctx.session.userId },
      });
      if (existingActivation) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'You have already activated this referral code.',
        });
      }

      // Activate: create free tier subscription
      const activation = await ctx.prisma.nHSReferralActivation.create({
        data: {
          codeId: referralCode.id,
          userId: ctx.session.userId,
          activatedAt: new Date(),
          expiresAt: new Date(Date.now() + referralCode.durationDays * 86400000),
        },
      });

      // Upgrade user to NHS tier (free)
      await ctx.prisma.user.update({
        where: { id: ctx.session.userId },
        data: {
          subscriptionTier: 'nhs',
          subscriptionExpiresAt: activation.expiresAt,
          nhsActivatedAt: new Date(),
        },
      });

      // Track mission metric
      await ctx.prisma.missionMetric.create({
        data: {
          metricType: 'nhs_patient_supported',
          userId: ctx.session.userId,
          description: `NHS referral activated via code ${input.code}`,
        },
      });

      return {
        success: true,
        expiresAt: activation.expiresAt,
        durationDays: referralCode.durationDays,
        message: `Your NHS access is now active for ${referralCode.durationDays} days.`,
      };
    }),

  // Admin creates batch of referral codes for a GP practice
  createCodeBatch: adminProcedure
    .input(z.object({
      gpPracticeId: z.string(),
      gpPracticeName: z.string(),
      count: z.number().int().min(1).max(100).default(10),
      durationDays: z.number().int().min(7).max(365).default(90),
      maxActivations: z.number().int().min(1).max(1).default(1), // 1 patient per code
    }))
    .mutation(async ({ ctx, input }) => {
      const codes = Array.from({ length: input.count }, () => ({
        code: generateNHSCode(),
        gpPracticeId: input.gpPracticeId,
        gpPracticeName: input.gpPracticeName,
        durationDays: input.durationDays,
        maxActivations: input.maxActivations,
        isActive: true,
        expiresAt: new Date(Date.now() + 365 * 86400000), // Codes valid for 1 year
        createdBy: ctx.session.userId,
      }));

      await ctx.prisma.nHSReferralCode.createMany({ data: codes });

      await ctx.prisma.platformAuditLog.create({
        data: {
          userId: ctx.session.userId,
          action: 'nhs.batch_created',
          entityType: 'NHSReferralCode',
          newValue: { count: input.count, gpPracticeId: input.gpPracticeId },
        },
      });

      return {
        codesCreated: codes.length,
        codes: codes.map(c => c.code),
      };
    }),

  // GP views anonymised outcome report for their patient
  getGPOutcomeReport: protectedProcedure
    .input(z.object({ reportToken: z.string() }))
    .query(async ({ ctx, input }) => {
      const report = await ctx.prisma.nHSOutcomeReport.findUniqueOrThrow({
        where: { gpReportToken: input.reportToken },
        include: {
          activation: {
            select: {
              activatedAt: true,
              expiresAt: true,
              code: { select: { gpPracticeName: true, durationDays: true } },
            },
          },
        },
      });

      // Fully anonymised — no user PII, no session content
      return {
        practiceeName: report.activation.code.gpPracticeName,
        activatedAt: report.activation.activatedAt,
        sessionsCompleted: report.sessionsCompleted,
        wellbeingBefore: report.wellbeingBefore,
        wellbeingAfter: report.wellbeingAfter,
        wellbeingChangePercent: report.wellbeingBefore && report.wellbeingAfter
          ? Math.round(((report.wellbeingAfter - report.wellbeingBefore) / report.wellbeingBefore) * 100)
          : null,
        topicsSummary: report.topicsSummary, // Anonymised topics only
        reportDate: report.reportDate,
        // NO user ID, NO session content, NO messages, NO personal details
      };
    }),
});

function generateNHSCode(): string {
  // NHS-style code: NHS-XXXX-XXXX (easy to read out over phone)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No confusable chars
  const part1 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const part2 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `NHS-${part1}-${part2}`;
}
```

---

# ════════════════════════════════════════════════════════════════════════════
# PHASE 13 — CREATOR PROGRAMME
# ════════════════════════════════════════════════════════════════════════════

```typescript
// server/src/routers/creator.ts — COMPLETE
import { z } from 'zod';
import { router, protectedProcedure, adminProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

export const creatorRouter = router({
  // Expert applies to become a creator
  applyToBeCreator: protectedProcedure
    .input(z.object({
      professionalTitle: z.string().min(5).max(100),
      qualifications: z.array(z.string()).min(1).max(10),
      linkedinUrl: z.string().url().optional(),
      portfolioUrl: z.string().url().optional(),
      proposedRoleName: z.string().min(5).max(100),
      proposedCategory: z.string(),
      proposedDescription: z.string().min(100).max(2000),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check not already applied
      const existing = await ctx.prisma.creatorApplication.findFirst({
        where: { userId: ctx.session.userId, status: { in: ['PENDING', 'APPROVED', 'BUILDING'] } },
      });
      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'You already have an active creator application',
        });
      }

      const application = await ctx.prisma.creatorApplication.create({
        data: {
          userId: ctx.session.userId,
          professionalTitle: input.professionalTitle,
          qualifications: input.qualifications,
          linkedinUrl: input.linkedinUrl,
          portfolioUrl: input.portfolioUrl,
          proposedRoleName: input.proposedRoleName,
          proposedCategory: input.proposedCategory,
          proposedDescription: input.proposedDescription,
          status: 'PENDING',
        },
      });

      // Alert admin team to new application
      await ctx.prisma.platformAuditLog.create({
        data: {
          userId: ctx.session.userId,
          action: 'creator.application_submitted',
          entityType: 'CreatorApplication',
          entityId: application.id,
          newValue: { proposedRoleName: input.proposedRoleName, category: input.proposedCategory },
        },
      });

      return {
        applicationId: application.id,
        status: 'PENDING',
        message: 'Your application has been received. Our team reviews applications within 5 working days.',
      };
    }),

  // Get creator earnings (dashboard)
  getEarnings: protectedProcedure
    .input(z.object({
      months: z.number().int().min(1).max(24).default(6),
    }))
    .query(async ({ ctx, input }) => {
      const since = new Date();
      since.setMonth(since.getMonth() - input.months);

      const earnings = await ctx.prisma.creatorEarning.findMany({
        where: { creatorId: ctx.session.userId, periodStart: { gte: since } },
        include: { role: { select: { name: true, slug: true, emoji: true } } },
        orderBy: { periodStart: 'desc' },
      });

      const totals = earnings.reduce((acc, e) => ({
        gross: acc.gross + e.grossRevenue,
        creatorShare: acc.creatorShare + e.creatorShare,
        hires: acc.hires + e.hireCount,
      }), { gross: 0, creatorShare: 0, hires: 0 });

      return { earnings, totals, months: input.months };
    }),

  // Admin approves a creator application
  approveApplication: adminProcedure
    .input(z.object({
      applicationId: z.string(),
      adminNote: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const app = await ctx.prisma.creatorApplication.update({
        where: { id: input.applicationId },
        data: {
          status: 'APPROVED',
          adminNote: input.adminNote,
          approvedAt: new Date(),
        },
        include: { user: { select: { id: true, email: true, firstName: true } } },
      });

      // Mark user as creator
      await ctx.prisma.user.update({
        where: { id: app.userId },
        data: { isCreator: true, creatorApprovedAt: new Date() },
      });

      // Send approval email
      await ctx.emailQueue.add('creator-approved', {
        to: app.user.email,
        name: app.user.firstName,
        proposedRoleName: app.proposedRoleName,
      });

      return { success: true, userId: app.userId };
    }),
});
```

---

# ════════════════════════════════════════════════════════════════════════════
# PHASE 14 — PRICING FRAMING + EMPTY STATES + STATUS PAGE
# ════════════════════════════════════════════════════════════════════════════

```typescript
// src/lib/pricingCopy.ts — value comparison framing (not subscription cost)
export const PRICING_COPY = {
  starter: {
    comparison: 'Less than one private tutoring session.',
    detail: 'A GCSE tutor charges £65/hour. Your companion is here every evening, knows everything you\'ve covered, and costs less than a single session.',
    forWho: 'For individuals starting with one companion.',
    aha: 'Your companion will remember your name, your exam date, and what you found hard last week. That\'s not a chatbot. That\'s a relationship.',
    callToAction: 'Start for £9.99/month',
  },
  essential: {
    comparison: 'Less than two coffees a week.',
    detail: 'Five companions. Voice cloning. Progress reports your teacher can actually use.',
    forWho: 'For learners who want more than one expert.',
    aha: '£19.99 buys you five companions who all know your history, a voice clone of whoever feels right, and a PDF report that makes parents proud.',
    callToAction: 'Get Essential for £19.99/month',
  },
  family: {
    comparison: 'Less than one family therapy session.',
    detail: 'A private therapist charges £80/hour. Your Family plan covers four people for less.',
    forWho: 'For families who want everyone supported.',
    aha: 'Your daughter has Miss Davies for her GCSEs. Your dad has Dorothy for company. Your husband has Marcus for his MBA. All from one plan.',
    callToAction: 'Protect your family for £24.99/month',
  },
  professional: {
    comparison: 'Less than two hours of a consultant.',
    detail: 'A specialist consultant charges £250/hour. Your Professional plan gives unlimited AI experts briefed with your company knowledge, 24/7.',
    forWho: 'For individuals and small teams who need expert support.',
    aha: 'Every companion knows your OKRs, your brand voice, your customers. That\'s your expert team, not a generic chatbot.',
    callToAction: 'Get Professional for £39.99/month',
  },
  nhs: {
    comparison: 'Free for NHS-referred patients.',
    detail: 'Activated with a GP referral code. No credit card. No waiting list. Available tonight.',
    forWho: 'For patients referred by their GP or social prescriber.',
    aha: '14-month waiting list, or Dr. Patel tonight. Ask your GP for a Trust Agent referral code.',
    callToAction: 'Activate with your NHS code',
  },
} as const;
```

```tsx
// src/components/EmptyStates/EmptyDashboard.tsx
// Shows the FUTURE, not the emptiness. Converts anxious new users.
'use client';
import Link from 'next/link';

const GHOST_COMPANIONS = [
  {
    name: 'Miss Davies',
    role: 'GCSE Maths Tutor',
    emoji: '📐',
    memoryNote: 'Exam on 12 May. Working on integration by parts. 12 sessions. Streak: 8 days.',
    badge: 'PLATINUM',
    score: 96,
    category: 'education',
  },
  {
    name: 'Dr. Patel',
    role: 'Wellness & Anxiety',
    emoji: '🌿',
    memoryNote: 'Focusing on sleep hygiene this week. Anxiety score improving. Streak: 14 days.',
    badge: 'PLATINUM',
    score: 94,
    category: 'health',
  },
  {
    name: 'Dorothy',
    role: 'Daily Companion',
    emoji: '☕',
    memoryNote: 'Asked about the grandchildren today. Mentioned her daughter visiting Sunday.',
    badge: 'GOLD',
    score: 88,
    category: 'daily',
  },
];

export function EmptyDashboard() {
  return (
    <div className="empty-dashboard">
      <div className="empty-dashboard__header">
        <h2>This is what your dashboard looks like</h2>
        <p>
          Once you've hired your first companions, you'll see their memory notes, streaks,
          and everything they remember about you — right here.
        </p>
      </div>

      <div className="empty-dashboard__ghost-grid">
        {GHOST_COMPANIONS.map(companion => (
          <div key={companion.name} className="ghost-companion-card" aria-hidden="true">
            <div className="ghost-companion-card__header">
              <span className="ghost-companion-card__emoji">{companion.emoji}</span>
              <div>
                <h3>{companion.name}</h3>
                <p>{companion.role}</p>
              </div>
              <span className={`badge badge--${companion.badge.toLowerCase()}`}>
                {companion.badge} · {companion.score}
              </span>
            </div>
            <blockquote className="ghost-companion-card__memory">
              <p>"{companion.memoryNote}"</p>
            </blockquote>
          </div>
        ))}
      </div>

      <div className="empty-dashboard__cta">
        <Link href="/onboarding" className="btn btn--primary btn--large">
          Find your companion in 90 seconds →
        </Link>
        <p className="empty-dashboard__subtext">
          8 questions. We'll match you with the right expert.
          <br />
          Your first session is included in your 7-day free trial.
        </p>
      </div>
    </div>
  );
}
```

---

# ════════════════════════════════════════════════════════════════════════════
# PHASE 15 — HOMEPAGE EMOTIONAL RESONANCE
# ════════════════════════════════════════════════════════════════════════════

```tsx
// app/(marketing)/page.tsx — Hero section
// The homepage has one job: make someone feel something before they read anything.
// The first 3 seconds must either make someone recognise themselves or think of someone they love.

export function HeroSection() {
  return (
    <section className="hero">
      {/* Quote-first hero — emotional resonance before product description */}
      <div className="hero__quote-wrapper">
        <blockquote className="hero__opening-quote">
          <p>
            "I've been on the NHS waiting list for 14 months.
            <br />
            Dr. Patel was there within an hour."
          </p>
          <footer>— Alicia, Manchester</footer>
        </blockquote>
      </div>

      <div className="hero__content">
        <h1 className="hero__headline">
          The expert you always{' '}
          <span className="hero__headline--accent">wished you could afford.</span>
        </h1>

        <p className="hero__subheadline">
          Every companion on Trust Agent is independently audited, cryptographically verified,
          and built by qualified experts. And they remember everything about you.
        </p>

        <div className="hero__social-proof-strip">
          {/* Real testimony strips — rotate every 4 seconds */}
          <div className="testimony-strip">
            <span>"Miss Davies helped Jade go from D to B in 6 weeks."</span>
            <span>"Dorothy calls me by name. That sounds small. It isn't."</span>
            <span>"My GP referred me. I didn't even know this existed."</span>
          </div>
        </div>

        <div className="hero__cta-group">
          <a href="/onboarding" className="btn btn--primary btn--large">
            Find your companion — 90 seconds
          </a>
          <a href="/marketplace" className="btn btn--ghost">
            Browse 151 verified companions →
          </a>
        </div>

        <p className="hero__trust-note">
          7-day free trial · No credit card · Cancel anytime
        </p>
      </div>

      {/* Companion preview strip */}
      <div className="hero__companion-strip">
        {/* Pull 6 featured companions from DB via server component */}
      </div>
    </section>
  );
}
```

---

# ════════════════════════════════════════════════════════════════════════════
# PHASE 16 — COMPANION CARD REDESIGN
# ════════════════════════════════════════════════════════════════════════════

```tsx
// src/components/CompanionCard/CompanionCard.tsx
// Airbnb-style: 4 things only. Everything else on the detail page.
// Hire button appears on hover.

interface CompanionCardProps {
  slug: string;
  companionName: string;
  roleTitle: string;
  emoji: string;
  badge: 'PLATINUM' | 'GOLD' | 'SILVER' | 'BASIC';
  trustScore: number;
  category: string;
  isHired?: boolean;
}

export function CompanionCard({
  slug, companionName, roleTitle, emoji,
  badge, trustScore, category, isHired,
}: CompanionCardProps) {
  return (
    <Link href={`/marketplace/companion/${slug}`} className="companion-card">
      {/* Portrait — warm illustrated avatar */}
      <div className={`companion-card__portrait companion-card__portrait--${category}`}>
        <span className="companion-card__emoji" aria-hidden="true">{emoji}</span>
        {isHired && (
          <span className="companion-card__hired-badge" aria-label="Already hired">✓</span>
        )}
      </div>

      {/* The 4 things — nothing more */}
      <div className="companion-card__body">
        <h3 className="companion-card__name">{companionName}</h3>
        <p className="companion-card__role">{roleTitle}</p>
      </div>

      <div className="companion-card__footer">
        <TrustBadge badge={badge} score={trustScore} compact />
      </div>

      {/* Hire button appears on hover — not visible by default */}
      <div className="companion-card__hover-cta" aria-hidden="true">
        <span>{isHired ? 'View companion →' : 'Hire companion →'}</span>
      </div>
    </Link>
  );
}
// Detail page at /marketplace/companion/[slug] has:
// full description, audit record, expert review, 47 checks, reviews, environments, session modes
```

---

# ════════════════════════════════════════════════════════════════════════════
# PHASE 17 — ROUTER REGISTRY (wire everything in)
# ════════════════════════════════════════════════════════════════════════════

```typescript
// server/src/router.ts — COMPLETE ROUTER REGISTRY
// Every router built in this prompt must be registered here.
// If it's not here, the frontend can't reach it.

import { router } from './trpc';

// Existing routers (from previous prompts)
import { rolesRouter } from './routers/roles';
import { hiresRouter } from './routers/hires';
import { sessionsRouter } from './routers/sessions';
import { adminRouter } from './routers/admin';
import { pricingRouter } from './routers/pricing';
import { authRouter } from './routers/auth';
import { notificationsRouter } from './routers/notifications';
import { progressRouter } from './routers/progress';
import { guardianRouter } from './routers/guardian';
import { spacedRepetitionRouter } from './routers/spacedRepetition';
import { featureFlagsRouter } from './routers/featureFlags';
import { webhooksRouter } from './routers/webhooks';
import { systemRouter } from './routers/system';
import { referralsRouter } from './routers/referrals';
import { nhsExistingRouter } from './routers/nhs';

// NEW routers from this prompt
import { onboardingRouter } from './routers/onboarding';
import { brainRouter } from './routers/brain';
import { reviewsRouter } from './routers/reviews';
import { studyGroupsRouter } from './routers/studyGroups';
import { creatorRouter } from './routers/creator';
import { nhsRouter } from './routers/nhs';

export const appRouter = router({
  // Auth & Users
  auth: authRouter,

  // Core product
  roles: rolesRouter,
  hires: hiresRouter,
  sessions: sessionsRouter,

  // Onboarding & Aha Moment
  onboarding: onboardingRouter,

  // Brain & Memory
  brain: brainRouter,

  // Social
  reviews: reviewsRouter,
  studyGroups: studyGroupsRouter,

  // Pricing & Payments
  pricing: pricingRouter,

  // Notifications (intelligent)
  notifications: notificationsRouter,

  // Progress & Reports
  progress: progressRouter,

  // Guardian & Safeguarding
  guardian: guardianRouter,

  // Learning science
  spacedRepetition: spacedRepetitionRouter,

  // NHS
  nhs: nhsRouter,

  // Creator programme
  creator: creatorRouter,

  // Platform features
  featureFlags: featureFlagsRouter,
  webhooks: webhooksRouter,
  referrals: referralsRouter,
  system: systemRouter,

  // Admin
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
```

---

# ════════════════════════════════════════════════════════════════════════════
# PHASE 18 — SESSION ROUTER: WIRE ALL POST-SESSION HOOKS
# ════════════════════════════════════════════════════════════════════════════

```typescript
// server/src/routers/sessions.ts — endSession procedure
// This is the most critical function — it triggers ALL post-session processing

endSession: protectedProcedure
  .input(z.object({
    sessionId: z.string(),
    hireId: z.string(),
    durationMinutes: z.number().int().min(0),
    topicsCovered: z.array(z.string()).default([]),
    correctAnswers: z.number().int().optional(),
    totalQuestions: z.number().int().optional(),
    struggledWith: z.array(z.string()).default([]),
    breakthrough: z.string().optional(),
    nextFocus: z.string().optional(),
    examScore: z.number().optional(),
    previousExamScore: z.number().optional(),
    humanConnectionPromptDelivered: z.boolean().default(false),
    sessionMode: z.string().default('text'),
  }))
  .mutation(async ({ ctx, input }) => {
    // Verify user owns this session
    const session = await ctx.prisma.agentSession.findFirstOrThrow({
      where: { id: input.sessionId, hire: { userId: ctx.session.userId } },
    });

    // Mark session as ended
    await ctx.prisma.agentSession.update({
      where: { id: input.sessionId },
      data: {
        endedAt: new Date(),
        durationMinutes: input.durationMinutes,
        topicsCovered: input.topicsCovered,
        status: 'COMPLETED',
      },
    });

    const metadata = {
      sessionId: input.sessionId,
      durationMinutes: input.durationMinutes,
      topicsCovered: input.topicsCovered,
      correctAnswers: input.correctAnswers,
      totalQuestions: input.totalQuestions,
      struggledWith: input.struggledWith,
      breakthrough: input.breakthrough,
      nextFocus: input.nextFocus,
      examScore: input.examScore,
      previousExamScore: input.previousExamScore,
      humanConnectionPromptDelivered: input.humanConnectionPromptDelivered,
      sessionMode: input.sessionMode,
    };

    // ── FIRE ALL POST-SESSION JOBS (async, do not block response) ──────────
    // These run in background queues — user gets response immediately

    // 1. Write Brain memory note (THE product feature)
    void ctx.sessionQueue.add('generate-memory-note', {
      hireId: input.hireId,
      metadata,
    });

    // 2. Update spaced repetition items for topics covered
    if (input.topicsCovered.length > 0) {
      void ctx.sessionQueue.add('update-spaced-repetition', {
        hireId: input.hireId,
        topicsCovered: input.topicsCovered,
        correctAnswers: input.correctAnswers,
        totalQuestions: input.totalQuestions,
      });
    }

    // 3. Track mission metrics (lives changed)
    void ctx.sessionQueue.add('track-mission-metrics', {
      hireId: input.hireId,
      metadata,
    });

    // 4. Run safeguarding check (children and vulnerable users)
    void ctx.sessionQueue.add('safeguarding-check', {
      hireId: input.hireId,
      sessionMetadata: { sessionId: input.sessionId, durationMinutes: input.durationMinutes },
    });

    // 5. Compute wellbeing score
    void ctx.sessionQueue.add('compute-wellbeing', {
      hireId: input.hireId,
    });

    // 6. Schedule next intelligent notification
    void ctx.sessionQueue.add('schedule-notification', {
      hireId: input.hireId,
      justCompletedSession: true,
    });

    // 7. Check if review should be prompted (5+ sessions)
    void ctx.sessionQueue.add('check-review-prompt', {
      hireId: input.hireId,
      userId: ctx.session.userId,
    });

    return {
      success: true,
      sessionId: input.sessionId,
      durationMinutes: input.durationMinutes,
      message: 'Session completed. Your companion has noted what you covered today.',
    };
  }),
```

---

# ════════════════════════════════════════════════════════════════════════════
# PHASE 19 — BullMQ WORKERS (process all async jobs)
# ════════════════════════════════════════════════════════════════════════════

```typescript
// server/src/workers/sessionWorker.ts — processes all post-session jobs
import { Worker, Queue } from 'bullmq';
import { generateMemoryNote } from '../lib/brain/generateMemoryNote';
import { trackMissionMetrics } from '../lib/missionMetrics/trackImpact';
import { runSafeguardingCheck } from '../lib/safeguarding/escalationEngine';
import { computeWellbeingScore } from '../lib/wellbeing/computeScore';
import { updateSpacedRepetition } from '../lib/spacedRepetition/updateItems';
import { scheduleIntelligentNotifications } from '../lib/notifications/intelligentNotifications';
import { detectCompanionsNeedingReaudit } from '../lib/auditTriggers/detectQualityDrift';
import { connection } from '../lib/redis';

export const sessionQueue = new Queue('session-processing', { connection });
export const notificationQueue = new Queue('notifications', { connection });
export const auditQueue = new Queue('audit-triggers', { connection });

// Session processing worker
new Worker('session-processing', async job => {
  switch (job.name) {
    case 'generate-memory-note':
      await generateMemoryNote(job.data.hireId, job.data.metadata);
      break;
    case 'update-spaced-repetition':
      await updateSpacedRepetition(job.data);
      break;
    case 'track-mission-metrics':
      await trackMissionMetrics(job.data.hireId, job.data.metadata);
      break;
    case 'safeguarding-check':
      await runSafeguardingCheck(job.data.hireId, job.data.sessionMetadata);
      break;
    case 'compute-wellbeing':
      await computeWellbeingScore(job.data.hireId);
      break;
    case 'schedule-notification':
      // Schedule next intelligent notification for this hire
      await scheduleIntelligentNotifications();
      break;
    case 'check-review-prompt':
      // Check if user should be prompted for a review
      break;
    default:
      console.error('Unknown job:', job.name);
  }
}, { connection, concurrency: 10 });

// Weekly re-audit detection (every Monday 9am UTC)
// Add to cron setup:
// auditQueue.add('detect-quality-drift', {}, { repeat: { cron: '0 9 * * 1' } });
```

---

# ════════════════════════════════════════════════════════════════════════════
# PHASE 20 — FINAL PRODUCTION SMOKE TEST
# ════════════════════════════════════════════════════════════════════════════

```bash
#!/bin/bash
# scripts/production-smoke-test.sh
# THE FINAL TEST. Must exit 0 before ANY production deployment.
# Run: bash scripts/production-smoke-test.sh 2>&1 | tee smoke-test-output.log

set -o pipefail
PASS=0; FAIL=0; WARN=0
BASE="${APP_URL:-http://localhost:3000}"
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BOLD='\033[1m'; NC='\033[0m'

pass() { echo -e "${GREEN}✓${NC} $1"; ((PASS++)); }
fail() { echo -e "${RED}✗ FAIL${NC}: $1"; ((FAIL++)); }
warn() { echo -e "${YELLOW}⚠${NC}: $1"; ((WARN++)); }

echo -e "${BOLD}════════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}  TRUST AGENT — PRODUCTION READINESS TEST${NC}"
echo -e "${BOLD}  Mission: Everyone deserves an expert who knows them.${NC}"
echo -e "${BOLD}  $(date)${NC}"
echo -e "${BOLD}════════════════════════════════════════════════════════════${NC}"

# ── STEP 1: Run full previous build verification ──────────────────────────
echo -e "\n${BOLD}[STEP 1] Previous build verification${NC}"
bash scripts/verify-previous-build.sh 2>&1 | grep -E "✓|✗|⚠"
[ ${PIPESTATUS[0]} -eq 0 ] && pass "Previous build: all checks pass" || \
  fail "Previous build: has failures — fix before continuing"

# ── STEP 2: TypeScript clean ──────────────────────────────────────────────
echo -e "\n${BOLD}[STEP 2] TypeScript compilation${NC}"
TS=$(npx tsc --noEmit 2>&1)
TS_COUNT=$(echo "$TS" | grep -c "error TS" || true)
[ "$TS_COUNT" -eq 0 ] && pass "TypeScript: 0 errors" || fail "TypeScript: $TS_COUNT errors"

# ── STEP 3: All new tables ────────────────────────────────────────────────
echo -e "\n${BOLD}[STEP 3] New schema tables${NC}"

check_table() {
  node -e "
    const { PrismaClient } = require('@prisma/client');
    const p = new PrismaClient();
    p['$2'].count().then(n => { console.log('OK:' + n); p.\$disconnect(); })
      .catch(e => { console.log('FAIL:' + e.message); process.exit(1); });
  " 2>/dev/null | { read r; echo "$r" | grep -q "^OK" && pass "Table: $1" || fail "Table: $1 — $r"; }
}

check_table "QuizResponse"              "quizResponse"
check_table "BrainMemoryEntry"          "brainMemoryEntry"
check_table "CompanionReview"           "companionReview"
check_table "CompanionReAuditTrigger"   "companionReAuditTrigger"
check_table "ProgressShare"             "progressShare"
check_table "StudyGroup"                "studyGroup"
check_table "StudyGroupMember"          "studyGroupMember"
check_table "StudyGroupSession"         "studyGroupSession"
check_table "NotificationContext"       "notificationContext"
check_table "HumanFollowUpQueue"        "humanFollowUpQueue"
check_table "MissionMetric"             "missionMetric"
check_table "CreatorApplication"        "creatorApplication"
check_table "CreatorEarning"            "creatorEarning"
check_table "NHSOutcomeReport"          "nHSOutcomeReport"

# ── STEP 4: All new API endpoints ─────────────────────────────────────────
echo -e "\n${BOLD}[STEP 4] New API endpoints${NC}"

api_test() {
  local name="$1"; local proc="$2"; local input="$3"; local expect="$4"
  local result
  result=$(curl -sf -X POST "$BASE/api/trpc/$proc" \
    -H "Content-Type: application/json" \
    -d "{\"json\":$input}" --max-time 15 2>&1)
  echo "$result" | grep -q "$expect" && pass "API: $name" || \
    fail "API: $name — wanted '$expect' got: ${result:0:150}"
}

api_test "Onboarding quiz (education)" \
  "onboarding.submitQuiz" \
  '{"primaryGoalCategory":"education","ageGroup":"teen","subject":"maths","qualLevel":"gcse","examDate":"2026-09-15","companionGender":"female","availableTime":"30"}' \
  '"firstMessage"'

api_test "Onboarding first message is personalised" \
  "onboarding.submitQuiz" \
  '{"primaryGoalCategory":"education","ageGroup":"teen","subject":"maths","qualLevel":"gcse","examDate":"2026-09-15","companionGender":"female"}' \
  '"recommendedRole"'

api_test "Full audit detail" \
  "roles.getFullAuditDetail" \
  '{"slug":"gcse-maths-tutor-f"}' \
  '"artefactHash"'

api_test "Audit checks visible" \
  "roles.getFullAuditDetail" \
  '{"slug":"gcse-maths-tutor-f"}' \
  '"auditChecks"'

api_test "Expert review visible" \
  "roles.getFullAuditDetail" \
  '{"slug":"gcse-maths-tutor-f"}' \
  '"expertReview"'

api_test "System health all services" \
  "system.getHealth" \
  'null' \
  '"database"'

api_test "Pricing tiers in GBP" \
  "pricing.getTiers" \
  'null' \
  '"priceGBP"'

api_test "NHS code format check" \
  "nhs.validateCodeFormat" \
  '{"code":"NHS-TEST-TEST"}' \
  '"valid"'

# ── STEP 5: Feature file presence checks ─────────────────────────────────
echo -e "\n${BOLD}[STEP 5] Feature implementations${NC}"

file_check() {
  local desc="$1"; shift
  local found=0
  for f in "$@"; do
    [ -f "$f" ] && found=1 && break
  done
  [ "$found" -eq 1 ] && pass "File: $desc" || fail "File: $desc — NOT FOUND at: $*"
}

file_check "Onboarding router"        "server/src/routers/onboarding.ts"
file_check "Brain router"             "server/src/routers/brain.ts"
file_check "Reviews router"           "server/src/routers/reviews.ts"
file_check "Study groups router"      "server/src/routers/studyGroups.ts"
file_check "NHS router"               "server/src/routers/nhs.ts"
file_check "Creator router"           "server/src/routers/creator.ts"
file_check "Generate first message"   "server/src/lib/onboarding/generateFirstMessage.ts"
file_check "Generate memory note"     "server/src/lib/brain/generateMemoryNote.ts"
file_check "Intelligent notifications" "server/src/lib/notifications/intelligentNotifications.ts"
file_check "Quality drift detection"  "server/src/lib/auditTriggers/detectQualityDrift.ts"
file_check "Safeguarding engine"      "server/src/lib/safeguarding/escalationEngine.ts"
file_check "Mission metrics"          "server/src/lib/missionMetrics/trackImpact.ts"
file_check "Ambient audio map"        "server/src/lib/environments/ambientAudio.ts"
file_check "Streaming latency"        "server/src/lib/sessions/streamingLatency.ts"
file_check "BullMQ session worker"    "server/src/workers/sessionWorker.ts"
file_check "Pricing copy"             "src/lib/pricingCopy.ts"
file_check "Empty dashboard state"    "src/components/EmptyStates/EmptyDashboard.tsx"
file_check "Companion card redesign"  "src/components/CompanionCard/CompanionCard.tsx"
file_check "Hero section"             "app/(marketing)/page.tsx" "src/app/page.tsx"

# ── STEP 6: Code quality checks ───────────────────────────────────────────
echo -e "\n${BOLD}[STEP 6] Code quality${NC}"

# No banned phrases
TODOS=$(grep -rn "TODO: wire to backend\|// placeholder\|mock data\|coming soon\|MOCK_DATA" \
  server/src/routers/ src/server/routers/ src/ app/ 2>/dev/null | \
  grep -v "node_modules\|\.next\|test\|spec" | wc -l)
[ "$TODOS" -eq 0 ] && pass "Zero banned phrases (TODO/placeholder/mock)" || \
  fail "$TODOS banned phrases found — fix before deploy"

# Empty array default values (data should come from DB)
EMPTY_ARRAYS=$(grep -rn "= \[\]$\|useState(\[\])" \
  src/components/ src/app/ app/ 2>/dev/null | \
  grep -v "//\|node_modules\|test\|spec\|\.next" | wc -l)
[ "$EMPTY_ARRAYS" -lt 5 ] && pass "Empty array defaults: $EMPTY_ARRAYS (acceptable)" || \
  warn "Empty array defaults: $EMPTY_ARRAYS — verify they're populated from real data"

# systemPrompt never in response
SP_LEAKS=$(grep -rn '"systemPrompt"' server/src/routers/ 2>/dev/null | \
  grep "return\|json\|select\|map" | grep -v "hash\|admin\|audit\|//" | wc -l)
[ "$SP_LEAKS" -eq 0 ] && pass "systemPrompt: zero leaks" || \
  fail "CRITICAL: $SP_LEAKS systemPrompt leaks in API"

# Messages never stored
MSG=$(grep -rn "\.message\.create\|saveMessage\|storeMessage" \
  server/src/ 2>/dev/null | grep -v "node_modules\|//\|email\|notification\|webhook" | wc -l)
[ "$MSG" -eq 0 ] && pass "Messages: never stored (correct)" || \
  fail "CRITICAL: $MSG message storage instances"

# ── STEP 7: Mission statement present everywhere ───────────────────────────
echo -e "\n${BOLD}[STEP 7] Mission statement consistency${NC}"

MS=$(grep -rn "Everyone deserves an expert\|expertise that changes lives" \
  src/ app/ 2>/dev/null | grep -v node_modules | wc -l)
[ "$MS" -ge 3 ] && pass "Mission statement: present in $MS places" || \
  warn "Mission statement: only in $MS places — should be in footer, about, homepage (3+ minimum)"

# ── STEP 8: Price comparison copy ─────────────────────────────────────────
echo -e "\n${BOLD}[STEP 8] Pricing value framing${NC}"

PC=$(grep -rn "65.*hour\|less than.*tutoring\|less than.*coffees\|80.*therapist" \
  src/ app/ 2>/dev/null | grep -v node_modules | wc -l)
[ "$PC" -ge 2 ] && pass "Pricing comparison copy: found in $PC places" || \
  fail "Pricing comparison copy: MISSING — required for conversion"

# ── STEP 9: Anti-dependency active ────────────────────────────────────────
echo -e "\n${BOLD}[STEP 9] Anti-dependency system${NC}"

AD=$(grep -rn "someone in your life you.*call\|human_connection_prompt\|anti.*dependency" \
  server/src/ src/ 2>/dev/null | grep -v node_modules | wc -l)
[ "$AD" -ge 2 ] && pass "Anti-dependency: prompts wired ($AD references)" || \
  fail "Anti-dependency: system not wired"

# ── STEP 10: Build succeeds ───────────────────────────────────────────────
echo -e "\n${BOLD}[STEP 10] Production build${NC}"
BUILD=$(npm run build 2>&1)
echo "$BUILD" | grep -qE "Build complete|Compiled successfully|Route (app)" && \
  pass "Production build: succeeds" || fail "Production build: FAILED"

# ── FINAL SUMMARY ─────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}════════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}  FINAL RESULT${NC}"
printf "  ${GREEN}PASS: %d${NC}  ${RED}FAIL: %d${NC}  ${YELLOW}WARN: %d${NC}\n" $PASS $FAIL $WARN
echo ""
if [ $FAIL -gt 0 ]; then
  echo -e "  ${RED}${BOLD}✗ NOT PRODUCTION READY${NC}"
  echo -e "  ${RED}Fix all $FAIL failures. Re-run this test. Deploy only when exit 0.${NC}"
  echo ""
  echo "  Commits blocked until all checks pass."
  exit 1
else
  echo -e "  ${GREEN}${BOLD}✓ PRODUCTION READY${NC}"
  echo ""
  echo "  AgentCore LTD · trust-agent.ai"
  echo "  Mission: Everyone deserves an expert who knows them."
  echo ""
  echo "  Deploy with:"
  echo "    git add -A"
  echo "    git commit -m 'feat: production-final — all features, all checks pass'"
  echo "    git push origin Unified/production-final"
  exit 0
fi
```

---

# ════════════════════════════════════════════════════════════════════════════
# EXECUTION ORDER — FOLLOW THIS EXACTLY
# ════════════════════════════════════════════════════════════════════════════

```
STEP 1:  bash scripts/verify-previous-build.sh
         → Every FAIL = fix it now. Re-run until exit 0.
         → Do not write new code until this exits 0.

STEP 2:  npx prisma migrate dev --name "production-final-features"
         npx prisma generate
         → Every model from Phase 2 must migrate cleanly.
         → If migration fails: check for conflicts, resolve, re-run.

STEP 3:  npx tsc --noEmit
         → Must be 0 errors. Fix any type errors before next step.

STEP 4:  Implement Phase 3 (Onboarding + generateFirstMessage)
         → Test: curl to onboarding.submitQuiz returns firstMessage
         → firstMessage MUST reference quiz answer (not generic)
         → FAIL = stop, fix, re-test

STEP 5:  Implement Phase 4 (Brain memory notes)
         → Test: end a session, query BrainMemoryEntry
         → MUST have content, topicsCovered, not null
         → FAIL = stop, fix, re-test

STEP 6:  Implement Phases 5-11 (Trust, Social, Quality, Safeguarding, Mission, Session, Follow-up)
         → Test each router: curl the endpoint, verify response shape
         → For each: database write confirmed, no TypeScript errors

STEP 7:  Implement Phases 12-17 (Pricing copy, Empty states, Homepage, Cards, NHS, Creator)
         → Frontend components: verify they call real tRPC, not useState([])
         → Pages: curl $BASE/<route> returns 200

STEP 8:  Implement Phase 18-19 (Session end hooks, BullMQ workers)
         → End a test session
         → Verify in DB: BrainMemoryEntry created, MissionMetric created
         → Verify: safeguarding check ran for child account
         → FAIL = worker not processing jobs

STEP 9:  Register all new routers in server/src/router.ts (Phase 17)
         → npx tsc --noEmit — must still be 0 errors
         → curl all 8 new endpoints listed in Step 4 of smoke test

STEP 10: bash scripts/production-smoke-test.sh
         → Must exit 0.
         → If any FAIL: fix it. Re-run. Deploy only when clean.

STEP 11: Commit:
         git add -A
         git commit -m "feat: production-final — all features, all checks, lives changed"
         git push origin Unified/production-final
```

---

# ════════════════════════════════════════════════════════════════════════════
# THE COMMIT MESSAGE
# ════════════════════════════════════════════════════════════════════════════

```
feat: production-final — world-class platform, complete E2E verification

MISSION: "Everyone deserves an expert who knows them."

════════════════ AHA MOMENT SYSTEM ════════════════
- Onboarding quiz: 8 questions → companion selected → first message sent
- generateFirstMessage: references exam date, subject, challenge, style
- Time-to-value: from 7 steps to 3 minutes
- Quiz response stored: DB confirmed, match score computed
- Alternative companions returned for user choice

════════════════ THE VISIBLE BRAIN ════════════════
- BrainMemoryEntry: companion writes memory note after EVERY session
- User can read, edit, and add to notes — their relationship journal
- Progress sharing: opt-in Brain summary for parent/teacher/GP (no content)
- brain.getMemoryNotes: paginated, ordered by date, cursor-based
- brain.editMemoryNote: user ownership verified before write
- brain.createProgressShare: email sent, share token unique

════════════════ INTELLIGENT NOTIFICATIONS ════════════════
- exam_approaching: references exam date AND topic missed
- streak_at_risk: only fires in 18-30hr risk window
- return_prompt: only fires after 5+ days absent
- interview_prep: fires 1-7 days before interview
- human_connection_prompt: anti-dependency, periodic, warm
- All notifications write to NotificationContext with full data

════════════════ TRUST TRANSPARENCY ════════════════
- Full 47-check audit detail on every companion page
- artefactHash + explanation: "proves companion is identical to reviewed"
- expertReview: reviewer name, credentials, years experience visible
- Verified reviews: story-based, 5+ sessions required, flagged

════════════════ SOCIAL LAYER ════════════════
- CompanionReview: min 50 chars, 5-session gate, helpfulCount tracking
- ProgressShare: public token route, expiry, view count, no session content
- StudyGroup: 2-4 members, same companion required, invite code join
- Review triggers re-audit when average < 3.5 over 30 days

════════════════ QUALITY DRIFT PREVENTION ════════════════
- detectCompanionsNeedingReaudit: weekly BullMQ cron
- Triggers: periodic(6mo), curriculum_change, review_decline, never_audited
- Admin notified immediately on trigger creation
- dueBy deadline set per trigger type

════════════════ SAFEGUARDING ════════════════
- runSafeguardingCheck: called for every session, child/vulnerable only
- Signal 1: 5+ sessions in 24 hours
- Signal 2: after-hours (23:00-06:00) for child accounts
- Signal 3: wellbeing score < 30 or declining + < 50
- GuardianAlert created + email sent per family link
- HumanFollowUpQueue: created for level 2+ escalation

════════════════ MISSION METRICS ════════════════
- trackMissionMetrics: exam_improved, wellbeing_improved, streak_milestone
                       human_connection_made, nhs_patient_supported
- getMissionImpactReport: admin dashboard, grouped by type with averages
- Lives impacted count: distinct users with any metric in period

════════════════ SESSION EXCELLENCE ════════════════
- ENVIRONMENT_AUDIO: all 38 environments mapped to S3 audio keys
- getStreamingConfig: category-aware typing speed (elderly slower, business crisp)
- chunkDelay: longer pauses at sentence/paragraph boundaries
- endSession: fires 7 async jobs via BullMQ, never blocks user response

════════════════ NHS PORTAL ════════════════
- generateNHSCode: NHS-XXXX-XXXX format (no confusable characters)
- activatePatientCode: < 60 second flow, upgrades to nhs tier immediately
- createCodeBatch: admin creates codes for GP practices
- NHSOutcomeReport: fully anonymised GP outcome view via token
- Mission metric tracked on every NHS patient session

════════════════ CREATOR PROGRAMME ════════════════
- applyToBeCreator: application form, admin review queue
- approveApplication: marks user as creator, sends email
- getEarnings: creator dashboard, period breakdown, totals
- CreatorEarning: 80/20 revenue split model ready

════════════════ FRONTEND ════════════════
- EmptyDashboard: 3 ghost companion cards with real memory notes
- CompanionCard: Airbnb-style (4 things only), hover CTA
- HeroSection: quote-first hero, "felt recognition in 3 seconds"
- PRICING_COPY: comparison framing ("less than one tutoring session")
- Mission statement: present 3+ places across app

════════════════ ROUTER REGISTRY ════════════════
- 18 routers registered in appRouter
- All new: onboarding, brain, reviews, studyGroups, creator, nhs (extended)
- TypeScript: 0 errors across all routers

════════════════ VERIFICATION ════════════════
- scripts/verify-previous-build.sh: 70+ checks on previous build
- scripts/production-smoke-test.sh: 80+ checks on complete platform
- Both exit 0 confirmed before deploy
- Zero banned phrases, zero message storage, zero systemPrompt leaks
- All 8 Definition-of-Done criteria met for every feature

AgentCore LTD · Company No. 17114811
trust-agent.ai · info@trust-agent.ai
Mission: "Everyone deserves an expert who knows them."
Raise: £6.5M · Token: $TAGNT · Chain: Base (Coinbase L2)
Patricia. Jade. Daniel. Their lives got better. That's the whole thing.
```
