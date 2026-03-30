import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Accessibility, Save, CheckCircle } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { showToast } from '@/components/ui/Toast';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.trust-agent.ai';

interface A11yConfig {
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
}

export function SettingsAccessibilityPage() {
  const navigate = useNavigate();
  const auth = useAuthStore();
  const [config, setConfig] = React.useState<A11yConfig>({
    highContrast: false,
    largeText: false,
    reducedMotion: false,
  });
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [activeHireId, setActiveHireId] = React.useState<string | null>(null);

  // Load from personality config
  React.useEffect(() => {
    async function load() {
      try {
        // Also load from localStorage for local-only mode
        const local = localStorage.getItem('ta_accessibility');
        if (local) {
          try {
            setConfig(JSON.parse(local));
          } catch { /* ignore */ }
        }

        const token = auth.token;
        const hiresRes = await fetch(`${API_URL}/trpc/hires.listActive`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (hiresRes.ok) {
          const hiresData = await hiresRes.json();
          const hires = hiresData.result?.data ?? hiresData.data ?? [];
          const firstHire = Array.isArray(hires) ? hires[0] : null;

          if (firstHire?.id) {
            setActiveHireId(firstHire.id);

            const configRes = await fetch(
              `${API_URL}/trpc/personality.getConfig?input=${encodeURIComponent(JSON.stringify({ hireId: firstHire.id }))}`,
              { headers: token ? { Authorization: `Bearer ${token}` } : {} }
            );

            if (configRes.ok) {
              const configData = await configRes.json();
              const result = configData.result?.data ?? configData.data;
              if (result) {
                setConfig({
                  highContrast: result.highContrast ?? false,
                  largeText: result.largeText ?? false,
                  reducedMotion: result.reducedMotion ?? false,
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

  // Apply accessibility to document in real-time
  React.useEffect(() => {
    document.documentElement.classList.toggle('high-contrast', config.highContrast);
    document.documentElement.classList.toggle('large-text', config.largeText);
    document.documentElement.classList.toggle('reduced-motion', config.reducedMotion);

    // Persist locally for instant apply on next load
    try {
      localStorage.setItem('ta_accessibility', JSON.stringify(config));
    } catch { /* ignore */ }
  }, [config]);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    setSaved(false);

    try {
      if (activeHireId) {
        const token = auth.token;
        const res = await fetch(`${API_URL}/trpc/personality.updateConfig`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            hireId: activeHireId,
            highContrast: config.highContrast,
            largeText: config.largeText,
            reducedMotion: config.reducedMotion,
          }),
        });

        if (!res.ok) throw new Error('Failed to save');
      }

      setSaved(true);
      showToast('Accessibility settings saved', 'success');
      setTimeout(() => setSaved(false), 3000);
    } catch {
      showToast('Failed to save. Settings applied locally.', 'info');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
        Loading accessibility settings...
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
        <Accessibility size={20} style={{ color: 'var(--color-electric-blue)' }} />
        <span style={headingStyle}>Accessibility</span>
      </div>

      <p style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.6, marginBottom: 24 }}>
        These settings take effect immediately. They are saved both locally on your device and synced to your account.
      </p>

      {/* High Contrast */}
      <Section title="Display">
        <ToggleRow
          label="High contrast mode"
          description="Increases contrast between text and backgrounds for better readability"
          checked={config.highContrast}
          onChange={(v) => setConfig((prev) => ({ ...prev, highContrast: v }))}
        />

        <ToggleRow
          label="Large text"
          description="Increases font sizes throughout the application"
          checked={config.largeText}
          onChange={(v) => setConfig((prev) => ({ ...prev, largeText: v }))}
        />

        <ToggleRow
          label="Reduced motion"
          description="Minimizes animations and transitions"
          checked={config.reducedMotion}
          onChange={(v) => setConfig((prev) => ({ ...prev, reducedMotion: v }))}
        />
      </Section>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          ...primaryBtnStyle,
          opacity: saving ? 0.5 : 1,
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

// ── Sub-components ────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={sectionStyle}>
      <div style={sectionTitleStyle}>{title}</div>
      {children}
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 16 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#E8EDF5', marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{description}</div>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        aria-label={label}
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
          flexShrink: 0,
          marginTop: 2,
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
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────

const headingStyle: React.CSSProperties = {
  fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-sans)', color: '#E8EDF5',
};

const backBtnStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  width: 32, height: 32, background: 'var(--color-surface-1)',
  border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
  color: 'var(--color-text-muted)', cursor: 'pointer',
};

const sectionStyle: React.CSSProperties = {
  marginBottom: 24, padding: '16px 20px', background: 'var(--color-surface-1)',
  border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)',
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)',
  color: 'var(--color-ion-cyan)', textTransform: 'uppercase',
  letterSpacing: '0.06em', marginBottom: 14,
};

const primaryBtnStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 8,
  padding: '10px 20px', background: 'var(--color-electric-blue)', color: '#fff',
  fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600,
  border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer',
  transition: 'opacity 0.15s ease',
};

export default SettingsAccessibilityPage;
