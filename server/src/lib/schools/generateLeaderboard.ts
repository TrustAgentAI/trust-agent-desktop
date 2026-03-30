/**
 * generateLeaderboard.ts - Phase 9: School Leaderboard
 * Students see their position. No names. Just streaks.
 * Anonymised, weekly, streak-based.
 */

import { prisma } from '../prisma';

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfWeek(date: Date): Date {
  const d = startOfWeek(date);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}

export async function generateSchoolLeaderboard(schoolId: string): Promise<void> {
  const enrolments = await prisma.studentEnrolment.findMany({
    where: { schoolLicenceId: schoolId, isActive: true },
    include: {
      student: {
        include: {
          hires: {
            where: { status: 'ACTIVE' },
            orderBy: { streakDays: 'desc' },
            take: 1,
            select: {
              streakDays: true,
              role: { select: { category: true, emoji: true } },
            },
          },
        },
      },
    },
  });

  // Build anonymised entries - no names, no IDs, just rank + streak + subject
  const entries = enrolments
    .map(e => ({
      streakDays: e.student.hires[0]?.streakDays ?? 0,
      subjectEmoji: e.student.hires[0]?.role.emoji ?? '',
      category: e.student.hires[0]?.role.category ?? 'education',
    }))
    .sort((a, b) => b.streakDays - a.streakDays)
    .map((e, i) => ({
      rank: i + 1,
      streakDays: e.streakDays,
      subjectEmoji: e.subjectEmoji,
      // anonymousId is deterministic but NOT linkable to user
      anonymousId: `student_${i + 1}`,
    }));

  const periodStart = startOfWeek(new Date());
  const periodEnd = endOfWeek(new Date());

  await prisma.schoolLeaderboard.upsert({
    where: {
      schoolId_periodStart: { schoolId, periodStart },
    },
    create: {
      schoolId,
      periodStart,
      periodEnd,
      entries: entries as object,
    },
    update: {
      entries: entries as object,
      generatedAt: new Date(),
    },
  });

  console.log(`School leaderboard generated for ${schoolId}: ${entries.length} entries`);
}
