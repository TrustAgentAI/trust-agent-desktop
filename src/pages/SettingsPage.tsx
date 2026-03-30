import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Wifi, WifiOff, ExternalLink, Globe, User, Smartphone, ChevronRight, Mic, Accessibility, Bell, Shield } from 'lucide-react';
import { useSettingsStore } from '@/store/settingsStore';
import { useAuthStore } from '@/store/authStore';
import { isTauri } from '@/lib/tauri-compat';
import { openExternal, AUTH_URLS } from '@/lib/auth';
import { showToast } from '@/components/ui/Toast';
import { MobileHandoffSetup } from '@/components/onboarding/MobileHandoffSetup';
import type { LLMProvider } from '@/store/settingsStore';

// ---------------------------------------------------------------------------
// 33 supported response languages
// ---------------------------------------------------------------------------

const SUPPORTED_LANGUAGES: { code: string; name: string }[] = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'nl', name: 'Dutch' },
  { code: 'ru', name: 'Russian' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
  { code: 'bn', name: 'Bengali' },
  { code: 'tr', name: 'Turkish' },
  { code: 'pl', name: 'Polish' },
  { code: 'uk', name: 'Ukrainian' },
  { code: 'sv', name: 'Swedish' },
  { code: 'da', name: 'Danish' },
  { code: 'no', name: 'Norwegian' },
  { code: 'fi', name: 'Finnish' },
  { code: 'el', name: 'Greek' },
  { code: 'cs', name: 'Czech' },
  { code: 'ro', name: 'Romanian' },
  { code: 'hu', name: 'Hungarian' },
  { code: 'th', name: 'Thai' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'id', name: 'Indonesian' },
  { code: 'ms', name: 'Malay' },
  { code: 'tl', name: 'Filipino' },
  { code: 'sw', name: 'Swahili' },
  { code: 'he', name: 'Hebrew' },
  { code: 'fa', name: 'Persian' },
];

const API_URL = import.meta.env.VITE_API_URL || 'https://api.trust-agent.ai';
const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0';

const modelDefaults: Record<LLMProvider, string> = {
  openai: 'gpt-4o',
  anthropic: 'claude-sonnet-4-20250514',
  custom: '',
};

