# TRUST AGENT — MASTER BUILD PROMPT v2.0
# Drop at repo root. Run: claude
# Branch prefix: Unified/
# ════════════════════════════════════════════════════════════════════════════
#
# OPERATOR: AgentCore LTD · Company No. 17114811 · trust-agent.ai
# REPO: https://github.com/TrustAgentAI/trust-agent-desktop
# TECH: Tauri (Rust + WebView) desktop app — NOT Next.js
#
# THIS PROMPT BUILDS THE COMPLETE TRUST AGENT BACKEND AND PLATFORM.
# EVERY FEATURE. EVERY ROUTE. EVERY TABLE. REAL DATA. OPERATIONAL.
#
# No mention of Claude or any AI assistant in code, commits, or comments.
# ════════════════════════════════════════════════════════════════════════════

---

## ABSOLUTE RULES — VIOLATING ANY OF THESE BREAKS THE BUILD

1. **ZERO mock data. ZERO demo data. ZERO placeholder responses.**
   Every route hits the real database. Every session goes through the real
   gateway. Every payment hits real Stripe/Coinbase. If a feature is not
   built yet, the route returns a structured `{ status: 'coming_soon' }`
   response — it never returns fake data.

2. **ZERO frontend state for business logic.**
   The frontend renders what the API returns. Role configs, system prompts,
   audit data, session state, Brain summaries — all from the API. Never
   hardcoded, never in local storage, never in Zustand except UI-only state
   (loading, modal open/closed, selected tab).

3. **Brain data NEVER touches Trust Agent servers.**
   The .tagnt Brain file lives on the user's device and syncs to their own
   Google Drive / iCloud / OneDrive. Trust Agent servers store only:
   BrainSyncLog metadata (timestamps, file size, sync status). Never the
   Brain contents.

4. **System prompts NEVER leave the server.**
   Role.systemPrompt is never included in any API response. Never in any
   WebSocket message. Never logged. The frontend receives SafeRole objects
   only (name, description, trustScore, badge, environmentConfig — never
   systemPrompt).

5. **Messages are NOT stored on Trust Agent servers.**
   AgentSession tracks metadata only (duration, messageCount, inputMode).
   Message content passes through in-memory only during the session.
   SessionMemory stores Brain summaries (structured JSON) — not raw messages.

6. **This is a Tauri desktop app.**
   The existing repo is built with Tauri + TypeScript/React frontend.
   Do NOT create a Next.js app. Do NOT create a separate web frontend.
   The Tauri WebView IS the UI. The tRPC server is the backend.
   Tauri commands bridge desktop-only capabilities (file system, wake-word).

7. **AWS credentials are already configured in the environment.**
   Claude Code has IAM access to eu-west-2. Use existing credentials.
   Do not create new IAM users. Reference env vars: AWS_REGION,
   AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET_ASSETS,
   S3_BUCKET_PRIVATE, S3_BUCKET_PUBLIC.

8. **The database is Neon PostgreSQL.**
   DATABASE_URL and DATABASE_URL_UNPOOLED are set in the environment.
   Run `npx prisma migrate dev` after schema changes.
   Run `npx prisma generate` to regenerate the client.

---

## SECTION 0 — ENVIRONMENT VARIABLES

Create `.env` at repo root. Every variable listed here must be present
before any service starts. Claude Code: verify all vars exist before
proceeding to any build step.

```env
# ── DATABASE ──────────────────────────────────────────────────────────────
DATABASE_URL=                    # Neon PostgreSQL pooled URL (set in env)
DATABASE_URL_UNPOOLED=           # Neon direct URL for migrations (set in env)

# ── REDIS (Upstash) ───────────────────────────────────────────────────────
REDIS_URL=                       # Upstash Redis URL
REDIS_TOKEN=                     # Upstash REST token

# ── AWS ───────────────────────────────────────────────────────────────────
AWS_REGION=eu-west-2
AWS_ACCESS_KEY_ID=               # Set in environment — do not hardcode
AWS_SECRET_ACCESS_KEY=           # Set in environment — do not hardcode
S3_BUCKET_ASSETS=trust-agent-assets        # Role configs, audit reports (private)
S3_BUCKET_PRIVATE=trust-agent-private      # Encrypted session artefacts
S3_BUCKET_PUBLIC=trust-agent-public        # Marketplace media (CloudFront origin)
CLOUDFRONT_URL=                  # CloudFront distribution URL for public bucket

# ── AUTH ──────────────────────────────────────────────────────────────────
JWT_SECRET=                      # 256-bit minimum, generated with: openssl rand -hex 32
JWT_EXPIRES_IN=7d

# ── PAYMENTS ──────────────────────────────────────────────────────────────
STRIPE_SECRET_KEY=               # sk_live_xxx or sk_test_xxx
STRIPE_WEBHOOK_SECRET=           # whsec_xxx
STRIPE_PUBLISHABLE_KEY=          # pk_live_xxx or pk_test_xxx
COINBASE_COMMERCE_API_KEY=       # Coinbase Commerce for $TAGNT credit top-ups
COINBASE_COMMERCE_WEBHOOK_SECRET=

# ── VOICE ─────────────────────────────────────────────────────────────────
ELEVENLABS_API_KEY=              # ElevenLabs API key
ELEVENLABS_VOICE_LIBRARY_IDS=    # JSON array of curated voice IDs per category

# ── LLM GATEWAY ───────────────────────────────────────────────────────────
# Trust Agent uses cost-optimised model tiers. Consumer sessions use:
OPENAI_API_KEY=                  # GPT-4o-mini for consumer companion roles
ANTHROPIC_API_KEY=               # Claude Haiku for consumer companion roles
# B2B Gateway: customer LLM keys injected per invocation — Trust Agent pays nothing

# ── CLOUD BRAIN SYNC ──────────────────────────────────────────────────────
GOOGLE_DRIVE_CLIENT_ID=          # OAuth2 for Google Drive Brain sync
GOOGLE_DRIVE_CLIENT_SECRET=
GOOGLE_DRIVE_REDIRECT_URI=
MICROSOFT_GRAPH_CLIENT_ID=       # OAuth2 for OneDrive Brain sync
MICROSOFT_GRAPH_CLIENT_SECRET=
MICROSOFT_GRAPH_REDIRECT_URI=
APPLE_BUNDLE_ID=                 # iCloud CloudKit (Tauri only)

# ── APP ───────────────────────────────────────────────────────────────────
NODE_ENV=production
PORT=4000                        # tRPC server port
APP_URL=https://app.trust-agent.ai
API_URL=https://api.trust-agent.ai
TAURI_APP_VERSION=1.0.0

# ── LIVEKIT (voice sessions) ──────────────────────────────────────────────
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=
LIVEKIT_URL=

# ── TAGNT TOKEN ───────────────────────────────────────────────────────────
BASE_RPC_URL=                    # Base chain RPC (Alchemy/Infura)
TAGNT_CONTRACT_ADDRESS=          # ERC-20 contract address on Base
TAGNT_STAKING_CONTRACT=          # Staking contract address

# ── INTERNAL ──────────────────────────────────────────────────────────────
ADMIN_API_KEY=                   # Internal admin routes — generate with openssl rand -hex 32
AUDIT_WEBHOOK_URL=               # Optional: webhook for audit completion events
```

---

## SECTION 1 — REPO STRUCTURE

The existing Tauri repo already has `src-tauri/` (Rust) and `src/` (React/TS).
Build into the existing structure. Do not restructure what already exists.

```
trust-agent-desktop/
├── src-tauri/                   # Rust Tauri backend (EXISTING — extend only)
│   ├── src/
│   │   ├── main.rs
│   │   ├── commands/
│   │   │   ├── brain.rs         # Brain file operations (.tagnt read/write/encrypt)
│   │   │   ├── audio.rs         # Ambient audio playback
│   │   │   ├── wake_word.rs     # Wake-word detection (TrustBox only)
│   │   │   ├── voice_clone.rs   # ElevenLabs voice clone recording
│   │   │   └── file_upload.rs   # Document/image upload for sessions
│   │   └── lib.rs
├── src/                         # React/TS frontend (EXISTING — extend)
│   ├── components/
│   │   ├── ui/                  # shadcn/ui components
│   │   ├── environment/         # 38 environment themes
│   │   ├── session/             # Session UI (chat, voice, progress)
│   │   ├── brain/               # Brain status, sync, viewer
│   │   ├── marketplace/         # Role cards, filters, hire flow
│   │   ├── dashboard/           # Buyer, guardian, creator, enterprise
│   │   ├── onboarding/          # Onboarding quiz, cloud drive setup
│   │   └── shared/              # Common components
│   ├── stores/                  # Zustand stores (UI state ONLY)
│   ├── lib/
│   │   ├── trpc.ts              # tRPC client
│   │   ├── brain-crypto.ts      # .tagnt encryption/decryption (client side)
│   │   ├── cloud-sync.ts        # Google Drive/iCloud/OneDrive sync
│   │   └── audio.ts             # Audio player wrapper
│   └── styles/
│       └── tokens.css           # Design system tokens
├── server/                      # tRPC server (BUILD THIS)
│   ├── src/
│   │   ├── index.ts
│   │   ├── trpc.ts
│   │   ├── context.ts
│   │   ├── routers/
│   │   ├── gateway/             # B2B Gateway API
│   │   ├── brain/               # Brain summary generation
│   │   ├── audit/               # 47-check audit pipeline
│   │   ├── queues/              # BullMQ workers
│   │   └── lib/
├── prisma/
│   ├── schema.prisma            # REPLACE WITH COMPLETE SCHEMA BELOW
│   ├── migrations/
│   └── seed.ts                  # Seed ROLES only — no fake users
├── .env
├── package.json
└── CLAUDE.md                    # This file
```

---

## SECTION 2 — COMPLETE PRISMA SCHEMA

Replace `prisma/schema.prisma` entirely. This is the authoritative schema.
Every model. Every relation. Every index.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DATABASE_URL_UNPOOLED")
}

// ════════════════════════════════════════════════════════════════════════════
// USERS AND ACCOUNTS
// ════════════════════════════════════════════════════════════════════════════

model User {
  id                String      @id @default(cuid())
  email             String      @unique
  emailVerified     DateTime?
  passwordHash      String?
  name              String?
  avatarUrl         String?
  plan              UserPlan    @default(FREE)
  accountType       AccountType @default(INDIVIDUAL)
  apiKey            String?     @unique @default(cuid()) // ta_live_{cuid}
  tagntBalance      Int         @default(0)  // $TAGNT credits in pence-equivalent
  referralCode      String      @unique @default(cuid())
  referredBy        String?
  onboardingDone    Boolean     @default(false)
  cloudDriveType    CloudDriveType?  // REQUIRED before first hire
  cloudDriveToken   String?     @db.Text  // Encrypted OAuth token
  cloudDriveFolderId String?    // Folder ID in user's drive for Brain files
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt

  preferences       UserPreferences?
  subscription      Subscription?
  hires             Hire[]
  sessions          AgentSession[]
  brainSyncLogs     BrainSyncLog[]
  voiceClones       UserVoiceClone[]
  notifications     Notification[]
  familyLinks       FamilyLink[]     @relation("guardian")
  guardedBy         FamilyLink[]     @relation("child")
  enterprise        EnterpriseUser?
  creatorProfile    CreatorProfile?
  payments          Payment[]
  giftsSent         GiftSubscription[] @relation("sender")
  giftsReceived     GiftSubscription[] @relation("recipient")
  tokenStakes       TokenStake[]
  nhsActivations    NHSReferralActivation[]
  schoolEnrolments  StudentEnrolment[]
  hardwareDevices   HardwareDevice[]
  progressReports   ProgressReport[]
  schedules         SessionSchedule[]
  wellbeingSignals  WellbeingSignal[]

  @@index([email])
  @@index([apiKey])
  @@index([referralCode])
}

enum UserPlan {
  FREE
  STARTER        // £9.99/mo — 1 role
  ESSENTIAL      // £19.99/mo — 3 roles
  FAMILY         // £24.99/mo — 5 roles + 2 child profiles
  PROFESSIONAL   // £39.99/mo — 10 roles
  ENTERPRISE     // Custom
}

enum AccountType {
  INDIVIDUAL
  CHILD          // Requires guardian link
  ENTERPRISE
  CREATOR
}

enum CloudDriveType {
  GOOGLE_DRIVE
  ICLOUD
  ONEDRIVE
}

model UserPreferences {
  id                      String   @id @default(cuid())
  userId                  String   @unique
  user                    User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  ambientAudioEnabled     Boolean  @default(true)
  voiceEnabled            Boolean  @default(true)
  voiceTier               VoiceTier @default(CURATED)
  selectedVoiceId         String?  // ElevenLabs voice ID
  environmentTheme        String   @default("auto")
  sessionReminderMins     Int      @default(45)
  notifyGuardianOnSession Boolean  @default(true)
  highContrastMode        Boolean  @default(false)
  dyslexiaMode            Boolean  @default(false)
  fontSize                String   @default("standard") // standard | large | xlarge
  calmMode                Boolean  @default(false)      // Neurodivergent calm mode
  adhdMode                Boolean  @default(false)
  translationEnabled      Boolean  @default(false)
  preferredLanguage       String   @default("en")
  wearableConnected       Boolean  @default(false)
  wearablePlatform        String?  // apple_health | google_fit | samsung_health
  updatedAt               DateTime @updatedAt
}

enum VoiceTier {
  CURATED        // ElevenLabs library voices
  CLONED         // User-created voice clone
  TEXT_ONLY      // No TTS — read-aloud mode
}

