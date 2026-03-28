/**
 * HITL (Human-In-The-Loop) Rule Checker
 * Evaluates input against HITLRule patterns and returns pause/block/escalate actions.
 * Creates HITLEvent records and sends notification emails if configured.
 */

import type { HITLRule } from '@prisma/client';
import { prisma } from '../lib/prisma';

export type HITLAction = 'pause' | 'block' | 'escalate';

export interface HITLCheckResult {
  triggered: boolean;
  ruleId: string | null;
  action: HITLAction | null;
  notifyEmail: string | null;
}

const NO_TRIGGER: HITLCheckResult = {
  triggered: false,
  ruleId: null,
  action: null,
  notifyEmail: null,
};

/**
 * Check input text against all HITL rules for the enterprise.
 * Rules are evaluated in order; first match wins.
 */
export function checkHITLRules(
  rules: HITLRule[],
  inputText: string
): HITLCheckResult {
  if (!rules.length || !inputText) return NO_TRIGGER;

  const normalizedInput = inputText.toLowerCase();

  for (const rule of rules) {
    const pattern = rule.triggerPattern;
    let matched = false;

    try {
      // Try as regex first
      if (pattern.startsWith('/') && pattern.lastIndexOf('/') > 0) {
        const lastSlash = pattern.lastIndexOf('/');
        const regexBody = pattern.slice(1, lastSlash);
        const flags = pattern.slice(lastSlash + 1) || 'i';
        const regex = new RegExp(regexBody, flags);
        matched = regex.test(inputText);
      } else {
        // Treat as keyword/phrase match (case-insensitive)
        matched = normalizedInput.includes(pattern.toLowerCase());
      }
    } catch {
      // If regex is invalid, fall back to keyword match
      matched = normalizedInput.includes(pattern.toLowerCase());
    }

    if (matched) {
      return {
        triggered: true,
        ruleId: rule.id,
        action: rule.action as HITLAction,
        notifyEmail: rule.notifyEmail,
      };
    }
  }

  return NO_TRIGGER;
}

/**
 * Create a HITLEvent record in the database.
 * Only stores the first 200 characters of input - never the full message.
 */
export async function createHITLEvent(
  sessionId: string,
  ruleId: string,
  inputText: string,
  action: string
): Promise<string> {
  const event = await prisma.hITLEvent.create({
    data: {
      sessionId,
      ruleId,
      inputSample: inputText.slice(0, 200), // First 200 chars only
      action,
    },
  });
  return event.id;
}

/**
 * Send notification email for HITL event if configured.
 * Uses the notification queue to send asynchronously.
 */
export async function notifyHITLTrigger(
  notifyEmail: string,
  action: string,
  rulePattern: string,
  sessionId: string
): Promise<void> {
  // Delegate to notification queue - imported lazily to avoid circular deps
  const { addNotificationJob } = await import('../queues/notification-queue');
  await addNotificationJob({
    type: 'hitl_alert',
    to: notifyEmail,
    subject: `HITL ${action.toUpperCase()} triggered`,
    body: `A HITL rule was triggered during session ${sessionId}.\nRule pattern: ${rulePattern}\nAction: ${action}\n\nPlease review in the Trust Agent dashboard.`,
  });
}
