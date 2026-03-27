/**
 * Mock agent response for browser mode.
 * When WS is disconnected, provides fallback responses.
 */
import { wsClient } from './ws';

interface MockResponse {
  messageId: string;
  fullContent: string;
}

const MOCK_DELAY = 1200;

const MOCK_MESSAGE =
  "I'm running in browser preview mode. To activate your role, connect to the Trust Agent gateway with a valid API key.";

export function shouldUseMockAgent(): boolean {
  return wsClient.getStatus() !== 'connected';
}

export function getMockResponse(): Promise<MockResponse> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        messageId: `mock-${Date.now()}`,
        fullContent: MOCK_MESSAGE,
      });
    }, MOCK_DELAY);
  });
}

export default { shouldUseMockAgent, getMockResponse };
