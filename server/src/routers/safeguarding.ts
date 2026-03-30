/**
 * Safeguarding Admin Router
 * Admin dashboard for safeguarding events - list, filter, export for compliance.
 */

import { z } from 'zod';
import { router, adminProcedure } from '../trpc';

export const safeguardingRouter = router({
  // List all safeguarding events with filtering
  listEvents: adminProcedure
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(100).default(20),
        severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
        eventType: z.string().optional(),
        userId: z.string().optional(),
        resolved: z.boolean().optional(),
        dateFrom: z.string().optional(), // ISO date string
        dateTo: z.string().optional(),
      }).optional()
    )
    .query(async ({ input, ctx }) => {
      const page = input?.page ?? 1;
      const limit = input?.limit ?? 20;
      const skip = (page - 1) * limit;

      const where: Record<string, unknown> = {};

      if (input?.severity) where.severity = input.severity;
      if (input?.eventType) where.eventType = input.eventType;
      if (input?.userId) where.userId = input.userId;
      if (input?.resolved !== undefined) where.resolved = input.resolved;

      if (input?.dateFrom || input?.dateTo) {
        const createdAt: Record<string, Date> = {};
        if (input?.dateFrom) createdAt.gte = new Date(input.dateFrom);
        if (input?.dateTo) createdAt.lte = new Date(input.dateTo);
        where.createdAt = createdAt;
      }

      const [events, total] = await Promise.all([
        ctx.prisma.safeguardingEvent.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        ctx.prisma.safeguardingEvent.count({ where }),
      ]);

      return {
        events,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    }),

  // Get safeguarding summary stats
  summary: adminProcedure
    .input(
      z.object({
        days: z.number().int().min(1).max(365).default(30),
      }).optional()
    )
    .query(async ({ input, ctx }) => {
      const days = input?.days ?? 30;
      const since = new Date(Date.now() - days * 86400000);

      const [totalEvents, bySeverity, byType, unresolvedCount] = await Promise.all([
        ctx.prisma.safeguardingEvent.count({
          where: { createdAt: { gte: since } },
        }),
        ctx.prisma.safeguardingEvent.groupBy({
          by: ['severity'],
          _count: { id: true },
          where: { createdAt: { gte: since } },
        }),
        ctx.prisma.safeguardingEvent.groupBy({
          by: ['eventType'],
          _count: { id: true },
          where: { createdAt: { gte: since } },
        }),
        ctx.prisma.safeguardingEvent.count({
          where: { resolved: false, createdAt: { gte: since } },
        }),
      ]);

      return {
        totalEvents,
        unresolvedCount,
        bySeverity: bySeverity.map((s) => ({ severity: s.severity, count: s._count.id })),
        byType: byType.map((t) => ({ eventType: t.eventType, count: t._count.id })),
        periodDays: days,
        generatedAt: new Date().toISOString(),
      };
    }),

  // Resolve a safeguarding event
  resolveEvent: adminProcedure
    .input(
      z.object({
        eventId: z.string(),
        resolution: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.prisma.safeguardingEvent.update({
        where: { id: input.eventId },
        data: {
          resolved: true,
          resolvedAt: new Date(),
          resolvedBy: ctx.adminApiKey ? 'admin' : 'unknown',
        },
      });
    }),

  // Export safeguarding events for compliance (returns all matching events)
  exportEvents: adminProcedure
    .input(
      z.object({
        dateFrom: z.string(),
        dateTo: z.string(),
        severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const where: Record<string, unknown> = {
        createdAt: {
          gte: new Date(input.dateFrom),
          lte: new Date(input.dateTo),
        },
      };

      if (input.severity) where.severity = input.severity;

      const events = await ctx.prisma.safeguardingEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });

      return {
        events,
        exportedAt: new Date().toISOString(),
        filters: {
          dateFrom: input.dateFrom,
          dateTo: input.dateTo,
          severity: input.severity || 'all',
        },
        totalRecords: events.length,
      };
    }),
});
