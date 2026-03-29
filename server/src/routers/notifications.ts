import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';

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
});