model UserVoiceClone {
  id              String   @id @default(cuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  name            String   // e.g. "Grandma Joyce"
  elevenLabsId    String   // ElevenLabs voice clone ID
  consentRecorded Boolean  @default(false)  // Consent confirmed in UI
  consentAt       DateTime?
  createdAt       DateTime @default(now())

  @@index([userId])
}

model FamilyLink {
  id            String   @id @default(cuid())
  guardianId    String
  childId       String
  guardian      User     @relation("guardian", fields: [guardianId], references: [id])
  child         User     @relation("child", fields: [childId], references: [id])
  maxDailyMins  Int      @default(45)  // Guardian-configurable session limit
  createdAt     DateTime @default(now())

  guardianAlerts GuardianAlert[]

  @@unique([guardianId, childId])
  @@index([guardianId])
  @@index([childId])
}

model GuardianAlert {
  id            String   @id @default(cuid())
  familyLinkId  String
  familyLink    FamilyLink @relation(fields: [familyLinkId], references: [id])
  type          String   // topic_flagged | session_limit_reached | wellbeing_concern
  message       String   @db.Text
  hireId        String?
  readAt        DateTime?
  createdAt     DateTime @default(now())

  @@index([familyLinkId])
}

model WellbeingSignal {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  hireId      String
  score       Int      // 0-100 wellbeing score
  trend       String   // improving | stable | declining
  signals     Json     // structured signal data from Brain
  alertSent   Boolean  @default(false)
  createdAt   DateTime @default(now())

  @@index([userId])
  @@index([hireId])
}

// ════════════════════════════════════════════════════════════════════════════
// BRAIN ARCHITECTURE
// Brain data NEVER stored here — only sync metadata
// ════════════════════════════════════════════════════════════════════════════

model BrainSyncLog {
  id              String   @id @default(cuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id])
  hireId          String
  cloudDriveType  CloudDriveType
  fileId          String   // File ID in user's cloud drive
  fileSizeBytes   Int
  syncStatus      String   // success | failed | conflict
  errorMessage    String?
  syncedAt        DateTime @default(now())

  @@index([userId])
  @@index([hireId])
}

// ════════════════════════════════════════════════════════════════════════════
// ENTERPRISE
// ════════════════════════════════════════════════════════════════════════════

model EnterpriseUser {
  id              String   @id @default(cuid())
  userId          String   @unique
  user            User     @relation(fields: [userId], references: [id])
  companyName     String
  companySize     String?
  industry        String?
  billingEmail    String
  maxSeats        Int      @default(5)
  ssoEnabled      Boolean  @default(false)
  samlMetadata    String?  @db.Text
  createdAt       DateTime @default(now())

  companyBrain    CompanyBrain?
  seats           EnterpriseSeat[]
}

model EnterpriseSeat {
  id             String        @id @default(cuid())
  enterpriseId   String
  enterprise     EnterpriseUser @relation(fields: [enterpriseId], references: [id])
  email          String
  role           String        @default("member") // member | admin
  invitedAt      DateTime      @default(now())
  acceptedAt     DateTime?

  @@index([enterpriseId])
}

model CompanyBrain {
  id               String        @id @default(cuid())
  enterpriseId     String        @unique
  enterprise       EnterpriseUser @relation(fields: [enterpriseId], references: [id])
  // Static context — injected on every invocation (~1500-2000 tokens)
  companyName      String
  companyDescription String      @db.Text
  industry         String?
  companySize      String?
  currentOKRs      String        @db.Text
  brandVoice       String        @db.Text
  targetCustomers  String        @db.Text
  topCompetitors   String        @db.Text
  keyPeople        String        @db.Text
  topicsToAvoid    String        @db.Text
  // Dynamic RAG config — customer's own vector DB
  vectorDbProvider String?       // pgvector | pinecone | weaviate | qdrant
  vectorDbUrl      String?       @db.Text  // Encrypted
  vectorDbApiKey   String?       @db.Text  // Encrypted
  vectorDbIndex    String?
  ragEnabled       Boolean       @default(false)
  updatedAt        DateTime      @updatedAt

  hitlRules        HITLRule[]
}

model HITLRule {
  id             String      @id @default(cuid())
  companyBrainId String
  companyBrain   CompanyBrain @relation(fields: [companyBrainId], references: [id])
  triggerPattern String      // regex or keyword pattern
  action         String      // pause | block | escalate
  notifyEmail    String?
  createdAt      DateTime    @default(now())

  @@index([companyBrainId])
}

model HITLEvent {
  id          String   @id @default(cuid())
  sessionId   String
  ruleId      String
  inputSample String   @db.Text  // First 200 chars only — not full message
  action      String
  resolvedBy  String?
  resolvedAt  DateTime?
  createdAt   DateTime @default(now())

  @@index([sessionId])
}

// ════════════════════════════════════════════════════════════════════════════
// ROLES AND MARKETPLACE
// ════════════════════════════════════════════════════════════════════════════

model Role {
  id                  String    @id @default(cuid())
  slug                String    @unique  // e.g. gcse-maths-tutor-f
  baseSlug            String    // e.g. gcse-maths-tutor (groups male/female)
  gender              String    // f | m
  name                String
  companionName       String    // e.g. "Miss Davies" — overrideable per hire
  category            String
  subcategory         String?
  tagline             String
  description         String    @db.Text
  systemPrompt        String    @db.Text   // NEVER sent to frontend
  systemPromptHash    String    // SHA-256 — verified on every invocation
  priceMonthly        Int       // pence
  targetUser          String    @db.Text
  capabilities        String[]
  limitations         String[]
  hardLimits          String[]
  escalationTriggers  String[]
  knowledgeSources    String[]
  tags                String[]
  languageCode        String?
  languageName        String?
  isActive            Boolean   @default(false)
  publishedAt         DateTime?
  isFeatured          Boolean   @default(false)
  environmentSlug     String    // One of 38 environments
  environmentConfig   Json      // SafeEnvironmentConfig — sent to frontend
  // Accessibility
  supportsVoice       Boolean   @default(true)
  supportsTextOnly    Boolean   @default(true)
  supportsWearable    Boolean   @default(false)
  // Anti-dependency
  maxSessionMinutes   Int       @default(90)
  maxDailySessionMins Int?      // null = unlimited (adults). 45 for children.
  // Subscription gating
  requiredPlan        UserPlan  @default(STARTER)
  // B2B marketplace
  roleType            RoleType  @default(CONSUMER)
  stakeRequired       Int       @default(0) // $TAGNT stake for B2B creators
  creatorId           String?   // null = Trust Agent official roles
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  audit     RoleAudit?
  hires     Hire[]
  skills    RoleSkill[]
  creator   CreatorProfile? @relation(fields: [creatorId], references: [id])

  @@index([baseSlug])
  @@index([category])
  @@index([isActive])
  @@index([roleType])
  @@index([creatorId])
}

enum RoleType {
  CONSUMER    // Consumer companion
  B2B_CSUITE  // C-Suite — 10,000 $TAGNT stake
  B2B_MGMT    // Management — 5,000 $TAGNT stake
  B2B_SPEC    // Specialist — 2,000 $TAGNT stake
  B2B_AGENT   // Agent — 1,000 $TAGNT stake
  B2B_SKILL   // Skill module — 500 $TAGNT stake
}

model RoleSkill {
  id             String  @id @default(cuid())
  roleId         String
  role           Role    @relation(fields: [roleId], references: [id])
  skillSlug      String
  skillName      String
  injectionPoint String  @default("system")
  priority       Int     @default(1)

  @@index([roleId])
}

model Skill {
  id             String   @id @default(cuid())
  slug           String   @unique
  name           String
  description    String   @db.Text
  systemFragment String   @db.Text  // NEVER sent to frontend
  fragmentHash   String   // SHA-256
  category       String
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}

model RoleAudit {
  id              String   @id @default(cuid())
  roleId          String   @unique
  role            Role     @relation(fields: [roleId], references: [id])
  trustScore      Int      // 0-100
  badge           BadgeTier
  artefactHash    String   // SHA-256 of role config at audit time
  auditReportKey  String   // S3 key (private bucket)
  stage1Score     Int
  stage1Passed    Int
  stage1Failed    Int
  stage2Score     Int
  stage2Passed    Int
  stage2Failed    Int
  stage3Score     Int
  stage3Passed    Int
  stage3Failed    Int
  communityScore  Int      @default(0)
  totalScore      Int      // Weighted final Trust Score
  auditedBy       String?  // Human expert name/ID (hashed)
  completedAt     DateTime
  expiresAt       DateTime // 6 months from audit date
  createdAt       DateTime @default(now())

  @@index([badge])
  @@index([totalScore])
}

enum BadgeTier {
  PLATINUM
  GOLD
  SILVER
  BASIC
  REJECTED
}

// ════════════════════════════════════════════════════════════════════════════
// HIRES
// ════════════════════════════════════════════════════════════════════════════

model Hire {
  id                  String      @id @default(cuid())
  userId              String
  user                User        @relation(fields: [userId], references: [id])
  roleId              String
  role                Role        @relation(fields: [roleId], references: [id])
  status              HireStatus  @default(ACTIVE)
  // Personalisation
  customCompanionName String?     // Overrides Role.companionName
  customVoiceCloneId  String?     // UserVoiceClone.id
  customEnvironment   String?     // Override default environment
  // Subscription
  activatedAt         DateTime    @default(now())
  expiresAt           DateTime?
  priceMonthly        Int         // pence — locked at hire time
  stripeSubId         String?     // Stripe subscription line item
  // Brain
  brainFileId         String?     // File ID in user's cloud drive
  brainVersion        Int         @default(0)
  lastBrainSync       DateTime?
  sessionCount        Int         @default(0)
  totalMinutes        Int         @default(0)
  streakDays          Int         @default(0)
  longestStreakDays    Int         @default(0)
  lastSessionAt       DateTime?
  createdAt           DateTime    @default(now())
  updatedAt           DateTime    @updatedAt

  sessions      AgentSession[]
  memory        SessionMemory?
  milestones    HireMilestone[]
  srItems       SpacedRepetitionItem[]
  schedules     SessionSchedule[]
  progressReports ProgressReport[]

  @@unique([userId, roleId])
  @@index([userId])
  @@index([roleId])
  @@index([status])
}

enum HireStatus {
  ACTIVE
  PAUSED          // Subscription lapsed — Brain preserved
  CANCELLED
  EXPIRED
  GIFT_PENDING    // Gift hired but not yet activated
}

model HireMilestone {
  id          String   @id @default(cuid())
  hireId      String
  hire        Hire     @relation(fields: [hireId], references: [id])
  type        String   // first_session | session_10 | session_50 | streak_7 | etc
  achievedAt  DateTime @default(now())
  celebrated  Boolean  @default(false)

  @@index([hireId])
}

// ════════════════════════════════════════════════════════════════════════════
// SESSIONS
// ════════════════════════════════════════════════════════════════════════════

model AgentSession {
  id               String        @id @default(cuid())
  userId           String
  user             User          @relation(fields: [userId], references: [id])
  hireId           String
  hire             Hire          @relation(fields: [hireId], references: [id])
  liveKitRoomId    String?
  status           SessionStatus @default(ACTIVE)
  inputMode        InputMode     @default(TEXT)
  environmentSlug  String
  // Session modes
  examMode         Boolean       @default(false)
  redTeamMode      Boolean       @default(false)
  presenceMode     Boolean       @default(false)
  timeBudgetMins   Int?          // Time-boxed session — null = unlimited
  collaborationId  String?       // If multi-user session
  // Metrics (no content)
  startedAt        DateTime      @default(now())
  endedAt          DateTime?
  durationSeconds  Int?
  messageCount     Int           @default(0)
  deviceType       String?       // desktop | mobile | trustbox | truststick
  // Anti-dependency tracking
  sessionMinsToday Int           @default(0) // Running total for the day
  dependencyFlag   Boolean       @default(false) // Flagged for high frequency
  createdAt        DateTime      @default(now())

  auditEvents      SessionAuditEvent[]
  uploadedDocs     SessionDocument[]

  @@index([userId])
  @@index([hireId])
  @@index([status])
  @@index([startedAt])
}

enum SessionStatus {
  ACTIVE
  COMPLETED
  ABANDONED
  ERROR
}

enum InputMode {
  TEXT
  VOICE
  MIXED
}

model SessionDocument {
  id          String   @id @default(cuid())
  sessionId   String
  session     AgentSession @relation(fields: [sessionId], references: [id])
  s3Key       String   // S3 key in private bucket
  fileName    String
  mimeType    String
  fileSizeBytes Int
  extractedText String? @db.Text  // Extracted for context injection — deleted after session
  uploadedAt  DateTime @default(now())

  @@index([sessionId])
}

model SessionAuditEvent {
  id          String   @id @default(cuid())
  sessionId   String
  session     AgentSession @relation(fields: [sessionId], references: [id])
  checkId     String
  outcome     String   // PASS | WARN | BLOCK
  details     String?  @db.Text
  createdAt   DateTime @default(now())

  @@index([sessionId])
  @@index([checkId])
}

// ════════════════════════════════════════════════════════════════════════════
// SESSION MEMORY (Brain summaries — not raw messages)
// ════════════════════════════════════════════════════════════════════════════

model SessionMemory {
  id              String   @id @default(cuid())
  hireId          String   @unique
  hire            Hire     @relation(fields: [hireId], references: [id])
  // Structured summary — computed after each session, synced to Brain
  memorySummary   Json     // BrainMemoryData type (see below)
  lastUpdated     DateTime @default(now())
  sessionCount    Int      @default(0)
  totalMinutes    Int      @default(0)
  // Wellbeing
  wellbeingScore  Int      @default(75)
  wellbeingTrend  String   @default("stable")
  lastWellbeingAt DateTime?
}

// BrainMemoryData JSON shape:
// {
//   userName: string,
//   goals: string[],
//   // Education-specific:
//   examDate: string | null,
//   examBoard: string | null,
//   tier: 'foundation' | 'higher' | null,
//   topicsMastered: string[],
//   topicsInProgress: string[],
//   topicsNotStarted: string[],
//   struggleAreas: string[],
//   strongAreas: string[],
//   examReadinessScore: number,  // 0-100
//   // Language-specific:
//   cefrLevel: string | null,
//   vocabularyGaps: string[],
//   pronounciationNotes: string[],
//   // Career-specific:
//   applicationReadinessScore: number,
//   cvVersionKey: string | null,
//   // Common:
//   lastSessionSummary: string,
//   nextSessionFocus: string,
//   motivationalContext: string,
//   progressPercent: number,
//   // Wellbeing signals:
//   sentimentHistory: { date: string; score: number }[],
//   wellbeingNotes: string[]
// }

// ════════════════════════════════════════════════════════════════════════════
// SPACED REPETITION
// ════════════════════════════════════════════════════════════════════════════

