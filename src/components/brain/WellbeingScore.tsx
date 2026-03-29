/**
 * WellbeingScore - displays weekly wellbeing trend as colored dots,
 * a status indicator, and a link to the guardian dashboard.
 * Never shows session content - only the wellbeing signal.
 */
import { useMemo } from 'react';
import { Shield, TrendingUp, TrendingDown, Minus, ExternalLink, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  getWeeklyTrend,
  getCurrentWeekScore,
  getWellbeingStatus,
  getPendingAlerts,
  type WeeklyScore,
} from '@/lib/wellbeing';

interface WellbeingScoreProps {
  accentColor?: string;
  onNavigateToGuardian?: () => void;
  compact?: boolean;
}

function scoreToColor(score: number): string {
  if (score >= 4) return '#00AA78'; // green
  if (score >= 3) return '#F59E0B'; // amber
  return '#CC3333'; // red
}

function scoreToLabel(score: number): string {
  if (score >= 5) return 'Excellent';
  if (score >= 4) return 'Good';
  if (score >= 3) return 'Fair';
  if (score >= 2) return 'Low';
  return 'Very low';
}

function TrendDot({ score, weekLabel }: { score: number; weekLabel: string }) {
  const color = scoreToColor(score);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
      }}
      title={`${weekLabel}: ${scoreToLabel(score)} (${score}/5)`}
    >
      <div
        style={{
          width: 14,
          height: 14,
          borderRadius: '50%',
          background: color,
          border: `2px solid color-mix(in srgb, ${color} 30%, transparent)`,
          transition: 'all 200ms ease',
        }}
      />
      <span
        style={{
          fontSize: 8,
          color: 'var(--color-text-muted)',
          fontFamily: 'var(--font-mono)',
        }}
      >
        {score}
      </span>
    </div>
  );
}

function EmptyDot() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div
        style={{
          width: 14,
          height: 14,
          borderRadius: '50%',
          background: 'var(--color-surface-2)',
          border: '2px solid var(--color-border)',
        }}
      />
      <span
        style={{
          fontSize: 8,
          color: 'var(--color-text-muted)',
          fontFamily: 'var(--font-mono)',
          opacity: 0.4,
        }}
      >
        -
      </span>
    </div>
  );
}

export function WellbeingScore({
  accentColor,
  onNavigateToGuardian,
  compact = false,
}: WellbeingScoreProps) {
  // accentColor reserved for future per-role theming
  void accentColor;

  const trend = useMemo(() => getWeeklyTrend(5), []);
  const currentScore = useMemo(() => getCurrentWeekScore(), []);
  const status = useMemo(() => getWellbeingStatus(), []);
  const pendingAlerts = useMemo(() => getPendingAlerts(), []);

  const statusConfig = {
    stable: {
      label: 'Wellbeing stable',
      icon: <Minus size={14} />,
      color: '#F59E0B',
    },
    improving: {
      label: 'Wellbeing improving',
      icon: <TrendingUp size={14} />,
      color: '#00AA78',
    },
    declining: {
      label: 'Wellbeing declining',
      icon: <TrendingDown size={14} />,
      color: '#CC3333',
    },
  };

  const statusInfo = statusConfig[status];

  // Fill to exactly 5 dots
  const dots: (WeeklyScore | null)[] = [];
  for (let i = 0; i < 5; i++) {
    dots.push(trend[i] || null);
  }

  if (compact) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Shield size={14} color={statusInfo.color} />
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: statusInfo.color,
            fontFamily: 'var(--font-sans)',
          }}
        >
          {statusInfo.label}
        </span>
        {pendingAlerts.length > 0 && (
          <AlertTriangle size={12} color="#CC3333" />
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Pending alert banner */}
      {pendingAlerts.length > 0 && (
        <Card
          padding="12px"
          style={{
            border: '1px solid rgba(204,51,51,0.3)',
            background: 'rgba(204,51,51,0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={16} color="#CC3333" />
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#CC3333',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                Family alert pending
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--color-text-muted)',
                  fontFamily: 'var(--font-sans)',
                  marginTop: 2,
                }}
              >
                {pendingAlerts[0].message}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Main wellbeing card */}
      <Card padding="16px">
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 'var(--radius-md)',
                background: `color-mix(in srgb, ${statusInfo.color} 15%, transparent)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: statusInfo.color,
              }}
            >
              <Shield size={16} />
            </div>
            <div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#E8EDF5',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                Wellbeing
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  marginTop: 2,
                }}
              >
                <span style={{ color: statusInfo.color, display: 'flex' }}>
                  {statusInfo.icon}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: statusInfo.color,
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  {statusInfo.label}
                </span>
              </div>
            </div>
          </div>

          {/* Current score */}
          {currentScore && (
            <div style={{ textAlign: 'right' }}>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: scoreToColor(currentScore.score),
                  fontFamily: 'var(--font-mono)',
                  lineHeight: 1,
                }}
              >
                {currentScore.score}
              </div>
              <div
                style={{
                  fontSize: 9,
                  color: 'var(--color-text-muted)',
                  fontFamily: 'var(--font-sans)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                this week
              </div>
            </div>
          )}
        </div>

        {/* Weekly trend dots */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 8px',
            background: 'var(--color-surface-2)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          {dots.map((d, i) =>
            d ? (
              <TrendDot key={d.weekId} score={d.score} weekLabel={d.weekId} />
            ) : (
              <EmptyDot key={`empty-${i}`} />
            ),
          )}
        </div>

        {/* Week labels */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '4px 8px 0',
          }}
        >
          <span
            style={{
              fontSize: 8,
              color: 'var(--color-text-muted)',
              fontFamily: 'var(--font-sans)',
              opacity: 0.6,
            }}
          >
            4 weeks ago
          </span>
          <span
            style={{
              fontSize: 8,
              color: 'var(--color-text-muted)',
              fontFamily: 'var(--font-sans)',
              opacity: 0.6,
            }}
          >
            This week
          </span>
        </div>
      </Card>

      {/* Guardian dashboard link */}
      {onNavigateToGuardian && (
        <Button
          variant="ghost"
          size="sm"
          icon={<ExternalLink size={12} />}
          onClick={onNavigateToGuardian}
          style={{ alignSelf: 'flex-start' }}
        >
          Open guardian dashboard
        </Button>
      )}

      {/* Privacy note */}
      <div
        style={{
          fontSize: 9,
          color: 'var(--color-text-muted)',
          fontFamily: 'var(--font-sans)',
          opacity: 0.5,
          textAlign: 'center',
          lineHeight: 1.5,
        }}
      >
        Wellbeing scores are based on session patterns only.
        <br />
        Session content is never shared.
      </div>
    </div>
  );
}

export default WellbeingScore;
