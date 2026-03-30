import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import type { NotificationContextType } from '@prisma/client';

export const notificationsRouter = router({
  // ──────────────────────────────────────────────────────────────────────────
  // GET NOTIFICATIONS - paginated list
  // ──────────────────────────────────────────────────────────────────────────
  getNotifications: protectedProcedure
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(50).default(20),
        unreadOnly: z.boolean().default(false),
      }).optional()
    )
    .query(async ({ input, ctx }) => {
      const page = input?.page ?? 1;
      const limit = input?.limit ?? 20;
      const skip = (page - 1) * limit;
      const unreadOnly = input?.unreadOnly ?? false;

      const where = {
        userId: ctx.user.id,
        ...(unreadOnly ? { readAt: null } : {}),
      };

      const [notifications, total] = await Promise.all([
        ctx.prisma.notification.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        ctx.prisma.notification.count({ where }),
      ]);

      return {
        notifications,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    }),

  // ──────────────────────────────────────────────────────────────────────────
  // MARK READ - mark one or many notifications as read
  // ──────────────────────────────────────────────────────────────────────────
  markRead: protectedProcedure
    .input(
      z.object({
        notificationIds: z.array(z.string()).min(1).max(100),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const result = await ctx.prisma.notification.updateMany({
        where: {
          id: { in: input.notificationIds },
          userId: ctx.user.id,
          readAt: null,
        },
        data: { readAt: new Date() },
      });

      return { marked: result.count };
    }),

  // ──────────────────────────────────────────────────────────────────────────
  // MARK ALL READ
  // ──────────────────────────────────────────────────────────────────────────
  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    const result = await ctx.prisma.notification.updateMany({
      where: {
        userId: ctx.user.id,
        readAt: null,
      },
      data: { readAt: new Date() },
    });

    return { marked: result.count };
  }),

  // ──────────────────────────────────────────────────────────────────────────
  // GET UNREAD COUNT
  // ──────────────────────────────────────────────────────────────────────────
  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const count = await ctx.prisma.notification.count({
      where: {
        userId: ctx.user.id,
        readAt: null,
      },
    });

    return { count };
  }),

  // ──────────────────────────────────────────────────────────────────────────
  // REGISTER PUSH SUBSCRIPTION (VAPID)
  // ──────────────────────────────────────────────────────────────────────────
  registerPushSubscription: protectedProcedure
    .input(
      z.object({
        subscription: z.object({
          endpoint: z.string().url(),
          keys: z.object({
            p256dh: z.string(),
            auth: z.string(),
          }),
        }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await ctx.prisma.user.update({
        where: { id: ctx.user.id },
        data: { vapidSubscription: input.subscription as any },
      });

      return { registered: true };
    }),

  // ──────────────────────────────────────────────────────────────────────────
  // SET EXAM CONTEXT - Create exam-approaching notification context
  // ──────────────────────────────────────────────────────────────────────────
  setExamContext: protectedProcedure
    .input(
      z.object({
        hireId: z.string(),
        examName: z.string().min(1).max(200),
        examDate: z.string(), // ISO date string
        weakestTopic: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const examDate = new Date(input.examDate);
      const now = new Date();
      if (examDate <= now) {
        return { error: 'Exam date must be in the future' };
      }

      // Verify hire belongs to user
      const hire = await ctx.prisma.hire.findFirst({
        where: { id: input.hireId, userId: ctx.user.id },
        include: { role: { select: { companionName: true } } },
      });
      if (!hire) {
        return { error: 'Hire not found' };
      }

      // Create notification contexts for key countdown points
      const daysUntilExam = Math.ceil((examDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const alertDays = [30, 14, 7, 3, 1, 0].filter(d => d < daysUntilExam);

      const created: string[] = [];
      for (const daysBeforeExam of alertDays) {
        const scheduledFor = new Date(examDate.getTime() - daysBeforeExam * 24 * 60 * 60 * 1000);
        scheduledFor.setHours(9, 0, 0, 0); // Send at 9 AM

        await ctx.prisma.notificationContext.create({
          data: {
            userId: ctx.user.id,
            hireId: input.hireId,
            contextType: 'EXAM_APPROACHING' as NotificationContextType,
            contextData: {
              examName: input.examName,
              examDate: input.examDate,
              companionName: hire.customCompanionName || hire.role.companionName,
              weakestTopic: input.weakestTopic || null,
              daysBeforeExam,
            },
            scheduledFor,
            expiresAt: new Date(examDate.getTime() + 24 * 60 * 60 * 1000),
          },
        });
        created.push(`${daysBeforeExam} days before`);
      }

      return { success: true, alertsScheduled: created.length, alerts: created };
    }),

  // ──────────────────────────────────────────────────────────────────────────
  // GET NOTIFICATION CONTEXTS - view scheduled intelligent notifications
  // ──────────────────────────────────────────────────────────────────────────
  getNotificationContexts: protectedProcedure
    .input(
      z.object({
        hireId: z.string().optional(),
        contextType: z.enum([
          'EXAM_APPROACHING',
          'STREAK_AT_RISK',
          'STREAK_MILESTONE',
          'TOPIC_DUE',
          'WELLBEING_CHECK',
          'MILESTONE_NEAR',
          'SESSION_INSIGHT',
        ]).optional(),
      }).optional()
    )
    .query(async ({ input, ctx }) => {
      const contexts = await ctx.prisma.notificationContext.findMany({
        where: {
          userId: ctx.user.id,
          isActive: true,
          ...(input?.hireId ? { hireId: input.hireId } : {}),
          ...(input?.contextType ? { contextType: input.contextType as NotificationContextType } : {}),
        },
        orderBy: { scheduledFor: 'asc' },
        take: 50,
      });

      return { contexts };
    }),

  // ──────────────────────────────────────────────────────────────────────────
  // DISMISS NOTIFICATION CONTEXT
  // ──────────────────────────────────────────────────────────────────────────
  dismissNotificationContext: protectedProcedure
    .input(z.object({ contextId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await ctx.prisma.notificationContext.updateMany({
        where: {
          id: input.contextId,
          userId: ctx.user.id,
        },
        data: { dismissed: true, isActive: false },
      });

      return { dismissed: true };
    }),
});