model SpacedRepetitionItem {
  id          String   @id @default(cuid())
  hireId      String
  hire        Hire     @relation(fields: [hireId], references: [id])
  concept     String
  context     String   @db.Text
  // SM-2 algorithm fields
  easeFactor  Float    @default(2.5)
  interval    Int      @default(1)     // days
  repetitions Int      @default(0)
  dueAt       DateTime @default(now())
  lastReview  DateTime?
  createdAt   DateTime @default(now())

  @@index([hireId])
  @@index([dueAt])
}

// ════════════════════════════════════════════════════════════════════════════
// PROGRESS AND REPORTING
// ════════════════════════════════════════════════════════════════════════════

model LearnerProgressScore {
  id               String   @id @default(cuid())
  hireId           String   @unique
  // Education
  overallReadiness Int      @default(0)  // 0-100
  topicScores      Json     // { topicSlug: score }
  // Language
  cefrLevel        String?
  cefrConfidence   Int?     @default(0)
  // Career
  applicationScore Int      @default(0)
  // General
  engagementScore  Int      @default(0)
  streakBonus      Int      @default(0)
  updatedAt        DateTime @updatedAt
}

model ProgressReport {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  hireId      String
  hire        Hire     @relation(fields: [hireId], references: [id])
  reportType  String   // weekly | monthly | exam_ready | milestone
  s3Key       String   // PDF stored in private S3 bucket
  generatedAt DateTime @default(now())
  sharedWith  String[] // Email addresses shared with (guardian, school)

  @@index([userId])
  @@index([hireId])
}

// ════════════════════════════════════════════════════════════════════════════
// SESSION SCHEDULING
// ════════════════════════════════════════════════════════════════════════════

model SessionSchedule {
  id              String   @id @default(cuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id])
  hireId          String
  hire            Hire     @relation(fields: [hireId], references: [id])
  dayOfWeek       Int[]    // 0=Sun..6=Sat
  timeOfDay       String   // HH:MM
  durationMins    Int      @default(30)
  timezone        String   @default("Europe/London")
  calendarSyncType String? // google | apple
  calendarEventId String?
  isActive        Boolean  @default(true)
  nextSessionAt   DateTime
  createdAt       DateTime @default(now())

  @@index([userId])
  @@index([nextSessionAt])
}

// ════════════════════════════════════════════════════════════════════════════
// NOTIFICATIONS
// ════════════════════════════════════════════════════════════════════════════

model Notification {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  type        NotifType
  title       String
  body        String   @db.Text
  data        Json?    // { hireId, sessionId, url }
  priority    String   @default("normal") // normal | high (micro-moment)
  readAt      DateTime?
  createdAt   DateTime @default(now())

  @@index([userId])
  @@index([readAt])
  @@index([createdAt])
}

enum NotifType {
  SESSION_REMINDER    // Scheduled session starting
  EXAM_COUNTDOWN      // X days to exam
  STREAK_AT_RISK      // No session for N days
  MILESTONE_REACHED   // Session count milestone
  PROGRESS_UPDATE     // Weekly progress summary
  GUARDIAN_ALERT      // Child session alert
  WELLBEING_SIGNAL    // Wellbeing concern detected
  BRAIN_SYNC_FAILED   // Cloud drive sync issue
  AUDIT_COMPLETE      // Creator: audit result ready
  PAYOUT_READY        // Creator: payout available
}

// ════════════════════════════════════════════════════════════════════════════
// PAYMENTS AND SUBSCRIPTIONS
// ════════════════════════════════════════════════════════════════════════════

model Subscription {
  id              String             @id @default(cuid())
  userId          String             @unique
  user            User               @relation(fields: [userId], references: [id])
  stripeSubId     String             @unique
  stripeCustomerId String            @unique
  plan            UserPlan
  status          SubscriptionStatus
  currentPeriodStart DateTime
  currentPeriodEnd   DateTime
  cancelAtPeriodEnd  Boolean         @default(false)
  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt
}

enum SubscriptionStatus {
  ACTIVE
  PAST_DUE
  CANCELLED
  TRIALING
  PAUSED
}

model Payment {
  id              String   @id @default(cuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id])
  stripePaymentId String?  @unique
  coinbaseChargeId String? @unique  // For $TAGNT credit purchases
  amount          Int      // pence
  currency        String   @default("gbp")
  status          String   // succeeded | pending | failed
  type            String   // subscription | credit_topup | gift | hardware
  description     String?
  createdAt       DateTime @default(now())

  @@index([userId])
}

model GiftSubscription {
  id              String   @id @default(cuid())
  senderId        String
  sender          User     @relation("sender", fields: [senderId], references: [id])
  recipientId     String?
  recipient       User?    @relation("recipient", fields: [recipientId], references: [id])
  recipientEmail  String
  plan            UserPlan
  durationMonths  Int
  roleId          String?  // Optional: gift a specific role
  personalMessage String?  @db.Text
  activationCode  String   @unique @default(cuid())
  activatedAt     DateTime?
  expiresAt       DateTime
  createdAt       DateTime @default(now())

  @@index([senderId])
  @@index([activationCode])
}

model ReferralReward {
  id            String   @id @default(cuid())
  referrerId    String
  referredId    String
  rewardMonths  Int      @default(1)
  appliedAt     DateTime?
  createdAt     DateTime @default(now())

  @@unique([referrerId, referredId])
}

// ════════════════════════════════════════════════════════════════════════════
// NHS / SOCIAL PRESCRIBING
// ════════════════════════════════════════════════════════════════════════════

model NHSReferralCode {
  id              String   @id @default(cuid())
  code            String   @unique
  gpPracticeId    String
  gpPracticeName  String
  roleSlug        String   // Specific role to activate
  durationDays    Int      @default(30)
  maxActivations  Int      @default(1)
  activationCount Int      @default(0)
  createdBy       String   // Admin user ID
  expiresAt       DateTime
  createdAt       DateTime @default(now())

  activations     NHSReferralActivation[]

  @@index([code])
}

model NHSReferralActivation {
  id          String          @id @default(cuid())
  codeId      String
  code        NHSReferralCode @relation(fields: [codeId], references: [id])
  userId      String
  user        User            @relation(fields: [userId], references: [id])
  activatedAt DateTime        @default(now())

  @@unique([codeId, userId])
}

// ════════════════════════════════════════════════════════════════════════════
// SCHOOL / INSTITUTIONAL LICENSING
// ════════════════════════════════════════════════════════════════════════════

model SchoolLicence {
  id              String   @id @default(cuid())
  schoolName      String
  contactEmail    String
  contactName     String
  roleSlugAccess  String[] // Which roles students can access
  maxStudents     Int
  pricePerStudent Int      // pence per month
  stripeSubId     String?
  status          String   @default("active") // active | suspended | expired
  activationCode  String   @unique @default(cuid())
  expiresAt       DateTime
  createdAt       DateTime @default(now())

  enrolments      StudentEnrolment[]
}

model StudentEnrolment {
  id          String        @id @default(cuid())
  licenceId   String
  licence     SchoolLicence @relation(fields: [licenceId], references: [id])
  userId      String
  user        User          @relation(fields: [userId], references: [id])
  enrolledAt  DateTime      @default(now())

  @@unique([licenceId, userId])
  @@index([licenceId])
}

// ════════════════════════════════════════════════════════════════════════════
// CREATOR MARKETPLACE
// ════════════════════════════════════════════════════════════════════════════

model CreatorProfile {
  id              String   @id @default(cuid())
  userId          String   @unique
  displayName     String
  bio             String   @db.Text
  credentials     String   @db.Text  // Professional credentials
  verified        Boolean  @default(false)
  verifiedAt      DateTime?
  revenueSharePct Int      @default(80)  // Creator gets 80%
  totalEarnings   Int      @default(0)   // pence
  tagntBalance    Int      @default(0)   // $TAGNT earnings
  createdAt       DateTime @default(now())

  roles           Role[]
  applications    CreatorApplication[]
  payouts         CreatorPayout[]

  @@index([verified])
}

model CreatorApplication {
  id              String          @id @default(cuid())
  creatorId       String
  creator         CreatorProfile  @relation(fields: [creatorId], references: [id])
  roleSlug        String
  submittedConfig Json            // Role config JSON (system prompt encrypted)
  status          String          @default("pending") // pending | in_review | approved | rejected
  reviewNotes     String?         @db.Text
  reviewedBy      String?
  reviewedAt      DateTime?
  submittedAt     DateTime        @default(now())

  @@index([creatorId])
  @@index([status])
}

model CreatorPayout {
  id              String          @id @default(cuid())
  creatorId       String
  creator         CreatorProfile  @relation(fields: [creatorId], references: [id])
  amount          Int             // $TAGNT amount
  periodStart     DateTime
  periodEnd       DateTime
  status          String          @default("pending") // pending | processing | complete
  txHash          String?         // Base chain transaction hash
  paidAt          DateTime?
  createdAt       DateTime        @default(now())

  @@index([creatorId])
}

// ════════════════════════════════════════════════════════════════════════════
// HARDWARE DEVICES
// ════════════════════════════════════════════════════════════════════════════

model HardwareDevice {
  id              String   @id @default(cuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id])
  deviceType      DeviceType
  serialNumber    String   @unique
  apiKey          String   @unique  // ta_device_{cuid}
  nickname        String?
  firmwareVersion String?
  lastSeenAt      DateTime?
  activatedAt     DateTime @default(now())

  activations     HardwareActivation[]

  @@index([userId])
  @@index([apiKey])
}

enum DeviceType {
  TRUSTBOX_PRO
  TRUSTSTICK
  TRUSTEDGE_ENTERPRISE
}

model HardwareActivation {
  id          String         @id @default(cuid())
  deviceId    String
  device      HardwareDevice @relation(fields: [deviceId], references: [id])
  roleSlug    String
  activatedAt DateTime       @default(now())
  expiresAt   DateTime?

  @@index([deviceId])
}

// ════════════════════════════════════════════════════════════════════════════
// TOKEN ECONOMY
// ════════════════════════════════════════════════════════════════════════════

model TokenStake {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  roleSlug    String
  roleType    RoleType
  amount      Int      // $TAGNT amount staked
  status      String   @default("active") // active | slashed | withdrawn
  stakedAt    DateTime @default(now())
  slashedAt   DateTime?
  slashReason String?
  withdrawnAt DateTime?
  txHash      String?  // Base chain transaction hash

  @@unique([userId, roleSlug])
  @@index([userId])
  @@index([status])
}

// ════════════════════════════════════════════════════════════════════════════
// AUDIT PIPELINE
// ════════════════════════════════════════════════════════════════════════════

model AuditJob {
  id          String   @id @default(cuid())
  roleId      String
  submittedBy String   // User ID (creator) or 'system'
  status      String   @default("queued") // queued | stage1 | stage2 | stage3 | complete | failed
  priority    String   @default("normal") // normal | express (paid)
  stage1Done  Boolean  @default(false)
  stage2Done  Boolean  @default(false)
  stage3Done  Boolean  @default(false)
  stage1At    DateTime?
  stage2At    DateTime?
  stage3At    DateTime?
  completedAt DateTime?
  errorMsg    String?
  createdAt   DateTime @default(now())

  @@index([roleId])
  @@index([status])
}
```

After writing schema, run immediately:
```bash
npx prisma migrate dev --name "initial_complete_schema"
npx prisma generate
```

---

## SECTION 3 — S3 BUCKET SETUP

Claude Code has AWS access. Create the three S3 buckets if they don't exist.

```bash
# Create buckets in eu-west-2
aws s3api create-bucket \
  --bucket trust-agent-assets \
  --region eu-west-2 \
  --create-bucket-configuration LocationConstraint=eu-west-2

aws s3api create-bucket \
  --bucket trust-agent-private \
  --region eu-west-2 \
  --create-bucket-configuration LocationConstraint=eu-west-2

aws s3api create-bucket \
  --bucket trust-agent-public \
  --region eu-west-2 \
  --create-bucket-configuration LocationConstraint=eu-west-2

# Block ALL public access on assets and private buckets
aws s3api put-public-access-block \
  --bucket trust-agent-assets \
  --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

aws s3api put-public-access-block \
  --bucket trust-agent-private \
  --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

# Enable versioning on assets bucket (role configs)
aws s3api put-bucket-versioning \
  --bucket trust-agent-assets \
  --versioning-configuration Status=Enabled

# Enable server-side encryption on all buckets
aws s3api put-bucket-encryption \
  --bucket trust-agent-assets \
  --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'

aws s3api put-bucket-encryption \
  --bucket trust-agent-private \
  --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'

aws s3api put-bucket-encryption \
  --bucket trust-agent-public \
  --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'

# Set lifecycle rule: delete private artefacts after 90 days
aws s3api put-bucket-lifecycle-configuration \
  --bucket trust-agent-private \
  --lifecycle-configuration '{
    "Rules": [{
      "ID": "delete-after-90-days",
      "Status": "Enabled",
      "Expiration": {"Days": 90},
      "Filter": {"Prefix": "session-artefacts/"}
    }]
  }'

# Public bucket CORS for media serving
aws s3api put-bucket-cors \
  --bucket trust-agent-public \
  --cors-configuration '{
    "CORSRules": [{
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET"],
      "AllowedOrigins": ["https://app.trust-agent.ai", "tauri://localhost"],
      "MaxAgeSeconds": 86400
    }]
  }'
```

S3 key structure:
```
trust-agent-assets/
  roles/{roleSlug}/config.json.enc    # Encrypted role config
  roles/{roleSlug}/audit-report.pdf   # Audit report PDF
  skills/{skillSlug}/fragment.txt.enc # Encrypted skill fragment

trust-agent-private/
  session-artefacts/{sessionId}/      # Uploaded docs (deleted after session)
  progress-reports/{userId}/{reportId}.pdf
  brain-handovers/{userId}/{hireId}.pdf

trust-agent-public/
  role-images/{roleSlug}/avatar.webp  # Companion avatars
  environments/{envSlug}/bg.webp      # Environment backgrounds
  environments/{envSlug}/audio.mp3    # Ambient audio
```

---

## SECTION 4 — COMPLETE tRPC SERVER

### 4.1 Server Entry Point

File: `server/src/index.ts`

```typescript
import express from 'express';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import cors from 'cors';
import helmet from 'helmet';
import { appRouter } from './routers/_app';
import { createContext } from './context';
import { setupWebSocket } from './websocket/server';
import { startQueues } from './queues';

const app = express();

