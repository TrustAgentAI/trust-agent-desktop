/**
 * B2B Gateway Express Router
 * POST /v1/gateway/invoke - Accept role invocation from enterprise customers
 *
 * Security invariants:
 *   - systemPrompt NEVER in any response
 *   - Message content NEVER stored in DB
 *   - API key validated and hash-verified on every invocation
 *   - CompanyBrain context injected for enterprise users
 *   - HITL rules checked before responding
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { createHash, randomUUID } from 'crypto';
import { prisma } from '../lib/prisma';
import { buildStaticContext, formatBrainInjection } from './brain-injector';
import { checkHITLRules, createHITLEvent, notifyHITLTrigger } from './hitl-checker';
import {
  invokeLLM,
  streamLLM,
  getConsumerConfig,
  getB2BConfig,
  estimateTokens,
  type LLMMessage,
  type LLMProvider,
} from './llm-router';

export const gatewayRouter = Router();

// ---------------------------------------------------------------------------
// Input validation schemas
// ---------------------------------------------------------------------------

const InvokeBodySchema = z.object({
  roleSlug: z.string().min(1).max(200),
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string().min(1).max(32000),
    })
  ).min(1).max(100),
  taskDescription: z.string().max(2000).optional(),
  stream: z.boolean().optional().default(false),
  llmProvider: z.enum(['openai', 'anthropic']).optional(),
  llmModel: z.string().max(100).optional(),
  llmApiKey: z.string().max(500).optional(),
  language: z.string().min(2).max(5).optional(),
});

// ---------------------------------------------------------------------------
// Language code to name mapping (33 supported languages)
// ---------------------------------------------------------------------------

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English', es: 'Spanish', fr: 'French', de: 'German', it: 'Italian',
  pt: 'Portuguese', nl: 'Dutch', ru: 'Russian', zh: 'Chinese', ja: 'Japanese',
  ko: 'Korean', ar: 'Arabic', hi: 'Hindi', bn: 'Bengali', tr: 'Turkish',
  pl: 'Polish', uk: 'Ukrainian', sv: 'Swedish', da: 'Danish', no: 'Norwegian',
  fi: 'Finnish', el: 'Greek', cs: 'Czech', ro: 'Romanian', hu: 'Hungarian',
  th: 'Thai', vi: 'Vietnamese', id: 'Indonesian', ms: 'Malay', tl: 'Filipino',
  sw: 'Swahili', he: 'Hebrew', fa: 'Persian',
};

const LANGUAGE_TUTOR_KEYWORDS = [
  'language tutor', 'language teacher', 'language coach',
  'language instructor', 'language learning',
  'spanish tutor', 'french tutor', 'german tutor', 'italian tutor',
  'japanese tutor', 'chinese tutor', 'korean tutor', 'arabic tutor',
  'portuguese tutor', 'russian tutor', 'hindi tutor', 'english tutor',
];

/**
 * Build a language instruction to prepend to the system prompt at runtime.
 * Never persisted - injected per-request only.
 */
function buildLanguageInstruction(
  langCode: string,
  systemPrompt: string,
  roleName: string,
): string {
  if (!langCode || langCode === 'en') return '';

  const langName = LANGUAGE_NAMES[langCode] || 'English';
  const combined = (roleName + ' ' + systemPrompt).toLowerCase();

  const isTutor = LANGUAGE_TUTOR_KEYWORDS.some((kw) => combined.includes(kw));

  if (isTutor) {
    // Detect target language from role name / prompt
    let targetLang = 'the target language';
    for (const [, name] of Object.entries(LANGUAGE_NAMES)) {
      if (combined.includes(name.toLowerCase())) {
        targetLang = name;
        break;
      }
    }

    return (
      `\n\nYou are teaching ${targetLang}. Use ${langName} for explanations, ` +
      `instructions, and feedback. Use ${targetLang} for examples, exercises, ` +
      `and immersion content. Adjust the ratio based on the learner's level ` +
      `(more ${langName} at beginner, more ${targetLang} at advanced).`
    );
  }

  return (
    `\n\nIMPORTANT: The user's preferred language is ${langName}. ` +
    `Always respond in ${langName} unless the conversation specifically involves ` +
    `teaching another language. If teaching a language, use ${langName} for ` +
    `explanations and instructions while using the target language for examples ` +
    `and exercises.`
  );
}

// ---------------------------------------------------------------------------
// POST /v1/gateway/invoke
// ---------------------------------------------------------------------------

