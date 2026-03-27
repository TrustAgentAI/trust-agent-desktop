/**
 * Agent session management hook.
 * Simplified to work with the new agentStore and sessionStore.
 */
import { useCallback } from 'react';
import { useAgentStore } from '@/store/agentStore';
import { useSession } from '@/store/sessionStore';
import { wsClient } from '@/lib/ws';
import { shouldUseMockAgent, getMockResponse } from '@/lib/mockAgent';

interface UseAgentReturn {
  sendMessage: (content: string) => void;
  isConnected: boolean;
  activeRoleId: string | null;
}

export function useAgent(): UseAgentReturn {
  const activeRoleId = useAgentStore((s) => s.activeRoleId);
  const addMessage = useSession((s) => s.addMessage);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!activeRoleId) return;

      const userMsg = {
        id: `user-${Date.now()}`,
        role: 'user' as const,
        content,
        timestamp: Date.now(),
      };
      addMessage(activeRoleId, userMsg);

      if (shouldUseMockAgent()) {
        const mock = await getMockResponse();
        addMessage(activeRoleId, {
          id: mock.messageId,
          role: 'agent',
          content: mock.fullContent,
          timestamp: Date.now(),
        });
        return;
      }

      try {
        wsClient.emit('agent:message', {
          hireId: activeRoleId,
          content,
        });
      } catch {
        addMessage(activeRoleId, {
          id: `err-${Date.now()}`,
          role: 'agent',
          content: 'Failed to send message. Check your connection.',
          timestamp: Date.now(),
        });
      }
    },
    [activeRoleId, addMessage]
  );

  return {
    sendMessage,
    isConnected: wsClient.isConnected,
    activeRoleId,
  };
}

export default useAgent;
