import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Download, Trash2, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { showToast } from '@/components/ui/Toast';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.trust-agent.ai';

export function SettingsPrivacyPage() {
  const navigate = useNavigate();
  const auth = useAuthStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [deleteText, setDeleteText] = React.useState('');
  const [deleting, setDeleting] = React.useState(false);
  const [exporting, setExporting] = React.useState(false);

  const handleExportData = async () => {
    if (exporting) return;
    setExporting(true);

    try {
      const token = auth.token;
      const res = await fetch(`${API_URL}/api/v1/auth/export-data`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) throw new Error('Export failed');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `trust-agent-data-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      showToast('Data export downloaded', 'success');
    } catch {
      showToast('Failed to export data. Please try again.', 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteText !== 'DELETE' || deleting) return;
    setDeleting(true);

    try {
      const token = auth.token;
      const res = await fetch(`${API_URL}/trpc/auth.deleteAccount`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({}),
      });

      if (!res.ok) throw new Error('Delete failed');

      showToast('Account deleted. We are sorry to see you go.', 'info');
      auth.logout();
    } catch {
      showToast('Failed to delete account. Please contact support.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 24, maxWidth: 640 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={() => navigate('/settings')} style={backBtnStyle} aria-label="Back to settings">
          <ArrowLeft size={16} />
        </button>
        <Shield size={20} style={{ color: 'var(--color-electric-blue)' }} />
        <span style={headingStyle}>Privacy and Data</span>
      </div>

      {/* Data Architecture */}
      <Section title="Your Data Architecture">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <InfoBlock
            icon={<Shield size={18} style={{ color: 'var(--color-success)' }} />}
            title="Your Brain lives on YOUR device"
            description="All conversation history, learned preferences, and personal context are stored locally on your device or in your personal cloud drive (Google Drive, iCloud, or Dropbox). Trust Agent servers never store your personal data."
          />

          <InfoBlock
            icon={<Shield size={18} style={{ color: 'var(--color-ion-cyan)' }} />}
            title="Zero-knowledge architecture"
            description="We cannot read your conversations even if we wanted to. Your Brain files are encrypted at rest and in transit. Only your device holds the decryption key."
          />

          <InfoBlock
            icon={<Shield size={18} style={{ color: 'var(--color-electric-blue)' }} />}
            title="What we DO store"
            description="Your account email, subscription status, and anonymized usage metrics. We use these to improve the product and never sell data to third parties."
          />
        </div>
      </Section>

      {/* Data Export */}
      <Section title="Data Export">
        <p style={{ fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.6, marginBottom: 12 }}>
          Download a complete copy of all data Trust Agent holds about your account. This includes your profile, subscription history, and anonymized usage data.
        </p>
        <button
          onClick={handleExportData}
          disabled={exporting}
          style={{
            ...ghostBtnStyle,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            opacity: exporting ? 0.5 : 1,
          }}
        >
          <Download size={14} />
          {exporting ? 'Preparing export...' : 'Export my data'}
        </button>
      </Section>

      {/* Delete Account */}
      <Section title="Danger Zone">
        <p style={{ fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.6, marginBottom: 12 }}>
          Permanently delete your Trust Agent account. This will cancel all active hires, remove your account from our servers, and cannot be undone. Your local Brain files will remain on your device.
        </p>

        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            style={{
              ...ghostBtnStyle,
              color: 'var(--color-error)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Trash2 size={14} />
            Delete my account
          </button>
        ) : (
          <div
            style={{
              padding: 16,
              background: 'rgba(255,59,48,0.06)',
              border: '1px solid rgba(255,59,48,0.2)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <AlertTriangle size={16} style={{ color: 'var(--color-error)' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-error)' }}>
                This action is irreversible
              </span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.5, marginBottom: 12 }}>
              Type DELETE to confirm account deletion.
            </p>
            <input
              type="text"
              value={deleteText}
              onChange={(e) => setDeleteText(e.target.value)}
              placeholder="Type DELETE"
              style={{
                ...inputStyle,
                borderColor: 'rgba(255,59,48,0.3)',
                marginBottom: 12,
              }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteText !== 'DELETE' || deleting}
                style={{
                  ...primaryBtnStyle,
                  background: deleteText === 'DELETE' ? 'var(--color-error)' : 'rgba(255,59,48,0.3)',
                  cursor: deleteText === 'DELETE' && !deleting ? 'pointer' : 'not-allowed',
                }}
              >
                {deleting ? 'Deleting...' : 'Permanently Delete Account'}
              </button>
              <button
                onClick={() => { setShowDeleteConfirm(false); setDeleteText(''); }}
                style={ghostBtnStyle}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </Section>
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

function InfoBlock({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <div style={{ flexShrink: 0, marginTop: 2 }}>{icon}</div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#E8EDF5', marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.6 }}>{description}</div>
      </div>
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

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', background: 'var(--color-surface-2)',
  border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
  color: '#E8EDF5', fontFamily: 'var(--font-sans)', fontSize: 13, outline: 'none',
};

const primaryBtnStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 8,
  padding: '10px 20px', background: 'var(--color-electric-blue)', color: '#fff',
  fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600,
  border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer',
};

const ghostBtnStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 4,
  padding: '8px 14px', background: 'transparent',
  color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)',
  fontSize: 12, fontWeight: 600, border: 'none',
  borderRadius: 'var(--radius-sm)', cursor: 'pointer',
};

export default SettingsPrivacyPage;
