/**
 * Authentication module for Trust Agent Desktop.
 * Handles API key login with proper error handling.
 */

const API_URL = import.meta.env.VITE_API_URL || 'https://api.trust-agent.ai';

interface LoginResponse {
  token: string;
  userId: string;
}

export async function login(apiKey: string): Promise<LoginResponse> {
  try {
    const response = await fetch(`${API_URL}/auth/desktop-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey }),
    });

    if (response.status === 401) {
      throw new Error('Invalid API key.');
    }

    if (!response.ok) {
      throw new Error('Login failed. Please try again.');
    }

    const data = await response.json();
    return { token: data.token, userId: data.userId };
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
