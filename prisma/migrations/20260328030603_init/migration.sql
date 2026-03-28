-- CreateEnum
CREATE TYPE "UserPlan" AS ENUM ('FREE', 'STARTER', 'ESSENTIAL', 'FAMILY', 'PROFESSIONAL', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('INDIVIDUAL', 'CHILD', 'ENTERPRISE', 'CREATOR');

-- CreateEnum
CREATE TYPE "CloudDriveType" AS ENUM ('GOOGLE_DRIVE', 'ICLOUD', 'ONEDRIVE');

-- CreateEnum
CREATE TYPE "VoiceTier" AS ENUM ('CURATED', 'CLONED', 'TEXT_ONLY');

-- CreateEnum
CREATE TYPE "RoleType" AS ENUM ('CONSUMER', 'B2B_CSUITE', 'B2B_MGMT', 'B2B_SPEC', 'B2B_AGENT', 'B2B_SKILL');

-- CreateEnum
CREATE TYPE "BadgeTier" AS ENUM ('PLATINUM', 'GOLD', 'SILVER', 'BASIC', 'REJECTED');

-- CreateEnum
CREATE TYPE "HireStatus" AS ENUM ('ACTIVE', 'PAUSED', 'CANCELLED', 'EXPIRED', 'GIFT_PENDING');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ABANDONED', 'ERROR');

-- CreateEnum
CREATE TYPE "InputMode" AS ENUM ('TEXT', 'VOICE', 'MIXED');

-- CreateEnum
CREATE TYPE "NotifType" AS ENUM ('SESSION_REMINDER', 'EXAM_COUNTDOWN', 'STREAK_AT_RISK', 'MILESTONE_REACHED', 'PROGRESS_UPDATE', 'GUARDIAN_ALERT', 'WELLBEING_SIGNAL', 'BRAIN_SYNC_FAILED', 'AUDIT_COMPLETE', 'PAYOUT_READY');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELLED', 'TRIALING', 'PAUSED');

-- CreateEnum
CREATE TYPE "DeviceType" AS ENUM ('TRUSTBOX_PRO', 'TRUSTSTICK', 'TRUSTEDGE_ENTERPRISE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "passwordHash" TEXT,
    "name" TEXT,
    "avatarUrl" TEXT,
    "plan" "UserPlan" NOT NULL DEFAULT 'FREE',
    "accountType" "AccountType" NOT NULL DEFAULT 'INDIVIDUAL',
    "apiKey" TEXT,
    "tagntBalance" INTEGER NOT NULL DEFAULT 0,
    "referralCode" TEXT NOT NULL,
    "referredBy" TEXT,
    "onboardingDone" BOOLEAN NOT NULL DEFAULT false,
    "cloudDriveType" "CloudDriveType",
    "cloudDriveToken" TEXT,
    "cloudDriveFolderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPreferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ambientAudioEnabled" BOOLEAN NOT NULL DEFAULT true,
    "voiceEnabled" BOOLEAN NOT NULL DEFAULT true,
    "voiceTier" "VoiceTier" NOT NULL DEFAULT 'CURATED',
    "selectedVoiceId" TEXT,
    "environmentTheme" TEXT NOT NULL DEFAULT 'auto',
    "sessionReminderMins" INTEGER NOT NULL DEFAULT 45,
    "notifyGuardianOnSession" BOOLEAN NOT NULL DEFAULT true,
    "highContrastMode" BOOLEAN NOT NULL DEFAULT false,
    "dyslexiaMode" BOOLEAN NOT NULL DEFAULT false,
    "fontSize" TEXT NOT NULL DEFAULT 'standard',
    "calmMode" BOOLEAN NOT NULL DEFAULT false,
    "adhdMode" BOOLEAN NOT NULL DEFAULT false,
    "translationEnabled" BOOLEAN NOT NULL DEFAULT false,
    "preferredLanguage" TEXT NOT NULL DEFAULT 'en',
    "wearableConnected" BOOLEAN NOT NULL DEFAULT false,
    "wearablePlatform" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPreferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserVoiceClone" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "elevenLabsId" TEXT NOT NULL,
    "consentRecorded" BOOLEAN NOT NULL DEFAULT false,
    "consentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserVoiceClone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FamilyLink" (
    "id" TEXT NOT NULL,
    "guardianId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "maxDailyMins" INTEGER NOT NULL DEFAULT 45,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FamilyLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuardianAlert" (
    "id" TEXT NOT NULL,
    "familyLinkId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "hireId" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuardianAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WellbeingSignal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "hireId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "trend" TEXT NOT NULL,
    "signals" JSONB NOT NULL,
    "alertSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WellbeingSignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrainSyncLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "hireId" TEXT NOT NULL,
    "cloudDriveType" "CloudDriveType" NOT NULL,
    "fileId" TEXT NOT NULL,
    "fileSizeBytes" INTEGER NOT NULL,
    "syncStatus" TEXT NOT NULL,
    "errorMessage" TEXT,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BrainSyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnterpriseUser" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "companySize" TEXT,
    "industry" TEXT,
    "billingEmail" TEXT NOT NULL,
    "maxSeats" INTEGER NOT NULL DEFAULT 5,
    "ssoEnabled" BOOLEAN NOT NULL DEFAULT false,
    "samlMetadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EnterpriseUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnterpriseSeat" (
    "id" TEXT NOT NULL,
    "enterpriseId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),

    CONSTRAINT "EnterpriseSeat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyBrain" (
    "id" TEXT NOT NULL,
    "enterpriseId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "companyDescription" TEXT NOT NULL,
    "industry" TEXT,
    "companySize" TEXT,
    "currentOKRs" TEXT NOT NULL,
    "brandVoice" TEXT NOT NULL,
    "targetCustomers" TEXT NOT NULL,
    "topCompetitors" TEXT NOT NULL,
    "keyPeople" TEXT NOT NULL,
    "topicsToAvoid" TEXT NOT NULL,
    "vectorDbProvider" TEXT,
    "vectorDbUrl" TEXT,
    "vectorDbApiKey" TEXT,
    "vectorDbIndex" TEXT,
    "ragEnabled" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyBrain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HITLRule" (
    "id" TEXT NOT NULL,
    "companyBrainId" TEXT NOT NULL,
    "triggerPattern" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "notifyEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HITLRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HITLEvent" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "inputSample" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HITLEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "baseSlug" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "companionName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "tagline" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "systemPrompt" TEXT NOT NULL,
    "systemPromptHash" TEXT NOT NULL,
    "priceMonthly" INTEGER NOT NULL,
    "targetUser" TEXT NOT NULL,
    "capabilities" TEXT[],
    "limitations" TEXT[],
    "hardLimits" TEXT[],
    "escalationTriggers" TEXT[],
    "knowledgeSources" TEXT[],
    "tags" TEXT[],
    "languageCode" TEXT,
    "languageName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "environmentSlug" TEXT NOT NULL,
    "environmentConfig" JSONB NOT NULL,
    "supportsVoice" BOOLEAN NOT NULL DEFAULT true,
    "supportsTextOnly" BOOLEAN NOT NULL DEFAULT true,
    "supportsWearable" BOOLEAN NOT NULL DEFAULT false,
    "maxSessionMinutes" INTEGER NOT NULL DEFAULT 90,
    "maxDailySessionMins" INTEGER,
    "requiredPlan" "UserPlan" NOT NULL DEFAULT 'STARTER',
    "roleType" "RoleType" NOT NULL DEFAULT 'CONSUMER',
    "stakeRequired" INTEGER NOT NULL DEFAULT 0,
    "creatorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoleSkill" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "skillSlug" TEXT NOT NULL,
    "skillName" TEXT NOT NULL,
    "injectionPoint" TEXT NOT NULL DEFAULT 'system',
    "priority" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "RoleSkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "systemFragment" TEXT NOT NULL,
    "fragmentHash" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoleAudit" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "trustScore" INTEGER NOT NULL,
    "badge" "BadgeTier" NOT NULL,
    "artefactHash" TEXT NOT NULL,
    "auditReportKey" TEXT NOT NULL,
    "stage1Score" INTEGER NOT NULL,
    "stage1Passed" INTEGER NOT NULL,
    "stage1Failed" INTEGER NOT NULL,
    "stage2Score" INTEGER NOT NULL,
    "stage2Passed" INTEGER NOT NULL,
    "stage2Failed" INTEGER NOT NULL,
    "stage3Score" INTEGER NOT NULL,
    "stage3Passed" INTEGER NOT NULL,
    "stage3Failed" INTEGER NOT NULL,
    "communityScore" INTEGER NOT NULL DEFAULT 0,
    "totalScore" INTEGER NOT NULL,
    "auditedBy" TEXT,
    "completedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoleAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hire" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "status" "HireStatus" NOT NULL DEFAULT 'ACTIVE',
    "customCompanionName" TEXT,
    "customVoiceCloneId" TEXT,
    "customEnvironment" TEXT,
    "activatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "priceMonthly" INTEGER NOT NULL,
    "stripeSubId" TEXT,
    "brainFileId" TEXT,
    "brainVersion" INTEGER NOT NULL DEFAULT 0,
    "lastBrainSync" TIMESTAMP(3),
    "sessionCount" INTEGER NOT NULL DEFAULT 0,
    "totalMinutes" INTEGER NOT NULL DEFAULT 0,
    "streakDays" INTEGER NOT NULL DEFAULT 0,
    "longestStreakDays" INTEGER NOT NULL DEFAULT 0,
    "lastSessionAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Hire_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HireMilestone" (
    "id" TEXT NOT NULL,
    "hireId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "achievedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "celebrated" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "HireMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "hireId" TEXT NOT NULL,
    "liveKitRoomId" TEXT,
    "status" "SessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "inputMode" "InputMode" NOT NULL DEFAULT 'TEXT',
    "environmentSlug" TEXT NOT NULL,
    "examMode" BOOLEAN NOT NULL DEFAULT false,
    "redTeamMode" BOOLEAN NOT NULL DEFAULT false,
    "presenceMode" BOOLEAN NOT NULL DEFAULT false,
    "timeBudgetMins" INTEGER,
    "collaborationId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "durationSeconds" INTEGER,
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "deviceType" TEXT,
    "sessionMinsToday" INTEGER NOT NULL DEFAULT 0,
    "dependencyFlag" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionDocument" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "s3Key" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSizeBytes" INTEGER NOT NULL,
    "extractedText" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SessionDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionAuditEvent" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "checkId" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SessionAuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionMemory" (
    "id" TEXT NOT NULL,
    "hireId" TEXT NOT NULL,
    "memorySummary" JSONB NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionCount" INTEGER NOT NULL DEFAULT 0,
    "totalMinutes" INTEGER NOT NULL DEFAULT 0,
    "wellbeingScore" INTEGER NOT NULL DEFAULT 75,
    "wellbeingTrend" TEXT NOT NULL DEFAULT 'stable',
    "lastWellbeingAt" TIMESTAMP(3),

    CONSTRAINT "SessionMemory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpacedRepetitionItem" (
    "id" TEXT NOT NULL,
    "hireId" TEXT NOT NULL,
    "concept" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "easeFactor" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "interval" INTEGER NOT NULL DEFAULT 1,
    "repetitions" INTEGER NOT NULL DEFAULT 0,
    "dueAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastReview" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SpacedRepetitionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearnerProgressScore" (
    "id" TEXT NOT NULL,
    "hireId" TEXT NOT NULL,
    "overallReadiness" INTEGER NOT NULL DEFAULT 0,
    "topicScores" JSONB NOT NULL,
    "cefrLevel" TEXT,
    "cefrConfidence" INTEGER DEFAULT 0,
    "applicationScore" INTEGER NOT NULL DEFAULT 0,
    "engagementScore" INTEGER NOT NULL DEFAULT 0,
    "streakBonus" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearnerProgressScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgressReport" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "hireId" TEXT NOT NULL,
    "reportType" TEXT NOT NULL,
    "s3Key" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sharedWith" TEXT[],

    CONSTRAINT "ProgressReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionSchedule" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "hireId" TEXT NOT NULL,
    "dayOfWeek" INTEGER[],
    "timeOfDay" TEXT NOT NULL,
    "durationMins" INTEGER NOT NULL DEFAULT 30,
    "timezone" TEXT NOT NULL DEFAULT 'Europe/London',
    "calendarSyncType" TEXT,
    "calendarEventId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "nextSessionAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SessionSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotifType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stripeSubId" TEXT NOT NULL,
    "stripeCustomerId" TEXT NOT NULL,
    "plan" "UserPlan" NOT NULL,
    "status" "SubscriptionStatus" NOT NULL,
    "currentPeriodStart" TIMESTAMP(3) NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stripePaymentId" TEXT,
    "coinbaseChargeId" TEXT,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'gbp',
    "status" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GiftSubscription" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "recipientId" TEXT,
    "recipientEmail" TEXT NOT NULL,
    "plan" "UserPlan" NOT NULL,
    "durationMonths" INTEGER NOT NULL,
    "roleId" TEXT,
    "personalMessage" TEXT,
    "activationCode" TEXT NOT NULL,
    "activatedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GiftSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralReward" (
    "id" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "referredId" TEXT NOT NULL,
    "rewardMonths" INTEGER NOT NULL DEFAULT 1,
    "appliedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferralReward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NHSReferralCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "gpPracticeId" TEXT NOT NULL,
    "gpPracticeName" TEXT NOT NULL,
    "roleSlug" TEXT NOT NULL,
    "durationDays" INTEGER NOT NULL DEFAULT 30,
    "maxActivations" INTEGER NOT NULL DEFAULT 1,
    "activationCount" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NHSReferralCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NHSReferralActivation" (
    "id" TEXT NOT NULL,
    "codeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "activatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NHSReferralActivation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolLicence" (
    "id" TEXT NOT NULL,
    "schoolName" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "roleSlugAccess" TEXT[],
    "maxStudents" INTEGER NOT NULL,
    "pricePerStudent" INTEGER NOT NULL,
    "stripeSubId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "activationCode" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SchoolLicence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentEnrolment" (
    "id" TEXT NOT NULL,
    "licenceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentEnrolment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreatorProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "bio" TEXT NOT NULL,
    "credentials" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "revenueSharePct" INTEGER NOT NULL DEFAULT 80,
    "totalEarnings" INTEGER NOT NULL DEFAULT 0,
    "tagntBalance" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreatorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreatorApplication" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "roleSlug" TEXT NOT NULL,
    "submittedConfig" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewNotes" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreatorApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreatorPayout" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "txHash" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreatorPayout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HardwareDevice" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceType" "DeviceType" NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "nickname" TEXT,
    "firmwareVersion" TEXT,
    "lastSeenAt" TIMESTAMP(3),
    "activatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HardwareDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HardwareActivation" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "roleSlug" TEXT NOT NULL,
    "activatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "HardwareActivation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TokenStake" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleSlug" TEXT NOT NULL,
    "roleType" "RoleType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "stakedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "slashedAt" TIMESTAMP(3),
    "slashReason" TEXT,
    "withdrawnAt" TIMESTAMP(3),
    "txHash" TEXT,

    CONSTRAINT "TokenStake_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditJob" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "submittedBy" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "stage1Done" BOOLEAN NOT NULL DEFAULT false,
    "stage2Done" BOOLEAN NOT NULL DEFAULT false,
    "stage3Done" BOOLEAN NOT NULL DEFAULT false,
    "stage1At" TIMESTAMP(3),
    "stage2At" TIMESTAMP(3),
    "stage3At" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "errorMsg" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_apiKey_key" ON "User"("apiKey");

-- CreateIndex
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_apiKey_idx" ON "User"("apiKey");

-- CreateIndex
CREATE INDEX "User_referralCode_idx" ON "User"("referralCode");

-- CreateIndex
CREATE UNIQUE INDEX "UserPreferences_userId_key" ON "UserPreferences"("userId");

-- CreateIndex
CREATE INDEX "UserVoiceClone_userId_idx" ON "UserVoiceClone"("userId");

-- CreateIndex
CREATE INDEX "FamilyLink_guardianId_idx" ON "FamilyLink"("guardianId");

-- CreateIndex
CREATE INDEX "FamilyLink_childId_idx" ON "FamilyLink"("childId");

-- CreateIndex
CREATE UNIQUE INDEX "FamilyLink_guardianId_childId_key" ON "FamilyLink"("guardianId", "childId");

-- CreateIndex
CREATE INDEX "GuardianAlert_familyLinkId_idx" ON "GuardianAlert"("familyLinkId");

-- CreateIndex
CREATE INDEX "WellbeingSignal_userId_idx" ON "WellbeingSignal"("userId");

-- CreateIndex
CREATE INDEX "WellbeingSignal_hireId_idx" ON "WellbeingSignal"("hireId");

-- CreateIndex
CREATE INDEX "BrainSyncLog_userId_idx" ON "BrainSyncLog"("userId");

-- CreateIndex
CREATE INDEX "BrainSyncLog_hireId_idx" ON "BrainSyncLog"("hireId");

-- CreateIndex
CREATE UNIQUE INDEX "EnterpriseUser_userId_key" ON "EnterpriseUser"("userId");

-- CreateIndex
CREATE INDEX "EnterpriseSeat_enterpriseId_idx" ON "EnterpriseSeat"("enterpriseId");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyBrain_enterpriseId_key" ON "CompanyBrain"("enterpriseId");

-- CreateIndex
CREATE INDEX "HITLRule_companyBrainId_idx" ON "HITLRule"("companyBrainId");

-- CreateIndex
CREATE INDEX "HITLEvent_sessionId_idx" ON "HITLEvent"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Role_slug_key" ON "Role"("slug");

-- CreateIndex
CREATE INDEX "Role_baseSlug_idx" ON "Role"("baseSlug");

-- CreateIndex
CREATE INDEX "Role_category_idx" ON "Role"("category");

-- CreateIndex
CREATE INDEX "Role_isActive_idx" ON "Role"("isActive");

-- CreateIndex
CREATE INDEX "Role_roleType_idx" ON "Role"("roleType");

-- CreateIndex
CREATE INDEX "Role_creatorId_idx" ON "Role"("creatorId");

-- CreateIndex
CREATE INDEX "RoleSkill_roleId_idx" ON "RoleSkill"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "Skill_slug_key" ON "Skill"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "RoleAudit_roleId_key" ON "RoleAudit"("roleId");

-- CreateIndex
CREATE INDEX "RoleAudit_badge_idx" ON "RoleAudit"("badge");

-- CreateIndex
CREATE INDEX "RoleAudit_totalScore_idx" ON "RoleAudit"("totalScore");

-- CreateIndex
CREATE INDEX "Hire_userId_idx" ON "Hire"("userId");

-- CreateIndex
CREATE INDEX "Hire_roleId_idx" ON "Hire"("roleId");

-- CreateIndex
CREATE INDEX "Hire_status_idx" ON "Hire"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Hire_userId_roleId_key" ON "Hire"("userId", "roleId");

-- CreateIndex
CREATE INDEX "HireMilestone_hireId_idx" ON "HireMilestone"("hireId");

-- CreateIndex
CREATE INDEX "AgentSession_userId_idx" ON "AgentSession"("userId");

-- CreateIndex
CREATE INDEX "AgentSession_hireId_idx" ON "AgentSession"("hireId");

-- CreateIndex
CREATE INDEX "AgentSession_status_idx" ON "AgentSession"("status");

-- CreateIndex
CREATE INDEX "AgentSession_startedAt_idx" ON "AgentSession"("startedAt");

-- CreateIndex
CREATE INDEX "SessionDocument_sessionId_idx" ON "SessionDocument"("sessionId");

-- CreateIndex
CREATE INDEX "SessionAuditEvent_sessionId_idx" ON "SessionAuditEvent"("sessionId");

-- CreateIndex
CREATE INDEX "SessionAuditEvent_checkId_idx" ON "SessionAuditEvent"("checkId");

-- CreateIndex
CREATE UNIQUE INDEX "SessionMemory_hireId_key" ON "SessionMemory"("hireId");

-- CreateIndex
CREATE INDEX "SpacedRepetitionItem_hireId_idx" ON "SpacedRepetitionItem"("hireId");

-- CreateIndex
CREATE INDEX "SpacedRepetitionItem_dueAt_idx" ON "SpacedRepetitionItem"("dueAt");

-- CreateIndex
CREATE UNIQUE INDEX "LearnerProgressScore_hireId_key" ON "LearnerProgressScore"("hireId");

-- CreateIndex
CREATE INDEX "ProgressReport_userId_idx" ON "ProgressReport"("userId");

-- CreateIndex
CREATE INDEX "ProgressReport_hireId_idx" ON "ProgressReport"("hireId");

-- CreateIndex
CREATE INDEX "SessionSchedule_userId_idx" ON "SessionSchedule"("userId");

-- CreateIndex
CREATE INDEX "SessionSchedule_nextSessionAt_idx" ON "SessionSchedule"("nextSessionAt");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_readAt_idx" ON "Notification"("readAt");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_userId_key" ON "Subscription"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_stripeSubId_key" ON "Subscription"("stripeSubId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_stripeCustomerId_key" ON "Subscription"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_stripePaymentId_key" ON "Payment"("stripePaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_coinbaseChargeId_key" ON "Payment"("coinbaseChargeId");

-- CreateIndex
CREATE INDEX "Payment_userId_idx" ON "Payment"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GiftSubscription_activationCode_key" ON "GiftSubscription"("activationCode");

-- CreateIndex
CREATE INDEX "GiftSubscription_senderId_idx" ON "GiftSubscription"("senderId");

-- CreateIndex
CREATE INDEX "GiftSubscription_activationCode_idx" ON "GiftSubscription"("activationCode");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralReward_referrerId_referredId_key" ON "ReferralReward"("referrerId", "referredId");

-- CreateIndex
CREATE UNIQUE INDEX "NHSReferralCode_code_key" ON "NHSReferralCode"("code");

-- CreateIndex
CREATE INDEX "NHSReferralCode_code_idx" ON "NHSReferralCode"("code");

-- CreateIndex
CREATE UNIQUE INDEX "NHSReferralActivation_codeId_userId_key" ON "NHSReferralActivation"("codeId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "SchoolLicence_activationCode_key" ON "SchoolLicence"("activationCode");

-- CreateIndex
CREATE INDEX "StudentEnrolment_licenceId_idx" ON "StudentEnrolment"("licenceId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentEnrolment_licenceId_userId_key" ON "StudentEnrolment"("licenceId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "CreatorProfile_userId_key" ON "CreatorProfile"("userId");

-- CreateIndex
CREATE INDEX "CreatorProfile_verified_idx" ON "CreatorProfile"("verified");

-- CreateIndex
CREATE INDEX "CreatorApplication_creatorId_idx" ON "CreatorApplication"("creatorId");

-- CreateIndex
CREATE INDEX "CreatorApplication_status_idx" ON "CreatorApplication"("status");

-- CreateIndex
CREATE INDEX "CreatorPayout_creatorId_idx" ON "CreatorPayout"("creatorId");

-- CreateIndex
CREATE UNIQUE INDEX "HardwareDevice_serialNumber_key" ON "HardwareDevice"("serialNumber");

-- CreateIndex
CREATE UNIQUE INDEX "HardwareDevice_apiKey_key" ON "HardwareDevice"("apiKey");

-- CreateIndex
CREATE INDEX "HardwareDevice_userId_idx" ON "HardwareDevice"("userId");

-- CreateIndex
CREATE INDEX "HardwareDevice_apiKey_idx" ON "HardwareDevice"("apiKey");

-- CreateIndex
CREATE INDEX "HardwareActivation_deviceId_idx" ON "HardwareActivation"("deviceId");

-- CreateIndex
CREATE INDEX "TokenStake_userId_idx" ON "TokenStake"("userId");

-- CreateIndex
CREATE INDEX "TokenStake_status_idx" ON "TokenStake"("status");

-- CreateIndex
CREATE UNIQUE INDEX "TokenStake_userId_roleSlug_key" ON "TokenStake"("userId", "roleSlug");

-- CreateIndex
CREATE INDEX "AuditJob_roleId_idx" ON "AuditJob"("roleId");

-- CreateIndex
CREATE INDEX "AuditJob_status_idx" ON "AuditJob"("status");

-- AddForeignKey
ALTER TABLE "UserPreferences" ADD CONSTRAINT "UserPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserVoiceClone" ADD CONSTRAINT "UserVoiceClone_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyLink" ADD CONSTRAINT "FamilyLink_guardianId_fkey" FOREIGN KEY ("guardianId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyLink" ADD CONSTRAINT "FamilyLink_childId_fkey" FOREIGN KEY ("childId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuardianAlert" ADD CONSTRAINT "GuardianAlert_familyLinkId_fkey" FOREIGN KEY ("familyLinkId") REFERENCES "FamilyLink"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WellbeingSignal" ADD CONSTRAINT "WellbeingSignal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrainSyncLog" ADD CONSTRAINT "BrainSyncLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnterpriseUser" ADD CONSTRAINT "EnterpriseUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnterpriseSeat" ADD CONSTRAINT "EnterpriseSeat_enterpriseId_fkey" FOREIGN KEY ("enterpriseId") REFERENCES "EnterpriseUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyBrain" ADD CONSTRAINT "CompanyBrain_enterpriseId_fkey" FOREIGN KEY ("enterpriseId") REFERENCES "EnterpriseUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HITLRule" ADD CONSTRAINT "HITLRule_companyBrainId_fkey" FOREIGN KEY ("companyBrainId") REFERENCES "CompanyBrain"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "CreatorProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleSkill" ADD CONSTRAINT "RoleSkill_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleAudit" ADD CONSTRAINT "RoleAudit_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hire" ADD CONSTRAINT "Hire_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hire" ADD CONSTRAINT "Hire_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HireMilestone" ADD CONSTRAINT "HireMilestone_hireId_fkey" FOREIGN KEY ("hireId") REFERENCES "Hire"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentSession" ADD CONSTRAINT "AgentSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentSession" ADD CONSTRAINT "AgentSession_hireId_fkey" FOREIGN KEY ("hireId") REFERENCES "Hire"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionDocument" ADD CONSTRAINT "SessionDocument_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AgentSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionAuditEvent" ADD CONSTRAINT "SessionAuditEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AgentSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionMemory" ADD CONSTRAINT "SessionMemory_hireId_fkey" FOREIGN KEY ("hireId") REFERENCES "Hire"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpacedRepetitionItem" ADD CONSTRAINT "SpacedRepetitionItem_hireId_fkey" FOREIGN KEY ("hireId") REFERENCES "Hire"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressReport" ADD CONSTRAINT "ProgressReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressReport" ADD CONSTRAINT "ProgressReport_hireId_fkey" FOREIGN KEY ("hireId") REFERENCES "Hire"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionSchedule" ADD CONSTRAINT "SessionSchedule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionSchedule" ADD CONSTRAINT "SessionSchedule_hireId_fkey" FOREIGN KEY ("hireId") REFERENCES "Hire"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GiftSubscription" ADD CONSTRAINT "GiftSubscription_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GiftSubscription" ADD CONSTRAINT "GiftSubscription_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NHSReferralActivation" ADD CONSTRAINT "NHSReferralActivation_codeId_fkey" FOREIGN KEY ("codeId") REFERENCES "NHSReferralCode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NHSReferralActivation" ADD CONSTRAINT "NHSReferralActivation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentEnrolment" ADD CONSTRAINT "StudentEnrolment_licenceId_fkey" FOREIGN KEY ("licenceId") REFERENCES "SchoolLicence"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentEnrolment" ADD CONSTRAINT "StudentEnrolment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreatorProfile" ADD CONSTRAINT "CreatorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreatorApplication" ADD CONSTRAINT "CreatorApplication_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "CreatorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreatorPayout" ADD CONSTRAINT "CreatorPayout_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "CreatorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HardwareDevice" ADD CONSTRAINT "HardwareDevice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HardwareActivation" ADD CONSTRAINT "HardwareActivation_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "HardwareDevice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TokenStake" ADD CONSTRAINT "TokenStake_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
