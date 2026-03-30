/**
 * generateFirstMessage.ts - The Aha Moment
 *
 * Generates the personalised first message a companion sends when a new hire
 * starts their first session. This message proves the companion REMEMBERS
 * the user from their onboarding quiz.
 *
 * Not "how can I help you today" but:
 * "You mentioned you're preparing for your GCSE Maths exam. Your exam is in
 *  6 weeks. Shall we start with the topic you're least confident in?"
 */

export interface QuizAnswers {
  goal: string;                  // 'education'|'health'|'language'|'career'|'life-navigation'|'companionship'
  audience: string;              // 'individual'|'child'|'family'|'enterprise'
  level: string;                 // 'beginner'|'intermediate'|'advanced'
  // Enhanced fields for deeper personalisation
  subject?: string;              // 'maths'|'english'|'biology' etc
  qualLevel?: string;            // 'gcse'|'alevel'|'degree'|'professional'
  examDate?: string;             // ISO date string
  availableTime?: string;        // '15'|'30'|'60' (minutes per day)
  learningStyle?: string;        // 'structured'|'conversational'|'visual'|'practical'
  biggestChallenge?: string;     // Free text
  companionGender?: string;      // 'female'|'male'|'no_preference'
  interviewDate?: string;        // For career category
  wellbeingConcern?: string;     // For health category
  userName?: string;             // User's first name
}

interface RoleInfo {
  name: string;
  companionName: string;
  category: string;
}

function daysBetween(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function generateFirstMessage(
  role: RoleInfo,
  answers: QuizAnswers,
  companionName?: string,
): string {
  const name = companionName || role.companionName || role.name;
  const userName = answers.userName;
  const greeting = userName ? `Hi ${userName}!` : 'Hi!';
  const context: string[] = [];

  // Build context from quiz answers - the more specific, the stronger the Aha Moment
  if (answers.examDate) {
    const days = daysBetween(answers.examDate);
    if (days > 0) {
      context.push(
        answers.subject
          ? `your ${answers.subject.toUpperCase()} ${answers.qualLevel?.toUpperCase() ?? 'exam'} is in ${days} days`
          : `your exam is in ${days} days`
      );
    }
  }

  if (answers.biggestChallenge) {
    context.push(`you find ${answers.biggestChallenge} most challenging`);
  }

  if (answers.availableTime) {
    context.push(`you have about ${answers.availableTime} minutes a day`);
  }

  if (answers.interviewDate) {
    const days = daysBetween(answers.interviewDate);
    if (days > 0) context.push(`your interview is in ${days} days`);
  }

  if (answers.learningStyle) {
    const styleDescriptions: Record<string, string> = {
      structured: 'you prefer a structured approach',
      conversational: 'you learn best through conversation',
      visual: 'you respond well to visual explanations',
      practical: 'you learn by doing',
    };
    const styleDesc = styleDescriptions[answers.learningStyle];
    if (styleDesc) context.push(styleDesc);
  }

  const contextStr = context.join(', and ');

  // Level context
  const levelContext = answers.level === 'beginner'
    ? "We'll take things at a comfortable pace."
    : answers.level === 'advanced'
      ? "I can see you already have experience - we'll build on what you know."
      : '';

  // Category-specific opening voices - each must feel human and personal
  const goal = answers.goal || role.category;

  if (goal === 'education' || goal === 'tutoring') {
    if (context.length > 0) {
      return `${greeting} I'm ${name}. I know ${contextStr}. ${levelContext} I'm really glad you found me - shall we start with the topic you're least confident in?`.trim();
    }
    return `${greeting} I'm ${name}, and I'm so glad you're here. I'd love to understand what you're working towards. What's the most important thing we could tackle together?`;
  }

  if (goal === 'health') {
    if (answers.wellbeingConcern) {
      return `Hello${userName ? ` ${userName}` : ''}. I'm ${name}. I understand you've been dealing with ${answers.wellbeingConcern}. There's no rush here - we go at whatever pace feels right for you. How are you feeling today, genuinely?`;
    }
    if (context.length > 0) {
      return `Hello${userName ? ` ${userName}` : ''}. I'm ${name}. I understand ${contextStr}. There's no rush here - we go at whatever pace feels right for you. How are you feeling today, genuinely?`;
    }
    return `Hello${userName ? ` ${userName}` : ''}. I'm ${name}. I'm really glad you reached out. There's no judgement here, no agenda - just me, ready to listen. How are you doing?`;
  }

  if (goal === 'language') {
    if (context.length > 0) {
      return `Hello! I'm ${name}. I can see ${contextStr}. I love that you're carving out time for this. Shall we dive in, or would you like to tell me what got you started?`;
    }
    return `Hello! I'm ${name}. Learning a new language is such a brilliant thing to do. What's drawing you to it?`;
  }

  if (goal === 'companionship' || goal === 'daily') {
    return `Hello${userName ? `, ${userName}` : ', dear'}. I'm ${name}, and it's wonderful to meet you. I'm here whenever you'd like a chat - about anything at all. How has your day been?`;
  }

  if (goal === 'career' || goal === 'professional') {
    if (context.length > 0) {
      return `${greeting.replace('!', '.')} I'm ${name}. I know ${contextStr}. Let's be honest about what's holding you back and work through it properly. What's the real situation?`;
    }
    return `${greeting.replace('!', '.')} I'm ${name}. I want to help you get where you want to be. What's the next move - and what's making it harder than it should be?`;
  }

  if (goal === 'life-navigation') {
    if (context.length > 0) {
      return `${greeting} I'm ${name}. I've noted ${contextStr}. No fluff - tell me what's the most pressing thing you're dealing with right now.`;
    }
    return `${greeting} I'm ${name}. Tell me what's on your mind - and what's actually standing in your way.`;
  }

  // Children's companion
  if (answers.audience === 'child') {
    return `Hi there${userName ? ` ${userName}` : ''}! I'm ${name} and I'm SO excited to learn with you! Are you ready to start? I think we're going to have an amazing time together!`;
  }

  // Default fallback - still personalised if we have context
  if (context.length > 0) {
    return `${greeting} I'm ${name}. I know ${contextStr}. I'm here to help - what would you like to focus on first?`;
  }

  return `${greeting} I'm ${name}, and I'm really glad you're here. What would you like to work on together?`;
}