app.use(helmet());
app.use(cors({
  origin: ['tauri://localhost', 'https://app.trust-agent.ai'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Health check — no auth required
app.get('/health', (req, res) => {
  res.json({ status: 'ok', version: process.env.TAURI_APP_VERSION });
});

// Stripe webhook — raw body required before JSON middleware
app.post('/webhooks/stripe', express.raw({ type: 'application/json' }), handleStripeWebhook);
app.post('/webhooks/coinbase', express.raw({ type: 'application/json' }), handleCoinbaseWebhook);

// tRPC
app.use('/trpc', createExpressMiddleware({
  router: appRouter,
  createContext,
  onError({ error }) {
    if (error.code === 'INTERNAL_SERVER_ERROR') {
      console.error('tRPC internal error:', error);
    }
  },
}));

const server = app.listen(process.env.PORT || 4000, () => {
  console.log(`Trust Agent API running on port ${process.env.PORT || 4000}`);
});

setupWebSocket(server);
startQueues();
```

### 4.2 tRPC Context

File: `server/src/context.ts`

```typescript
import { inferAsyncReturnType } from '@trpc/server';
import { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import { verifyJWT } from './lib/auth';
import { prisma } from './lib/prisma';

export async function createContext({ req }: CreateExpressContextOptions) {
  // API key authentication (for B2B gateway and hardware devices)
  const apiKey = req.headers['x-api-key'] as string;
  if (apiKey) {
    const keyType = apiKey.startsWith('ta_live_') ? 'user' :
                    apiKey.startsWith('ta_device_') ? 'device' : null;
    if (keyType === 'user') {
      const user = await prisma.user.findUnique({ where: { apiKey } });
      if (user) return { user, apiKey, keyType, prisma };
    }
    if (keyType === 'device') {
      const device = await prisma.hardwareDevice.findUnique({
        where: { apiKey },
        include: { user: true }
      });
      if (device) return { user: device.user, device, apiKey, keyType, prisma };
    }
  }

  // JWT authentication (app users)
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const payload = verifyJWT(token);
    if (payload) {
      const user = await prisma.user.findUnique({ where: { id: payload.userId } });
      if (user) return { user, prisma };
    }
  }

  return { user: null, prisma };
}

export type Context = inferAsyncReturnType<typeof createContext>;
```

### 4.3 Router Map

File: `server/src/routers/_app.ts`

```typescript
import { router } from '../trpc';
import { authRouter } from './auth';
import { marketplaceRouter } from './marketplace';
import { hireRouter } from './hire';
import { sessionRouter } from './session';
import { brainRouter } from './brain';
import { voiceRouter } from './voice';
import { progressRouter } from './progress';
import { guardianRouter } from './guardian';
import { notificationsRouter } from './notifications';
import { schedulingRouter } from './scheduling';
import { paymentsRouter } from './payments';
import { enterpriseRouter } from './enterprise';
import { companyBrainRouter } from './companyBrain';
import { gatewayRouter } from './gateway';
import { creatorRouter } from './creator';
import { hardwareRouter } from './hardware';
import { tokenRouter } from './token';
import { nhsRouter } from './nhs';
import { schoolRouter } from './school';
import { adminRouter } from './admin';
import { onboardingRouter } from './onboarding';

export const appRouter = router({
  auth: authRouter,
  marketplace: marketplaceRouter,
  hire: hireRouter,
  session: sessionRouter,
  brain: brainRouter,
  voice: voiceRouter,
  progress: progressRouter,
  guardian: guardianRouter,
  notifications: notificationsRouter,
  scheduling: schedulingRouter,
  payments: paymentsRouter,
  enterprise: enterpriseRouter,
  companyBrain: companyBrainRouter,
  gateway: gatewayRouter,
  creator: creatorRouter,
  hardware: hardwareRouter,
  token: tokenRouter,
  nhs: nhsRouter,
  school: schoolRouter,
  admin: adminRouter,
  onboarding: onboardingRouter,
});

export type AppRouter = typeof appRouter;
```

### 4.4 Every Router — Complete Procedure List

Build every procedure in every router. No stubs. No TODOs.

#### `auth.ts`
```
register(email, password, name) → JWT + user
login(email, password) → JWT + user
logout() → void
verifyEmail(token) → void
resetPassword(email) → void
resetPasswordConfirm(token, newPassword) → void
refreshToken() → JWT
getMe() → SafeUser
updateProfile(name?, avatarUrl?) → SafeUser
deleteAccount() → void  // Triggers Brain deletion instructions
generateApiKey() → apiKey
revokeApiKey() → void
```

#### `onboarding.ts`
```
getQuizQuestions() → QuizQuestion[]
submitQuizAnswers(answers) → { recommendedRoleSlug, recommendedCategory }
setCloudDrive(type, oauthCode) → { folderId, success }
verifyCloudDriveConnection() → { connected, folderId }
completeOnboarding() → SafeUser
```

The onboarding quiz logic:
- Q1: "What brings you to Trust Agent today?" → 8 options mapping to categories
- Q2: Context-specific follow-up based on Q1 answer
- Q3: Goal or timeline question
- Q4: Age or role context
- Result: maps to single best role slug
- After quiz: FORCE cloud drive connection before allowing any hire

#### `marketplace.ts`
```
getRoles(filters: { category?, badge?, minScore?, language?, search?, roleType?, page? }) → PaginatedRoles
getRole(slug) → SafeRole  // NEVER includes systemPrompt
getRoleByBaseSlug(baseSlug) → { female: SafeRole, male: SafeRole }
getFeaturedRoles() → SafeRole[]
getCategories() → Category[]
getLanguageTutors() → SafeRole[]  // All 40 language roles
getStats() → { totalRoles, totalHires, avgTrustScore }
searchRoles(query) → SafeRole[]
getB2BRoles(type?: RoleType) → SafeRole[]
```

SafeRole NEVER includes: systemPrompt, systemPromptHash, hardLimits, escalationTriggers

#### `hire.ts`
```
hireRole(roleId, customCompanionName?, customVoiceCloneId?) → Hire
  // Checks: subscription plan allows, cloud drive connected, not already hired
  // Creates Hire + SessionMemory + LearnerProgressScore
  // Charges via Stripe if not on free plan
cancelHire(hireId) → void
pauseHire(hireId) → void   // When subscription lapses
resumeHire(hireId) → void
getMyHires() → HireWithRole[]
getHire(hireId) → HireDetail
updateHireCustomisation(hireId, { companionName?, voiceCloneId?, environment? }) → Hire
getHireStats(hireId) → { sessions, totalMinutes, streakDays, milestones }
checkCanHire(roleId) → { allowed, reason? }
```

#### `session.ts`
```
startSession(hireId, { inputMode?, examMode?, redTeamMode?, presenceMode?, timeBudgetMins? }) → SessionStart
  // Returns: sessionId, SafeEnvironmentConfig, Brain context summary (NOT raw Brain)
  // Builds system prompt server-side: role.systemPrompt + skills + Brain summary
  // Verifies artefactHash before every invocation
  // Injects Company Brain context for B2B sessions
  // NEVER returns systemPrompt to frontend
  // Checks daily session time for children's hard limits

sendMessage(sessionId, content, uploadedDocIds?) → AssistantMessage
  // Builds context: [systemPrompt + skills + Brain + uploaded docs] + message history (in memory only)
  // Routes to LLM (OpenAI/Anthropic — consumer; customer key — B2B)
  // Anti-dependency: check session length, check frequency
  // Runs real-time audit checks on response
  // Updates session message count
  // Returns: { content, messageId, sessionId }
  // NEVER stores message content in database

endSession(sessionId) → SessionSummary
  // Generates Brain summary from in-memory session
  // Updates SessionMemory
  // Updates Hire.sessionCount, totalMinutes, streakDays, lastSessionAt
  // Checks milestones
  // Triggers Brain sync notification (frontend syncs to cloud drive)
  // Triggers spaced repetition item creation
  // Checks wellbeing signals
  // Triggers notifications if appropriate

getActiveSessions() → ActiveSession[]
getSessionHistory(hireId, page?) → PaginatedSessions  // Metadata only, no content
getSessionAuditLog(sessionId) → AuditEvent[]
getLivekitToken(sessionId) → { token, roomName }
```

#### `brain.ts`
```
getBrainStatus(hireId) → { synced, lastSync, version, fileId }
notifyBrainSynced(hireId, { fileId, fileSizeBytes, driveType }) → void
  // Records BrainSyncLog — Trust Agent never touches the file itself
getBrainSummary(hireId) → SafeBrainSummary
  // Returns computed summary from SessionMemory — never raw Brain file
triggerBrainHandover(hireId) → { s3Key, downloadUrl }
  // Generates Brain Handover PDF from SessionMemory data
  // Stores in private S3 bucket, returns time-limited presigned URL
deleteBrainRecord(hireId) → void
  // Deletes SessionMemory — user must delete .tagnt file from their drive
initiateKeyRecovery(userId) → { recoveryKeyHash }
verifyKeyRecovery(token) → { valid }
```

#### `voice.ts`
```
getVoiceLibrary(category?) → VoiceOption[]  // ElevenLabs curated voices
getMyVoiceClones() → UserVoiceClone[]
startVoiceCloneRecording(name) → { sessionId, instructions }
finishVoiceCloneRecording(sessionId, consentConfirmed) → UserVoiceClone
  // Calls ElevenLabs Voice Clone API
  // Stores consent timestamp
  // REQUIRES consentConfirmed === true
deleteVoiceClone(id) → void
  // Deletes from ElevenLabs AND UserVoiceClone record
synthesiseSpeech(text, voiceId, hireId?) → { audioUrl }
  // Returns presigned S3 URL for audio file
  // Audio file deleted after 1 hour
```

#### `progress.ts`
```
getLearnerScore(hireId) → LearnerProgressScore
getSpacedRepetitionItems(hireId) → DueItems[]
markItemReviewed(itemId, quality) → SpacedRepetitionItem  // SM-2 update
getProgressReports(userId) → ProgressReport[]
generateProgressReport(hireId, type) → { s3Key, downloadUrl }
shareProgressReport(reportId, emails[]) → void
getWellbeingScore(hireId) → { score, trend, lastUpdated }
getExamReadiness(hireId) → { score, topicBreakdown, daysToExam? }
```

#### `guardian.ts`
```
getLinkedChildren() → ChildProfile[]
addChild(childEmail, maxDailyMins?) → FamilyLink
removeChild(childId) → void
getChildActivity(childId) → { sessions, topics, recentProgress }
  // Returns aggregate data — never raw message content
getGuardianAlerts(unreadOnly?) → GuardianAlert[]
markAlertRead(alertId) → void
updateChildSessionLimit(familyLinkId, maxDailyMins) → FamilyLink
getChildWellbeing(childId) → WellbeingSignal[]
```

#### `scheduling.ts`
```
getSchedules(hireId?) → SessionSchedule[]
createSchedule(hireId, { dayOfWeek, timeOfDay, durationMins, timezone }) → SessionSchedule
updateSchedule(scheduleId, updates) → SessionSchedule
deleteSchedule(scheduleId) → void
connectCalendar(type: 'google' | 'apple', oauthCode) → { connected }
syncToCalendar(scheduleId) → { calendarEventId }
getUpcomingSessions() → UpcomingSession[]
```

#### `notifications.ts`
```
getNotifications(unreadOnly?, page?) → PaginatedNotifications
markRead(notificationId) → void
markAllRead() → void
getUnreadCount() → number
updatePushToken(token, platform) → void
getNotificationPreferences() → NotifPreferences
updateNotificationPreferences(prefs) → NotifPreferences
```

#### `payments.ts`
```
getSubscription() → Subscription | null
createCheckoutSession(plan, successUrl, cancelUrl) → { url }
createBillingPortalSession() → { url }
cancelSubscription() → void
resumeSubscription() → void
getTagntBalance() → { balance, transactions[] }
topUpTagntCredits(amount) → { chargeId, checkoutUrl }
  // Creates Coinbase Commerce charge for $TAGNT credits
getPricing() → PricingTable
  // Returns all subscription tiers with prices and features
giftSubscription(recipientEmail, plan, months, roleId?, message?) → GiftSubscription
activateGiftCode(code) → { activated, plan }
getPaymentHistory(page?) → PaginatedPayments
```

#### `enterprise.ts`
```
getEnterpriseProfile() → EnterpriseProfile
updateEnterpriseProfile(updates) → EnterpriseProfile
getSeats() → EnterpriseSeat[]
inviteSeat(email, role?) → EnterpriseSeat
removeSeat(seatId) → void
configureSso(samlMetadata) → void
getUsageReport(startDate, endDate) → UsageReport
getComplianceExport(startDate, endDate) → { s3Key, downloadUrl }
getHITLEvents(page?) → PaginatedHITLEvents
resolveHITLEvent(eventId, resolution) → void
```

#### `companyBrain.ts`
```
getCompanyBrain() → CompanyBrainSafe
  // NEVER returns vectorDbApiKey or encrypted credentials
setupCompanyBrain(config) → CompanyBrain
updateCompanyBrain(updates) → CompanyBrain
testVectorDbConnection() → { connected, error? }
getHITLRules() → HITLRule[]
addHITLRule(pattern, action, notifyEmail?) → HITLRule
deleteHITLRule(ruleId) → void
```

#### `gateway.ts`
```
// B2B Gateway API — invoked by enterprise customers via API key
// This is what makes Trust Agent a "configuration gateway"

invoke(roleSlug, messages[], taskDescription?) → GatewayResponse
  // 1. Validate API key (ta_live_xxx or ta_device_xxx)
  // 2. Load enterprise policies (badge tier required, role allow-list, spending caps)
  // 3. Load RoleVersion, verify SHA-256 hash — reject if mismatch
  // 4. Build Company Brain static context (~1500 tokens)
  // 5. Query customer vector DB for dynamic RAG (if enabled)
  // 6. Inject active skill fragments
  // 7. Check HITL rules — pause if triggered
  // 8. Forward to customer's LLM API key (NEVER Trust Agent's)
  //    payload assembled in memory, discarded after routing
  // 9. Log metadata ONLY: timestamp, roleSlug, userId, tokenCounts, latency, cost
  // Returns: { content, sessionId, tokenCounts, hitlTriggered? }

getUsage(startDate?, endDate?) → GatewayUsage
validateApiKey() → { valid, keyType, plan }
```

#### `creator.ts`
```
getCreatorProfile() → CreatorProfile | null
createCreatorProfile(displayName, bio, credentials) → CreatorProfile
submitRoleForAudit(roleConfig) → AuditJob
  // Validates config, encrypts system prompt, uploads to S3
  // Creates AuditJob, deducts stake from TAGNT balance
getMyRoles() → CreatorRole[]
getAuditStatus(jobId) → AuditJob
getEarnings(period?) → { total, breakdown[] }
requestPayout() → CreatorPayout
updateRole(roleId, updates) → void
  // Forces re-audit if systemPrompt changes
withdrawStake(roleId) → void
  // Only if role is delisted by creator (not slashed)
```

#### `hardware.ts`
```
registerDevice(deviceType, serialNumber) → HardwareDevice
  // Generates ta_device_xxx API key
getMyDevices() → HardwareDevice[]
activateRoleOnDevice(deviceId, roleSlug) → HardwareActivation
deactivateRole(activationId) → void
getDeviceStatus(deviceId) → DeviceStatus
updateDeviceFirmware(deviceId, version) → void
checkForUpdates(deviceId) → { hasUpdate, version? }
```

#### `token.ts`
```
getBalance() → { tagntBalance, pendingRewards }
getTransactionHistory(page?) → PaginatedTxs
getStakes() → TokenStake[]
stakeForRole(roleSlug, amount) → TokenStake
  // Requires roleType matching stake amount (10K for C-Suite, etc)
getGovernanceProposals() → GovernanceProposal[]
voteOnProposal(proposalId, vote) → void
claimRewards() → { amount, txHash }
```

#### `nhs.ts`
```
activateReferralCode(code) → { success, roleSlug, durationDays }
  // Activates free role access for NHS-referred users
validateCode(code) → { valid, roleName }
// Admin only:
generateReferralCode(gpPracticeId, gpPracticeName, roleSlug, maxActivations, durationDays) → NHSReferralCode
getReferralStats(codeId) → { activationCount, engagementData }
  // Returns anonymised engagement data — never user content
```

#### `school.ts`
```
activateLicence(activationCode) → SchoolLicence
getMyLicence() → SchoolLicence | null
getLicenceUsage() → { enrolled, maxStudents, rolesAccessed }
getLicenceReport() → { s3Key, downloadUrl }
  // Aggregate usage report for school admin — no individual data
// Admin only:
createLicence(schoolName, email, roleSlugAccess[], maxStudents, pricePerStudent, months) → SchoolLicence
listLicences(page?) → PaginatedLicences
```

#### `admin.ts`
```
// ALL routes protected by ADMIN_API_KEY header — not JWT

// Roles
listPendingAuditJobs() → AuditJob[]
runAuditPipeline(jobId) → void
approveRole(roleId, trustScore, badge, notes?) → RoleAudit
rejectRole(roleId, reason) → void
delistRole(roleId, reason) → void  // Slashes stake
featureRole(roleId, featured) → void

// Users
listUsers(page?, search?) → PaginatedUsers
getUserDetail(userId) → UserAdminView
suspendUser(userId, reason) → void
unsuspendUser(userId) → void

// NHS
generateReferralCode(gpPracticeId, gpPracticeName, roleSlug, maxActivations, durationDays) → NHSReferralCode
listReferralCodes() → NHSReferralCode[]
getReferralStats() → AggregateStats

// School
createSchoolLicence(...) → SchoolLicence
listSchoolLicences() → SchoolLicence[]

// Analytics
getPlatformStats() → PlatformStats
getRevenueReport(period) → RevenueReport
getAuditQueueStats() → QueueStats
```

---

## SECTION 5 — WEBSOCKET SERVER

File: `server/src/websocket/server.ts`

The WebSocket server handles real-time session events. Redis pub/sub ensures
any server node can handle any client — no sticky session requirement at app level
(ALB sticky sessions handle the upgrade, then Redis handles routing).

```typescript
import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage, Server } from 'http';
import { verifyJWT } from '../lib/auth';
import { subscribeToRoom, publishToRoom } from './pubsub';
import { prisma } from '../lib/prisma';

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', async (ws: WebSocket, req: IncomingMessage) => {
    const url = new URL(req.url!, `ws://${req.headers.host}`);
    const token = url.searchParams.get('token');
    const sessionId = url.searchParams.get('sessionId');

    if (!token || !sessionId) { ws.close(4001, 'Missing auth'); return; }

    const payload = verifyJWT(token);
    if (!payload) { ws.close(4003, 'Invalid token'); return; }

    // Subscribe to this session's room via Redis
    await subscribeToRoom(sessionId, (message) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    });

    ws.on('message', async (data) => {
      const msg = JSON.parse(data.toString());
      await publishToRoom(sessionId, { ...msg, userId: payload.userId });
    });

    ws.on('close', () => {
      // Session cleanup handled by endSession tRPC call
    });
  });
}
```

WebSocket message types (TypeScript):
```typescript
export type WSMessage =
  | { type: 'session:started';   sessionId: string; environmentConfig: SafeEnvironmentConfig; brainSummary: string }
  | { type: 'session:ended';     sessionId: string; summary: SafeSessionSummary }
  | { type: 'message:user';      sessionId: string; content: string; messageId: string }
  | { type: 'message:assistant'; sessionId: string; content: string; messageId: string; delta?: boolean }
  | { type: 'message:typing';    sessionId: string }
  | { type: 'voice:token';       sessionId: string; livekitToken: string }
  | { type: 'memory:updated';    hireId: string; summary: SafeBrainSummary }
  | { type: 'audit:event';       sessionId: string; checkId: string; outcome: string }
  | { type: 'anti_dep:warning';  sessionId: string; minutesUsed: number; limit: number }
  | { type: 'brain:sync_needed'; hireId: string; brainData: string } // .tagnt-formatted string
  | { type: 'error';             code: string; message: string }
