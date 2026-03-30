import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { checkAndAwardMilestones } from './milestones';
import { generateMemoryNote } from '../lib/brain/generateMemoryNote';
import { runSafeguardingPreCheck } from '../lib/safeguarding/checker';
import { runSafeguardingEscalation } from '../lib/safeguarding/escalationEngine';
import { getVoiceRecommendation, getStreamingConfig } from '../lib/sessions/voiceDefaults';
import { getAudioForEnvironment } from '../lib/environments/ambientAudio';

// S3 client for document uploads (B.7)
const s3 = new S3Client({
  region: process.env.AWS_REGION || 'eu-west-2',
  credentials: process.env.AWS_ACCESS_KEY_ID
    ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      }
    : undefined,
});
const S3_BUCKET = process.env.S3_CUSTOMER_DOCS_BUCKET || 'trustagent-prod-customer-docs';

export const sessionsRouter = router({
  // ── B.6 + B.10: Start session with exam mode and anti-dependency enforcement ──
  startSession: protectedProcedure
    .input(
      z.object({
        hireId: z.string(),
        inputMode: z.enum(['TEXT', 'VOICE', 'MIXED']).default('TEXT'),
        examMode: z.boolean().default(false),
        redTeamMode: z.boolean().default(false),
        presenceMode: z.boolean().default(false),
        timeBudgetMins: z.number().int().min(5).max(180).optional(),
        mode: z.enum(['normal', 'exam', 'upload_mark']).default('normal'),
        documentId: z.string().optional(), // B.7: document to inject into context
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Verify the hire belongs to this user and is active
      const hire = await ctx.prisma.hire.findFirst({
        where: { id: input.hireId, userId: ctx.user.id, status: 'ACTIVE' },
        include: { role: true },
      });
      if (!hire) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Active hire not found' });
      }

      // ── B.10: Server-side anti-dependency enforcement ──
      // Check daily session limits (for child accounts via FamilyLink)
      const familyLink = await ctx.prisma.familyLink.findFirst({
        where: { childId: ctx.user.id },
      });

      if (familyLink) {
        // Child account - enforce guardian-set daily limit
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todaySessions = await ctx.prisma.agentSession.aggregate({
          where: {
            userId: ctx.user.id,
            startedAt: { gte: today },
            status: { in: ['ACTIVE', 'COMPLETED'] },
          },
          _sum: { durationSeconds: true },
        });
        const usedMins = Math.floor((todaySessions._sum.durationSeconds || 0) / 60);
        const dailyLimit = familyLink.maxDailyMins;
        if (usedMins >= dailyLimit) {
          // Log dependency event
          await ctx.prisma.dependencyEvent.create({
            data: {
              sessionId: 'BLOCKED', // No session created
              userId: ctx.user.id,
              eventType: 'DAILY_LIMIT_EXCEEDED',
              elapsedMins: usedMins,
              details: `Child account daily limit of ${dailyLimit} minutes reached. Used ${usedMins} minutes today.`,
            },
          });

          throw new TRPCError({
            code: 'FORBIDDEN',
            message: `Daily session limit of ${dailyLimit} minutes reached`,
            cause: { code: 'DAILY_LIMIT_EXCEEDED', usedMins, dailyLimit },
          });
        }
      }

      // Also check role-level limits
      if (hire.role.maxDailySessionMins) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todaySessions = await ctx.prisma.agentSession.aggregate({
          where: {
            hireId: hire.id,
            startedAt: { gte: today },
            status: { in: ['ACTIVE', 'COMPLETED'] },
          },
          _sum: { durationSeconds: true },
        });
        const usedMins = Math.floor((todaySessions._sum.durationSeconds || 0) / 60);
        if (usedMins >= hire.role.maxDailySessionMins) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: `Daily session limit of ${hire.role.maxDailySessionMins} minutes reached`,
            cause: { code: 'DAILY_LIMIT_EXCEEDED' },
          });
        }
      }

      // Check for already active sessions on this hire
      const activeSession = await ctx.prisma.agentSession.findFirst({
        where: { hireId: hire.id, status: 'ACTIVE' },
      });
      if (activeSession) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'An active session already exists for this hire. End it before starting a new one.',
        });
      }

      // ── Safeguarding pre-check for child accounts ──
      const safeguardingResult = await runSafeguardingPreCheck(ctx.prisma, {
        userId: ctx.user.id,
        accountType: ctx.user.accountType,
      });

      if (!safeguardingResult.allowed) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: safeguardingResult.reason || 'Session blocked by safeguarding controls',
          cause: {
            code: safeguardingResult.eventType || 'SAFEGUARDING_BLOCK',
            severity: safeguardingResult.severity,
          },
        });
      }

      // Resolve exam mode from either boolean or mode string
      const isExamMode = input.examMode || input.mode === 'exam';

      const session = await ctx.prisma.agentSession.create({
        data: {
          userId: ctx.user.id,
          hireId: hire.id,
          status: 'ACTIVE',
          inputMode: input.inputMode,
          environmentSlug: hire.customEnvironment || hire.role.environmentSlug,
          examMode: isExamMode,
          redTeamMode: input.redTeamMode,
          presenceMode: input.presenceMode,
          timeBudgetMins: input.timeBudgetMins,
          documentId: input.documentId || null,
        },
      });

      // Return session metadata - NEVER return systemPrompt
      return {
        sessionId: session.id,
        environmentSlug: session.environmentSlug,
        environmentConfig: hire.role.environmentConfig,
        inputMode: session.inputMode,
        companionName: hire.customCompanionName || hire.role.companionName,
        roleName: hire.role.name,
        maxSessionMinutes: hire.role.maxSessionMinutes,
        examModeActive: isExamMode,
        isChildAccount: !!familyLink,
        dailyLimitMins: familyLink?.maxDailyMins ?? null,
      };
    }),

  // ── B.6: End session with optional exam results + Visible Brain metadata ──
  endSession: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        // B.6: exam results (optional - only present if exam mode)
        examScore: z.number().int().optional(),
        examTotal: z.number().int().optional(),
        examPercentage: z.number().int().optional(),
        examGrade: z.string().optional(),
        // Visible Brain: session metadata for memory note generation
        topicsCovered: z.array(z.string()).optional(),
        correctAnswers: z.number().int().optional(),
        totalQuestions: z.number().int().optional(),
        struggledWith: z.array(z.string()).optional(),
        breakthrough: z.string().optional(),
        nextFocus: z.string().optional(),
        examSubject: z.string().optional(),
        examDate: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const session = await ctx.prisma.agentSession.findFirst({
        where: { id: input.sessionId, userId: ctx.user.id, status: 'ACTIVE' },
      });
      if (!session) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Active session not found' });
      }

      const endedAt = new Date();
      const durationSeconds = Math.floor((endedAt.getTime() - session.startedAt.getTime()) / 1000);

      // Build update data
      const updateData: Record<string, unknown> = {
        status: 'COMPLETED',
        endedAt,
        durationSeconds,
      };

      // B.6: Save exam results if this was an exam session
      if (session.examMode) {
        updateData.examScore = input.examScore ?? null;
        updateData.examTotal = input.examTotal ?? null;
        updateData.examPercentage = input.examPercentage ?? null;
        updateData.examGrade = input.examGrade ?? null;
        updateData.examDurationSecs = durationSeconds;
      }

      // Update session
      const updated = await ctx.prisma.agentSession.update({
        where: { id: session.id },
        data: updateData,
      });

      // ── B.4: Compute streak data ──────────────────────────────────────────
      const durationMins = Math.ceil(durationSeconds / 60);

      // Get current hire to read lastSessionAt before update
      const hire = await ctx.prisma.hire.findUnique({
        where: { id: session.hireId },
        select: { streakDays: true, longestStreakDays: true, lastSessionAt: true, sessionCount: true, totalMinutes: true },
      });

      let newStreakDays = 1;
      if (hire?.lastSessionAt) {
        const lastDate = new Date(hire.lastSessionAt);
        lastDate.setHours(0, 0, 0, 0);
        const todayDate = new Date(endedAt);
        todayDate.setHours(0, 0, 0, 0);
        const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 0) {
          // Same day - keep existing streak
          newStreakDays = hire.streakDays || 1;
        } else if (diffDays === 1) {
          // Consecutive day - increment
          newStreakDays = (hire.streakDays || 0) + 1;
        } else {
          // Gap - reset to 1
          newStreakDays = 1;
        }
      }

      const newLongestStreak = Math.max(newStreakDays, hire?.longestStreakDays || 0);
      const newSessionCount = (hire?.sessionCount || 0) + 1;
      const newTotalMinutes = (hire?.totalMinutes || 0) + durationMins;

      // Update hire stats with streak data
      await ctx.prisma.hire.update({
        where: { id: session.hireId },
        data: {
          sessionCount: newSessionCount,
          totalMinutes: newTotalMinutes,
          lastSessionAt: endedAt,
          streakDays: newStreakDays,
          longestStreakDays: newLongestStreak,
        },
      });

      // ── B.5: Compute wellbeing score ──────────────────────────────────────
      const fourteenDaysAgo = new Date(endedAt);
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
      const recentSessions = await ctx.prisma.agentSession.findMany({
        where: {
          hireId: session.hireId,
          status: 'COMPLETED',
          startedAt: { gte: fourteenDaysAgo },
        },
        select: { durationSeconds: true, dependencyFlag: true, startedAt: true },
      });

      const recentSessionCount = recentSessions.length;
      const avgSessionMins =
        recentSessionCount > 0
          ? recentSessions.reduce((sum, s) => sum + Math.ceil((s.durationSeconds || 0) / 60), 0) / recentSessionCount
          : 0;
      const dependencyFlagCount = recentSessions.filter((s) => s.dependencyFlag).length;

      // Calculate days since last session before this one
      let daysSinceLastSession = 0;
      if (hire?.lastSessionAt) {
        daysSinceLastSession = Math.floor(
          (endedAt.getTime() - new Date(hire.lastSessionAt).getTime()) / (1000 * 60 * 60 * 24),
        );
      }

      // Wellbeing formula from B.5
      let wellbeingScore = 75;
      if (recentSessionCount >= 3) wellbeingScore += 5;
      if (newStreakDays >= 3) wellbeingScore += 5;
      if (avgSessionMins > 10) wellbeingScore += 5;
      if (recentSessionCount === 0) wellbeingScore -= 15;
      if (daysSinceLastSession > 7) wellbeingScore -= 10;
      if (daysSinceLastSession > 14) wellbeingScore -= 10;
      if (dependencyFlagCount > 3) wellbeingScore -= 10;
      wellbeingScore = Math.max(0, Math.min(100, wellbeingScore));

      // Get previous wellbeing to determine trend
      const existingMemory = await ctx.prisma.sessionMemory.findUnique({
        where: { hireId: session.hireId },
        select: { wellbeingScore: true, wellbeingTrend: true },
      });

      const prevScore = existingMemory?.wellbeingScore ?? 75;
      let wellbeingTrend: string;
      if (wellbeingScore > prevScore + 5) wellbeingTrend = 'improving';
      else if (wellbeingScore < prevScore - 5) wellbeingTrend = 'declining';
      else wellbeingTrend = 'stable';

      // Upsert SessionMemory with wellbeing
      await ctx.prisma.sessionMemory.upsert({
        where: { hireId: session.hireId },
        create: {
          hireId: session.hireId,
          memorySummary: {},
          wellbeingScore,
          wellbeingTrend,
          lastWellbeingAt: endedAt,
          sessionCount: 1,
          totalMinutes: durationMins,
        },
        update: {
          wellbeingScore,
          wellbeingTrend,
          lastWellbeingAt: endedAt,
          sessionCount: { increment: 1 },
          totalMinutes: { increment: durationMins },
        },
      });

      // Record wellbeing signal
      await ctx.prisma.wellbeingSignal.create({
        data: {
          userId: ctx.user.id,
          hireId: session.hireId,
          score: wellbeingScore,
          trend: wellbeingTrend,
          signals: {
            recentSessionCount,
            avgSessionMins: Math.round(avgSessionMins),
            streakDays: newStreakDays,
            dependencyFlagCount,
            daysSinceLastSession,
          },
        },
      });

      // ── B.5: Create alert if trend declining ──────────────────────────────
      if (wellbeingTrend === 'declining') {
        // Find guardian links for this user
        const guardianLinks = await ctx.prisma.familyLink.findMany({
          where: { childId: ctx.user.id },
        });

        for (const link of guardianLinks) {
          await ctx.prisma.guardianAlert.create({
            data: {
              familyLinkId: link.id,
              type: 'wellbeing_concern',
              message: `Wellbeing score has declined to ${wellbeingScore}/100 (was ${prevScore}/100). Trend: declining.`,
              hireId: session.hireId,
            },
          });

          // Also create notification for guardian
          await ctx.prisma.notification.create({
            data: {
              userId: link.guardianId,
              type: 'WELLBEING_SIGNAL',
              title: 'Wellbeing Alert',
              body: `Wellbeing score has declined to ${wellbeingScore}/100. This may indicate reduced engagement or session pattern changes.`,
              data: { hireId: session.hireId, childId: ctx.user.id, score: wellbeingScore, trend: wellbeingTrend },
              priority: 'high',
            },
          });
        }
      }

      // ── B.4: Check and award milestones ───────────────────────────────────
      const awardedMilestones = await checkAndAwardMilestones(
        ctx.prisma,
        ctx.user.id,
        session.hireId,
        { streakDays: newStreakDays, sessionCount: newSessionCount, totalMinutes: newTotalMinutes },
      );

      // ── Visible Brain: Generate memory note after session ───────────────
      try {
        await generateMemoryNote(session.hireId, {
          sessionId: session.id,
          durationMinutes: durationMins,
          topicsCovered: input.topicsCovered ?? [],
          correctAnswers: input.correctAnswers,
          totalQuestions: input.totalQuestions,
          struggledWith: input.struggledWith,
          breakthrough: input.breakthrough,
          nextFocus: input.nextFocus,
          examDate: input.examDate,
          examSubject: input.examSubject,
          sessionMode: session.examMode ? 'exam' : 'normal',
          examScore: input.examScore,
        });
      } catch (err) {
        // Memory note generation should never block session end
        console.error('[brain] Memory note generation failed:', err);
      }

      // ── Safeguarding post-session escalation for child/vulnerable accounts ──
      try {
        await runSafeguardingEscalation(ctx.prisma, session.hireId, {
          sessionId: session.id,
          durationMinutes: durationMins,
        });
      } catch (err) {
        // Safeguarding escalation should never block session end
        console.error('[safeguarding] Post-session escalation failed:', err);
      }

      // Return metadata only - NO message content
      return {
        sessionId: updated.id,
        durationSeconds,
        messageCount: updated.messageCount,
        status: updated.status,
        endedAt: updated.endedAt,
        // B.4: Streak data
        streakDays: newStreakDays,
        longestStreakDays: newLongestStreak,
        newMilestones: awardedMilestones,
        // B.5: Wellbeing data
        wellbeingScore,
        wellbeingTrend,
        // B.6: Exam results
        examScore: updated.examScore,
        examTotal: updated.examTotal,
        examPercentage: updated.examPercentage,
        examGrade: updated.examGrade,
        examDurationSecs: updated.examDurationSecs,
      };
    }),

  // ── B.7: Upload document and get S3 signed URL ──
  uploadDocument: protectedProcedure
    .input(
      z.object({
        hireId: z.string(),
        fileName: z.string(),
        mimeType: z.string(),
        fileSizeBytes: z.number().int().positive().max(10 * 1024 * 1024), // 10MB max
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Verify the hire belongs to this user
      const hire = await ctx.prisma.hire.findFirst({
        where: { id: input.hireId, userId: ctx.user.id, status: 'ACTIVE' },
      });
      if (!hire) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Active hire not found' });
      }

      // Generate unique S3 key
      const timestamp = Date.now();
      const sanitizedName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
      const s3Key = `uploads/${ctx.user.id}/${input.hireId}/${timestamp}-${sanitizedName}`;

      // Create presigned URL for direct upload from client
      const putCommand = new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: s3Key,
        ContentType: input.mimeType,
        ContentLength: input.fileSizeBytes,
        Metadata: {
          userId: ctx.user.id,
          hireId: input.hireId,
        },
      });

      const presignedUrl = await getSignedUrl(s3, putCommand, { expiresIn: 300 }); // 5 min expiry

      // Create document record in DB
      const doc = await ctx.prisma.sessionDocument.create({
        data: {
          sessionId: '', // Will be linked when session starts with this document
          s3Key,
          fileName: input.fileName,
          mimeType: input.mimeType,
          fileSizeBytes: input.fileSizeBytes,
        },
      });

      // Generate download URL for reading back
      const getCommand = new GetObjectCommand({
        Bucket: S3_BUCKET,
        Key: s3Key,
      });
      const documentUrl = await getSignedUrl(s3, getCommand, { expiresIn: 3600 });

      return {
        documentId: doc.id,
        presignedUploadUrl: presignedUrl,
        documentUrl,
        s3Key,
        fileName: input.fileName,
      };
    }),

  // ── B.7: Confirm document upload and link to session ──
  linkDocumentToSession: protectedProcedure
    .input(
      z.object({
        documentId: z.string(),
        sessionId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Verify session belongs to user
      const session = await ctx.prisma.agentSession.findFirst({
        where: { id: input.sessionId, userId: ctx.user.id },
      });
      if (!session) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Session not found' });
      }

      // Link document to session
      const doc = await ctx.prisma.sessionDocument.update({
        where: { id: input.documentId },
        data: { sessionId: input.sessionId },
      });

      // Update session with document reference
      await ctx.prisma.agentSession.update({
        where: { id: input.sessionId },
        data: { documentId: input.documentId },
      });

      return { documentId: doc.id, sessionId: input.sessionId, linked: true };
    }),

  // ── B.10: Log dependency event (called from server-side WebSocket handler) ──
  logDependencyEvent: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        eventType: z.enum(['WARNING_EMITTED', 'DAILY_LIMIT_EXCEEDED', 'FORCE_END', 'HARD_LIMIT']),
        elapsedMins: z.number().int(),
        details: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const event = await ctx.prisma.dependencyEvent.create({
        data: {
          sessionId: input.sessionId,
          userId: ctx.user.id,
          eventType: input.eventType,
          elapsedMins: input.elapsedMins,
          details: input.details,
        },
      });

      // If it's a force end, also flag the session
      if (input.eventType === 'FORCE_END' || input.eventType === 'HARD_LIMIT') {
        await ctx.prisma.agentSession.update({
          where: { id: input.sessionId },
          data: { dependencyFlag: true },
        });
      }

      return { eventId: event.id };
    }),

  // ── B.10: Check dependency status for current session ──
  checkDependencyStatus: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ input, ctx }) => {
      const session = await ctx.prisma.agentSession.findFirst({
        where: { id: input.sessionId, userId: ctx.user.id, status: 'ACTIVE' },
      });
      if (!session) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Active session not found' });
      }

      const elapsedSecs = Math.floor((Date.now() - session.startedAt.getTime()) / 1000);
      const elapsedMins = Math.floor(elapsedSecs / 60);

      // Check if child account
      const familyLink = await ctx.prisma.familyLink.findFirst({
        where: { childId: ctx.user.id },
      });
      const isChild = !!familyLink;
      const dailyLimit = familyLink?.maxDailyMins ?? null;

      // Get today's total usage
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todaySessions = await ctx.prisma.agentSession.aggregate({
        where: {
          userId: ctx.user.id,
          startedAt: { gte: today },
          status: { in: ['ACTIVE', 'COMPLETED'] },
        },
        _sum: { durationSeconds: true },
      });
      const totalTodayMins = Math.floor((todaySessions._sum.durationSeconds || 0) / 60);

      // Adult warning at 90 minutes
      const shouldWarnAdult = !isChild && elapsedMins >= 90;
      // Child hard limit
      const shouldEndChild = isChild && dailyLimit && totalTodayMins >= dailyLimit;

      return {
        elapsedMins,
        totalTodayMins,
        isChild,
        dailyLimit,
        shouldWarnAdult,
        shouldEndChild,
        dependencyFlag: session.dependencyFlag,
      };
    }),

  listSessions: protectedProcedure
    .input(
      z.object({
        hireId: z.string().optional(),
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(50).default(20),
      })
    )
    .query(async ({ input, ctx }) => {
      const where: Record<string, unknown> = { userId: ctx.user.id };
      if (input.hireId) where.hireId = input.hireId;

      const skip = (input.page - 1) * input.limit;

      const [sessions, total] = await Promise.all([
        ctx.prisma.agentSession.findMany({
          where,
          select: {
            id: true,
            hireId: true,
            status: true,
            inputMode: true,
            environmentSlug: true,
            examMode: true,
            examScore: true,
            examTotal: true,
            examPercentage: true,
            examGrade: true,
            startedAt: true,
            endedAt: true,
            durationSeconds: true,
            messageCount: true,
            deviceType: true,
            // NO message content - metadata only
          },
          skip,
          take: input.limit,
          orderBy: { startedAt: 'desc' },
        }),
        ctx.prisma.agentSession.count({ where }),
      ]);

      return {
        sessions,
        total,
        page: input.page,
        totalPages: Math.ceil(total / input.limit),
      };
    }),

  getSessionMeta: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ input, ctx }) => {
      const session = await ctx.prisma.agentSession.findFirst({
        where: { id: input.sessionId, userId: ctx.user.id },
        select: {
          id: true,
          hireId: true,
          status: true,
          inputMode: true,
          environmentSlug: true,
          examMode: true,
          examScore: true,
          examTotal: true,
          examPercentage: true,
          examGrade: true,
          examDurationSecs: true,
          redTeamMode: true,
          presenceMode: true,
          startedAt: true,
          endedAt: true,
          durationSeconds: true,
          messageCount: true,
          deviceType: true,
          sessionMinsToday: true,
          dependencyFlag: true,
          documentId: true,
          // NO message content
        },
      });

      if (!session) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Session not found' });
      }

      return session;
    }),

  // ── Phase 4: Voice recommendation endpoint ──────────────────────────────
  getVoiceRecommendation: protectedProcedure
    .input(z.object({ hireId: z.string() }))
    .query(async ({ ctx, input }) => {
      const hire = await ctx.prisma.hire.findFirst({
        where: { id: input.hireId, userId: ctx.user.id },
        include: {
          role: {
            select: {
              category: true,
              defaultCompanionName: true,
              companionName: true,
            },
          },
        },
      });

      if (!hire) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Hire not found' });
      }

      const companionName =
        hire.customCompanionName ??
        hire.role.defaultCompanionName ??
        hire.role.companionName;

      // Check if user has used voice before via preferences
      const prefs = await ctx.prisma.userPreferences.findUnique({
        where: { userId: ctx.user.id },
        select: { voiceEnabled: true },
      });

      const voiceRec = getVoiceRecommendation(
        hire.role.category,
        companionName,
        prefs?.voiceEnabled ?? false,
      );

      return voiceRec;
    }),

  // ── Phase 4: Session config (ambient audio + voice + streaming) ─────────
  getSessionConfig: protectedProcedure
    .input(
      z.object({
        hireId: z.string(),
        environmentSlug: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const hire = await ctx.prisma.hire.findFirstOrThrow({
        where: { id: input.hireId, userId: ctx.user.id },
        include: {
          role: {
            select: {
              category: true,
              defaultCompanionName: true,
              companionName: true,
              gender: true,
            },
          },
        },
      });

      const companionName =
        hire.customCompanionName ??
        hire.role.defaultCompanionName ??
        hire.role.companionName;
      const category = hire.role.category;

      // Get ambient audio config for this environment
      const audio = getAudioForEnvironment(input.environmentSlug);

      // Generate presigned URL for ambient audio (1 hour expiry)
      let audioUrl: string | null = null;
      if (audio) {
        try {
          const assetsBucket =
            process.env.S3_ASSETS_BUCKET || 'trustagent-prod-assets';
          const command = new GetObjectCommand({
            Bucket: assetsBucket,
            Key: audio.s3Key,
          });
          audioUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
        } catch {
          // S3 presign failed - audio will be null, session proceeds without ambient
          audioUrl = null;
        }
      }

      // Get user preferences for overrides
      const prefs = await ctx.prisma.userPreferences.findUnique({
        where: { userId: ctx.user.id },
        select: {
          voiceEnabled: true,
          ambientAudioEnabled: true,
          highContrastMode: true,
          fontSize: true,
          calmMode: true,
        },
      });

      // Get voice recommendation
      const voiceRec = getVoiceRecommendation(
        category,
        companionName,
        prefs?.voiceEnabled ?? false,
      );

      // Get streaming config
      const streaming = getStreamingConfig(category);

      return {
        companion: {
          name: companionName,
          category,
          gender: hire.role.gender,
        },
        ambient: {
          url: audioUrl,
          defaultVolume: audio?.defaultVolume ?? 10,
          enabled: prefs?.ambientAudioEnabled ?? true,
          fadeInMs: audio?.fadeInMs ?? 2000,
          fadeOutMs: audio?.fadeOutMs ?? 1500,
        },
        voice: {
          mode: prefs?.voiceEnabled ? 'voice' : 'text',
          speed: 1.0,
          recommendation: voiceRec,
        },
        streaming: {
          minThinkingMs: streaming.minThinkingMs,
          charsPerChunk: streaming.charsPerChunk,
          baseDelayMs: streaming.baseDelayMs,
        },
        accessibility: {
          highContrast: prefs?.highContrastMode ?? false,
          largeText: prefs?.fontSize === 'large' || prefs?.fontSize === 'xlarge',
          reducedMotion: prefs?.calmMode ?? false,
        },
      };
    }),
});
