// Trust Agent API client - connects to live API
import type {
  User,
  HiredRole,
  RoleConfig,
  MarketplaceAgent,
  MarketplaceSkill,
  Message,
  WalletBalance,
  WalletTransaction,
} from './roleConfig';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://api.trust-agent.ai';

interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

interface SessionTokenResponse {
  token: string;
  user: User;
  expiresAt: number;
}

interface HireConfirmation {
  hireId: string;
  roleId: string;
  status: string;
}

interface CreateSessionResponse {
  sessionId: string;
  roleHireId: string;
  apiKey: string;
}

interface SendMessageResponse {
  messageId: string;
  content: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

let getSessionToken: () => string | null = () => null;
let onTokenExpired: (() => Promise<void>) | null = null;

export function configureGateway(opts: {
  getToken: () => string | null;
  onTokenExpired?: () => Promise<void>;
}) {
  getSessionToken = opts.getToken;
  if (opts.onTokenExpired) {
    onTokenExpired = opts.onTokenExpired;
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  retry = true
): Promise<T> {
  const token = getSessionToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${BASE_URL}${path}`;
  const options: RequestInit = {
    method,
    headers,
  };
  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(url, options);

  if (res.status === 401 && retry && onTokenExpired) {
    try {
      await onTokenExpired();
      return request<T>(method, path, body, false);
    } catch {
      throw new GatewayError('Session expired. Please sign in again.', 'AUTH_EXPIRED', 401);
    }
  }

  if (!res.ok) {
    let errorBody: ApiErrorResponse | null = null;
    try {
      errorBody = await res.json();
    } catch {
      // Response may not be JSON
    }
    const message = errorBody?.error?.message || `Request failed with status ${res.status}`;
    const code = errorBody?.error?.code || 'UNKNOWN_ERROR';
    throw new GatewayError(message, code, res.status);
  }

  const json: ApiResponse<T> = await res.json();
  if (!json.success) {
    const errResp = json as ApiErrorResponse;
    throw new GatewayError(errResp.error.message, errResp.error.code, res.status);
  }

  return (json as ApiSuccessResponse<T>).data;
}

export class GatewayError extends Error {
  code: string;
  status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = 'GatewayError';
    this.code = code;
    this.status = status;
  }
}

export const gateway = {
  auth: {
    async signin(email: string, password: string): Promise<SessionTokenResponse> {
      return request<SessionTokenResponse>('POST', '/api/v1/auth/signin', { email, password });
    },
    async signout(): Promise<void> {
      await request<void>('POST', '/api/v1/auth/signout');
    },
  },

  roles: {
    async listHired(): Promise<HiredRole[]> {
      return request<HiredRole[]>('GET', '/api/v1/roles/hired');
    },
    async getRole(roleId: string): Promise<RoleConfig> {
      return request<RoleConfig>('GET', `/api/v1/roles/${roleId}`);
    },
    async hire(roleId: string): Promise<HireConfirmation> {
      return request<HireConfirmation>('POST', '/api/v1/roles/hire', { roleId });
    },
  },

  agents: {
    async list(): Promise<MarketplaceAgent[]> {
      return request<MarketplaceAgent[]>('GET', '/api/v1/agents');
    },
    async get(agentId: string): Promise<MarketplaceAgent> {
      return request<MarketplaceAgent>('GET', `/api/v1/agents/${agentId}`);
    },
  },

  skills: {
    async list(): Promise<MarketplaceSkill[]> {
      return request<MarketplaceSkill[]>('GET', '/api/v1/skills');
    },
  },

  sessions: {
    async create(roleHireId: string, language?: string): Promise<CreateSessionResponse> {
      return request<CreateSessionResponse>('POST', '/api/v1/sessions', {
        roleHireId,
        ...(language && language !== 'en' ? { language } : {}),
      });
    },
    async sendMessage(sessionId: string, message: string, language?: string): Promise<SendMessageResponse> {
      return request<SendMessageResponse>('POST', `/api/v1/sessions/${sessionId}/messages`, {
        content: message,
        ...(language && language !== 'en' ? { language } : {}),
      });
    },
    async getHistory(sessionId: string): Promise<Message[]> {
      return request<Message[]>('GET', `/api/v1/sessions/${sessionId}/messages`);
    },
  },

  wallet: {
    async getBalance(): Promise<WalletBalance> {
      return request<WalletBalance>('GET', '/api/v1/wallet/balance');
    },
    async getTransactions(): Promise<WalletTransaction[]> {
      return request<WalletTransaction[]>('GET', '/api/v1/wallet/transactions');
    },
  },
};

export default gateway;
