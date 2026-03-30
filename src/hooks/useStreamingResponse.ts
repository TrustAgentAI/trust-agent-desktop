/**
 * Phase 10.2 - Typing Latency Optimization
 * Shows typing indicator immediately on send.
 * Streams response tokens as they arrive via WebSocket.
 * Target: first token visible within 500ms of send.
 */
import { useRef, useCallback, useState } from 'react';
import { wsClient } from '@/lib/ws';

export interface StreamingState {
  /** True from the moment user sends until response is fully received */
  isStreaming: boolean;
  /** True before any tokens arrive - shows typing dots */
  isWaitingForFirstToken: boolean;
  /** Accumulated streamed content so far */
  streamedContent: string;
  /** Start streaming - call immediately on user send */
  startStreaming: () => void;
  /** Append a token to the streamed content */
  appendToken: (token: string) => void;
  /** Mark streaming as complete */
  finishStreaming: () => string;
  /** Reset streaming state */
  resetStreaming: () => void;
}

export function useStreamingResponse(): StreamingState {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isWaitingForFirstToken, setIsWaitingForFirstToken] = useState(false);
  const [streamedContent, setStreamedContent] = useState('');
  const contentRef = useRef('');
  const startTimeRef = useRef<number>(0);

  const startStreaming = useCallback(() => {
    setIsStreaming(true);
    setIsWaitingForFirstToken(true);
    setStreamedContent('');
    contentRef.current = '';
    startTimeRef.current = Date.now();
  }, []);

  const appendToken = useCallback((token: string) => {
    if (isWaitingForFirstToken || contentRef.current === '') {
      setIsWaitingForFirstToken(false);
      const latency = Date.now() - startTimeRef.current;
      if (latency > 500) {
        console.warn(`[StreamingResponse] First token latency: ${latency}ms (target: 500ms)`);
      }
    }
    contentRef.current += token;
    setStreamedContent(contentRef.current);
  }, [isWaitingForFirstToken]);

  const finishStreaming = useCallback((): string => {
    const finalContent = contentRef.current;
    setIsStreaming(false);
    setIsWaitingForFirstToken(false);
    return finalContent;
  }, []);

  const resetStreaming = useCallback(() => {
    setIsStreaming(false);
    setIsWaitingForFirstToken(false);
    setStreamedContent('');
    contentRef.current = '';
  }, []);

  return {
    isStreaming,
    isWaitingForFirstToken,
    streamedContent,
    startStreaming,
    appendToken,
    finishStreaming,
    resetStreaming,
  };
}

/**
 * Setup WebSocket token streaming listeners.
 * Call once when session component mounts.
 * Returns cleanup function.
 */
export function setupTokenStreaming(
  onToken: (token: string) => void,
  onDone: (fullContent: string) => void,
): () => void {
  const tokenHandler = (data: { token: string }) => {
    onToken(data.token);
  };

  const doneHandler = (data: { content: string }) => {
    onDone(data.content);
  };

  wsClient.on('agent:token', tokenHandler);
  wsClient.on('agent:done', doneHandler);

  return () => {
    wsClient.off('agent:token', tokenHandler);
    wsClient.off('agent:done', doneHandler);
  };
}