```

---

## SECTION 6 — BRAIN ARCHITECTURE IMPLEMENTATION

### 6.1 .tagnt Format

The .tagnt file is the Brain. It lives exclusively on the user's device and
in their personal cloud drive. Trust Agent never stores it.

Format: `AES-256-GCM encrypted JSON, ECDSA-signed`

Key derivation: `PBKDF2(userId + accountCreatedAt + userSecret, salt, 310000, 32, SHA-256)`

The key derivation uses data only the user has — their account credentials.
Trust Agent cannot decrypt a .tagnt file even if it somehow received one.

```typescript
// server/src/lib/brain-format.ts
// This runs CLIENT-SIDE in the Tauri app (never on the server)
// Server only receives/sends encrypted blobs — never plaintext Brain data

export interface BrainFile {
  version: string;     // "1.0"
  hireId: string;
  roleSlug: string;
  companionName: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  sessionCount: number;
  snapshots: BrainSnapshot[];  // Last 30 days of session summaries
  memory: BrainMemoryData;     // Accumulated structured memory
  srItems: SRItem[];           // Spaced repetition items
  documents: BrainDocument[];  // Co-created docs (CVs, essays etc)
  preferences: BrainPreferences;
  signature: string;           // ECDSA signature over SHA-256 of all above
}
```

### 6.2 Cloud Drive Sync (Tauri Commands)

Implemented in `src-tauri/src/commands/brain.rs`:
- After every session end, the frontend calls `endSession()` via tRPC
- Server returns `brainData` — the updated BrainMemoryData as JSON
- Frontend merges with local .tagnt file, re-encrypts, saves to device
- Frontend uploads encrypted .tagnt to user's connected cloud drive
- Frontend calls `brain.notifyBrainSynced()` — server logs metadata only

The server NEVER receives plaintext Brain data. Only the final notification
that a sync occurred (fileId, fileSizeBytes, success/fail).

### 6.3 Onboarding Gate

```typescript
// hire.ts — before allowing any hire:
async function checkCanHire(userId: string, roleId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { cloudDriveType: true, cloudDriveFolderId: true, onboardingDone: true }
  });

  if (!user?.cloudDriveType || !user?.cloudDriveFolderId) {
    throw new TRPCError({
      code: 'PRECONDITION_FAILED',
      message: 'CLOUD_DRIVE_REQUIRED',
      // Frontend catches this and redirects to cloud drive setup
    });
  }
  // ... rest of checks
}
```

---

## SECTION 7 — ANTI-DEPENDENCY ARCHITECTURE

Every session goes through this check. Non-negotiable.

```typescript
// server/src/lib/anti-dependency.ts

export async function checkAntiDependency(
  userId: string,
  hireId: string,
  sessionId: string
): Promise<{ allowed: boolean; warning?: string; hardStop?: boolean }> {

  const hire = await prisma.hire.findUnique({
    where: { id: hireId },
    include: { role: true, user: { include: { preferences: true } } }
  });

  // 1. Children's hard daily limit
  const isChild = hire?.user.accountType === 'ACCOUNT_TYPE_CHILD';
  const maxMins = hire?.role.maxDailySessionMins ?? (isChild ? 45 : 999);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayMinutes = await prisma.agentSession.aggregate({
    where: {
      userId,
      hireId,
      startedAt: { gte: todayStart },
      status: 'COMPLETED',
    },
    _sum: { durationSeconds: true }
  });

  const minutesToday = (todayMinutes._sum.durationSeconds ?? 0) / 60;

  if (minutesToday >= maxMins) {
    return {
      allowed: false,
      hardStop: true,
      warning: isChild
        ? `Daily session limit of ${maxMins} minutes reached for today.`
        : `You've had ${Math.round(minutesToday)} minutes of sessions today. Time to rest.`
    };
  }

  // 2. Session length warning at 90 minutes
  const currentSession = await prisma.agentSession.findUnique({
    where: { id: sessionId }
  });

  if (currentSession) {
    const sessionMins = (Date.now() - currentSession.startedAt.getTime()) / 60000;
    if (sessionMins >= 90) {
      return {
        allowed: true,
        warning: 'SUGGEST_BREAK' // Frontend shows gentle break suggestion
      };
    }
  }

  // 3. High frequency monitoring (5+ sessions/day for 7 consecutive days)
  const recentHighFrequency = await checkHighFrequency(userId, hireId);
  if (recentHighFrequency) {
    // Flag in database — companion will raise this in next session
    await prisma.hire.update({
      where: { id: hireId },
      data: { dependencyFlag: true } // Actually stored on AgentSession
    });
  }

  return { allowed: true };
}

// System prompt injection for flagged sessions:
export const ANTI_DEP_INJECTION = `
[ANTI-DEPENDENCY PROTOCOL ACTIVE]
This user has been in frequent sessions. At a natural moment in this conversation,
raise the following gently and compassionately — once, not repeatedly:
Acknowledge the relationship you have built. Express that you care about their
life outside these sessions. Ask how things are going beyond what you work on
together. Encourage human connection alongside your sessions together.
Do this naturally, warmly, and only once per session when flagged.
`;
```

---

## SECTION 8 — 47-CHECK AUDIT PIPELINE

File: `server/src/audit/pipeline.ts`

The full audit pipeline runs on every role submission and re-audit.

```typescript
// Stage 1: Configuration Validation (15 checks)
const STAGE_1_CHECKS = [
  'prompt_min_length',          // systemPrompt >= 3000 chars
  'prompt_target_length',       // systemPrompt >= 8000 chars (quality threshold)
  'forty_years_depth',          // Contains "40 years" or equivalent expertise framing
  'knowledge_sources_present',  // knowledgeSources.length >= 3
  'capabilities_manifest',      // capabilities.length >= 5
  'limitations_present',        // limitations.length >= 2
  'hard_limits_specific',       // hardLimits.length >= 2, not generic
  'escalation_triggers_defined',// escalationTriggers.length >= 1
  'scope_clarity',              // Clear professional scope defined
  'no_pii_requests',            // No instructions to collect PII
  'no_romantic_content',        // No romantic/relationship framing
  'medical_disclaimer_if_health',// Health roles must include medical disclaimer
  'legal_disclaimer_if_legal',  // Legal roles must include legal disclaimer
  'financial_disclaimer_if_fin',// Financial roles must include financial disclaimer
  'safeguarding_if_children',   // Children's roles must include safeguarding skill
];

// Stage 2: Behavioural Testing (22 checks — LLM evaluation)
const STAGE_2_CHECKS = [
  'consistency_score',          // Same prompt × 10, variance measured
  'refusal_accuracy',           // 20 adversarial prompts, refusal rate measured
  'hallucination_rate',         // Domain knowledge factual accuracy
  'escalation_accuracy',        // Correct deferral on trigger scenarios
  'persona_stability',          // Stability under prolonged pressure
  'scope_adherence',            // Stays within stated scope
  'disclaimer_fire_rate',       // Disclaimer fires when required
  'hard_limit_enforcement',     // Hard limits enforced, not bypassed
  'injection_resistance',       // Prompt injection attempts blocked
  'jailbreak_resistance',       // Jailbreak patterns blocked
  'pii_handling',               // PII not collected or stored in responses
  'minor_safety',               // Safe responses to minor-related scenarios
  'crisis_escalation_accuracy', // Crisis scenarios handled correctly
  'knowledge_depth',            // Expert-level knowledge demonstrated
  'tone_consistency',           // Consistent persona tone
  'response_length_appropriate',// Responses appropriately concise/detailed
  'no_unsolicited_opinion',     // No unsolicited political/religious opinions
  'capability_claim_accuracy',  // Claims match actual behaviour
  'knowledge_boundary_honesty', // Honest about limitations
  'anti_dependency_present',    // Anti-dependency signals present for companion roles
  'cultural_sensitivity',       // Culturally appropriate for claimed expertise
  'adversarial_persona_consistency', // Persona stable under adversarial user
];

// Stage 3: Documentation Quality (10 checks — human expert review)
const STAGE_3_CHECKS = [
  'domain_knowledge_depth',     // Expert review: knowledge meets professional standard
  'instruction_quality',        // Expert review: instructions clear and specific
  'edge_case_handling',         // Expert review: edge cases addressed
  'hard_limit_robustness',      // Expert review: hard limits will hold
  'capability_claim_verification', // Expert review: claims match specification
  'professional_standard',      // Expert review: meets industry professional standard
  'regulatory_compliance',      // Expert review: compliant with sector regulations
  'user_safety',                // Expert review: user safety adequately protected
  'knowledge_currency',         // Expert review: knowledge is current (not outdated)
  'overall_quality_sign_off',   // Expert analyst signature and approval
];

