/**
 * Phase 12.3 - Trial Countdown
 * Shows on hired role cards:
 * - "4 days left in your free trial"
 * - "Subscribe to keep [companion name]"
 */
import { Clock, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';

// --- Types ---

interface TrialCountdownProps {
  /** Days remaining in trial */
  daysRemaining: number;
  /** Name of the companion */
  companionName: string;
  /** Callback when user clicks subscribe */
  onSubscribe: () => void;
  /** Whether to show inline (small) or prominent (large) variant */
  variant?: 'inline' | 'prominent';
}

export function TrialCountdown({
  daysRemaining,
  companionName,
  onSubscribe,
  variant = 'inline',
}: TrialCountdownProps) {
  const isUrgent = daysRemaining <= 2;
  const isExpiring = daysRemaining <= 0;
  const accentColor = isExpiring ? '#EF4444' : isUrgent ? '#F59E0B' : 'var(--color-electric-blue)';

  if (variant === 'prominent') {
    return (
      <div
        style={{
          padding: 16,
          background: isExpiring ? 'rgba(239,68,68,0.06)' : isUrgent ? 'rgba(245,158,11,0.06)' : 'rgba(30,111,255,0.06)',
          border: `1px solid ${isExpiring ? 'rgba(239,68,68,0.2)' : isUrgent ? 'rgba(245,158,11,0.2)' : 'rgba(30,111,255,0.15)'}`,
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: `${accentColor}20`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Clock size={18} color={accentColor} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: accentColor,
              fontFamily: 'var(--font-sans)',
              marginBottom: 2,
            }}
          >
            {isExpiring
              ? 'Trial expired'
              : `${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'} left in your free trial`}
          </div>
          <div
            style={{
              fontSize: 12,
              color: 'var(--color-text-muted)',
              fontFamily: 'var(--font-sans)',
            }}
          >
            {isExpiring
              ? `Subscribe now to keep ${companionName}`
              : `Subscribe to keep ${companionName} after your trial ends`}
          </div>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={onSubscribe}
          icon={<Zap size={14} />}
          style={{
            flexShrink: 0,
            background: accentColor,
          }}
        >
          Subscribe
        </Button>
      </div>
    );
  }

  // Inline variant - compact for card overlays
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 10px',
        background: isExpiring ? 'rgba(239,68,68,0.08)' : isUrgent ? 'rgba(245,158,11,0.08)' : 'rgba(30,111,255,0.06)',
        borderRadius: 'var(--radius-md)',
        border: `1px solid ${isExpiring ? 'rgba(239,68,68,0.15)' : isUrgent ? 'rgba(245,158,11,0.15)' : 'rgba(30,111,255,0.1)'}`,
      }}
    >
      <Clock size={12} color={accentColor} style={{ flexShrink: 0 }} />
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: accentColor,
          fontFamily: 'var(--font-sans)',
          flex: 1,
        }}
      >
        {isExpiring
          ? 'Trial expired'
          : `${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'} left`}
      </span>
      <button
        onClick={onSubscribe}
        style={{
          fontSize: 10,
          fontWeight: 700,
          fontFamily: 'var(--font-sans)',
          color: '#fff',
          background: accentColor,
          border: 'none',
          borderRadius: 'var(--radius-sm)',
          padding: '3px 8px',
          cursor: 'pointer',
          flexShrink: 0,
          transition: 'opacity 150ms ease',
        }}
      >
        Subscribe
      </button>
    </div>
  );
}

// --- Trial calculation helper ---

const FREE_TRIAL_DAYS = 7;

export interface TrialInfo {
  isOnTrial: boolean;
  daysRemaining: number;
  trialEndDate: Date;
}

/**
 * Calculate trial status from hire activation date.
 */
export function calculateTrialInfo(activatedAt: string | Date): TrialInfo {
  const activated = typeof activatedAt === 'string' ? new Date(activatedAt) : activatedAt;
  const trialEndDate = new Date(activated.getTime() + FREE_TRIAL_DAYS * 24 * 60 * 60 * 1000);
  const now = new Date();
  const diffMs = trialEndDate.getTime() - now.getTime();
  const daysRemaining = Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));

  return {
    isOnTrial: daysRemaining > 0,
    daysRemaining,
    trialEndDate,
  };
}
