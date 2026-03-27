// Agent session management hook
import { useCallback } from 'react';
import { useAgentStore } from '../store/agentStore';
import { useSessionStore } from '../store/sessionStore';
import { useWebSocket } from './useWebSocket';
import type { Message } from '../lib/roleConfig';

interface AgentResponsePayload {
  sessionId: string;
  messageId: string;
  content: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

interface AgentErrorPayload {
  sessionId: string;
  error: string;
  code?: string;
}

interface UseAgentReturn {
  sendMessage: (content: string) => void;
  startSession: (roleHireId: string) => Promise<void>;
  endSession: () => void;
  isConnected: boolean;
  isReconnecting: boolean;
  isAgentThinking: boolean;
  activeSession: ReturnType<typeof useAgentStore.getState>['activeSession'];
  messages: Message[];
}

export function useAgent(): UseAgentReturn {
  const activeSession = useAgentStore((s) => s.activeSession);
  const agentStartSession = useAgentStore((s) => s.startSession);
  const agentEndSession = useAgentStore((s) => s.endSession);
  const messages = useSessionStore((s) => s.messages);
  const addMessage = useSessionStore((s) => s.addMessage);
  const setThinking = useSessionStore((s) => s.setThinking);
  const isAgentThinking = useSessionStore((s) => s.isAgentThinking);
  const registerSession = useSessionStore((s) => s.registerSession);
  const setCurrentSession = useSessionStore((s) => s.setCurrentSession);
  const clearSession = useSessionStore((s) => s.clearSession);

  const handleAgentResponse = useCallback(
    (data: unknown) => {
      const payload = data as AgentResponsePayload;
      if (activeSession && payload.sessionId === activeSession.sessionId) {
        const message: Message = {
          id: payload.messageId,
          role: 'agent',
          content: payload.content,
          timestamp: payload.timestamp,
          metadata: payload.metadata,
        };
        addMessage(message);
        setThinking(false);
      }
    },
    [activeSession, addMessage, setThinking]
  );

  const handleAgentThinking = useCallback(
    (data: unknown) => {
      const payload = data as { sessionId: string };
      if (activeSession && payload.sessionId === activeSession.sessionId) {
        setThinking(true);
      }
    },
    [activeSession, setThinking]
  );

  const handleAgentError = useCallback(
    (data: unknown) => {
      const payload = data as AgentErrorPayload;
      if (activeSession && payload.sessionId === activeSession.sessionId) {
        setThinking(false);
        const errorMessage: Message = {
          id: `error-${Date.now()}`,
          role: 'agent',
          content: `Error: ${payload.error}`,
          timestamp: Date.now(),
          metadata: { isError: true, code: payload.code },
        };
        addMessage(errorMessage);
      }
    },
    [activeSession, addMessage, setThinking]
  );

  const handleSessionEnd = useCallback(
    (data: unknown) => {
      const payload = data as { sessionId: string };
      if (activeSession && payload.sessionId === activeSession.sessionId) {
        setThinking(false);
        agentEndSession();
      }
    },
    [activeSession, setThinking, agentEndSession]
  );

  const { isConnected, isReconnecting, send } = useWebSocket({
    onAgentResponse: handleAgentResponse,
    onAgentThinking: handleAgentThinking,
    onAgentError: handleAgentError,
    onSessionEnd: handleSessionEnd,
  });

  const sendMessage = useCallback(
    (content: string) => {
      if (!activeSession) {
        console.error('No active session');
        return;
      }

      const message: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        content,
        timestamp: Date.now(),
      };
      addMessage(message);

      send('user-message', {
        sessionId: activeSession.sessionId,
        content,
      });
    },
    [activeSession, addMessage, send]
  );

  const startSession = useCallback(
    async (roleHireId: string) => {
      try {
        const session = await agentStartSession(roleHireId);
        registerSession(session);
        setCurrentSession(session.sessionId);
        send('start-session', { sessionId: session.sessionId });
      } catch (err) {
        console.error('Failed to start session:', err);
        throw err;
      }
    },
    [agentStartSession, registerSession, setCurrentSession, send]
  );

  const endSession = useCallback(() => {
    if (activeSession) {
      try {
        send('cancel-task', { sessionId: activeSession.sessionId });
      } catch {
        // WebSocket may already be disconnected
      }
      clearSession(activeSession.sessionId);
      agentEndSession();
    }
  }, [activeSession, send, clearSession, agentEndSession]);

  return {
    sendMessage,
    startSession,
    endSession,
    isConnected,
    isReconnecting,
    isAgentThinking,
    activeSession,
    messages,
  };
}

export default useAgent;
