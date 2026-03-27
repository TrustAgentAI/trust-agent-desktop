import React from 'react';
import { useAuthStore } from '@/store/authStore';
import { wsClient } from '@/lib/ws';

export function LoginPage() {
  const [apiKey, setApiKey] = React.useState('');
  const { isLoading, error, login, loginBrowserMode, clearError } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim() || isLoading) return;

    clearError();

    // In browser mode: accept keys starting with "ta_"
    if (wsClient.getStatus() !== 'connected') {
      if (apiKey.trim().startsWith('ta_')) {
        loginBrowserMode(apiKey.trim());
        return;
      }
    }

    try {
      await login(apiKey.trim());
    } catch {
      // Error is set in store
    }
  };

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: 'var(--color-dark-navy)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 32,
          width: '100%',
          maxWidth: 400,
          padding: '0 24px',
          animation: 'fadeIn 400ms ease',
        }}
      >
        {/* Wordmark */}
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontFamily: 'var(--font-sans)',
              fontWeight: 800,
              fontSize: 36,
              color: '#fff',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
            }}
          >
            Trust <span style={{ color: 'var(--color-electric-blue)' }}>Agent</span>
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 14,
              fontWeight: 400,
              color: 'var(--color-ion-cyan)',
              marginTop: 8,
            }}
          >
            Desktop v1.0
          </div>
        </div>

        {/* Login form */}
        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            width: '100%',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label
              htmlFor="api-key-input"
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--color-text-muted)',
                fontFamily: 'var(--font-sans)',
              }}
            >
              API Key
            </label>
            <input
              id="api-key-input"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="ta_live_..."
              autoFocus
              autoComplete="off"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'var(--color-navy-2)',
                border: `1px solid ${error ? 'var(--color-error)' : 'var(--color-mid-blue)'}`,
                borderRadius: 'var(--radius-md)',
                color: '#E8EDF5',
                fontFamily: 'var(--font-mono)',
                fontSize: 14,
                outline: 'none',
                transition: 'border-color 150ms ease',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-electric-blue)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = error
                  ? 'var(--color-error)'
                  : 'var(--color-mid-blue)';
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !apiKey.trim()}
            style={{
              width: '100%',
              padding: '12px 24px',
              background: isLoading || !apiKey.trim()
                ? 'rgba(30,111,255,0.4)'
                : 'var(--color-electric-blue)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              color: '#fff',
              fontFamily: 'var(--font-sans)',
              fontWeight: 600,
              fontSize: 15,
              cursor: isLoading || !apiKey.trim() ? 'not-allowed' : 'pointer',
              transition: 'all 150ms ease',
            }}
          >
            {isLoading ? (
              <span>
                Connecting
                <AnimatedDots />
              </span>
            ) : (
              'Connect'
            )}
          </button>

          {error && (
            <div
              style={{
                fontSize: 13,
                color: 'var(--color-error)',
                textAlign: 'center',
                fontFamily: 'var(--font-sans)',
              }}
            >
              {error}
            </div>
          )}
        </form>
      </div>

      {/* Footer */}
      <div
        style={{
          position: 'absolute',
          bottom: 24,
          textAlign: 'center',
          fontSize: 11,
          color: 'var(--color-text-muted)',
          fontFamily: 'var(--font-sans)',
        }}
      >
        AgentCore LTD &middot; 17114811 &middot; trust-agent.ai
      </div>
    </div>
  );
}

function AnimatedDots() {
  const [dots, setDots] = React.useState('');

  React.useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return <span style={{ display: 'inline-block', width: 20, textAlign: 'left' }}>{dots}</span>;
}

export default LoginPage;
