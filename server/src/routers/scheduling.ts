/**
 * B.9 Session Scheduling Router
 *
 * CRUD for recurring session schedules + ICS file generation.
 * Integrates with BullMQ for SESSION_REMINDER notifications.
 */
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc';
import { addNotificationJob } from '../queues/notification-queue';

// ── ICS generation helper ─────────────────────────────────────────────────

function generateICSContent(schedule: {
  id: string;
  dayOfWeek: number[];
  timeOfDay: string;
  durationMins: number;
  timezone: string;
  roleName?: string;
}): string {
  const [hours, minutes] = schedule.timeOfDay.split(':').map(Number);

  // Map dayOfWeek numbers to RRULE BYDAY values (0=SU..6=SA)
  const dayMap = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
  const byDay = schedule.dayOfWeek.map((d) => dayMap[d]).join(',');

  // Calculate DTSTART from the next occurrence
  const now = new Date();
  const startDate = getNextOccurrence(schedule.dayOfWeek, hours, minutes, schedule.timezone);
  const endDate = new Date(startDate.getTime() + schedule.durationMins * 60 * 1000);

  const formatDate = (d: Date): string => {
    return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  };

  const uid = `schedule-${schedule.id}@trust-agent.ai`;
  const summary = schedule.roleName
    ? `Trust Agent Session - ${schedule.roleName}`
    : 'Trust Agent Session';

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AgentCore LTD//Trust Agent//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTART:${formatDate(startDate)}`,
    `DTEND:${formatDate(endDate)}`,
    `RRULE:FREQ=WEEKLY;BYDAY=${byDay}`,
    `SUMMARY:${summary}`,
    'DESCRIPTION:Your scheduled Trust Agent session. Open the app to begin.',
    `LOCATION:https://app.trust-agent.ai`,
    `BEGIN:VALARM`,
    `TRIGGER:-PT15M`,
    `ACTION:DISPLAY`,
    `DESCRIPTION:Trust Agent session starts in 15 minutes`,
    `END:VALARM`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

function getNextOccurrence(
  daysOfWeek: number[],
  hours: number,
  minutes: number,
  _timezone: string
): Date {
  const now = new Date();
  const currentDay = now.getDay();

  // Find the next matching day
  let daysUntil = Infinity;
  for (const targetDay of daysOfWeek) {
    let diff = targetDay - currentDay;
    if (diff < 0) diff += 7;
    if (diff === 0) {
      // Same day - check if time hasn't passed
      const todayTarget = new Date(now);
      todayTarget.setHours(hours, minutes, 0, 0);
      if (todayTarget > now) {
        diff = 0;
      } else {
        diff = 7;
      }
    }
    if (diff < daysUntil) daysUntil = diff;
  }

  const nextDate = new Date(now);
  nextDate.setDate(nextDate.getDate() + daysUntil);
  nextDate.setHours(hours, minutes, 0, 0);
  return nextDate;
}

export const schedulingRouter = router({
  // ── Create a new schedule ──
  createSchedule: protectedProcedure
    .input(
      z.object({
        hireId: z.string(),
        dayOfWeek: z.union([
          z.number().int().min(0).max(6),
          z.array(z.number().int().min(0).max(6)),
        ]),
        time: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:MM format'),
        timezone: z.string().default('Europe/London'),
        durationMins: z.number().int().min(15).max(180).default(30),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Verify hire belongs to user
      const hire = await ctx.prisma.hire.findFirst({
        where: { id: input.hireId, userId: ctx.user.id, status: 'ACTIVE' },
        include: { role: true },
      });
      if (!hire) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Hire not found' });
      }

      const days = Array.isArray(input.dayOfWeek) ? input.dayOfWeek : [input.dayOfWeek];
      const [hours, minutes] = input.time.split(':').map(Number);

      // Calculate next session time
      const nextSessionAt = getNextOccurrence(days, hours, minutes, input.timezone);

      const schedule = await ctx.prisma.sessionSchedule.create({
        data: {
          userId: ctx.user.id,
          hireId: input.hireId,
          dayOfWeek: days,
          timeOfDay: input.time,
          durationMins: input.durationMins,
          timezone: input.timezone,
          isActive: true,
          nextSessionAt,
        },
      });

      // Generate ICS URL
      const icsUrl = `${process.env.API_URL || 'https://api.trust-agent.ai'}/schedules/${schedule.id}/calendar.ics`;

      return {
        scheduleId: schedule.id,
        nextSessionAt,
        icsUrl,
        dayOfWeek: days,
        time: input.time,
        durationMins: input.durationMins,
      };
    }),

  // ── Delete a schedule ──
  deleteSchedule: protectedProcedure
    .input(z.object({ scheduleId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const schedule = await ctx.prisma.sessionSchedule.findFirst({
        where: { id: input.scheduleId, userId: ctx.user.id },
      });
      if (!schedule) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Schedule not found' });
      }

      await ctx.prisma.sessionSchedule.delete({
        where: { id: input.scheduleId },
      });

      return { deleted: true };
    }),

  // ── Get my schedules ──
  getMySchedules: protectedProcedure
    .input(z.object({ hireId: z.string().optional() }))
    .query(async ({ input, ctx }) => {
      const where: Record<string, unknown> = { userId: ctx.user.id };
      if (input.hireId) where.hireId = input.hireId;

      const schedules = await ctx.prisma.sessionSchedule.findMany({
        where,
        include: {
          hire: {
            select: { id: true, role: { select: { name: true, companionName: true } } },
          },
        },
        orderBy: { nextSessionAt: 'asc' },
      });

      return schedules.map((s) => ({
        id: s.id,
        hireId: s.hireId,
        roleName: s.hire.role.name,
        companionName: s.hire.role.companionName,
        dayOfWeek: s.dayOfWeek,
        timeOfDay: s.timeOfDay,
        durationMins: s.durationMins,
        timezone: s.timezone,
        isActive: s.isActive,
        nextSessionAt: s.nextSessionAt,
        icsUrl: `${process.env.API_URL || 'https://api.trust-agent.ai'}/schedules/${s.id}/calendar.ics`,
      }));
    }),

  // ── Toggle schedule active/inactive ──
  toggleSchedule: protectedProcedure
    .input(z.object({ scheduleId: z.string(), isActive: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      const schedule = await ctx.prisma.sessionSchedule.findFirst({
        where: { id: input.scheduleId, userId: ctx.user.id },
      });
      if (!schedule) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Schedule not found' });
      }

      const updated = await ctx.prisma.sessionSchedule.update({
        where: { id: input.scheduleId },
        data: { isActive: input.isActive },
      });

      return { id: updated.id, isActive: updated.isActive };
    }),

  // ── Generate ICS file content ──
  generateICS: protectedProcedure
    .input(z.object({ scheduleId: z.string() }))
    .query(async ({ input, ctx }) => {
      const schedule = await ctx.prisma.sessionSchedule.findFirst({
        where: { id: input.scheduleId, userId: ctx.user.id },
        include: { hire: { include: { role: true } } },
      });
      if (!schedule) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Schedule not found' });
      }

      const icsContent = generateICSContent({
        id: schedule.id,
        dayOfWeek: schedule.dayOfWeek,
        timeOfDay: schedule.timeOfDay,
        durationMins: schedule.durationMins,
        timezone: schedule.timezone,
        roleName: schedule.hire.role.name,
      });

      return {
        content: icsContent,
        contentType: 'text/calendar',
        fileName: `trust-agent-${schedule.hire.role.name.toLowerCase().replace(/\s+/g, '-')}.ics`,
      };
    }),
});

