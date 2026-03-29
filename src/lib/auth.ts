/**
 * Authentication module for Trust Agent Desktop.
 * Handles email/password login, Google OAuth, JWT refresh, and session management.
 */

import { localStore, isTauri } from '@/lib/tauri-compat';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.trust-agent.ai';
const GOOGLE_OAUTH_URL = `${API_URL}/api/v1/auth/google`;
const APP_URL = import.meta.env.VITE_APP_URL || 'https://app.trust-agent.ai';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  plan: string;
  avatarUrl?: string | null;
  accountType?: string;
  onboardingDone?: boolean;
  createdAt?: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: AuthUser;
}

export interface SessionData {
  token: string;
  refreshToken: string;
  user: AuthUser;
}

/**
 * Login with email and password. Calls the tRPC auth.login endpoint.
 */
export async function loginWithEmail(email: string, password: string): Promise<LoginResponse> {
  try {
    const response = await fetch(`${API_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (response.status === 401) {
      throw new Error('Invalid email or password.');
    }

    if (response.status === 404) {
      throw new Error('No account found with this email. Sign up at trust-agent.ai');
    }

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error?.message || 'Login failed. Please try again.');
    }

    const data = await response.json();
    // Handle both direct response and wrapped { success, data } format
    const result = data.data || data;
    const loginResult: LoginResponse = {
      token: result.token,
      refreshToken: result.refreshToken,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        plan: result.user.plan || 'free',
        avatarUrl: result.user.avatarUrl || null,
        accountType: result.user.accountType,
        onboardingDone: result.user.onboardingDone,
        createdAt: result.user.createdAt,
      },
    };

    saveSession(loginResult);
    return loginResult;
  } catch (err) {
    if (err instanceof TypeError && err.message.includes('fetch')) {
      throw new Error('Cannot connect to Trust Agent servers. Check your connection.');
    }
    if (err instanceof Error) {
      throw err;
    }
    throw new Error('Login failed. Please try again.');
  }
}

/**
 * Open Google OAuth flow in the system browser.
 * The OAuth callback will redirect back to the app with a token.
 */
export async function loginWithGoogle(): Promise<void> {
  const callbackUrl = isTauri()
    ? 'trustagent://auth/callback'
    : `${window.location.origin}/auth/callback`;

  const oauthUrl = `${GOOGLE_OAUTH_URL}?redirect_uri=${encodeURIComponent(callbackUrl)}&platform=desktop`;

  if (isTauri()) {
    // Open in system browser via Tauri shell
    try {
      const { open } = await import('@tauri-apps/plugin-shell');
      await open(oauthUrl);
    } catch {
      // Fallback to window.open
      window.open(oauthUrl, '_blank');
    }
  } else {
    window.open(oauthUrl, '_blank');
  }
}

/**
 * Handle the OAuth callback token exchange.
 */
export async function handleGoogleCallback(code: string): Promise<LoginResponse> {
  const response = await fetch(`${API_URL}/api/v1/auth/google/callback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, platform: 'desktop' }),
  });

  if (!response.ok) {
    throw new Error('Google sign-in failed. Please try again.');
  }

  const data = await response.json();
  const result = data.data || data;
  const loginResult: LoginResponse = {
    token: result.token,
    refreshToken: result.refreshToken,
    user: {
      id: result.user.id,
      email: result.user.email,
      name: result.user.name,
      plan: result.user.plan || 'free',
      avatarUrl: result.user.avatarUrl || null,
      accountType: result.user.accountType,
      onboardingDone: result.user.onboardingDone,
    },
  };

  saveSession(loginResult);
  return loginResult;
}

/**
 * Refresh the JWT token before it expires.
 */
export async function refreshToken(): Promise<{ token: string; refreshToken: string }> {
  const currentRefreshToken = localStore.get<string>('auth_refreshToken');
  if (!currentRefreshToken) {
    throw new Error('No refresh token available. Please sign in again.');
  }

  const response = await fetch(`${API_URL}/api/v1/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: currentRefreshToken }),
  });

  if (!response.ok) {
    clearSession();
    throw new Error('Session expired. Please sign in again.');
  }

  const data = await response.json();
  const result = data.data || data;

  localStore.set('auth_token', result.token);
  localStore.set('auth_refreshToken', result.refreshToken);

  return { token: result.token, refreshToken: result.refreshToken };
}

/**
 * Get the current session from local storage.
 */
export function getSession(): SessionData | null {
  const token = localStore.get<string>('auth_token');
  const refreshTk = localStore.get<string>('auth_refreshToken');
  const user = localStore.get<AuthUser>('auth_user');

  if (!token || !user) return null;

  return { token, refreshToken: refreshTk || '', user };
}

/**
 * Save session data to local storage.
 */
export function saveSession(data: LoginResponse): void {
  localStore.set('auth_token', data.token);
  localStore.set('auth_refreshToken', data.refreshToken);
  localStore.set('auth_user', data.user);
}

/**
 * Save "remember me" email to local storage.
 */
export function saveRememberedEmail(email: string): void {
  localStore.set('auth_rememberedEmail', email);
}

export function getRememberedEmail(): string {
  return localStore.get<string>('auth_rememberedEmail') || '';
}

export function clearRememberedEmail(): void {
  localStore.remove('auth_rememberedEmail');
}

/**
 * Clear session data (logout).
 */
export function clearSession(): void {
  localStore.remove('auth_token');
  localStore.remove('auth_refreshToken');
  localStore.remove('auth_user');
  localStore.remove('auth_userId');
}

/**
 * Open external links in the system browser.
 */
export function openExternal(url: string): void {
  if (isTauri()) {
    import('@tauri-apps/plugin-shell').then(({ open }) => open(url)).catch(() => {
      window.open(url, '_blank');
    });
  } else {
    window.open(url, '_blank');
  }
}

export const AUTH_URLS = {
  signup: `${APP_URL}/signup`,
  forgotPassword: `${APP_URL}/forgot-password`,
  billing: `${APP_URL}/billing`,
  changePassword: `${APP_URL}/account/password`,
};