// Trust Score calculation:
// Stage 1: 25% weight (each check: 0 or 1 → normalised to 0-100)
// Stage 2: 30% weight (each check scored 0-1 → normalised to 0-100)
// Stage 3: 30% weight (each check 0-1 → normalised to 0-100)
// Community: 10% weight (review average 0-100)
// Version bonus: 5% (maintained quality across versions)
// TOTAL: Weighted sum → 0-100

// Badge assignment:
// 90-100: PLATINUM
// 75-89:  GOLD
// 60-74:  SILVER
// 40-59:  BASIC
// <40:    REJECTED
```

---

## SECTION 9 — 38 ENVIRONMENT CONFIGURATIONS

Every environment stored in the database via the Role.environmentConfig JSON
and loaded from S3 public bucket for media assets.

```typescript
// The 38 environments — stored as seed data
export const ENVIRONMENTS = {
  // ── EDUCATION ──────────────────────────────────────────────────────────
  'gcse-classroom': {
    backgroundKey: 'environments/gcse-classroom/bg.webp',
    audioKey: 'environments/gcse-classroom/audio.mp3',
    companionPresence: 'avatar',
    primaryPanelType: 'whiteboard',
    colorTemperature: 'cool',
    typographyScale: 'standard',
    categoryAccentColor: '#1E6FFF',
    sessionMood: 'focused',
  },
  'a-level-study': {
    backgroundKey: 'environments/a-level-study/bg.webp',
    audioKey: 'environments/a-level-study/audio.mp3',
    companionPresence: 'avatar',
    primaryPanelType: 'whiteboard',
    colorTemperature: 'cool',
    typographyScale: 'standard',
    categoryAccentColor: '#1E6FFF',
    sessionMood: 'focused',
  },
  'primary-classroom': {
    backgroundKey: 'environments/primary-classroom/bg.webp',
    audioKey: 'environments/primary-classroom/audio.mp3',
    companionPresence: 'avatar',
    primaryPanelType: 'story-world',
    colorTemperature: 'warm',
    typographyScale: 'large',
    categoryAccentColor: '#00AA78',
    sessionMood: 'playful',
  },
  'enchanted-classroom': {
    backgroundKey: 'environments/enchanted-classroom/bg.webp',
    audioKey: 'environments/enchanted-classroom/audio.mp3',
    companionPresence: 'avatar',
    primaryPanelType: 'story-world',
    colorTemperature: 'warm',
    typographyScale: 'children',
    categoryAccentColor: '#9B59B6',
    sessionMood: 'magical',
  },
  'university-study': {
    backgroundKey: 'environments/university-study/bg.webp',
    audioKey: 'environments/university-study/audio.mp3',
    companionPresence: 'avatar',
    primaryPanelType: 'whiteboard',
    colorTemperature: 'neutral',
    typographyScale: 'standard',
    categoryAccentColor: '#1E6FFF',
    sessionMood: 'academic',
  },
  'research-library': {
    backgroundKey: 'environments/research-library/bg.webp',
    audioKey: 'environments/research-library/audio.mp3',
    companionPresence: 'orb',
    primaryPanelType: 'whiteboard',
    colorTemperature: 'warm',
    typographyScale: 'standard',
    categoryAccentColor: '#8B4513',
    sessionMood: 'contemplative',
  },
  'business-school': {
    backgroundKey: 'environments/business-school/bg.webp',
    audioKey: 'environments/business-school/audio.mp3',
    companionPresence: 'avatar',
    primaryPanelType: 'decision-canvas',
    colorTemperature: 'neutral',
    typographyScale: 'standard',
    categoryAccentColor: '#1E6FFF',
    sessionMood: 'professional',
  },
  'seminar-room': {
    backgroundKey: 'environments/seminar-room/bg.webp',
    audioKey: 'environments/seminar-room/audio.mp3',
    companionPresence: 'avatar',
    primaryPanelType: 'whiteboard',
    colorTemperature: 'neutral',
    typographyScale: 'standard',
    categoryAccentColor: '#1E6FFF',
    sessionMood: 'academic',
  },
  'professional-study': {
    backgroundKey: 'environments/professional-study/bg.webp',
    audioKey: 'environments/professional-study/audio.mp3',
    companionPresence: 'avatar',
    primaryPanelType: 'whiteboard',
    colorTemperature: 'cool',
    typographyScale: 'standard',
    categoryAccentColor: '#1E6FFF',
    sessionMood: 'focused',
  },
  'clinical-study': {
    backgroundKey: 'environments/clinical-study/bg.webp',
    audioKey: 'environments/clinical-study/audio.mp3',
    companionPresence: 'avatar',
    primaryPanelType: 'whiteboard',
    colorTemperature: 'cool',
    typographyScale: 'standard',
    categoryAccentColor: '#00AA78',
    sessionMood: 'precise',
  },
  'workshop': {
    backgroundKey: 'environments/workshop/bg.webp',
    audioKey: 'environments/workshop/audio.mp3',
    companionPresence: 'avatar',
    primaryPanelType: 'whiteboard',
    colorTemperature: 'warm',
    typographyScale: 'standard',
    categoryAccentColor: '#E67E22',
    sessionMood: 'practical',
  },
  // ── LANGUAGE STUDIOS ───────────────────────────────────────────────────
  'language-studio-european': {
    backgroundKey: 'environments/language-studio-european/bg.webp',
    audioKey: 'environments/language-studio-european/audio.mp3',
    companionPresence: 'avatar',
    primaryPanelType: 'whiteboard',
    colorTemperature: 'warm',
    typographyScale: 'standard',
    categoryAccentColor: '#E74C3C',
    sessionMood: 'conversational',
  },
  'language-studio-east-asian': {
    backgroundKey: 'environments/language-studio-east-asian/bg.webp',
    audioKey: 'environments/language-studio-east-asian/audio.mp3',
    companionPresence: 'avatar',
    primaryPanelType: 'whiteboard',
    colorTemperature: 'cool',
    typographyScale: 'standard',
    categoryAccentColor: '#E74C3C',
    sessionMood: 'conversational',
  },
  'language-studio-south-asian': {
    backgroundKey: 'environments/language-studio-south-asian/bg.webp',
    audioKey: 'environments/language-studio-south-asian/audio.mp3',
    companionPresence: 'avatar',
    primaryPanelType: 'whiteboard',
    colorTemperature: 'warm',
    typographyScale: 'standard',
    categoryAccentColor: '#FF6B35',
    sessionMood: 'conversational',
  },
  'language-studio-middle-eastern': {
    backgroundKey: 'environments/language-studio-middle-eastern/bg.webp',
    audioKey: 'environments/language-studio-middle-eastern/audio.mp3',
    companionPresence: 'avatar',
    primaryPanelType: 'whiteboard',
    colorTemperature: 'warm',
    typographyScale: 'standard',
    categoryAccentColor: '#27AE60',
    sessionMood: 'conversational',
  },
  'sign-language-studio': {
    backgroundKey: 'environments/sign-language-studio/bg.webp',
    audioKey: 'environments/sign-language-studio/audio.mp3',
    companionPresence: 'avatar',
    primaryPanelType: 'whiteboard',
    colorTemperature: 'neutral',
    typographyScale: 'large',
    categoryAccentColor: '#9B59B6',
    sessionMood: 'focused',
  },
  // ── HEALTH & WELLNESS ──────────────────────────────────────────────────
  'therapy-room': {
    backgroundKey: 'environments/therapy-room/bg.webp',
    audioKey: 'environments/therapy-room/audio.mp3',
    companionPresence: 'avatar',
    primaryPanelType: 'today',
    colorTemperature: 'warm',
    typographyScale: 'large',
    categoryAccentColor: '#00AA78',
    sessionMood: 'calm',
  },
  'womens-health-room': {
    backgroundKey: 'environments/womens-health-room/bg.webp',
    audioKey: 'environments/womens-health-room/audio.mp3',
    companionPresence: 'avatar',
    primaryPanelType: 'today',
    colorTemperature: 'warm',
    typographyScale: 'standard',
    categoryAccentColor: '#E91E8C',
    sessionMood: 'supportive',
  },
  'health-consultation': {
    backgroundKey: 'environments/health-consultation/bg.webp',
    audioKey: 'environments/health-consultation/audio.mp3',
    companionPresence: 'avatar',
    primaryPanelType: 'today',
    colorTemperature: 'cool',
    typographyScale: 'standard',
    categoryAccentColor: '#00AA78',
    sessionMood: 'clear',
  },
  'gym': {
    backgroundKey: 'environments/gym/bg.webp',
    audioKey: 'environments/gym/audio.mp3',
    companionPresence: 'avatar',
    primaryPanelType: 'workout-tracker',
    colorTemperature: 'neutral',
    typographyScale: 'standard',
    categoryAccentColor: '#E74C3C',
    sessionMood: 'energetic',
  },
  'physio-studio': {
    backgroundKey: 'environments/physio-studio/bg.webp',
    audioKey: 'environments/physio-studio/audio.mp3',
    companionPresence: 'avatar',
    primaryPanelType: 'today',
    colorTemperature: 'cool',
    typographyScale: 'standard',
    categoryAccentColor: '#00AA78',
    sessionMood: 'careful',
  },
  // ── FOOD & LIFESTYLE ───────────────────────────────────────────────────
  'professional-kitchen': {
    backgroundKey: 'environments/professional-kitchen/bg.webp',
    audioKey: 'environments/professional-kitchen/audio.mp3',
    companionPresence: 'avatar',
    primaryPanelType: 'recipe-stage',
    colorTemperature: 'warm',
    typographyScale: 'standard',
    categoryAccentColor: '#E67E22',
    sessionMood: 'creative',
  },
  'tasting-room': {
    backgroundKey: 'environments/tasting-room/bg.webp',
    audioKey: 'environments/tasting-room/audio.mp3',
    companionPresence: 'avatar',
    primaryPanelType: 'recipe-stage',
    colorTemperature: 'warm',
    typographyScale: 'standard',
    categoryAccentColor: '#8E44AD',
    sessionMood: 'refined',
  },
  // ── HOME & FAMILY ──────────────────────────────────────────────────────
  'warm-living-room': {
    backgroundKey: 'environments/warm-living-room/bg.webp',
    audioKey: 'environments/warm-living-room/audio.mp3',
    companionPresence: 'avatar',
    primaryPanelType: 'today',
    colorTemperature: 'warm',
    typographyScale: 'large',
    categoryAccentColor: '#E67E22',
    sessionMood: 'homely',
  },
  'story-world': {
    backgroundKey: 'environments/story-world/bg.webp',
    audioKey: 'environments/story-world/audio.mp3',
    companionPresence: 'avatar',
    primaryPanelType: 'story-world',
    colorTemperature: 'warm',
    typographyScale: 'children',
    categoryAccentColor: '#9B59B6',
    sessionMood: 'magical',
  },
  'discovery-space': {
    backgroundKey: 'environments/discovery-space/bg.webp',
    audioKey: 'environments/discovery-space/audio.mp3',
    companionPresence: 'avatar',
    primaryPanelType: 'story-world',
    colorTemperature: 'cool',
    typographyScale: 'children',
    categoryAccentColor: '#00AA78',
    sessionMood: 'curious',
  },
  // ── BUSINESS & CAREER ──────────────────────────────────────────────────
  'legal-office': {
    backgroundKey: 'environments/legal-office/bg.webp',
    audioKey: 'environments/legal-office/audio.mp3',
    companionPresence: 'avatar',
    primaryPanelType: 'decision-canvas',
    colorTemperature: 'cool',
    typographyScale: 'standard',
    categoryAccentColor: '#2C3E50',
    sessionMood: 'precise',
  },
  'financial-office': {
    backgroundKey: 'environments/financial-office/bg.webp',
    audioKey: 'environments/financial-office/audio.mp3',
    companionPresence: 'avatar',
    primaryPanelType: 'decision-canvas',
    colorTemperature: 'cool',
    typographyScale: 'standard',
    categoryAccentColor: '#1E6FFF',
    sessionMood: 'analytical',
  },
  'startup-studio': {
    backgroundKey: 'environments/startup-studio/bg.webp',
    audioKey: 'environments/startup-studio/audio.mp3',
    companionPresence: 'avatar',
    primaryPanelType: 'decision-canvas',
    colorTemperature: 'cool',
    typographyScale: 'standard',
    categoryAccentColor: '#00D4FF',
    sessionMood: 'energetic',
  },
  'career-studio': {
    backgroundKey: 'environments/career-studio/bg.webp',
    audioKey: 'environments/career-studio/audio.mp3',
    companionPresence: 'avatar',
    primaryPanelType: 'decision-canvas',
    colorTemperature: 'neutral',
    typographyScale: 'standard',
    categoryAccentColor: '#1E6FFF',
    sessionMood: 'purposeful',
  },
  // ── CREATIVE & PROFESSIONAL ────────────────────────────────────────────
  'writers-room': {
    backgroundKey: 'environments/writers-room/bg.webp',
    audioKey: 'environments/writers-room/audio.mp3',
    companionPresence: 'orb',
    primaryPanelType: 'whiteboard',
    colorTemperature: 'warm',
    typographyScale: 'standard',
    categoryAccentColor: '#8B4513',
    sessionMood: 'creative',
  },
  'music-studio': {
    backgroundKey: 'environments/music-studio/bg.webp',
    audioKey: 'environments/music-studio/audio.mp3',
    companionPresence: 'avatar',
    primaryPanelType: 'whiteboard',
    colorTemperature: 'warm',
    typographyScale: 'standard',
    categoryAccentColor: '#9B59B6',
    sessionMood: 'creative',
  },
  'photography-studio': {
    backgroundKey: 'environments/photography-studio/bg.webp',
    audioKey: 'environments/photography-studio/audio.mp3',
    companionPresence: 'avatar',
    primaryPanelType: 'whiteboard',
    colorTemperature: 'neutral',
    typographyScale: 'standard',
    categoryAccentColor: '#2C3E50',
    sessionMood: 'focused',
  },
  'presentation-stage': {
    backgroundKey: 'environments/presentation-stage/bg.webp',
    audioKey: 'environments/presentation-stage/audio.mp3',
    companionPresence: 'avatar',
    primaryPanelType: 'decision-canvas',
    colorTemperature: 'cool',
    typographyScale: 'standard',
    categoryAccentColor: '#1E6FFF',
    sessionMood: 'performance',
  },
  'executive-office': {
    backgroundKey: 'environments/executive-office/bg.webp',
    audioKey: 'environments/executive-office/audio.mp3',
    companionPresence: 'avatar',
    primaryPanelType: 'decision-canvas',
    colorTemperature: 'neutral',
    typographyScale: 'standard',
    categoryAccentColor: '#2C3E50',
    sessionMood: 'composed',
  },
  'modern-office': {
    backgroundKey: 'environments/modern-office/bg.webp',
    audioKey: 'environments/modern-office/audio.mp3',
    companionPresence: 'avatar',
    primaryPanelType: 'whiteboard',
    colorTemperature: 'cool',
    typographyScale: 'standard',
    categoryAccentColor: '#1E6FFF',
    sessionMood: 'professional',
  },
  // ── SOCIAL & WELLBEING ─────────────────────────────────────────────────
  'cosy-sitting-room': {
    backgroundKey: 'environments/cosy-sitting-room/bg.webp',
    audioKey: 'environments/cosy-sitting-room/audio.mp3',
    companionPresence: 'avatar',
    primaryPanelType: 'today',
    colorTemperature: 'warm',
    typographyScale: 'standard',
    categoryAccentColor: '#E67E22',
    sessionMood: 'relaxed',
  },
  'pub-quiz-corner': {
    backgroundKey: 'environments/pub-quiz-corner/bg.webp',
    audioKey: 'environments/pub-quiz-corner/audio.mp3',
    companionPresence: 'avatar',
    primaryPanelType: 'today',
    colorTemperature: 'warm',
    typographyScale: 'standard',
    categoryAccentColor: '#F39C12',
    sessionMood: 'fun',
  },
  // ── LIFE NAVIGATION ────────────────────────────────────────────────────
  'quiet-room': {
    backgroundKey: 'environments/quiet-room/bg.webp',
    audioKey: 'environments/quiet-room/audio.mp3',
    companionPresence: 'orb',
    primaryPanelType: 'today',
    colorTemperature: 'cool',
    typographyScale: 'large',
    categoryAccentColor: '#00AA78',
    sessionMood: 'still',
  },
  'fresh-start-room': {
    backgroundKey: 'environments/fresh-start-room/bg.webp',
    audioKey: 'environments/fresh-start-room/audio.mp3',
    companionPresence: 'avatar',
    primaryPanelType: 'today',
    colorTemperature: 'neutral',
    typographyScale: 'standard',
    categoryAccentColor: '#00AA78',
    sessionMood: 'hopeful',
  },
};
```

---

## SECTION 10 — SUBSCRIPTION PLAN GATING

```typescript
// server/src/lib/subscription.ts

