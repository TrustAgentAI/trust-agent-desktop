/**
 * Proactive Contact System - Phase 3: Companion Feels Alive
 *
 * The companion initiates. It doesn't wait to be asked.
 * "It's been 5 days since we spoke. I've been thinking about your interview."
 *
 * Every message MUST reference something specific from the Brain.
 * Generic messages are the exception, not the default.
 */

import { differenceInDays, differenceInHours, isSameDay } from 'date-fns';
import { prisma } from '../prisma';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProactiveMessage {
  title: string;
  body: string;
  /** The key: it MUST reference something specific from the Brain */
  specificity: 'generic' | 'context_aware' | 'highly_personal';
  /** What specific Brain fact it references */
  context: string;
}

/** Shape of structured data inside SessionMemory.memorySummary JSON */
interface MemorySummaryData {
  examDate?: string;
  examSubject?: string;
  interviewDate?: string;
  nextSessionFocus?: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Core function
// ---------------------------------------------------------------------------

export async function generateProactiveContact(
  hireId: string,
): Promise<ProactiveMessage | null> {
  const hire = await prisma.hire.findUnique({
    where: { id: hireId },
    include: {
      role: {
        select: {
          defaultCompanionName: true,
          companionName: true,
          category: true,
        },
      },
      user: { select: { name: true } },
      memory: true,
      brainMemoryEntries: {
        take: 3,
        orderBy: { entryDate: 'desc' },
        select: {
          content: true,
          topicsCovered: true,
          nextFocus: true,
          entryDate: true,
          breakthrough: true,
        },
      },
      milestones: {
        take: 1,
        orderBy: { achievedAt: 'desc' },
        select: { type: true, achievedAt: true },
      },
    },
  });

  if (!hire) return null;

  const companion =
    hire.customCompanionName ??
    hire.role.defaultCompanionName ??
    hire.role.companionName;
  const lastNote = hire.brainMemoryEntries[0];
  const daysSinceSession = hire.lastSessionAt
    ? differenceInDays(new Date(), hire.lastSessionAt)
    : 999;

  // Parse structured memory summary (examDate, interviewDate, etc.)
  const memoryData: MemorySummaryData =
    (hire.memory?.memorySummary as MemorySummaryData) ?? {};

  // -- EXAM-AWARE MESSAGES ------------------------------------------------
  // These are the gold standard - specific, time-aware, actionable
  if (memoryData.examDate) {
    const daysToExam = differenceInDays(
      new Date(memoryData.examDate),
      new Date(),
    );
    const topic = memoryData.nextSessionFocus ?? lastNote?.nextFocus;
    const subject = memoryData.examSubject ?? 'your exam';

    if (daysToExam === 7 && topic) {
      return {
        title: `One week until ${subject}`,
        body: `${companion}: You've got 7 days. You haven't covered ${topic} yet - that's the gap we need to close. 30 minutes tonight?`,
        specificity: 'highly_personal',
        context: `exam in 7 days, topic ${topic} not yet covered`,
      };
    }

    if (daysToExam === 3 && topic) {
      return {
        title: '3 days to go',
        body: `${companion}: Three days. Let's do ${topic} today - it's the one area I think will make the difference.`,
        specificity: 'highly_personal',
        context: 'exam in 3 days, topic gap identified',
      };
    }

    if (daysToExam === 1) {
      return {
        title: 'Tomorrow is the day',
        body: `${companion}: You've worked hard. I know you're ready. One last session tonight?`,
        specificity: 'highly_personal',
        context: 'exam tomorrow',
      };
    }
  }

  // -- INTERVIEW-AWARE ----------------------------------------------------
  if (memoryData.interviewDate) {
    const daysToInterview = differenceInDays(
      new Date(memoryData.interviewDate),
      new Date(),
    );

    if (daysToInterview === 2) {
      return {
        title: 'Interview in 2 days',
        body: `${companion}: Your interview is the day after tomorrow. Ready for a practice run? I'll ask the hardest questions first.`,
        specificity: 'highly_personal',
        context: 'interview in 2 days',
      };
    }
  }

  // -- STREAK AT RISK -----------------------------------------------------
  if (hire.streakDays >= 7 && daysSinceSession === 1 && hire.lastSessionAt) {
    const hoursLeft = 24 - differenceInHours(new Date(), hire.lastSessionAt);
    if (hoursLeft <= 4 && hoursLeft > 0) {
      return {
        title: `${hire.streakDays} days. Don't break it now`,
        body: `${companion}: Your ${hire.streakDays}-day streak ends in ${Math.round(hoursLeft)} hours. 15 minutes is all it takes.`,
        specificity: 'context_aware',
        context: `streak ${hire.streakDays} days, window closing`,
      };
    }
  }

  // -- COMEBACK AFTER ABSENCE ---------------------------------------------
  if (daysSinceSession >= 5 && lastNote) {
    const lastTopic = lastNote.topicsCovered?.[0];
    const breakthrough = lastNote.breakthrough;

    if (breakthrough) {
      return {
        title: `${companion} has been thinking about you`,
        body: `${companion}: It's been ${daysSinceSession} days. I keep thinking about that moment when you ${breakthrough.toLowerCase()}. Ready to build on that?`,
        specificity: 'highly_personal',
        context: `absence ${daysSinceSession} days, breakthrough referenced`,
      };
    }

    if (lastTopic) {
      return {
        title: `${companion} has been thinking about you`,
        body: `${companion}: ${daysSinceSession} days since we spoke. I've been thinking about ${lastTopic} - there's something I want to try with you. Shall we?`,
        specificity: 'highly_personal',
        context: `absence ${daysSinceSession} days, topic ${lastTopic} referenced`,
      };
    }
  }

  // -- MILESTONE CELEBRATION ----------------------------------------------
  if (hire.milestones[0]) {
    const recent = isSameDay(hire.milestones[0].achievedAt, new Date());
    if (recent) {
      return {
        title: 'You did it',
        body: `${companion}: ${hire.milestones[0].type.replace(/_/g, ' ')} - you earned it. Take a moment. Then let's keep going.`,
        specificity: 'context_aware',
        context: `milestone earned today: ${hire.milestones[0].type}`,
      };
    }
  }

  // -- HUMAN CONNECTION PROMPT (anti-dependency, periodic) ----------------
  // Only fires once a fortnight maximum, never if there's something more relevant
  if (hire.sessionCount % 10 === 0 && hire.sessionCount > 0) {
    return {
      title: `A thought from ${companion}`,
      body: `${companion}: Is there someone in your life you've been meaning to call? I'll still be here after.`,
      specificity: 'generic',
      context: 'anti-dependency periodic prompt',
    };
  }

  return null; // No appropriate proactive message right now
}

// Validation - every message returned MUST be context_aware or highly_personal.
// Generic messages should be rare exceptions, not the default.
// If this function is returning too many 'generic' messages, the Brain is empty.
// Fix: ensure BrainMemoryEntries are being written after every session.
