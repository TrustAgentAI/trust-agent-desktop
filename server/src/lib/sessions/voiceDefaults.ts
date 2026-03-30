/**
 * Voice Mode Auto-Recommendation - Phase 4: Session Experience
 *
 * For elderly, daily companion, language learning: voice mode is natural.
 * The moment Patricia hears Dorothy say her name, it becomes presence.
 *
 * Categories map to default voice mode recommendations with contextual
 * prompt text that explains WHY voice mode matters for this category.
 */

// ---------------------------------------------------------------------------
// Voice default rules per category
// ---------------------------------------------------------------------------

interface VoiceDefaultRule {
  defaultMode: 'voice' | 'text' | 'voice_preferred';
  promptTitle: string;
  promptBody: string;
}

const VOICE_DEFAULT_RULES: Record<string, VoiceDefaultRule> = {
  elderly: {
    defaultMode: 'voice',
    promptTitle: 'Dorothy prefers to talk',
    promptBody:
      'Most people in conversation with Dorothy choose voice mode. It feels more natural. Would you like to try it?',
  },
  daily_companion: {
    defaultMode: 'voice',
    promptTitle: '{companionName} would love to hear your voice',
    promptBody:
      'Voice mode makes your companion feel more present. Tap to switch, or keep text if you prefer.',
  },
  language: {
    defaultMode: 'voice_preferred',
    promptTitle: 'Speaking practice is more effective',
    promptBody:
      'Language learning improves 3x faster with voice. Your companion is ready to listen.',
  },
  health: {
    defaultMode: 'text',
    promptTitle: 'How would you like to talk today?',
    promptBody:
      'Some people prefer text for sensitive conversations. Others find voice more natural. Your choice.',
  },
  education: {
    defaultMode: 'text',
    promptTitle: 'Text or voice - you choose',
    promptBody:
      'Text mode works well for studying. Switch to voice any time if you want to talk things through.',
  },
  business: {
    defaultMode: 'text',
    promptTitle: 'Ready when you are',
    promptBody:
      'Text mode is great for working through ideas. Voice is there if you want a conversation.',
  },
  mental_health: {
    defaultMode: 'text',
    promptTitle: 'Your space, your way',
    promptBody:
      'Text can feel safer for personal conversations. Voice is available whenever you are ready.',
  },
};

// ---------------------------------------------------------------------------
// Public function
// ---------------------------------------------------------------------------

export interface VoiceRecommendation {
  recommendVoice: boolean;
  promptTitle: string;
  promptBody: string;
  defaultMode: string;
}

export function getVoiceRecommendation(
  category: string,
  companionName: string,
  userHasUsedVoiceBefore: boolean,
): VoiceRecommendation {
  const rule = VOICE_DEFAULT_RULES[category];
  if (!rule) {
    return {
      recommendVoice: false,
      promptTitle: '',
      promptBody: '',
      defaultMode: 'text',
    };
  }

  return {
    recommendVoice: rule.defaultMode !== 'text',
    promptTitle: rule.promptTitle.replace('{companionName}', companionName),
    promptBody: rule.promptBody,
    defaultMode: userHasUsedVoiceBefore ? rule.defaultMode : rule.defaultMode,
  };
}

// ---------------------------------------------------------------------------
// Streaming config per category
// ---------------------------------------------------------------------------

interface StreamingConfig {
  minThinkingMs: number;
  charsPerChunk: number;
  baseDelayMs: number;
}

const STREAMING_DEFAULTS: Record<string, StreamingConfig> = {
  elderly: { minThinkingMs: 1500, charsPerChunk: 40, baseDelayMs: 80 },
  daily_companion: { minThinkingMs: 800, charsPerChunk: 60, baseDelayMs: 50 },
  language: { minThinkingMs: 1000, charsPerChunk: 50, baseDelayMs: 60 },
  health: { minThinkingMs: 1200, charsPerChunk: 50, baseDelayMs: 70 },
  education: { minThinkingMs: 1000, charsPerChunk: 60, baseDelayMs: 50 },
  business: { minThinkingMs: 800, charsPerChunk: 80, baseDelayMs: 40 },
  mental_health: { minThinkingMs: 1500, charsPerChunk: 40, baseDelayMs: 80 },
};

export function getStreamingConfig(category: string): StreamingConfig {
  return (
    STREAMING_DEFAULTS[category] ?? {
      minThinkingMs: 1000,
      charsPerChunk: 60,
      baseDelayMs: 50,
    }
  );
}