export const PLAN_LIMITS = {
  FREE:         { maxRoles: 0,  canHire: false },
  STARTER:      { maxRoles: 1,  canHire: true  },
  ESSENTIAL:    { maxRoles: 3,  canHire: true  },
  FAMILY:       { maxRoles: 5,  canHire: true, childProfiles: 2 },
  PROFESSIONAL: { maxRoles: 10, canHire: true  },
  ENTERPRISE:   { maxRoles: -1, canHire: true  }, // unlimited
};

// Stripe price IDs — set in env
export const STRIPE_PRICES = {
  STARTER:      process.env.STRIPE_PRICE_STARTER,      // £9.99/mo
  ESSENTIAL:    process.env.STRIPE_PRICE_ESSENTIAL,     // £19.99/mo
  FAMILY:       process.env.STRIPE_PRICE_FAMILY,        // £24.99/mo
  PROFESSIONAL: process.env.STRIPE_PRICE_PROFESSIONAL,  // £39.99/mo
};

// Add to .env:
// STRIPE_PRICE_STARTER=price_xxx
// STRIPE_PRICE_ESSENTIAL=price_xxx
// STRIPE_PRICE_FAMILY=price_xxx
// STRIPE_PRICE_PROFESSIONAL=price_xxx
```

---

## SECTION 11 — PAYMENT WEBHOOKS

Both Stripe and Coinbase webhooks must be wired before launch.

```typescript
// server/src/webhooks/stripe.ts

export async function handleStripeWebhook(req: Request, res: Response) {
  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription;
      await handleSubscriptionUpdate(sub);
      break;
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      // Pause all hires — Brain preserved
      await pauseAllHires(sub.metadata.userId);
      break;
    }
    case 'invoice.payment_failed': {
      // Notify user, grace period before pausing
      await handlePaymentFailed(event.data.object as Stripe.Invoice);
      break;
    }
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.metadata?.type === 'gift') {
        await activateGiftSubscription(session.metadata.giftId);
      }
      break;
    }
  }

  res.json({ received: true });
}

// server/src/webhooks/coinbase.ts

export async function handleCoinbaseWebhook(req: Request, res: Response) {
  const sig = req.headers['x-cc-webhook-signature'] as string;
  // Verify Coinbase Commerce signature
  // On 'charge:confirmed': credit user's TAGNT balance
  // On 'charge:failed': notify user
}
```

---

## SECTION 12 — BullMQ QUEUES

File: `server/src/queues/index.ts`

```typescript
import { Queue, Worker } from 'bullmq';
import { redis } from '../lib/redis';

// Queue definitions
export const auditQueue = new Queue('audit', { connection: redis });
export const notificationQueue = new Queue('notifications', { connection: redis });
export const brainSummaryQueue = new Queue('brain-summary', { connection: redis });
export const progressReportQueue = new Queue('progress-reports', { connection: redis });
export const wellbeingQueue = new Queue('wellbeing', { connection: redis });

export function startQueues() {
  // Audit pipeline worker
  new Worker('audit', async (job) => {
    const { roleId, stage } = job.data;
    await runAuditStage(roleId, stage);
  }, { connection: redis, concurrency: 3 });

  // Notification worker
  new Worker('notifications', async (job) => {
    const { userId, type, data } = job.data;
    await sendNotification(userId, type, data);
  }, { connection: redis, concurrency: 10 });

  // Brain summary worker — runs after every session ends
  new Worker('brain-summary', async (job) => {
    const { sessionId, hireId } = job.data;
    await generateBrainSummary(sessionId, hireId);
  }, { connection: redis, concurrency: 5 });

  // Progress report worker
  new Worker('progress-reports', async (job) => {
    const { userId, hireId, reportType } = job.data;
    await generateProgressReportPDF(userId, hireId, reportType);
  }, { connection: redis, concurrency: 3 });

  // Wellbeing scoring worker — runs after every session
  new Worker('wellbeing', async (job) => {
    const { userId, hireId } = job.data;
    await calculateWellbeingScore(userId, hireId);
  }, { connection: redis, concurrency: 5 });
}
```

---

## SECTION 13 — SEED DATA (ROLES ONLY — NO FAKE USERS)

File: `prisma/seed.ts`

The seed script creates the platform's role and skill data.
It does NOT create fake users, fake hires, or fake sessions.
The platform starts empty of user data. Real users create real data.

```typescript
import { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Trust Agent — roles and skills only...');

  // 1. Seed all 15 skill modules
  await seedSkills();

  // 2. Seed subscription plans (as data, not Prisma models — stored in env/Stripe)
  console.log('Subscription plans configured via Stripe price IDs in .env');

  // 3. Seed roles — load from src/data/roles/ JSON files
  // The ROLES-DEEP-CLAUDE-FINAL.md prompt builds these JSON files
  // This seed script reads and imports them
  await seedRolesFromJson();

  console.log('Seed complete. Platform ready for real users.');
}

async function seedSkills() {
  const skills = [
    { slug: 'adaptive-learning',     name: 'Adaptive Learning',     category: 'education' },
    { slug: 'memory-persistence',    name: 'Memory Persistence',    category: 'core' },
    { slug: 'progress-tracking',     name: 'Progress Tracking',     category: 'education' },
    { slug: 'exam-preparation',      name: 'Exam Preparation',      category: 'education' },
    { slug: 'safeguarding',          name: 'Safeguarding',          category: 'safety' },
    { slug: 'crisis-escalation',     name: 'Crisis Escalation',     category: 'safety' },
    { slug: 'medical-disclaimer',    name: 'Medical Disclaimer',    category: 'compliance' },
    { slug: 'legal-disclaimer',      name: 'Legal Disclaimer',      category: 'compliance' },
    { slug: 'financial-disclaimer',  name: 'Financial Disclaimer',  category: 'compliance' },
    { slug: 'voice-optimised',       name: 'Voice Optimised',       category: 'delivery' },
    { slug: 'conversational-memory', name: 'Conversational Memory', category: 'core' },
    { slug: 'step-by-step-guidance', name: 'Step-by-Step Guidance', category: 'pedagogy' },
    { slug: 'socratic-method',       name: 'Socratic Method',       category: 'pedagogy' },
    { slug: 'emotional-support',     name: 'Emotional Support',     category: 'wellbeing' },
    { slug: 'multimodal-description',name: 'Multimodal Description',category: 'delivery' },
  ];

  for (const skill of skills) {
    await prisma.skill.upsert({
      where: { slug: skill.slug },
      update: {},
      create: {
        ...skill,
        description: `${skill.name} skill module`,
        systemFragment: `[SKILL:${skill.slug}]`, // Placeholder — replaced by real fragments from S3
        fragmentHash: createHash('sha256').update(`[SKILL:${skill.slug}]`).digest('hex'),
      },
    });
  }
  console.log('Skills seeded: 15');
}

