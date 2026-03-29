/**
 * StreaksMilestones - displays current streak, milestone badges,
 * and celebration animations when new milestones are earned.
 */
import React, { useEffect, useState } from 'react';
import { Flame, Award, Trophy, Clock, Zap } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { useStreaksStore, Milestone } from '@/store/streaksStore';

// --- Celebration overlay ---

function CelebrationOverlay({
  milestone,
  onDismiss,
}: {
  milestone: Milestone;
  onDismiss: () => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Animate in
    requestAnimationFrame(() => setVisible(true));
    // Auto-dismiss after 5 seconds
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300);
    }, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.6)',
        zIndex: 9999,
        opacity: visible ? 1 : 0,
        transition: 'opacity 300ms ease',
        pointerEvents: visible ? 'auto' : 'none',
      }}
      onClick={() => {
        setVisible(false);
        setTimeout(onDismiss, 300);
      }}
    >
      <div
        style={{
          background: 'var(--color-surface-1)',
          border: '1px solid var(--color-border-active)',
          borderRadius: 'var(--radius-lg)',
          padding: 32,
          textAlign: 'center',
          maxWidth: 360,
          transform: visible ? 'scale(1)' : 'scale(0.8)',
          transition: 'transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {/* Sparkle ring */}
        <div
          style={{
            width: 72,
            height: 72,
            margin: '0 auto 16px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(30,111,255,0.2), rgba(0,212,255,0.2))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        >
          <Trophy size={32} color="var(--color-electric-blue)" />
        </div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--color-electric-blue)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 8,
            fontFamily: 'var(--font-sans)',
          }}
        >
          New Milestone!
        </div>
        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: '#E8EDF5',
            marginBottom: 8,
            fontFamily: 'var(--font-sans)',
          }}
        >
          {milestone.label}
        </div>
        {milestone.roleName && (
          <div
            style={{
              fontSize: 12,
              color: 'var(--color-text-muted)',
              fontFamily: 'var(--font-sans)',
            }}
          >
            with {milestone.roleName}
          </div>
        )}
        <div
          style={{
            fontSize: 10,
            color: 'var(--color-text-muted)',
            marginTop: 16,
            fontFamily: 'var(--font-sans)',
          }}
        >
          Click anywhere to dismiss
        </div>
      </div>
    </div>
  );
}

// --- Milestone badge card ---

function MilestoneBadge({ milestone }: { milestone: Milestone }) {
  const iconMap: Record<string, React.ReactNode> = {
    session: <Award size={14} />,
    streak: <Zap size={14} />,
    time: <Clock size={14} />,
  };

  const colorMap: Record<string, string> = {
    session: 'var(--color-electric-blue)',
    streak: '#F59E0B',
    time: 'var(--color-ion-cyan)',
  };

  const icon = iconMap[milestone.type] || <Award size={14} />;
  const color = colorMap[milestone.type] || 'var(--color-electric-blue)';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 10px',
        background: `color-mix(in srgb, ${color} 8%, transparent)`,
        border: `1px solid color-mix(in srgb, ${color} 20%, transparent)`,
        borderRadius: 'var(--radius-md)',
        minWidth: 0,
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 'var(--radius-sm)',
          background: `color-mix(in srgb, ${color} 15%, transparent)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: '#E8EDF5',
            fontFamily: 'var(--font-sans)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {milestone.label}
        </div>
        <div
          style={{
            fontSize: 9,
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {new Date(milestone.achievedAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}

// --- Main component ---

interface StreaksMilestonesProps {
  accentColor?: string;
  compact?: boolean;
}

export function StreaksMilestones({ accentColor, compact = false }: StreaksMilestonesProps) {
  const {
    currentStreak,
    longestStreak,
    milestonesReached,
    pendingCelebrations,
    dismissCelebration,
  } = useStreaksStore();

  const accent = accentColor || 'var(--color-electric-blue)';

  // Show the first pending celebration
  const activeCelebration = pendingCelebrations.length > 0 ? pendingCelebrations[0] : null;

  // Sort milestones newest first
  const sortedMilestones = [...milestonesReached].sort((a, b) => b.achievedAt - a.achievedAt);

  if (compact) {
    return (
      <>
        {activeCelebration && (
          <CelebrationOverlay
            milestone={activeCelebration}
            onDismiss={() => dismissCelebration(activeCelebration.id)}
          />
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Streak counter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Flame size={14} color={currentStreak > 0 ? '#F59E0B' : 'var(--color-text-muted)'} />
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: currentStreak > 0 ? '#F59E0B' : 'var(--color-text-muted)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {currentStreak}
            </span>
            <span
              style={{
                fontSize: 11,
                color: 'var(--color-text-muted)',
                fontFamily: 'var(--font-sans)',
              }}
            >
              day{currentStreak !== 1 ? 's' : ''}
            </span>
          </div>
          {/* Milestone count */}
          {milestonesReached.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Trophy size={12} color={accent} />
              <span
                style={{
                  fontSize: 11,
                  color: accent,
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 600,
                }}
              >
                {milestonesReached.length}
              </span>
            </div>
          )}
        </div>
      </>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Celebration overlay */}
      {activeCelebration && (
        <CelebrationOverlay
          milestone={activeCelebration}
          onDismiss={() => dismissCelebration(activeCelebration.id)}
        />
      )}

      {/* Streak card */}
      <Card padding="16px">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 'var(--radius-md)',
                background: currentStreak > 0
                  ? 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(239,68,68,0.15))'
                  : 'var(--color-surface-2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Flame
                size={20}
                color={currentStreak > 0 ? '#F59E0B' : 'var(--color-text-muted)'}
                fill={currentStreak >= 7 ? '#F59E0B' : 'none'}
              />
            </div>
            <div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: currentStreak > 0 ? '#F59E0B' : 'var(--color-text-muted)',
                  fontFamily: 'var(--font-mono)',
                  lineHeight: 1,
                }}
              >
                {currentStreak}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--color-text-muted)',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                day streak
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div
              style={{
                fontSize: 10,
                color: 'var(--color-text-muted)',
                fontFamily: 'var(--font-sans)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Best
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: '#E8EDF5',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {longestStreak} days
            </div>
          </div>
        </div>
      </Card>

      {/* Milestones */}
      {sortedMilestones.length > 0 && (
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: 8,
              fontFamily: 'var(--font-sans)',
            }}
          >
            Milestones ({sortedMilestones.length})
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 8,
            }}
          >
            {sortedMilestones.map((ms) => (
              <MilestoneBadge key={ms.id} milestone={ms} />
            ))}
          </div>
        </div>
      )}

      {sortedMilestones.length === 0 && (
        <Card padding="16px">
          <div
            style={{
              textAlign: 'center',
              padding: '12px 0',
            }}
          >
            <Trophy size={24} color="var(--color-text-muted)" style={{ marginBottom: 8, opacity: 0.4 }} />
            <div
              style={{
                fontSize: 12,
                color: 'var(--color-text-muted)',
                fontFamily: 'var(--font-sans)',
              }}
            >
              Start chatting to earn your first milestone
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

export default StreaksMilestones;
