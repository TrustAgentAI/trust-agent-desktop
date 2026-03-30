import React from 'react';
import { useAuthStore } from '@/store/authStore';
import {
  openExternal,
  AUTH_URLS,
  saveRememberedEmail,
  getRememberedEmail,
  clearRememberedEmail,
  handleGoogleCallback,
  saveSession,
} from '@/lib/auth';
import { HeroSection } from '@/components/layout/HeroSection';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export function LoginPage() {
  const rememberedEmail = React.useMemo(() => getRememberedEmail(), []);
  const [email, setEmail] = React.useState(rememberedEmail);
  const [password, setPassword] = React.useState('');
  const [rememberMe, setRememberMe] = React.useState(!!rememberedEmail);
  const { isLoading, error, login, loginWithGoogle, clearError } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim() || isLoading) return;

    clearError();

    if (rememberMe) {
      saveRememberedEmail(email.trim());
    } else {
      clearRememberedEmail();
    }

    try {
      await login(email.trim(), password.trim());
    } catch {
      // Error is set in store
    }
  };

  // Load Google Identity Services script
  React.useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    if (document.getElementById('gsi-script')) return;

    const script = document.createElement('script');
    script.id = 'gsi-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }, []);

  const handleGoogleSignIn = () => {
    clearError();

    // If Google Client ID is configured, use GSI popup
    if (GOOGLE_CLIENT_ID && window.google?.accounts?.oauth2) {
      const client = window.google.accounts.oauth2.initCodeClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'openid email profile',
        ux_mode: 'popup',
        callback: async (response: { code?: string; error?: string }) => {
          if (response.error || !response.code) {
            useAuthStore.setState({
              error: 'Google sign-in was cancelled or failed.',
              isLoading: false,
            });
            return;
          }

          useAuthStore.setState({ isLoading: true });
          try {
            const result = await handleGoogleCallback(response.code);
            saveSession(result);
            useAuthStore.setState({
              token: result.token,
              refreshToken: result.refreshToken,
              user: result.user,
              isAuthenticated: true,
              isLoading: false,
            });

            // New users go to onboarding
            if (!result.user.onboardingDone) {
              try {
                localStorage.removeItem('ta_onboarding_completed');
              } catch { /* ignore */ }
            }
          } catch (err) {
            useAuthStore.setState({
              error: err instanceof Error ? err.message : 'Google sign-in failed.',
              isLoading: false,
            });
          }
        },
      });
      client.requestCode();
    } else {
      // Fallback to redirect-based OAuth
      loginWithGoogle();
    }
  };

  const handleSignUp = () => {
    openExternal(AUTH_URLS.signup);
  };

  const handleForgotPassword = () => {
    openExternal(AUTH_URLS.forgotPassword);
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
        overflow: 'auto',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 0,
          width: '100%',
          maxWidth: 480,
          padding: '24px 24px 0',
          animation: 'fadeIn 400ms ease',
        }}
      >
        {/* Phase 15: Quote-first hero - emotional resonance before product description */}
        <HeroSection />

        {/* Login form */}
        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            width: '100%',
          }}
        >
          {/* Email */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label
              htmlFor="email-input"
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--color-text-muted)',
                fontFamily: 'var(--font-sans)',
              }}
            >
              Email
            </label>
            <input
              id="email-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoFocus
              autoComplete="email"
              disabled={isLoading}
              style={{
                ...inputStyle,
                borderColor: error ? 'var(--color-error)' : 'var(--color-mid-blue)',
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

          {/* Password */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label
                htmlFor="password-input"
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--color-text-muted)',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                Password
              </label>
              <button
                type="button"
                onClick={handleForgotPassword}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-electric-blue)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 11,
                  fontWeight: 500,
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                Forgot password?
              </button>
            </div>
            <input
              id="password-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              disabled={isLoading}
              style={{
                ...inputStyle,
                borderColor: error ? 'var(--color-error)' : 'var(--color-mid-blue)',
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

          {/* Remember me */}
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              fontSize: 12,
              color: 'var(--color-text-muted)',
              fontFamily: 'var(--font-sans)',
            }}
          >
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              style={{
                accentColor: 'var(--color-electric-blue)',
                width: 14,
                height: 14,
                cursor: 'pointer',
              }}
            />
            Remember me
          </label>

          {/* Error message */}
          {error && (
            <div
              style={{
                fontSize: 13,
                color: 'var(--color-error)',
                textAlign: 'center',
                fontFamily: 'var(--font-sans)',
                padding: '8px 12px',
                background: 'rgba(255,59,48,0.08)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              {error}
            </div>
          )}

          {/* Sign in button */}
          <button
            type="submit"
            disabled={isLoading || !email.trim() || !password.trim()}
            style={{
              width: '100%',
              padding: '12px 24px',
              background:
                isLoading || !email.trim() || !password.trim()
                  ? 'rgba(30,111,255,0.4)'
                  : 'var(--color-electric-blue)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-white)',
              fontFamily: 'var(--font-sans)',
              fontWeight: 600,
              fontSize: 15,
              cursor:
                isLoading || !email.trim() || !password.trim() ? 'not-allowed' : 'pointer',
              transition: 'all 150ms ease',
            }}
          >
            {isLoading ? (
              <span>
                Signing in
                <AnimatedDots />
              </span>
            ) : (
              'Sign in'
            )}
          </button>

          {/* Divider */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              margin: '4px 0',
            }}
          >
            <div style={{ flex: 1, height: 1, background: 'var(--color-mid-blue)' }} />
            <span
              style={{
                fontSize: 11,
                color: 'var(--color-text-muted)',
                fontFamily: 'var(--font-sans)',
              }}
            >
              or
            </span>
            <div style={{ flex: 1, height: 1, background: 'var(--color-mid-blue)' }} />
          </div>

          {/* Google Sign-In button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '11px 24px',
              background: 'var(--color-navy-2)',
              border: '1px solid var(--color-mid-blue)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-inverse, #E8EDF5)',
              fontFamily: 'var(--font-sans)',
              fontWeight: 600,
              fontSize: 14,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 150ms ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
            }}
          >
            <GoogleIcon />
            Sign in with Google
          </button>

          {/* Sign up link */}
          <div
            style={{
              textAlign: 'center',
              fontSize: 13,
              color: 'var(--color-text-muted)',
              fontFamily: 'var(--font-sans)',
              marginTop: 4,
            }}
          >
            Don&apos;t have an account?{' '}
            <button
              type="button"
              onClick={handleSignUp}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-electric-blue)',
                fontFamily: 'var(--font-sans)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                padding: 0,
                textDecoration: 'underline',
              }}
            >
              Sign up
            </button>
          </div>
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

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  background: 'var(--color-navy-2)',
  border: '1px solid var(--color-mid-blue)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--text-inverse, #E8EDF5)',
  fontFamily: 'var(--font-sans)',
  fontSize: 14,
  outline: 'none',
  transition: 'border-color 150ms ease',
};

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.26c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
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
