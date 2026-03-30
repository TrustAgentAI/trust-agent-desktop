import React from 'react';
import { useParams } from 'react-router-dom';
import { Share2, Trophy, Flame, Brain, BarChart3, AlertTriangle, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.trust-agent.ai';

interface ShareData {
  shareType: string;
  shareData: Record<string, unknown>;
  viewCount: number;
  createdAt: string;
  roleName: string;
  companionName: string;
  category: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  EDUCATION: 'var(--color-electric-blue)',
  CAREER: '#FFB740',
  HEALTH: '#4ADE80',
  WELLBEING: '#67E8F9',
  LIFESTYLE: '#A78BFA',
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  MILESTONE: <Trophy size={28} />,
  STREAK: <Flame size={28} />,
  BRAIN_SUMMARY: <Brain size={28} />,
  EXAM_RESULT: <BarChart3 size={28} />,
};

/**
 * PublicSharePage - NO auth required.
 * Shows a shared progress link with Brain summary (never session content).
 */
export function PublicSharePage() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const [data, setData] = React.useState<ShareData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!shareToken) return;

    async function fetchShare() {
      try {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams({
          input: JSON.stringify({ json: { shareUrl: shareToken } }),
        });
        const res = await fetch(`${API_BASE}/trpc/progressSharing.viewShare?${params}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError('This share link is not valid or has expired.');
          } else {
            setError('Unable to load this progress link.');
          }
          return;
        }
        const json = await res.json();
        setData(json.result?.data ?? null);
      } catch {
        setError('Unable to load this progress link. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    fetchShare();
  }, [shareToken]);

  // Loading
  if (loading) {
    return (
      <div style={pageContainer}>
        <div style={contentContainer}>
          <Skeleton width={56} height={56} borderRadius="50%" style={{ margin: '0 auto 16px' }} />
          <Skeleton width={280} height={24} style={{ margin: '0 auto 12px' }} />
          <Skeleton width={200} height={14} style={{ margin: '0 auto 24px' }} />
          <Skeleton height={120} borderRadius="var(--radius-lg)" />
        </div>
      </div>
    );
  }

  // Error
  if (error || !data) {
    return (
      <div style={pageContainer}>
        <div style={contentContainer}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'rgba(255,0,64,0.08)',
              border: '1px solid rgba(255,0,64,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <AlertTriangle size={24} style={{ color: 'var(--color-error)' }} />
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#E8EDF5', fontFamily: 'var(--font-sans)', marginBottom: 8, textAlign: 'center' }}>
            Link not found
          </h1>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)', textAlign: 'center', lineHeight: 1.5 }}>
            {error || 'This progress link may have expired or been removed.'}
          </p>
        </div>
      </div>
    );
  }

  const shareData = data.shareData;
  const headline = (shareData.headline as string) || 'Someone is making progress!';
  const catColor = CATEGORY_COLORS[data.category] || 'var(--color-electric-blue)';
  const icon = TYPE_ICONS[data.shareType] || <Share2 size={28} />;

  return (
    <div style={pageContainer}>
      <div style={contentContainer}>
        {/* Logo */}
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--color-electric-blue)',
            fontFamily: 'var(--font-sans)',
            marginBottom: 28,
            textAlign: 'center',
            letterSpacing: '0.05em',
          }}
        >
          TRUST AGENT
        </div>

        {/* Icon */}
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: `${catColor}12`,
            border: `1px solid ${catColor}30`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            color: catColor,
          }}
        >
          {icon}
        </div>

        {/* Headline */}
        <h1
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: '#E8EDF5',
            fontFamily: 'var(--font-sans)',
            marginBottom: 8,
            textAlign: 'center',
          }}
        >
          {headline}
        </h1>

        <p
          style={{
            fontSize: 13,
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-sans)',
            marginBottom: 24,
            textAlign: 'center',
          }}
        >
          Working with {data.companionName}
        </p>

        {/* Stats */}
        <Card style={{ padding: 20, marginBottom: 20 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
              gap: 16,
              textAlign: 'center',
            }}
          >
            {shareData.totalSessions != null && (
              <StatBlock label="Sessions" value={String(shareData.totalSessions)} color={catColor} />
            )}
            {shareData.currentStreak != null && (
              <StatBlock label="Current streak" value={`${shareData.currentStreak} days`} color="#FFB740" />
            )}
            {shareData.longestStreak != null && (
              <StatBlock label="Longest streak" value={`${shareData.longestStreak} days`} color="#A78BFA" />
            )}
            {shareData.totalHours != null && (
              <StatBlock label="Total hours" value={String(shareData.totalHours)} color="#67E8F9" />
            )}
            {shareData.totalMinutes != null && (
              <StatBlock label="Total minutes" value={String(shareData.totalMinutes)} color="#67E8F9" />
            )}
            {shareData.streakDays != null && (shareData.currentStreak == null) && (
              <StatBlock label="Streak" value={`${shareData.streakDays} days`} color="#FFB740" />
            )}
            {shareData.milestoneName != null && (
              <StatBlock label="Milestone" value={String(shareData.milestoneName)} color="#4ADE80" />
            )}
          </div>
        </Card>

        {/* Category badge */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <span
            style={{
              display: 'inline-block',
              padding: '4px 12px',
              borderRadius: 'var(--radius-sm)',
              background: `${catColor}15`,
              color: catColor,
              fontSize: 11,
              fontWeight: 700,
              fontFamily: 'var(--font-sans)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            {data.category}
          </span>
          <span
            style={{
              display: 'block',
              fontSize: 11,
              color: 'var(--color-text-muted)',
              marginTop: 8,
              fontFamily: 'var(--font-sans)',
            }}
          >
            {data.viewCount} {data.viewCount === 1 ? 'view' : 'views'}
          </span>
        </div>

        {/* CTA */}
        <Card
          style={{
            padding: 20,
            textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(30,111,255,0.08), rgba(167,139,250,0.04))',
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#E8EDF5', fontFamily: 'var(--font-sans)', marginBottom: 6 }}>
            Everyone deserves an expert who knows them
          </h2>
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)', marginBottom: 14, lineHeight: 1.5 }}>
            Trust Agent is the companion that remembers everything and gets better every session.
          </p>
          <Button
            variant="primary"
            size="md"
            icon={<ExternalLink size={14} />}
            onClick={() => window.open('https://trust-agent.ai', '_blank')}
          >
            Try Trust Agent
          </Button>
        </Card>
      </div>
    </div>
  );
}

function StatBlock({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 800, color, fontFamily: 'var(--font-sans)' }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)' }}>
        {label}
      </div>
    </div>
  );
}

const pageContainer: React.CSSProperties = {
  minHeight: '100vh',
  background: 'var(--color-dark-navy)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 24,
};

const contentContainer: React.CSSProperties = {
  maxWidth: 480,
  width: '100%',
};