// ── BullMQ schedule checker (runs as cron job) ────────────────────────────
// Called from a separate worker process or cron schedule

export async function checkSchedulesAndNotify(prisma: typeof import('../lib/prisma').prisma): Promise<number> {
  const now = new Date();
  const reminderWindow = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes from now

  // Find schedules where nextSessionAt is within the next 10 minutes
  const dueSchedules = await prisma.sessionSchedule.findMany({
    where: {
      isActive: true,
      nextSessionAt: {
        gte: now,
        lte: reminderWindow,
      },
    },
    include: {
      hire: { include: { role: true } },
      user: { select: { id: true, name: true, email: true } },
    },
  });

  let notificationCount = 0;

  for (const schedule of dueSchedules) {
    // Create SESSION_REMINDER notification
    await addNotificationJob({
      type: 'session_reminder',
      userId: schedule.userId,
      title: `Session starting soon`,
      body: `Your session with ${schedule.hire.role.companionName} starts in 10 minutes.`,
      data: {
        hireId: schedule.hireId,
        scheduleId: schedule.id,
        startTime: schedule.nextSessionAt.toISOString(),
      },
      priority: 'high',
    });
    notificationCount++;

    // Advance nextSessionAt to next week's occurrence
    const [hours, minutes] = schedule.timeOfDay.split(':').map(Number);
    const nextSessionAt = getNextOccurrence(schedule.dayOfWeek, hours, minutes, schedule.timezone);
    // Make sure it's in the future (at least 1 day out)
    if (nextSessionAt <= now) {
      nextSessionAt.setDate(nextSessionAt.getDate() + 7);
    }

    await prisma.sessionSchedule.update({
      where: { id: schedule.id },
      data: { nextSessionAt },
    });
  }

  return notificationCount;
}
