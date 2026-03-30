/**
 * generateMemoryNote.ts - The Visible Brain
 *
 * After every session, the companion creates a structured memory entry
 * visible to the user. This is the relationship journal - proof that
 * the companion remembers and cares.
 */

import { prisma } from '../prisma';

export interface SessionMetadata {
  sessionId: string;
  durationMinutes: number;
  topicsCovered: string[];
  correctAnswers?: number;
  totalQuestions?: number;
  struggledWith?: string[];
  breakthrough?: string;
  nextFocus?: string;
  examDate?: string;
  examSubject?: string;
  sessionMode: string;
  examScore?: number;
  previousExamScore?: number;
}

export type BrainEntryType =
  | 'SESSION_NOTE'
  | 'TOPIC_MASTERED'
  | 'STRUGGLE_NOTED'
  | 'EMOTIONAL_MOMENT'
  | 'GOAL_SET'
  | 'BREAKTHROUGH'
  | 'PREFERENCE_LEARNED';

function daysBetween(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export async function generateMemoryNote(
  hireId: string,
  metadata: SessionMetadata,
): Promise<void> {
  const hire = await prisma.hire.findUniqueOrThrow({
    where: { id: hireId },
    include: {
      role: { select: { companionName: true, category: true } },
      user: { select: { name: true } },
      memory: true,
    },
  });

  const userName = hire.user.name?.split(' ')[0] ?? 'You';
  const parts: string[] = [];
  const entries: Array<{ entryType: BrainEntryType; content: string }> = [];

  // Build human-readable memory note in companion voice
  if (metadata.topicsCovered.length > 0) {
    parts.push(`${userName} worked through ${metadata.topicsCovered.join(', ')}`);
  }

  if (metadata.correctAnswers !== undefined && metadata.totalQuestions !== undefined) {
    const pct = Math.round((metadata.correctAnswers / metadata.totalQuestions) * 100);
    parts.push(`${metadata.correctAnswers} of ${metadata.totalQuestions} correct (${pct}%)`);

    // Check for topic mastery
    if (pct >= 90 && metadata.topicsCovered.length > 0) {
      entries.push({
        entryType: 'TOPIC_MASTERED',
        content: `${userName} demonstrated strong mastery of ${metadata.topicsCovered.join(', ')} with ${pct}% accuracy.`,
      });
    }
  }

  if (metadata.breakthrough) {
    parts.push(`breakthrough: ${metadata.breakthrough}`);
    entries.push({
      entryType: 'BREAKTHROUGH',
      content: `${userName} had a breakthrough: ${metadata.breakthrough}`,
    });
  }

  if (metadata.struggledWith && metadata.struggledWith.length > 0) {
    parts.push(`still hesitating on ${metadata.struggledWith.join(' and ')} - worth returning to`);
    entries.push({
      entryType: 'STRUGGLE_NOTED',
      content: `${userName} found ${metadata.struggledWith.join(' and ')} challenging. Plan to revisit these next session.`,
    });
  }

  if (metadata.examDate) {
    const daysLeft = daysBetween(metadata.examDate);
    if (daysLeft > 0) {
      parts.push(
        metadata.examSubject
          ? `${metadata.examSubject} exam is ${daysLeft} days away`
          : `exam is ${daysLeft} days away`
      );
    }
  }

  // Exam score improvement tracking
  if (metadata.examScore !== undefined && metadata.previousExamScore !== undefined) {
    const improvement = metadata.examScore - metadata.previousExamScore;
    if (improvement > 0) {
      entries.push({
        entryType: 'BREAKTHROUGH',
        content: `${userName}'s exam score improved by ${improvement} points (${metadata.previousExamScore} to ${metadata.examScore}).`,
      });
    }
  }

  if (metadata.nextFocus) {
    entries.push({
      entryType: 'GOAL_SET',
      content: `Next session focus: ${metadata.nextFocus}`,
    });
  }

  const content = parts.length > 0
    ? parts.join('. ') + '.'
    : `Session completed (${metadata.durationMinutes} min).`;

  // Create the main session note
  await prisma.brainMemoryEntry.create({
    data: {
      hireId,
      sessionId: metadata.sessionId,
      entryType: 'SESSION_NOTE',
      content,
      topicsCovered: metadata.topicsCovered,
      nextFocus: metadata.nextFocus ?? metadata.struggledWith?.[0] ?? null,
      correctRate: metadata.totalQuestions
        ? (metadata.correctAnswers ?? 0) / metadata.totalQuestions
        : null,
      breakthrough: metadata.breakthrough ?? null,
    },
  });

  // Create additional typed entries (breakthroughs, struggles, mastery)
  for (const entry of entries) {
    await prisma.brainMemoryEntry.create({
      data: {
        hireId,
        sessionId: metadata.sessionId,
        entryType: entry.entryType,
        content: entry.content,
        topicsCovered: metadata.topicsCovered,
      },
    });
  }

  // Update SessionMemory with last session summary
  const existingMemory = hire.memory;
  if (existingMemory) {
    await prisma.sessionMemory.update({
      where: { hireId },
      data: {
        memorySummary: {
          ...(existingMemory.memorySummary as object ?? {}),
          lastSessionSummary: content,
          nextSessionFocus: metadata.nextFocus ?? metadata.struggledWith?.[0] ?? null,
        },
        lastUpdated: new Date(),
      },
    });
  }
}
