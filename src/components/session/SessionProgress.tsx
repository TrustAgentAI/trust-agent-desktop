import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export interface Milestone {
  id: string;
  type: string;
  achievedAt: string;
  celebrated: boolean;
}

export interface SpacedRepetitionSummary {
  dueCount: number;
  totalItems: number;
  nextDueAt?: string;
}

export interface TopicMastery {
  topic: string;
  score: number; // 0-100
  status: 'mastered' | 'in-progress' | 'not-started';
}

interface SessionProgressProps {
  sessionCount: number;
  totalMinutes: number;
  streakDays: number;
  milestones: Milestone[];
  spacedRepetition?: SpacedRepetitionSummary;
  topicMastery?: TopicMastery[];
  accentColor?: string;
}

const MILESTONE_LABELS: Record<string, string> = {
  first_session: 'First Session',
  session_10: '10 Sessions',
  session_50: '50 Sessions',
  session_100: '100 Sessions',
  streak_7: '7-Day Streak',
  streak_30: '30-Day Streak',
  streak_100: '100-Day Streak',
};

function getMasteryColor(score: number): string {
  if (score >= 80) return 'var(--color-success)';
  if (score >= 50) return 'var(--color-electric-blue)';
  if (score >= 20) return '#F59E0B';
  return 'var(--color-text-muted)';
}

export function SessionProgress({
  sessionCount,
  totalMinutes,
  streakDays,
  milestones,
  spacedRepetition,
  topicMastery,
  accentColor,
}: SessionProgressProps) {
  const accent = accentColor || 'var(--color-electric-blue)';
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 16 }}>
      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        <StatCard label="Sessions" value={String(sessionCount)} accent={accent} />
        <StatCard
          label="Time Spent"
          value={hours > 0 ? `${hours}h ${mins}m` : `${mins}m`}
          accent={accent}
        />
        <StatCard
          label="Streak"
          value={`${streakDays}d`}
          accent={streakDays >= 7 ? 'var(--color-success)' : accent}
        />
      </div>

      {/* Spaced repetition */}
      {spacedRepetition && spacedRepetition.totalItems > 0 && (
        <Card padding="12px">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--color-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginBottom: 4,
                  fontFamily: 'var(--font-sans)',
                }}
              >
                Spaced Repetition
              </div>
              <div style={{ fontSize: 13, color: '#E8EDF5', fontFamily: 'var(--font-sans)' }}>
                {spacedRepetition.dueCount} items due for review
              </div>
            </div>
            <Badge variant="info">{spacedRepetition.totalItems} total</Badge>
          </div>
          {/* Progress bar */}
          <div
            style={{
              marginTop: 10,
              height: 4,
              borderRadius: 2,
              background: 'var(--color-surface-2)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${((spacedRepetition.totalItems - spacedRepetition.dueCount) / spacedRepetition.totalItems) * 100}%`,
                background: accent,
                borderRadius: 2,
                transition: 'width 300ms ease',
              }}
            />
          </div>
        </Card>
      )}

      {/* Topic mastery */}
      {topicMastery && topicMastery.length > 0 && (
        <Card padding="12px">
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: 10,
              fontFamily: 'var(--font-sans)',
            }}
          >
            Topic Mastery
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {topicMastery.map((topic) => (
              <div key={topic.topic}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 4,
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      color: '#E8EDF5',
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    {topic.topic}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontFamily: 'var(--font-mono)',
                      color: getMasteryColor(topic.score),
                    }}
                  >
                    {topic.score}%
                  </span>
                </div>
                <div
                  style={{
                    height: 3,
                    borderRadius: 2,
                    background: 'var(--color-surface-2)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${topic.score}%`,
                      background: getMasteryColor(topic.score),
                      borderRadius: 2,
                      transition: 'width 300ms ease',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Milestones */}
      {milestones.length > 0 && (
        <Card padding="12px">
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: 10,
              fontFamily: 'var(--font-sans)',
            }}
          >
            Milestones
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {milestones.map((ms) => (
              <Badge key={ms.id} variant="gold" size="md">
                {MILESTONE_LABELS[ms.type] || ms.type}
              </Badge>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div
      style={{
        background: 'var(--color-surface-1)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        padding: '10px 12px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontSize: 18,
          fontWeight: 700,
          color: accent,
          fontFamily: 'var(--font-sans)',
          lineHeight: 1.2,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: 'var(--color-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          marginTop: 2,
          fontFamily: 'var(--font-sans)',
        }}
      >
        {label}
      </div>
    </div>
  );
}

export default SessionProgress;
