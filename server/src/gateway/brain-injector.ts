/**
 * Brain Context Injector
 * Loads CompanyBrain for enterprise users and builds context injection (~1500-2000 tokens).
 * Brain data NEVER touches Trust Agent servers beyond this in-memory assembly.
 */

import type { CompanyBrain } from '@prisma/client';

export interface BrainContext {
  staticContext: string;
  tokenEstimate: number;
}

/**
 * Build static Company Brain context for injection into the system prompt.
 * This assembles ~1500-2000 tokens of company context that gets prepended
 * to the role system prompt on every B2B invocation.
 */
export function buildStaticContext(brain: CompanyBrain): BrainContext {
  const sections: string[] = [];

  // Company identity
  sections.push(`Company: ${brain.companyName}`);
  if (brain.companyDescription) {
    sections.push(`About: ${brain.companyDescription}`);
  }
  if (brain.industry) {
    sections.push(`Industry: ${brain.industry}`);
  }
  if (brain.companySize) {
    sections.push(`Size: ${brain.companySize}`);
  }

  // Strategic context
  if (brain.currentOKRs) {
    sections.push(`Current OKRs:\n${brain.currentOKRs}`);
  }

  // Brand and communication
  if (brain.brandVoice) {
    sections.push(`Brand Voice Guidelines:\n${brain.brandVoice}`);
  }

  // Market context
  if (brain.targetCustomers) {
    sections.push(`Target Customers:\n${brain.targetCustomers}`);
  }
  if (brain.topCompetitors) {
    sections.push(`Key Competitors:\n${brain.topCompetitors}`);
  }

  // People
  if (brain.keyPeople) {
    sections.push(`Key People:\n${brain.keyPeople}`);
  }

  // Guardrails
  if (brain.topicsToAvoid) {
    sections.push(`Topics to Avoid:\n${brain.topicsToAvoid}`);
  }

  const staticContext = sections.join('\n\n');
  // Rough token estimate: ~4 chars per token
  const tokenEstimate = Math.ceil(staticContext.length / 4);

  return { staticContext, tokenEstimate };
}

/**
 * Build the full context injection block for the system prompt.
 * Returns the formatted context string ready for injection.
 */
export function formatBrainInjection(brainContext: BrainContext): string {
  if (!brainContext.staticContext) return '';
  return `\n\n[COMPANY CONTEXT]\n${brainContext.staticContext}`;
}
