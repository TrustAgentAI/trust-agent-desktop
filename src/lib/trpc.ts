/**
 * tRPC Vanilla Client for Trust Agent Desktop
 * Connects to the server's /trpc endpoint.
 * Uses @trpc/client (vanilla) with custom React hooks.
 */
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../../server/src/routers/index';
import { useAuthStore } from '@/store/authStore';

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.trust-agent.ai';

export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${API_BASE}/trpc`,
      headers() {
        const token = useAuthStore.getState().token;
        return token ? { Authorization: `Bearer ${token}` } : {};
      },
    }),
  ],
});

export type { AppRouter };
