# Trust Agent - Phase 0 E2E Verification
Run at: 2026-03-30T00:04:23.976Z


=== [1] ENVIRONMENT VARIABLES ===
PASS: .env file exists
PASS: Neon PostgreSQL URL (DATABASE_URL)
PASS: Redis URL (REDIS_URL)
WARN: Stripe secret key (STRIPE_SECRET_KEY) set but is placeholder - needs real value
WARN: Stripe publishable key (STRIPE_PUBLISHABLE_KEY) set but is placeholder - needs real value
WARN: Stripe webhook secret (STRIPE_WEBHOOK_SECRET) set but is placeholder - needs real value
WARN: VAPID public key (VAPID_PUBLIC_KEY) set but is placeholder - needs real value
WARN: VAPID private key (VAPID_PRIVATE_KEY) set but is placeholder - needs real value
PASS: SMTP host (SMTP_HOST)
PASS: SMTP user (SMTP_USER)
WARN: SMTP password (SMTP_PASS) set but is placeholder - needs real value
WARN: AWS access key (AWS_ACCESS_KEY_ID) set but is placeholder - needs real value
WARN: AWS secret key (AWS_SECRET_ACCESS_KEY) set but is placeholder - needs real value
PASS: AWS region (AWS_REGION)
PASS: S3 assets bucket (S3_ASSETS_BUCKET)
PASS: S3 artifacts bucket (S3_ARTIFACTS_BUCKET)
PASS: S3 docs bucket (S3_DOCS_BUCKET)
WARN: ElevenLabs API key (ELEVENLABS_API_KEY) set but is placeholder - needs real value
WARN: NextAuth secret (NEXTAUTH_SECRET) set but is placeholder - needs real value
PASS: NextAuth URL (NEXTAUTH_URL)
WARN: Google OAuth client ID (GOOGLE_CLIENT_ID) set but is placeholder - needs real value
WARN: Google OAuth client secret (GOOGLE_CLIENT_SECRET) set but is placeholder - needs real value
WARN: PostHog analytics key (POSTHOG_KEY) set but is placeholder - needs real value
PASS: LiveKit API key (LIVEKIT_API_KEY)
PASS: LiveKit API secret (LIVEKIT_API_SECRET)
PASS: Base chain RPC URL (BASE_CHAIN_RPC_URL)
WARN: $TAGNT contract address (TAGNT_CONTRACT_ADDRESS) set but is placeholder - needs real value

=== [2] DATABASE CONNECTION AND SCHEMA ===
PASS: Database connection
PASS: Table: User (0 rows)
PASS: Table: Role (169 rows)
PASS: Table: RoleAudit (169 rows)
PASS: Table: AuditCheck (0 rows)
PASS: Table: Hire (0 rows)
PASS: Table: HireMemory (0 rows)
PASS: Table: AgentSession (0 rows)
PASS: Table: Milestone (0 rows)
PASS: Table: PricingTier (5 rows)
PASS: Table: PriceHistory (0 rows)
PASS: Table: NHSReferralCode (0 rows)
PASS: Table: NHSReferralActivation (0 rows)
PASS: Table: GiftSubscription (0 rows)
PASS: Table: SchoolLicence (0 rows)
PASS: Table: StudentEnrolment (0 rows)
PASS: Table: SpacedRepetitionItem (0 rows)
PASS: Table: SessionSchedule (0 rows)
PASS: Table: FeatureFlag (14 rows)
PASS: Table: PlatformAuditLog (0 rows)
PASS: Table: Webhook (0 rows)
PASS: Table: WebhookDelivery (0 rows)
PASS: Table: Notification (0 rows)
PASS: Table: GuardianAlert (0 rows)
PASS: Table: FamilyLink (0 rows)
PASS: Table: UserVoiceClone (0 rows)
PASS: Table: QuizResponse (0 rows)
PASS: Table: BrainMemoryEntry (0 rows)
PASS: Table: CompanionReview (0 rows)
PASS: Table: CompanionReAuditTrigger (0 rows)
PASS: Table: ProgressShare (0 rows)
PASS: Table: StudyGroup (0 rows)
PASS: Table: StudyGroupMember (0 rows)
PASS: Table: StudyGroupSession (0 rows)
PASS: Table: NotificationContext (0 rows)
PASS: Table: HumanFollowUpQueue (0 rows)
PASS: Table: MissionMetric (0 rows)
PASS: Table: LegacyDesignation (0 rows)

=== [3] ROLE DATA QUALITY ===
PASS: 169 active roles (need 151+)
WARN: 18 roles have systemPrompt < 8000 chars (systemPromptLength field may need population)
PASS: All roles have defaultCompanionName
PASS: All roles have emoji
PASS: Role: gcse-maths-tutor-f
PASS: Role: gcse-english-tutor-f
PASS: Role: gcse-science-tutor-f
PASS: Role: a-level-maths-tutor-f
PASS: Role: a-level-english-tutor-f
PASS: Role: a-level-biology-tutor-f
PASS: Role: grief-bereavement-companion-f
PASS: Role: menopause-midlife-companion-f
PASS: Role: anxiety-cbt-therapist-f
PASS: Role: depression-support-companion-f
PASS: Role: daily-companion-elderly-f
PASS: Role: daily-companion-elderly-m
PASS: Role: english-language-tutor-f
PASS: Role: french-language-tutor-f
PASS: Role: cmo-companion-m
PASS: Role: cfo-companion-m
PASS: Role: ceo-coach-m
PASS: Role: financial-wellbeing-coach-f
PASS: Role: career-coach-f
PASS: Role: acca-tutor-f
PASS: Role: cfa-tutor-f
PASS: Role: primary-reading-tutor-f
PASS: Role: primary-maths-tutor-f
PASS: Role: nhs-social-prescribing-companion-f

=== [4] PRICING TIERS (GBP) ===
PASS: Tier: starter 9.99
PASS: Tier: essential 19.99
PASS: Tier: family 24.99
PASS: Tier: professional 39.99
PASS: NHS free tier exists

=== [5] SECURITY INVARIANTS ===
PASS: systemPrompt: zero leaks in API responses
PASS: Message storage: zero instances found (correct)

=== [6] FEATURE IMPLEMENTATIONS (code pattern checks) ===
PASS: Feature: Onboarding quiz router
PASS: Feature: Brain memory entries
PASS: Feature: Study groups
PASS: Feature: Guardian router
PASS: Feature: Companion reviews
PASS: Feature: Progress sharing
PASS: Feature: Safeguarding
PASS: Feature: Spaced repetition
PASS: Feature: Notifications
PASS: Feature: Feature flags
PASS: Feature: Mission metrics
PASS: Feature: Human follow-up queue

=== [7] TYPESCRIPT (schema validation) ===
PASS: Prisma schema validated successfully (prisma validate passed)

## Summary
- PASS: 98
- FAIL: 0
- WARN: 15

**ALL CHECKS PASS - safe to proceed**