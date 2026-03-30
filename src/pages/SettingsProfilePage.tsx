import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Save, Mail, CheckCircle } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { showToast } from '@/components/ui/Toast';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.trust-agent.ai';

export function SettingsProfilePage() {
  const navigate = useNavigate();
  const auth = useAuthStore();
  const [name, setName] = React.useState(auth.user?.name || '');
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  const handleSave = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    setSaved(false);

    try {
      const token = auth.token;
      const res = await fetch(`${API_URL}/trpc/auth.updateProfile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (!res.ok) {
        throw new Error('Failed to update profile');
      }

      const data = await res.json();
      const result = data.result?.data ?? data.data ?? data;

      // Update auth store with new name
      if (auth.user) {
        useAuthStore.setState({
          user: { ...auth.user, name: result.name || name.trim() },
        });
      }

      setSaved(true);
      showToast('Profile updated', 'success');
      setTimeout(() => setSaved(false), 3000);
    } catch {
      showToast('Failed to update profile. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 24, maxWidth: 640 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button
          onClick={() => navigate('/settings')}
          style={backBtnStyle}
          aria-label="Back to settings"
        >
          <ArrowLeft size={16} />
        </button>
        <User size={20} style={{ color: 'var(--color-electric-blue)' }} />
        <span style={headingStyle}>Profile</span>
      </div>

      {/* Avatar */}
      <Section title="Avatar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {auth.user?.avatarUrl ? (
            <img
              src={auth.user.avatarUrl}
              alt="Avatar"
              style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover' }}
            />
          ) : (
            <div style={avatarPlaceholderStyle}>
              <User size={28} style={{ color: 'var(--color-electric-blue)' }} />
            </div>
          )}
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
            Your avatar is synced from your Google account. To change it, update your Google profile picture.
          </p>
        </div>
      </Section>

      {/* Name */}
      <Section title="Display Name">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label
            htmlFor="profile-name"
            style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)' }}
          >
            Name
          </label>
          <input
            id="profile-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            style={inputStyle}
          />
        </div>
      </Section>

      {/* Email - read only */}
      <Section title="Email">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Mail size={14} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
          <span
            style={{
              fontSize: 13,
              color: '#E8EDF5',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {auth.user?.email || 'No email'}
          </span>
        </div>
        <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 6, lineHeight: 1.5 }}>
          Email cannot be changed. It is tied to your Google account.
        </p>
      </Section>

      {/* Account Info */}
      <Section title="Account">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Plan</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#E8EDF5', textTransform: 'capitalize' }}>
              {auth.user?.plan || 'Free'}
            </span>
          </div>
          {auth.user?.createdAt && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Member since</span>
              <span style={{ fontSize: 13, color: '#E8EDF5' }}>
                {new Date(auth.user.createdAt).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </Section>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saving || !name.trim()}
        style={{
          ...primaryBtnStyle,
          opacity: saving || !name.trim() ? 0.5 : 1,
          cursor: saving || !name.trim() ? 'not-allowed' : 'pointer',
        }}
      >
        {saved ? (
          <>
            <CheckCircle size={14} />
            Saved
          </>
        ) : saving ? (
          'Saving...'
        ) : (
          <>
            <Save size={14} />
            Save Changes
          </>
        )}
      </button>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={sectionStyle}>
      <div style={sectionTitleStyle}>{title}</div>
      {children}
    </div>
  );
}

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

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  background: 'var(--color-surface-2)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  color: '#E8EDF5',
  fontFamily: 'var(--font-sans)',
  fontSize: 13,
  outline: 'none',
};

const avatarPlaceholderStyle: React.CSSProperties = {
  width: 64,
  height: 64,
  borderRadius: '50%',
  background: 'rgba(30,111,255,0.12)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
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

export default SettingsProfilePage;
