/**
 * LLM Provider Router
 * Routes to OpenAI (GPT-4o-mini) for consumer roles.
 * Routes to customer's own LLM keys for B2B roles.
 * Supports Anthropic (Claude) and OpenAI with streaming and token counting.
 *
 * Trust Agent NEVER pays for B2B inference - customers provide their own keys.
 */

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import type { Response } from 'express';

export type LLMProvider = 'openai' | 'anthropic';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMRoutingConfig {
  provider: LLMProvider;
  apiKey: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
}

export interface LLMResponse {
  content: string;
  inputTokens: number;
  outputTokens: number;
  model: string;
  provider: LLMProvider;
  latencyMs: number;
}

/**
 * Get the default consumer LLM config (Trust Agent pays).
 * Uses GPT-4o-mini for cost-optimised consumer companion roles.
 */
export function getConsumerConfig(): LLMRoutingConfig {
  return {
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY!,
    model: 'gpt-4o-mini',
    maxTokens: 2048,
    temperature: 0.7,
  };
}

/**
 * Build an LLM routing config from enterprise customer's keys.
 * B2B customers provide their own API keys - Trust Agent pays nothing.
 */
export function getB2BConfig(
  customerApiKey: string,
  provider: LLMProvider = 'openai',
  model?: string
): LLMRoutingConfig {
  const defaults: Record<LLMProvider, string> = {
    openai: 'gpt-4o',
    anthropic: 'claude-sonnet-4-20250514',
  };

  return {
    provider,
    apiKey: customerApiKey,
    model: model || defaults[provider],
    maxTokens: 4096,
    temperature: 0.7,
  };
}

/**
 * Send a non-streaming request to the configured LLM provider.
 * Returns the complete response with token counts.
 */
export async function invokeLLM(
  config: LLMRoutingConfig,
  messages: LLMMessage[]
): Promise<LLMResponse> {
  const start = Date.now();

  if (config.provider === 'openai') {
    return invokeOpenAI(config, messages, start);
  }

  if (config.provider === 'anthropic') {
    return invokeAnthropic(config, messages, start);
  }

  throw new Error(`Unsupported LLM provider: ${config.provider}`);
}

/**
 * Stream a response from the configured LLM provider via SSE.
 * Writes directly to the Express response object.
 */
export async function streamLLM(
  config: LLMRoutingConfig,
  messages: LLMMessage[],
  res: Response
): Promise<{ inputTokens: number; outputTokens: number }> {
  if (config.provider === 'openai') {
    return streamOpenAI(config, messages, res);
  }

  if (config.provider === 'anthropic') {
    return streamAnthropic(config, messages, res);
  }

  throw new Error(`Unsupported LLM provider: ${config.provider}`);
}

/**
 * Estimate token count for a string.
 * Rough approximation: ~4 characters per token for English text.
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// ---------------------------------------------------------------------------
// OpenAI implementation
// ---------------------------------------------------------------------------

async function invokeOpenAI(
  config: LLMRoutingConfig,
  messages: LLMMessage[],
  start: number
): Promise<LLMResponse> {
  const client = new OpenAI({ apiKey: config.apiKey });

  const response = await client.chat.completions.create({
    model: config.model,
    messages: messages.map((m) => ({
      role: m.role as 'system' | 'user' | 'assistant',
      content: m.content,
    })),
    max_tokens: config.maxTokens,
    temperature: config.temperature,
  });

  const choice = response.choices[0];

  return {
    content: choice?.message?.content ?? '',
    inputTokens: response.usage?.prompt_tokens ?? 0,
    outputTokens: response.usage?.completion_tokens ?? 0,
    model: config.model,
    provider: 'openai',
    latencyMs: Date.now() - start,
  };
}

async function streamOpenAI(
  config: LLMRoutingConfig,
  messages: LLMMessage[],
  res: Response
): Promise<{ inputTokens: number; outputTokens: number }> {
  const client = new OpenAI({ apiKey: config.apiKey });

  const stream = await client.chat.completions.create({
    model: config.model,
    messages: messages.map((m) => ({
      role: m.role as 'system' | 'user' | 'assistant',
      content: m.content,
    })),
    max_tokens: config.maxTokens,
    temperature: config.temperature,
    stream: true,
    stream_options: { include_usage: true },
  });

  let inputTokens = 0;
  let outputTokens = 0;

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) {
      res.write(`data: ${JSON.stringify({ type: 'content', content: delta })}\n\n`);
    }

    if (chunk.usage) {
      inputTokens = chunk.usage.prompt_tokens ?? 0;
      outputTokens = chunk.usage.completion_tokens ?? 0;
    }
  }

  res.write(`data: ${JSON.stringify({ type: 'done', inputTokens, outputTokens })}\n\n`);

  return { inputTokens, outputTokens };
}

// ---------------------------------------------------------------------------
// Anthropic implementation
// ---------------------------------------------------------------------------

async function invokeAnthropic(
  config: LLMRoutingConfig,
  messages: LLMMessage[],
  start: number
): Promise<LLMResponse> {
  const client = new Anthropic({ apiKey: config.apiKey });

  // Anthropic separates system prompt from messages
  const systemMessage = messages.find((m) => m.role === 'system');
  const chatMessages = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

  const response = await client.messages.create({
    model: config.model,
    max_tokens: config.maxTokens ?? 4096,
    system: systemMessage?.content ?? '',
    messages: chatMessages,
    temperature: config.temperature,
  });

  const textBlock = response.content.find((b) => b.type === 'text');

  return {
    content: textBlock?.text ?? '',
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    model: config.model,
    provider: 'anthropic',
    latencyMs: Date.now() - start,
  };
}

async function streamAnthropic(
  config: LLMRoutingConfig,
  messages: LLMMessage[],
  res: Response
): Promise<{ inputTokens: number; outputTokens: number }> {
  const client = new Anthropic({ apiKey: config.apiKey });

  const systemMessage = messages.find((m) => m.role === 'system');
  const chatMessages = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

  let inputTokens = 0;
  let outputTokens = 0;

  const stream = client.messages.stream({
    model: config.model,
    max_tokens: config.maxTokens ?? 4096,
    system: systemMessage?.content ?? '',
    messages: chatMessages,
    temperature: config.temperature,
  });

  stream.on('text', (text) => {
    res.write(`data: ${JSON.stringify({ type: 'content', content: text })}\n\n`);
  });

  const finalMessage = await stream.finalMessage();
  inputTokens = finalMessage.usage.input_tokens;
  outputTokens = finalMessage.usage.output_tokens;

  res.write(`data: ${JSON.stringify({ type: 'done', inputTokens, outputTokens })}\n\n`);

  return { inputTokens, outputTokens };
}