gatewayRouter.post('/invoke', async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    // ── 1. Validate API key ──────────────────────────────────────────────
    const apiKey = req.headers['x-api-key'] as string;
    if (!apiKey || !apiKey.startsWith('ta_live_')) {
      res.status(401).json({ error: 'INVALID_API_KEY', message: 'Valid API key required' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { apiKey } });
    if (!user) {
      res.status(401).json({ error: 'INVALID_API_KEY', message: 'API key not found' });
      return;
    }

    // ── 2. Validate request body ─────────────────────────────────────────
    const parseResult = InvokeBodySchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'VALIDATION_ERROR',
        issues: parseResult.error.issues.map((i) => ({
          path: i.path.join('.'),
          message: i.message,
        })),
      });
      return;
    }

    const { roleSlug, messages, taskDescription, stream, llmProvider, llmModel, llmApiKey, language } =
      parseResult.data;

    // ── 3. Check hire exists and is active ────────────────────────────────
    const hire = await prisma.hire.findFirst({
      where: {
        userId: user.id,
        role: { slug: roleSlug },
        status: 'ACTIVE',
      },
      include: {
        role: {
          include: {
            audit: true,
            skills: true,
          },
        },
      },
    });

    if (!hire) {
      res.status(404).json({
        error: 'HIRE_NOT_FOUND',
        message: 'No active hire found for this role',
      });
      return;
    }

    const role = hire.role;

    // ── 4. Verify role is audited and active ──────────────────────────────
    if (!role.audit) {
      res.status(403).json({ error: 'ROLE_NOT_AUDITED', message: 'Role has not been audited' });
      return;
    }
    if (role.audit.badge === 'REJECTED') {
      res.status(403).json({ error: 'ROLE_NOT_ACTIVE', message: 'Role badge is REJECTED' });
      return;
    }

    // ── 5. Verify SHA-256 hash - reject if mismatch ──────────────────────
    const currentHash = createHash('sha256').update(role.systemPrompt).digest('hex');
    if (currentHash !== role.systemPromptHash) {
      // Auto-suspend badge on hash mismatch
      await prisma.roleAudit.update({
        where: { roleId: role.id },
        data: { badge: 'REJECTED' },
      });
      res.status(403).json({
        error: 'ROLE_INTEGRITY_FAILED',
        message: 'System prompt hash mismatch - role suspended',
      });
      return;
    }

    // ── 6. Load enterprise policies and CompanyBrain ──────────────────────
    const enterprise = await prisma.enterpriseUser.findUnique({
      where: { userId: user.id },
      include: {
        companyBrain: {
          include: { hitlRules: true },
        },
      },
    });

    // Enterprise policy: check minimum badge tier
    if (enterprise) {
      const badgeMet = checkBadgePolicy(role.audit.badge, enterprise);
      if (!badgeMet) {
        res.status(403).json({
          error: 'BADGE_TIER_INSUFFICIENT',
          message: 'Role does not meet enterprise minimum badge requirement',
        });
        return;
      }
    }

    // ── 7. Build Company Brain context ────────────────────────────────────
    let brainInjection = '';
    if (enterprise?.companyBrain) {
      const brainContext = buildStaticContext(enterprise.companyBrain);
      brainInjection = formatBrainInjection(brainContext);
    }

    // ── 8. Build skill fragments ──────────────────────────────────────────
    let skillInjection = '';
    if (role.skills && role.skills.length > 0) {
      const fragments = role.skills.map((s) => s.fragment).filter(Boolean);
      if (fragments.length > 0) {
        skillInjection = `\n\n[SKILLS]\n${fragments.join('\n\n')}`;
      }
    }

    // ── 9. Check HITL rules before responding ─────────────────────────────
    const lastUserMessage = messages[messages.length - 1]?.content ?? '';
    const hitlResult = checkHITLRules(
      enterprise?.companyBrain?.hitlRules ?? [],
      lastUserMessage
    );

    const sessionId = randomUUID();

    if (hitlResult.triggered && hitlResult.ruleId && hitlResult.action) {
      await createHITLEvent(sessionId, hitlResult.ruleId, lastUserMessage, hitlResult.action);

      // Send notification if configured
      if (hitlResult.notifyEmail) {
        const matchedRule = enterprise?.companyBrain?.hitlRules.find(
          (r) => r.id === hitlResult.ruleId
        );
        notifyHITLTrigger(
          hitlResult.notifyEmail,
          hitlResult.action,
          matchedRule?.triggerPattern ?? 'unknown',
          sessionId
        ).catch(() => {}); // Fire and forget
      }

      if (hitlResult.action === 'block') {
        res.status(403).json({
          error: 'HITL_BLOCKED',
          message: 'Input blocked by HITL rule',
          sessionId,
        });
        return;
      }

      if (hitlResult.action === 'pause') {
        res.status(200).json({
          content: '',
          sessionId,
          hitlTriggered: true,
          hitlAction: 'pause',
          tokenCounts: { input: 0, output: 0 },
        });
        return;
      }
    }

    // ── 10. Assemble system prompt (in memory - never logged/stored) ──────
    const languageInjection = buildLanguageInstruction(
      language ?? 'en',
      role.systemPrompt,
      role.name ?? role.slug ?? '',
    );

    const assembledSystemPrompt = [
      role.systemPrompt,
      brainInjection,
      skillInjection,
      languageInjection,
    ].join('').trim();

    // ── 11. Route to appropriate LLM provider ─────────────────────────────
    const llmMessages: LLMMessage[] = [
      { role: 'system', content: assembledSystemPrompt },
      ...messages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ];

    // Determine LLM config
    const isB2B = role.roleType !== 'CONSUMER';
    let llmConfig;

    if (isB2B) {
      // B2B: customer provides their own LLM key
      const customerKey = llmApiKey || (enterprise?.companyBrain?.vectorDbApiKey ?? '');
      if (!customerKey) {
        res.status(400).json({
          error: 'LLM_KEY_REQUIRED',
          message: 'B2B roles require customer LLM API key',
        });
        return;
      }
      llmConfig = getB2BConfig(
        customerKey,
        llmProvider as LLMProvider | undefined,
        llmModel
      );
    } else {
      // Consumer: Trust Agent pays
      llmConfig = getConsumerConfig();
    }

    // ── 12. Execute LLM call ──────────────────────────────────────────────
    if (stream) {
      // SSE streaming response
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Session-Id', sessionId);
      res.flushHeaders();

      try {
        const tokenCounts = await streamLLM(llmConfig, llmMessages, res);

        // Log metadata ONLY after streaming completes - never message content
        await logInvocationMetadata({
          userId: user.id,
          roleSlug,
          sessionId,
          inputTokens: tokenCounts.inputTokens,
          outputTokens: tokenCounts.outputTokens,
          latencyMs: Date.now() - startTime,
          provider: llmConfig.provider,
          model: llmConfig.model,
          messageCount: messages.length,
          hitlTriggered: hitlResult.triggered,
        });

        res.end();
      } catch (llmError) {
        res.write(
          `data: ${JSON.stringify({ type: 'error', error: 'LLM_INVOCATION_FAILED' })}\n\n`
        );
        res.end();
      }
    } else {
      // Non-streaming JSON response
      const llmResponse = await invokeLLM(llmConfig, llmMessages);

      // Log metadata ONLY - never message content
      await logInvocationMetadata({
        userId: user.id,
        roleSlug,
        sessionId,
        inputTokens: llmResponse.inputTokens,
        outputTokens: llmResponse.outputTokens,
        latencyMs: llmResponse.latencyMs,
        provider: llmResponse.provider,
        model: llmResponse.model,
        messageCount: messages.length,
        hitlTriggered: hitlResult.triggered,
      });

      // NEVER include systemPrompt in response
      res.status(200).json({
        content: llmResponse.content,
        sessionId,
        tokenCounts: {
          input: llmResponse.inputTokens,
          output: llmResponse.outputTokens,
        },
        latencyMs: llmResponse.latencyMs,
        hitlTriggered: hitlResult.triggered || undefined,
      });
    }
  } catch (error: any) {
    const errorMap: Record<string, { status: number; message: string }> = {
      INVALID_API_KEY: { status: 401, message: 'Invalid API key' },
      HIRE_NOT_FOUND: { status: 404, message: 'No active hire found' },
      ROLE_NOT_AUDITED: { status: 403, message: 'Role not audited' },
      ROLE_NOT_ACTIVE: { status: 403, message: 'Role not active' },
      ROLE_INTEGRITY_FAILED: { status: 403, message: 'Role integrity check failed' },
      BADGE_TIER_INSUFFICIENT: { status: 403, message: 'Badge tier insufficient' },
      HITL_BLOCKED: { status: 403, message: 'Blocked by HITL rule' },
      LLM_KEY_REQUIRED: { status: 400, message: 'LLM API key required for B2B roles' },
    };

    const mapped = errorMap[error.message];
    if (mapped) {
      res.status(mapped.status).json({ error: error.message, message: mapped.message });
      return;
    }

    console.error('Gateway invoke error:', error.message);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Gateway invocation failed' });
  }
});

