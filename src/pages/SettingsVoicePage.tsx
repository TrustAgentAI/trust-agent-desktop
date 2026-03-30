import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mic, Save, CheckCircle } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { showToast } from '@/components/ui/Toast';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.trust-agent.ai';

interface PersonalityConfig {
  verbosity: string;
  formalityLevel: string;
  encouragement: string;
  voiceMode: string;
  voiceId: string | null;
  voiceSpeed: number;
  ambientAudio: boolean;
  ambientVolume: number;
}

const DEFAULT_CONFIG: PersonalityConfig = {
  verbosity: 'balanced',
  formalityLevel: 'warm',
  encouragement: 'moderate',
  voiceMode: 'text',
  voiceId: null,
  voiceSpeed: 1.0,
  ambientAudio: true,
  ambientVolume: 10,
};

export function SettingsVoicePage() {
  const navigate = useNavigate();
  const auth = useAuthStore();
  const [config, setConfig] = React.useState<PersonalityConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [activeHireId, setActiveHireId] = React.useState<string | null>(null);

  // Load active hire's personality config
  React.useEffect(() => {
    async function load() {
      try {
        const token = auth.token;
        // Get user's active hires to find the primary one
        const hiresRes = await fetch(
          `${API_URL}/trpc/hires.listActive`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        );

        if (hiresRes.ok) {
          const hiresData = await hiresRes.json();
          const hires = hiresData.result?.data ?? hiresData.data ?? [];
          const firstHire = Array.isArray(hires) ? hires[0] : null;

          if (firstHire?.id) {
            setActiveHireId(firstHire.id);

            const configRes = await fetch(
              `${API_URL}/trpc/personality.getConfig?input=${encodeURIComponent(JSON.stringify({ hireId: firstHire.id }))}`,
              {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
              }
            );

            if (configRes.ok) {
              const configData = await configRes.json();
              const result = configData.result?.data ?? configData.data;
              if (result) {
                setConfig({
                  verbosity: result.verbosity || 'balanced',
                  formalityLevel: result.formalityLevel || 'warm',
                  encouragement: result.encouragement || 'moderate',
                  voiceMode: result.voiceMode || 'text',
                  voiceId: result.voiceId || null,
                  voiceSpeed: result.voiceSpeed ?? 1.0,
                  ambientAudio: result.ambientAudio ?? true,
                  ambientVolume: result.ambientVolume ?? 10,
                });
              }
            }
          }
        }
      } catch {
        // Use defaults
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [auth.token]);

  const handleSave = async () => {
    if (saving || !activeHireId) return;
    setSaving(true);
    setSaved(false);

    try {
      const token = auth.token;
      const res = await fetch(`${API_URL}/trpc/personality.updateConfig`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ hireId: activeHireId, ...config }),
      });

      if (!res.ok) throw new Error('Failed to save');

      setSaved(true);
      showToast('Voice and personality settings saved', 'success');
      setTimeout(() => setSaved(false), 3000);
    } catch {
      showToast('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const updateField = <K extends keyof PersonalityConfig>(key: K, value: PersonalityConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
        Loading voice settings...
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 24, maxWidth: 640 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={() => navigate('/settings')} style={backBtnStyle} aria-label="Back to settings">
          <ArrowLeft size={16} />
        </button>
        <Mic size={20} style={{ color: 'var(--color-electric-blue)' }} />
        <span style={headingStyle}>Voice and Personality</span>
      </div>

      {!activeHireId && (
        <div style={{
          padding: '16px 20px',
          background: 'rgba(255,149,0,0.08)',
          border: '1px solid rgba(255,149,0,0.2)',
          borderRadius: 'var(--radius-lg)',
          marginBottom: 24,
          fontSize: 13,
          color: '#FFB340',
          lineHeight: 1.5,
        }}>
          Hire a role from the Marketplace to configure personality and voice settings.
        </div>
      )}

      {/* Response Style */}
      <Section title="Response Style">
        <FieldRow label="Verbosity">
          <SegmentedControl
            options={[
              { value: 'concise', label: 'Concise' },
              { value: 'balanced', label: 'Balanced' },
              { value: 'detailed', label: 'Detailed' },
            ]}
            value={config.verbosity}
            onChange={(v) => updateField('verbosity', v)}
          />
        </FieldRow>

        <FieldRow label="Formality">
          <SegmentedControl
            options={[
              { value: 'professional', label: 'Professional' },
              { value: 'warm', label: 'Warm' },
              { value: 'friendly', label: 'Friendly' },
            ]}
            value={config.formalityLevel}
            onChange={(v) => updateField('formalityLevel', v)}
          />
        </FieldRow>

        <FieldRow label="Encouragement">
          <SegmentedControl
            options={[
              { value: 'minimal', label: 'Minimal' },
              { value: 'moderate', label: 'Moderate' },
              { value: 'enthusiastic', label: 'Enthusiastic' },
            ]}
            value={config.encouragement}
            onChange={(v) => updateField('encouragement', v)}
          />
        </FieldRow>
      </Section>

      {/* Voice */}
      <Section title="Voice Settings">
        <FieldRow label="Voice Mode">
          <SegmentedControl
            options={[
              { value: 'text', label: 'Text Only' },
              { value: 'voice_preferred', label: 'Voice Preferred' },
              { value: 'voice', label: 'Voice Only' },
            ]}
            value={config.voiceMode}
            onChange={(v) => updateField('voiceMode', v)}
          />
        </FieldRow>

        <FieldRow label="Voice Speed">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input
              type="range"
              min={0.75}
              max={1.25}
              step={0.05}
              value={config.voiceSpeed}
              onChange={(e) => updateField('voiceSpeed', parseFloat(e.target.value))}
              style={{ flex: 1, accentColor: 'var(--color-electric-blue)' }}
            />
            <span style={{ fontSize: 13, color: '#E8EDF5', fontFamily: 'var(--font-mono)', minWidth: 40 }}>
              {config.voiceSpeed.toFixed(2)}x
            </span>
          </div>
        </FieldRow>
      </Section>

      {/* Ambient */}
      <Section title="Ambient Audio">
        <FieldRow label="Enable ambient audio">
          <ToggleSwitch
            checked={config.ambientAudio}
            onChange={(v) => updateField('ambientAudio', v)}
          />
        </FieldRow>

        {config.ambientAudio && (
          <FieldRow label="Volume">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={config.ambientVolume}
                onChange={(e) => updateField('ambientVolume', parseInt(e.target.value))}
                style={{ flex: 1, accentColor: 'var(--color-electric-blue)' }}
              />
              <span style={{ fontSize: 13, color: '#E8EDF5', fontFamily: 'var(--font-mono)', minWidth: 32 }}>
                {config.ambientVolume}%
              </span>
            </div>
          </FieldRow>
        )}
      </Section>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saving || !activeHireId}
        style={{
          ...primaryBtnStyle,
          opacity: saving || !activeHireId ? 0.5 : 1,
          cursor: saving || !activeHireId ? 'not-allowed' : 'pointer',
        }}
      >
        {saved ? (
          <>
            <CheckCircle size={14} />
            Saved
          </>
        ) : saving ? 'Saving...' : (
          <>
            <Save size={14} />
            Save Settings
          </>
        )}
      </button>
    </div>
  );
}

// ── Shared sub-components ─────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={sectionStyle}>
      <div style={sectionTitleStyle}>{title}</div>
      {children}
    </div>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 6 }}>
        {label}
      </div>
      {children}
    </div>
  );
}