export function SettingsPage() {
  const navigate = useNavigate();
  const settings = useSettingsStore();
  const auth = useAuthStore();
  const [testingConnection, setTestingConnection] = React.useState(false);
  const [connectionResult, setConnectionResult] = React.useState<string | null>(null);
  const [showMobileSetup, setShowMobileSetup] = React.useState(false);

  React.useEffect(() => {
    settings.loadAll();
  }, []);

  const handleProviderChange = (provider: LLMProvider) => {
    settings.setSetting('llmProvider', provider);
    settings.setSetting('llmModel', modelDefaults[provider]);
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionResult(null);
    try {
      const res = await fetch(`${API_URL}/health`, { method: 'GET' });
      if (res.ok) {
        setConnectionResult('Connected successfully');
      } else {
        setConnectionResult(`Server responded with status ${res.status}`);
      }
    } catch {
      setConnectionResult('Cannot reach Trust Agent servers');
    } finally {
      setTestingConnection(false);
    }
  };

  const handleTestVoice = () => {
    if (!isTauri()) {
      showToast(
        'Voice requires the full Tauri desktop app. Download at trust-agent.ai/desktop',
        'info',
      );
      return;
    }
    showToast('Voice test started', 'info');
  };

  const handleSaveLLM = () => {
    settings.saveAll();
    showToast('LLM settings saved', 'success');
  };

  const handleSaveVoice = () => {
    settings.saveAll();
    showToast('Voice settings saved', 'success');
  };

  const handleSignOut = () => {
    auth.logout();
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 24, maxWidth: 640 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
        <Settings size={20} style={{ color: 'var(--color-electric-blue)' }} />
        <span
          style={{
            fontSize: '18px',
            fontWeight: 800,
            fontFamily: 'var(--font-sans)',
            color: '#E8EDF5',
          }}
        >
          Settings
        </span>
      </div>

      {/* Quick Nav */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 24 }}>
        {[
          { path: '/settings/profile', icon: <User size={16} />, label: 'Profile', desc: 'Name, email, account info' },
          { path: '/settings/voice', icon: <Mic size={16} />, label: 'Voice and Personality', desc: 'Verbosity, formality, voice mode' },
          { path: '/settings/accessibility', icon: <Accessibility size={16} />, label: 'Accessibility', desc: 'Contrast, text size, motion' },
          { path: '/settings/notifications', icon: <Bell size={16} />, label: 'Notifications', desc: 'Push, email, alerts' },
          { path: '/settings/privacy', icon: <Shield size={16} />, label: 'Privacy and Data', desc: 'Data export, account deletion' },
        ].map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 16px',
              background: 'var(--color-surface-1)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              transition: 'background 0.15s ease',
              textAlign: 'left',
            }}
          >
            <div style={{ color: 'var(--color-electric-blue)', flexShrink: 0 }}>{item.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#E8EDF5' }}>{item.label}</div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{item.desc}</div>
            </div>
            <ChevronRight size={14} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
          </button>
        ))}
      </div>

      {/* Account */}
      <Section title="Account">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          {auth.user?.avatarUrl ? (
            <img
              src={auth.user.avatarUrl}
              alt=""
              style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }}
            />
          ) : (
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: 'rgba(30,111,255,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <User size={20} style={{ color: 'var(--color-electric-blue)' }} />
            </div>
          )}
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#E8EDF5' }}>
              {auth.user?.name || 'User'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
              {auth.user?.email || 'No email'}
            </div>
          </div>
        </div>

        <FieldRow label="Plan">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: '#E8EDF5',
                textTransform: 'capitalize',
              }}
            >
              {auth.user?.plan || 'Free'}
            </span>
            <button
              onClick={() => openExternal(AUTH_URLS.billing)}
              style={{
                ...ghostBtnStyle,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              Manage subscription <ExternalLink size={10} />
            </button>
          </div>
        </FieldRow>

        <FieldRow label="Password">
          <button
            onClick={() => openExternal(AUTH_URLS.changePassword)}
            style={{
              ...ghostBtnStyle,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            Change password <ExternalLink size={10} />
          </button>
        </FieldRow>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
          <button
            onClick={handleTestConnection}
            disabled={testingConnection}
            style={{
              ...primaryBtnStyle,
              opacity: testingConnection ? 0.6 : 1,
            }}
          >
            {testingConnection ? (
              <>
                <Wifi size={12} style={{ animation: 'pulse 1s infinite' }} />
                Testing...
              </>
            ) : (
              <>
                <Wifi size={12} />
                Test Connection
              </>
            )}
          </button>
          {connectionResult && (
            <span
              style={{
                fontSize: '12px',
                color: connectionResult.includes('success')
                  ? 'var(--color-success)'
                  : 'var(--color-error)',
              }}
            >
              {connectionResult.includes('success') ? (
                <Wifi size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
              ) : (
                <WifiOff size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
              )}
              {connectionResult}
            </span>
          )}
        </div>

        <div style={{ marginTop: 12 }}>
          <button
            onClick={handleSignOut}
            style={{
              ...ghostBtnStyle,
              color: 'var(--color-error)',
            }}
          >
            Sign out
          </button>
        </div>
      </Section>

      {/* LLM Provider */}
      <Section title="LLM Provider">
        <FieldRow label="Provider">
          <select
            value={settings.llmProvider}
            onChange={(e) => handleProviderChange(e.target.value as LLMProvider)}
            style={selectStyle}
          >
            <option value="openai">OpenAI</option>
            <option value="anthropic">Anthropic</option>
            <option value="custom">Custom</option>
          </select>
        </FieldRow>

        <FieldRow label="API Key">
          <input
            type="password"
            value={settings.llmApiKey}
            onChange={(e) => settings.setSetting('llmApiKey', e.target.value)}
            placeholder="sk-..."
            style={{ ...inputStyle, fontFamily: 'var(--font-mono)' }}
          />
        </FieldRow>

        <FieldRow label="Model">
          <input
            type="text"
            value={settings.llmModel}
            onChange={(e) => settings.setSetting('llmModel', e.target.value)}
            placeholder="Model name"
            style={inputStyle}
          />
        </FieldRow>

        {settings.llmProvider === 'custom' && (
          <FieldRow label="Base URL">
            <input
              type="text"
              value={settings.llmBaseUrl}
              onChange={(e) => settings.setSetting('llmBaseUrl', e.target.value)}
              placeholder="https://your-endpoint.com/v1"
              style={{ ...inputStyle, fontFamily: 'var(--font-mono)' }}
            />
          </FieldRow>
        )}

        <button onClick={handleSaveLLM} style={{ ...primaryBtnStyle, marginTop: 8 }}>
          Save
        </button>
      </Section>

      {/* Response Language */}
      <Section title="Response Language">
        <FieldRow label="Language">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Globe size={14} style={{ color: 'var(--color-ion-cyan)', flexShrink: 0 }} />
            <select
              value={settings.language}
              onChange={(e) => {
                settings.setLanguage(e.target.value);
                showToast('Response language updated', 'success');
              }}
              style={selectStyle}
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>
        </FieldRow>
        <p
          style={{
            fontSize: '11px',
            color: 'var(--color-text-muted)',
            marginTop: 4,
            lineHeight: 1.5,
          }}
        >
          Roles will respond in your chosen language. Language tutor roles will use
          your language for explanations while teaching in the target language.
        </p>
      </Section>

      {/* Voice Settings */}
      <Section title="Voice Settings">
        <FieldRow label="Deepgram API Key">
          <input
            type="password"
            value={settings.deepgramApiKey}
            onChange={(e) => settings.setSetting('deepgramApiKey', e.target.value)}
            placeholder="Enter Deepgram key"
            style={{ ...inputStyle, fontFamily: 'var(--font-mono)' }}
          />
        </FieldRow>

        <FieldRow label="ElevenLabs API Key">
          <input
            type="password"
            value={settings.elevenLabsApiKey}
            onChange={(e) => settings.setSetting('elevenLabsApiKey', e.target.value)}
            placeholder="Enter ElevenLabs key"
            style={{ ...inputStyle, fontFamily: 'var(--font-mono)' }}
          />
        </FieldRow>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
          <button onClick={handleSaveVoice} style={primaryBtnStyle}>
            Save
          </button>
          <button onClick={handleTestVoice} style={ghostBtnStyle}>
            Test Voice
          </button>
        </div>

        <p
          style={{
            fontSize: '11px',
            color: 'var(--color-text-muted)',
            marginTop: 8,
            lineHeight: 1.5,
          }}
        >
          Voice keys are stored locally and never sent to Trust Agent servers.
        </p>
      </Section>

      {/* Family Setup */}
      <Section title="Family Setup">
        <p
          style={{
            fontSize: '12px',
            color: 'var(--color-text-muted)',
            lineHeight: 1.6,
            marginBottom: 12,
          }}
        >
          Set up Trust Agent on a family member's phone in under 90 seconds.
          Generates a QR code they scan for simplified, large-text onboarding.
        </p>
        <button
          onClick={() => setShowMobileSetup(true)}
          style={{
            ...primaryBtnStyle,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Smartphone size={14} />
          Set up for a family member
        </button>
      </Section>

      {/* Mobile Handoff Modal */}
      {showMobileSetup && (
        <MobileHandoffSetup onClose={() => setShowMobileSetup(false)} />
      )}

      {/* About */}
      <Section title="About">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#E8EDF5' }}>
            Trust Agent Desktop
          </span>
          <span
            style={{
              padding: '2px 8px',
              fontSize: '10px',
              fontWeight: 600,
              fontFamily: 'var(--font-mono)',
              color: 'var(--color-ion-cyan)',
              background: 'rgba(0,212,255,0.08)',
              borderRadius: 100,
            }}
          >
            v{APP_VERSION}
          </span>
        </div>
        <a
          href="https://github.com/TrustAgentAI/trust-agent-desktop"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontSize: '12px',
            color: 'var(--color-electric-blue)',
            textDecoration: 'none',
            marginBottom: 8,
          }}
        >
          GitHub Repository <ExternalLink size={10} />
        </a>
        <p
          style={{
            fontSize: '12px',
            color: 'var(--color-text-muted)',
            lineHeight: 1.5,
          }}
        >
          AgentCore LTD - Company No. 17114811 - 20 Wenlock Road, London, England, N1 7GU
        </p>
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        marginBottom: 28,
        padding: '16px 20px',
        background: 'var(--color-surface-1)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      <div
        style={{
          fontSize: '11px',
          fontWeight: 700,
          fontFamily: 'var(--font-mono)',
          color: 'var(--color-ion-cyan)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: 14,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function FieldRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div
        style={{
          fontSize: '12px',
          fontWeight: 600,
          color: 'var(--color-text-muted)',
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  background: 'var(--color-surface-2)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  color: '#E8EDF5',
  fontFamily: 'var(--font-sans)',
  fontSize: '13px',
  outline: 'none',
  transition: 'border-color 0.15s ease',
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: 'pointer',
  appearance: 'auto',
};

const primaryBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '8px 16px',
  background: 'var(--color-electric-blue)',
  color: '#fff',
  fontFamily: 'var(--font-sans)',
  fontSize: '13px',
  fontWeight: 600,
  border: 'none',
  borderRadius: 'var(--radius-md)',
  cursor: 'pointer',
  transition: 'opacity 0.15s ease',
};

const ghostBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '6px 12px',
  background: 'transparent',
  color: 'var(--color-text-muted)',
  fontFamily: 'var(--font-sans)',
  fontSize: '12px',
  fontWeight: 600,
  border: 'none',
  borderRadius: 'var(--radius-sm)',
  cursor: 'pointer',
  transition: 'color 0.15s ease',
};
