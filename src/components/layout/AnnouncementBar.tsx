import React from 'react';
import { X, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DISMISS_KEY = 'ta_announcement_dismissed';

export function AnnouncementBar() {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = React.useState(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, 'true');
    } catch {
      // Storage might be blocked
    }
  };

  if (dismissed) {
    return null;
  }

  return (
    <div
      role="status"
      aria-label="Announcement"
      style={{
        position: 'relative',
        zIndex: 'var(--z-announcement)' as unknown as number,
        background: 'var(--primary-600)',
        color: 'var(--text-inverse)',
        fontFamily: 'var(--font-sans)',
        fontSize: 14,
        fontWeight: 500,
        textAlign: 'center',
        padding: '10px var(--space-12)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--space-3)',
        minHeight: 44,
      }}
    >
      <span>NHS and social prescribing referrals now accepted</span>
      <button
        onClick={() => navigate('/nhs')}
        aria-label="Learn more about NHS referrals"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          background: 'rgba(255,255,255,0.15)',
          border: '1px solid rgba(255,255,255,0.25)',
          borderRadius: 'var(--radius-pill)',
          color: 'var(--text-inverse)',
          fontFamily: 'var(--font-sans)',
          fontSize: 12,
          fontWeight: 600,
          padding: '4px 12px',
          cursor: 'pointer',
          transition: 'all var(--transition-fast)',
          minHeight: 28,
        }}
      >
        Learn more
        <ArrowRight size={12} />
      </button>
      <button
        onClick={handleDismiss}
        aria-label="Dismiss announcement"
        style={{
          position: 'absolute',
          right: 'var(--space-3)',
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 28,
          height: 28,
          borderRadius: 'var(--radius-full)',
          background: 'rgba(255,255,255,0.1)',
          border: 'none',
          color: 'var(--text-inverse)',
          cursor: 'pointer',
          transition: 'all var(--transition-fast)',
        }}
      >
        <X size={14} />
      </button>
    </div>
  );
}