// ---------------------------------------------------------------------------
// Helper: Check enterprise minimum badge policy
// ---------------------------------------------------------------------------

function checkBadgePolicy(
  roleBadge: string,
  _enterprise: { companyName?: string } | null
): boolean {
  // Default: require at least BASIC badge (not REJECTED)
  const badgeHierarchy = ['PLATINUM', 'GOLD', 'SILVER', 'BASIC', 'REJECTED'];
  const roleIndex = badgeHierarchy.indexOf(roleBadge);
  // Rejected roles never pass
  return roleIndex >= 0 && roleIndex < badgeHierarchy.length - 1;
}

// ---------------------------------------------------------------------------
// Helper: Log invocation metadata (NEVER message content)
// ---------------------------------------------------------------------------

interface InvocationMetadata {
  userId: string;
  roleSlug: string;
  sessionId: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  provider: string;
  model: string;
  messageCount: number;
  hitlTriggered: boolean;
}

async function logInvocationMetadata(metadata: InvocationMetadata): Promise<void> {
  try {
    // Store in AgentSession as metadata only - never message content
    await prisma.agentSession.create({
      data: {
        id: metadata.sessionId,
        userId: metadata.userId,
        hireId: '', // Gateway sessions are stateless - use empty string
        status: 'COMPLETED',
        inputMode: 'TEXT',
        environmentSlug: 'default',
        messageCount: metadata.messageCount,
        durationSeconds: Math.ceil(metadata.latencyMs / 1000),
        startedAt: new Date(Date.now() - metadata.latencyMs),
        endedAt: new Date(),
      },
    });
  } catch {
    // Session logging is best-effort - do not fail the request
    console.error('Failed to log gateway invocation metadata');
  }
}