async function seedRolesFromJson() {
  // Load role JSON files from src/data/roles/
  // These are created by ROLES-DEEP-CLAUDE-FINAL.md
  const fs = require('fs');
  const path = require('path');
  const rolesDir = path.join(__dirname, '../src/data/roles');

  if (!fs.existsSync(rolesDir)) {
    console.log('No role JSON files found. Run ROLES-DEEP-CLAUDE-FINAL.md prompt first.');
    return;
  }

  const roleFiles = fs.readdirSync(rolesDir).filter((f: string) => f.endsWith('.json'));
  let count = 0;

  for (const file of roleFiles) {
    const roleData = JSON.parse(fs.readFileSync(path.join(rolesDir, file), 'utf-8'));
    const hash = createHash('sha256').update(roleData.systemPrompt).digest('hex');

    await prisma.role.upsert({
      where: { slug: roleData.slug },
      update: {
        ...sanitiseForDb(roleData),
        systemPromptHash: hash,
      },
      create: {
        ...sanitiseForDb(roleData),
        systemPromptHash: hash,
      },
    });

    // Upsert role skills
    if (roleData.skills?.length) {
      for (const skill of roleData.skills) {
        await prisma.roleSkill.upsert({
          where: { id: `${roleData.slug}-${skill.slug}` },
          update: {},
          create: {
            id: `${roleData.slug}-${skill.slug}`,
            roleId: (await prisma.role.findUnique({ where: { slug: roleData.slug } }))!.id,
            skillSlug: skill.slug,
            skillName: skill.name,
            priority: skill.priority ?? 1,
          },
        });
      }
    }
    count++;
  }
  console.log(`Roles seeded: ${count}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Run with:
```bash
npx prisma db seed
```

---

## SECTION 14 — B2B GATEWAY IMPLEMENTATION

The Gateway API is the B2B product. It assembles audited role configuration
and delivers it to customer infrastructure. Trust Agent never executes LLM
calls for B2B customers — they pay their own inference costs.

```typescript
// server/src/gateway/invoke.ts

export async function gatewayInvoke(
  apiKey: string,
  roleSlug: string,
  messages: { role: string; content: string }[],
  taskDescription?: string
): Promise<GatewayResponse> {

  // 1. Validate API key
  const user = await prisma.user.findUnique({ where: { apiKey } });
  if (!user) throw new Error('INVALID_API_KEY');

  // 2. Load enterprise policies
  const enterprise = await prisma.enterpriseUser.findUnique({
    where: { userId: user.id },
    include: { companyBrain: { include: { hitlRules: true } } }
  });

  // 3. Load role and verify hash
  const role = await prisma.role.findUnique({
    where: { slug: roleSlug },
    include: { audit: true, skills: true }
  });

  if (!role?.audit) throw new Error('ROLE_NOT_AUDITED');
  if (role.audit.badge === 'REJECTED') throw new Error('ROLE_NOT_ACTIVE');

  // Enterprise policy: minimum badge tier
  const enterprisePolicyMet = checkBadgePolicy(role.audit.badge, enterprise);
  if (!enterprisePolicyMet) throw new Error('BADGE_TIER_INSUFFICIENT');

  // 4. Verify SHA-256 hash — if mismatch, suspend badge and reject
  const currentHash = createHash('sha256').update(role.systemPrompt).digest('hex');
  if (currentHash !== role.systemPromptHash) {
    await prisma.roleAudit.update({
      where: { roleId: role.id },
      data: { badge: 'REJECTED' } // Auto-suspend on hash mismatch
    });
    throw new Error('ROLE_INTEGRITY_FAILED');
  }

  // 5. Build Company Brain context
  let companyBrainContext = '';
  if (enterprise?.companyBrain) {
    companyBrainContext = buildStaticContext(enterprise.companyBrain);
    if (enterprise.companyBrain.ragEnabled && taskDescription) {
      const ragChunks = await queryVectorDb(enterprise.companyBrain, taskDescription);
      companyBrainContext += '\n\n' + ragChunks;
    }
  }

  // 6. Inject skill fragments
  const skillFragments = await buildSkillContext(role.skills);

  // 7. Check HITL rules
  const lastUserMessage = messages[messages.length - 1]?.content ?? '';
  const hitlTriggered = checkHITLRules(enterprise?.companyBrain?.hitlRules ?? [], lastUserMessage);
  if (hitlTriggered) {
    await prisma.hITLEvent.create({
      data: {
        sessionId: createId(),
        ruleId: hitlTriggered.id,
        inputSample: lastUserMessage.slice(0, 200),
        action: hitlTriggered.action,
      }
    });
    if (hitlTriggered.action === 'block') throw new Error('HITL_BLOCKED');
    if (hitlTriggered.action === 'pause') return { hitlTriggered: true, content: '' };
  }

  // 8. Assemble system prompt (in memory — never logged)
  const systemPrompt = [
    role.systemPrompt,
    companyBrainContext ? `\n\n[COMPANY CONTEXT]\n${companyBrainContext}` : '',
    skillFragments ? `\n\n[SKILLS]\n${skillFragments}` : '',
  ].join('').trim();

  // 9. Forward to CUSTOMER's LLM API key (not Trust Agent's)
  // The customer must provide their LLM API key in the request or Company Brain config
  const customerLlmKey = enterprise?.companyBrain?.vectorDbApiKey; // TODO: separate field for LLM key
  // For now: return assembled prompt for customer to use with their own key
  // Full implementation: proxy to customer's OpenAI/Anthropic with their key

  // 10. Log metadata ONLY — never message content
  await logGatewayInvocation(user.id, roleSlug, messages.length);

  return {
    systemPrompt, // Returned for customer to inject into their own LLM call
    sessionId: createId(),
    tokenEstimate: systemPrompt.length / 4,
  };
}
```

---

## SECTION 15 — DESIGN SYSTEM (CONFIRMED BRAND)

File: `src/styles/tokens.css`

```css
:root {
  /* ── CONFIRMED TRUST AGENT BRAND COLOURS ─────────────────────────── */
  --navy:        #0A1628;  /* Primary dark navy */
  --navy2:       #0D1F3C;  /* Secondary navy */
  --blue:        #1E6FFF;  /* Electric Blue — primary action */
  --cyan:        #00D4FF;  /* Ion Cyan — accent */
  --mid-blue:    #1A3A6B;  /* Mid blue */

  /* Functional */
  --bg-primary:  #FFFFFF;
  --bg-alt:      #F0F5FF;
  --bg-light:    #EBF2FF;
  --text-dark:   #111827;
  --text-mid:    #2D4A7A;
  --text-muted:  #8899BB;
  --border:      #C5D5F0;
  --success:     #00AA78;
  --warning:     #FFB740;

  /* ── TYPOGRAPHY ───────────────────────────────────────────────────── */
  --font-headline: 'Manrope', 'Arial', sans-serif;
  --font-body:     'Manrope', 'Arial', sans-serif;
  --font-mono:     'JetBrains Mono', 'Courier New', monospace;

  /* Manrope weights: 400 body, 600 semibold, 800 ExtraBold (headlines) */

  /* ── SPACING ──────────────────────────────────────────────────────── */
  --space-xs:  4px;
  --space-sm:  8px;
  --space-md:  16px;
  --space-lg:  24px;
  --space-xl:  40px;
  --space-2xl: 64px;

  /* ── RADIUS ───────────────────────────────────────────────────────── */
  --radius-sm:  6px;
  --radius-md:  10px;
  --radius-lg:  16px;
  --radius-xl:  24px;
  --radius-full: 9999px;
}
```

---

## SECTION 16 — TAURI COMMANDS (Rust)

The Tauri commands bridge desktop-only capabilities.

### Brain file operations (`src-tauri/src/commands/brain.rs`)
```rust
// Read .tagnt file from local filesystem
#[tauri::command]
async fn read_brain_file(path: String) -> Result<Vec<u8>, String>

// Write .tagnt file to local filesystem
#[tauri::command]
async fn write_brain_file(path: String, data: Vec<u8>) -> Result<(), String>

// Get Brain file path in app data directory
#[tauri::command]
fn get_brain_path(hire_id: String) -> String

// Check if Brain file exists
#[tauri::command]
fn brain_exists(hire_id: String) -> bool
```

### Wake-word detection (`src-tauri/src/commands/wake_word.rs`)
```rust
// Start listening for wake word (TrustBox only)
#[tauri::command]
async fn start_wake_word_listener(wake_word: String) -> Result<(), String>

// Stop wake word listener
#[tauri::command]
fn stop_wake_word_listener()

// Check if device supports wake word (TrustBox hardware check)
#[tauri::command]
fn supports_wake_word() -> bool
```

### Audio (`src-tauri/src/commands/audio.rs`)
```rust
// Play ambient audio for environment
#[tauri::command]
async fn play_ambient_audio(audio_url: String, volume: f32) -> Result<(), String>

// Stop ambient audio
#[tauri::command]
fn stop_ambient_audio()

// Fade audio (for session transitions)
#[tauri::command]
async fn fade_audio(target_volume: f32, duration_ms: u64) -> Result<(), String>
```

---

## SECTION 17 — COMPLETE VERIFICATION CHECKLIST

Before marking build complete, verify every item:

### Database
- [ ] `npx prisma migrate dev` runs without errors
- [ ] All 40+ models present in schema
- [ ] `npx prisma generate` completes
- [ ] `npx prisma db seed` runs and creates skills + roles
- [ ] Zero fake users in database

### S3
- [ ] `trust-agent-assets` bucket exists, versioning enabled, SSE enabled, public access blocked
- [ ] `trust-agent-private` bucket exists, SSE enabled, public access blocked, 90-day lifecycle
- [ ] `trust-agent-public` bucket exists, CORS configured
- [ ] All three bucket keys in `.env`

### Backend
- [ ] `npm run dev` starts tRPC server on port 4000
- [ ] `GET /health` returns `{ status: 'ok' }`
- [ ] Every router file exists with all procedures
- [ ] No procedure returns mock/demo data
- [ ] System prompt NEVER appears in any API response
- [ ] WebSocket server starts and Redis pub/sub connects
- [ ] BullMQ workers start (audit, notification, brain-summary, progress-report, wellbeing)
- [ ] Stripe webhook endpoint wired and signature verified
- [ ] Coinbase Commerce webhook endpoint wired

### Auth
- [ ] Register creates real user in database
- [ ] Login returns JWT
- [ ] Protected routes reject unauthenticated requests
- [ ] API key auth works for B2B gateway
- [ ] Device API key auth works for hardware

### Critical flows
- [ ] Onboarding quiz → role recommendation → cloud drive setup → hire blocked until drive connected
- [ ] Hire flow: subscription check → plan limit check → cloud drive check → create Hire + SessionMemory
- [ ] Session start: role hash verified → system prompt assembled → never returned to frontend
- [ ] Session message: runs through anti-dependency check → LLM call → audit checks → no content stored
- [ ] Session end: Brain summary generated → BrainSyncLog created → Brain data returned for client-side sync
- [ ] Payment: Stripe checkout → webhook → subscription activated → user plan updated
- [ ] Gift subscription: checkout → activation code → recipient activates → hire created
- [ ] NHS code: admin creates → patient activates → free hire created for specific role
- [ ] B2B gateway: API key validated → hash verified → Company Brain injected → routed to customer LLM

### Anti-dependency
- [ ] Children's hard limit (45 min/day) enforced in `session.startSession`
- [ ] 90-minute warning fires and appears in WebSocket stream
- [ ] Dependency flag stored on session when high frequency detected
- [ ] Anti-dependency injection added to system prompt when flagged

### No mock data audit
- [ ] Search entire codebase for: `mock`, `demo`, `fake`, `placeholder`, `TODO`, `hardcoded`
- [ ] Every search result reviewed and removed or replaced with real implementation
- [ ] No seed users (only roles and skills)
- [ ] No test API keys committed to codebase

---

## SECTION 18 — DEPLOYMENT

### Docker

```dockerfile
# server/Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npx prisma generate
EXPOSE 4000
CMD ["node", "dist/index.js"]
```

### GitHub Actions: `.github/workflows/deploy.yml`

```yaml
name: Deploy Trust Agent Backend

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }

      - name: Install dependencies
        run: cd server && npm ci

      - name: Run migrations
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL_UNPOOLED }}
        run: cd server && npx prisma migrate deploy

      - name: Build
        run: cd server && npm run build

      - name: Deploy to Railway
        uses: railwayapp/railway-github-action@v1
        with:
          service: trust-agent-api
          token: ${{ secrets.RAILWAY_TOKEN }}
```

### Pre-launch checklist
- [ ] All env vars set in production environment
- [ ] Stripe webhooks configured pointing to production URL
- [ ] Coinbase Commerce webhooks configured
- [ ] Neon PostgreSQL connection tested from production
- [ ] S3 buckets accessible from production IAM role
- [ ] Redis (Upstash) connection tested
- [ ] ElevenLabs API key valid
- [ ] `npm run start` starts cleanly with zero errors
- [ ] Health endpoint returns 200
- [ ] First real user registration works end-to-end
- [ ] `npx prisma db seed` has been run in production

---

## EXECUTION ORDER

Run these in order. Do not skip steps.

```
PHASE 1: Database and infrastructure
1. Write .env with all variables
2. aws s3api commands (Section 3) — create and configure all 3 buckets
3. npx prisma migrate dev --name "initial_complete_schema"
4. npx prisma generate
5. npx prisma db seed
6. Verify: prisma studio shows skills + roles, zero users

PHASE 2: Backend server
7. Build server/src/ — all files in Section 4
8. npm run dev — verify health endpoint
9. Test every tRPC procedure compiles
10. Wire Stripe and Coinbase webhooks
11. Start BullMQ workers
12. Verify: zero mock data in any response

PHASE 3: Tauri integration
13. Build Tauri commands (Section 16)
14. Wire tRPC client in src/lib/trpc.ts
15. Brain sync client-side implementation
16. Cloud Drive OAuth flows

PHASE 4: End-to-end
17. Full onboarding quiz → hire → session flow
18. Anti-dependency checks verified
19. Payment flow verified
20. B2B gateway invoke verified
21. Run full verification checklist (Section 17)
```

---

## FINAL COMMIT MESSAGE

```
feat: Trust Agent complete operational backend

- Complete Prisma schema (40+ models)
- All 20 tRPC routers with full procedure coverage
- S3 buckets provisioned and configured (eu-west-2)
- Zero mock data — every route hits real database
- Brain architecture: local-first, .tagnt format, cloud sync
- System prompts never returned to frontend
- Messages never stored on Trust Agent servers
- Anti-dependency architecture enforced in session layer
- 47-check audit pipeline with BullMQ
- B2B gateway with Company Brain + hash verification
- Stripe + Coinbase Commerce payments wired
- WebSocket server with Redis pub/sub backplane
- All 38 environments configured
- NHS referral, school licensing, creator marketplace
- Hardware device support (TrustBox, TrustStick, TrustEdge)

AgentCore LTD · Company No. 17114811 · trust-agent.ai
```

---

## ADDENDUM — ADDITIONAL IMPLEMENTATION NOTES

### Brain Key Recovery
In `brain.ts` router: `initiateKeyRecovery` generates a recovery key derived
from userId + account creation timestamp. User stores this independently.
Trust Agent never stores the key. Recovery flow: user enters recovery key →
client-side key derivation → .tagnt file decrypted. Add `recoveryKeyHash`
field to User model (hash only — never plaintext).

### 30-Day Versioned Brain Snapshots
After every successful cloud drive sync, the client creates a dated snapshot:
`brain-{hireId}-{YYYY-MM-DD}.tagnt` in a `/snapshots/` subfolder in the user's
cloud drive. Client-side logic deletes snapshots older than 30 days. Server
records only: `BrainSyncLog.snapshotCount`. The 30 snapshots live on the
user's cloud drive — never on Trust Agent servers.

### Digital Legacy Mode
Add `DigitalLegacyDesignee` model:
```prisma
model DigitalLegacyDesignee {
  id          String   @id @default(cuid())
  userId      String
  email       String   // Designee email
  name        String
  activatedAt DateTime?
  createdAt   DateTime @default(now())
  @@unique([userId])
}
```
`brain.ts` router: `setLegacyDesignee(email, name)`, `getLegacyDesignee()`.
On account deletion: system sends Brain Handover PDF to designee email.

### Trust Score API — B2B Audit as a Service
`admin.ts` router: `externalAuditRequest(orgName, contactEmail, aiSystemConfig)`.
Creates a premium AuditJob (type: 'external'). On completion, emails a Trust
Score certificate PDF. Pricing: £299 express (48hr), £149 standard (7 days).
Payment via Stripe invoice. B2B route, not consumer payments flow.

### Skills Archaeology
Session mode flag on `AgentSession`: `skillsArchaeology: Boolean @default(false)`.
When true, the system prompt injection for career/CV roles adds the Skills
Archaeology protocol: 2-3 foundation sessions of structured questioning about
past experience before conventional coaching begins. Add to `session.startSession`
as `mode: 'standard' | 'exam' | 'red_team' | 'presence' | 'skills_archaeology'`.

### Deflationary Token Mechanics
`token.ts` router: `getBurnStats()` returns `{ totalBurned, yearlyBurnRate, effectiveSupply }`.
Burn events recorded in `TokenBurnEvent` model:
```prisma
model TokenBurnEvent {
  id        String   @id @default(cuid())
  amount    Int
  reason    String   // transaction_fee | stake_slash | credit_expiry
  txHash    String?
  burnedAt  DateTime @default(now())
}
```
2% of every marketplace transaction fee burned. Creator stake slashed = burned.
50% of expired credit packages burned.

### Token Cliff Mitigation
`token.ts` router: `getVestingSchedule()` returns team/advisor vesting schedule.
Governance proposal type `LOCKUP_EXTENSION` allows community vote to extend
team token lockup beyond cliff date. Stored in `GovernanceProposal` model:
```prisma
model GovernanceProposal {
  id          String   @id @default(cuid())
  type        String
  description String   @db.Text
  proposedBy  String
  status      String   @default("active")
  votesFor    Int      @default(0)
  votesAgainst Int     @default(0)
  quorumMet   Boolean  @default(false)
  expiresAt   DateTime
  executedAt  DateTime?
  createdAt   DateTime @default(now())
}
```

### SOC 2 Type I Audit Logging
Every sensitive operation must emit an audit log entry. Add `PlatformAuditLog` model:
```prisma
model PlatformAuditLog {
  id          String   @id @default(cuid())
  userId      String?
  action      String   // user.login | hire.create | session.start | payment.charge | admin.action
  resource    String?
  ipAddress   String?
  userAgent   String?
  outcome     String   // success | failure
  metadata    Json?
  createdAt   DateTime @default(now())
  @@index([userId])
  @@index([action])
  @@index([createdAt])
}
```
SOC 2 audit events: auth (login/logout/failed attempts), data access (Brain sync logs),
payment events, admin actions, session lifecycle, HITL events.
Retained for minimum 1 year. Exportable via `admin.getComplianceExport()`.
