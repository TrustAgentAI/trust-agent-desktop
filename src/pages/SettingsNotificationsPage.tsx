import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, Save, CheckCircle } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { showToast } from '@/components/ui/Toast';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.trust-agent.ai';

interface NotificationPrefs {
  pushEnabled: boolean;
  emailDigest: boolean;
  sessionReminders: boolean;
  marketplaceUpdates: boolean;
  safeguardingAlerts: boolean;
}

export function SettingsNotificationsPage() {
  const navigate = useNavigate();
  const auth = useAuthStore();
  const [prefs, setPrefs] = React.useState<NotificationPrefs>({
    pushEnabled: false,
    emailDigest: true,
    sessionReminders: true,
    marketplaceUpdates: false,
    safeguardingAlerts: true,
  });
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [pushSupported] = React.useState(() => 'Notification' in window && 'serviceWorker' in navigator);
  const [pushPermission, setPushPermission] = React.useState<NotificationPermission>(
    'Notification' in window ? Notification.permission : 'denied'
  );

  React.useEffect(() => {
    // Load from localStorage
    try {
      const stored = localStorage.getItem('ta_notification_prefs');
      if (stored) {
        setPrefs(JSON.parse(stored));
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  const handlePushToggle = async (enabled: boolean) => {
    if (!pushSupported) {
      showToast('Push notifications are not supported in this browser', 'info');
      return;
    }

    if (enabled && pushPermission !== 'granted') {
      const permission = await Notification.requestPermission();
      setPushPermission(permission);
      if (permission !== 'granted') {
        showToast('Notification permission was denied by your browser', 'info');
        return;
      }
    }

    setPrefs((prev) => ({ ...prev, pushEnabled: enabled }));

    if (enabled) {
      // Register push subscription with server
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: import.meta.env.VITE_VAPID_PUBLIC_KEY,
        });

        const token = auth.token;
        await fetch(`${API_URL}/trpc/notifications.registerPushSubscription`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            subscription: subscription.toJSON(),
            platform: 'desktop',
          }),
        });
      } catch {
        showToast('Could not register push notifications', 'error');
      }
    }
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    setSaved(false);

    try {
      localStorage.setItem('ta_notification_prefs', JSON.stringify(prefs));
      setSaved(true);
      showToast('Notification preferences saved', 'success');
      setTimeout(() => setSaved(false), 3000);
    } catch {
      showToast('Failed to save preferences', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
        Loading notification settings...
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
        <Bell size={20} style={{ color: 'var(--color-electric-blue)' }} />
        <span style={headingStyle}>Notifications</span>
      </div>

      {/* Push Notifications */}
      <Section title="Push Notifications">
        <ToggleRow
          label="Enable push notifications"
          description={
            !pushSupported
              ? 'Push notifications are not supported in this browser'
              : pushPermission === 'denied'
              ? 'Notification permission was denied. Enable it in your browser settings.'
              : 'Receive instant alerts for important events'
          }
          checked={prefs.pushEnabled}
          onChange={handlePushToggle}
          disabled={!pushSupported || pushPermission === 'denied'}
        />
      </Section>

      {/* Notification Types */}
      <Section title="Notification Preferences">
        <ToggleRow
          label="Email digest"
          description="Receive a daily summary of activity via email"
          checked={prefs.emailDigest}
          onChange={(v) => setPrefs((prev) => ({ ...prev, emailDigest: v }))}
        />

        <ToggleRow
          label="Session reminders"
          description="Get reminded before scheduled sessions"
          checked={prefs.sessionReminders}
          onChange={(v) => setPrefs((prev) => ({ ...prev, sessionReminders: v }))}
        />

        <ToggleRow
          label="Marketplace updates"
          description="New roles and features in the marketplace"
          checked={prefs.marketplaceUpdates}
          onChange={(v) => setPrefs((prev) => ({ ...prev, marketplaceUpdates: v }))}
        />

        <ToggleRow
          label="Safeguarding alerts"
          description="Critical safety alerts (always recommended)"
          checked={prefs.safeguardingAlerts}
          onChange={(v) => setPrefs((prev) => ({ ...prev, safeguardingAlerts: v }))}
        />
      </Section>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saving}
        style={{ ...primaryBtnStyle, opacity: saving ? 0.5 : 1 }}
      >
        {saved ? (
          <>
            <CheckCircle size={14} />
            Saved
          </>
        ) : saving ? 'Saving...' : (
          <>
            <Save size={14} />
            Save Preferences
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
  disabled = false,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 16, opacity: disabled ? 0.5 : 1 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#E8EDF5', marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{description}</div>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        style={{
          width: 44, height: 24, borderRadius: 12,
          background: checked ? 'var(--color-electric-blue)' : 'var(--color-surface-2)',
          border: '1px solid var(--color-border)',
          position: 'relative', cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'background 0.2s ease', padding: 0, flexShrink: 0, marginTop: 2,
        }}
      >
        <div style={{
          width: 18, height: 18, borderRadius: '50%', background: '#fff',
          position: 'absolute', top: 2, left: checked ? 22 : 2,
          transition: 'left 0.2s ease',
        }} />
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

export default SettingsNotificationsPage;
