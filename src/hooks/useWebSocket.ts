// WebSocket connection hook
import { useEffect, useRef, useCallback, useState } from 'react';
import { wsClient } from '../lib/ws';
import { useAuthStore } from '../store/authStore';

interface UseWebSocketOptions {
  onAgentResponse?: (data: unknown) => void;
  onAgentThinking?: (data: unknown) => void;
  onAgentError?: (data: unknown) => void;
  onTaskUpdate?: (data: unknown) => void;
  onSessionEnd?: (data: unknown) => void;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  isReconnecting: boolean;
  send: (type: 'user-message' | 'start-session' | 'cancel-task', payload: unknown) => void;
  disconnect: () => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const sessionToken = useAuthStore((s) => s.sessionToken);
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    if (!sessionToken) {
      wsClient.disconnect();
      setIsConnected(false);
      return;
    }

    const handleConnected = () => {
      setIsConnected(true);
      setIsReconnecting(false);
    };

    const handleDisconnected = () => {
      setIsConnected(false);
    };

    const handleReconnecting = () => {
      setIsReconnecting(true);
    };

    const handleAgentResponse = (data: unknown) => {
      optionsRef.current.onAgentResponse?.(data);
    };

    const handleAgentThinking = (data: unknown) => {
      optionsRef.current.onAgentThinking?.(data);
    };

    const handleAgentError = (data: unknown) => {
      optionsRef.current.onAgentError?.(data);
    };

    const handleTaskUpdate = (data: unknown) => {
      optionsRef.current.onTaskUpdate?.(data);
    };

    const handleSessionEnd = (data: unknown) => {
      optionsRef.current.onSessionEnd?.(data);
    };

    wsClient.on('connected', handleConnected);
    wsClient.on('disconnected', handleDisconnected);
    wsClient.on('reconnecting', handleReconnecting);
    wsClient.on('agent-response', handleAgentResponse);
    wsClient.on('agent-thinking', handleAgentThinking);
    wsClient.on('agent-error', handleAgentError);
    wsClient.on('task-update', handleTaskUpdate);
    wsClient.on('session-end', handleSessionEnd);

    wsClient.connect(sessionToken);

    return () => {
      wsClient.off('connected', handleConnected);
      wsClient.off('disconnected', handleDisconnected);
      wsClient.off('reconnecting', handleReconnecting);
      wsClient.off('agent-response', handleAgentResponse);
      wsClient.off('agent-thinking', handleAgentThinking);
      wsClient.off('agent-error', handleAgentError);
      wsClient.off('task-update', handleTaskUpdate);
      wsClient.off('session-end', handleSessionEnd);
      wsClient.disconnect();
    };
  }, [sessionToken]);

  const send = useCallback(
    (type: 'user-message' | 'start-session' | 'cancel-task', payload: unknown) => {
      try {
        wsClient.emit(type, payload);
      } catch (err) {
        console.error('WebSocket send failed:', err);
      }
    },
    []
  );

  const disconnect = useCallback(() => {
    wsClient.disconnect();
  }, []);

  return { isConnected, isReconnecting, send, disconnect };
}

export default useWebSocket;
