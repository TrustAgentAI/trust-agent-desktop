// ---------------------------------------------------------------------------
// Setup Token - generates and validates mobile handoff tokens
// ---------------------------------------------------------------------------

export interface SetupToken {
  token: string;
  createdAt: string;
  expiresAt: string;
  createdBy: string;
  familyMemberName?: string;
  companionId?: string;
}

/**
 * Generate a cryptographically random setup token for mobile handoff.
 * Token is a 6-segment alphanumeric code for easy scanning/entry.
 */
export function generateSetupToken(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no ambiguous chars (0,O,1,I,L)
  const segments: string[] = [];
  for (let s = 0; s < 4; s++) {
    let segment = '';
    for (let i = 0; i < 4; i++) {
      segment += chars[Math.floor(Math.random() * chars.length)];
    }
    segments.push(segment);
  }
  return segments.join('-');
}

/**
 * Build the payload that gets encoded into the QR code.
 */
export function buildSetupPayload(opts: {
  userName: string;
  companionId?: string;
}): SetupToken {
  const now = new Date();
  const expires = new Date(now.getTime() + 15 * 60 * 1000); // 15 min expiry

  return {
    token: generateSetupToken(),
    createdAt: now.toISOString(),
    expiresAt: expires.toISOString(),
    createdBy: opts.userName,
    companionId: opts.companionId,
  };
}

/**
 * Encode setup payload as a URL for the QR code.
 */
export function buildSetupUrl(payload: SetupToken): string {
  const base = 'https://app.trust-agent.ai/mobile-setup';
  const params = new URLSearchParams({
    token: payload.token,
    by: payload.createdBy,
    exp: payload.expiresAt,
  });
  if (payload.companionId) {
    params.set('companion', payload.companionId);
  }
  return `${base}?${params.toString()}`;
}

/**
 * Check whether a setup token has expired.
 */
export function isTokenExpired(token: SetupToken): boolean {
  return new Date() > new Date(token.expiresAt);
}