function SegmentedControl({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ display: 'flex', gap: 0, borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          style={{
            flex: 1,
            padding: '8px 12px',
            background: value === opt.value ? 'var(--color-electric-blue)' : 'var(--color-surface-2)',
            color: value === opt.value ? '#fff' : 'var(--color-text-muted)',
            border: 'none',
            fontSize: 12,
            fontWeight: 600,
            fontFamily: 'var(--font-sans)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        width: 44,
        height: 24,
        borderRadius: 12,
        background: checked ? 'var(--color-electric-blue)' : 'var(--color-surface-2)',
        border: '1px solid var(--color-border)',
        position: 'relative',
        cursor: 'pointer',
        transition: 'background 0.2s ease',
        padding: 0,
      }}
    >
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: '#fff',
          position: 'absolute',
          top: 2,
          left: checked ? 22 : 2,
          transition: 'left 0.2s ease',
        }}
      />
    </button>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────

const headingStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 800,
  fontFamily: 'var(--font-sans)',
  color: '#E8EDF5',
};

const backBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 32,
  height: 32,
  background: 'var(--color-surface-1)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--color-text-muted)',
  cursor: 'pointer',
};

const sectionStyle: React.CSSProperties = {
  marginBottom: 24,
  padding: '16px 20px',
  background: 'var(--color-surface-1)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  fontFamily: 'var(--font-mono)',
  color: 'var(--color-ion-cyan)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: 14,
};

const primaryBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '10px 20px',
  background: 'var(--color-electric-blue)',
  color: '#fff',
  fontFamily: 'var(--font-sans)',
  fontSize: 14,
  fontWeight: 600,
  border: 'none',
  borderRadius: 'var(--radius-md)',
  cursor: 'pointer',
  transition: 'opacity 0.15s ease',
};

export default SettingsVoicePage;
