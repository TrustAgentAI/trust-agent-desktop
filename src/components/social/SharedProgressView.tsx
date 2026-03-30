import React from 'react';
import { Trophy, Flame, GraduationCap, Brain, Eye, Clock, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';

interface ShareViewData {
  shareType: string;
  shareData: Record<string, unknown>;
  viewCount: number;
  createdAt: string;
  roleName: string;
  companionName: string;
  category: string;
}

interface Props {
  shareUrl: string;
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  MILESTONE: Trophy,
  STREAK: Flame,
  EXAM_RESULT: GraduationCap,
  BRAIN_SUMMARY: Brain,
};

const TYPE_COLORS: Record<string, string> = {
  MILESTONE: 'from-amber-500/20 to-amber-600/5 border-amber-500/20',
  STREAK: 'from-orange-500/20 to-orange-600/5 border-orange-500/20',
  EXAM_RESULT: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/20',
  BRAIN_SUMMARY: 'from-blue-500/20 to-blue-600/5 border-blue-500/20',
};

const TYPE_ICON_COLORS: Record<string, string> = {
  MILESTONE: 'text-amber-400',
  STREAK: 'text-orange-400',
  EXAM_RESULT: 'text-emerald-400',
  BRAIN_SUMMARY: 'text-blue-400',
};

export function SharedProgressView({ shareUrl }: Props) {
  const [data, setData] = React.useState<ShareViewData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchShare() {
      try {
        const result = await api.get<ShareViewData>(
          `/trpc/progressSharing.viewShare?input=${encodeURIComponent(JSON.stringify({ shareUrl }))}`
        );
        setData(result);
      } catch (err) {
        setError('This share link may have expired or is not available. Please ask for a new link.');
      } finally {
        setLoading(false);
      }
    }
    fetchShare();
  }, [shareUrl]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <p className="text-white/60">{error || 'This share link is no longer available'}</p>
          <a
            href="https://app.trust-agent.ai"
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-sm hover:bg-emerald-500/30 transition-colors"
          >
            Visit Trust Agent <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    );
  }

  const Icon = TYPE_ICONS[data.shareType] || Brain;
  const colorClass = TYPE_COLORS[data.shareType] || TYPE_COLORS.BRAIN_SUMMARY;
  const iconColor = TYPE_ICON_COLORS[data.shareType] || 'text-blue-400';
  const sd = data.shareData as Record<string, unknown>;

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Main card */}
        <div
          className={`bg-gradient-to-b ${colorClass} border rounded-2xl p-6 space-y-4`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl bg-white/[0.05] ${iconColor}`}>
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-white font-semibold text-lg">
                {(sd.headline as string) || 'Progress shared!'}
              </p>
              <p className="text-white/50 text-sm">
                with {data.companionName} - {data.roleName}
              </p>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3">
            {sd.currentStreak !== undefined && (
              <StatCard label="Current streak" value={`${sd.currentStreak} days`} />
            )}
            {sd.longestStreak !== undefined && (
              <StatCard label="Longest streak" value={`${sd.longestStreak} days`} />
            )}
            {sd.totalSessions !== undefined && (
              <StatCard label="Total sessions" value={String(sd.totalSessions)} />
            )}
            {sd.totalHours !== undefined && (
              <StatCard label="Total hours" value={String(sd.totalHours)} />
            )}
            {sd.totalMinutes !== undefined && (
              <StatCard label="Total minutes" value={String(sd.totalMinutes)} />
            )}
            {sd.milestoneName !== undefined && (
              <StatCard label="Milestone" value={sd.milestoneName as string} />
            )}
            {sd.streakDays !== undefined && sd.currentStreak === undefined && (
              <StatCard label="Streak" value={`${sd.streakDays} days`} />
            )}
          </div>

          {/* Meta */}
          <div className="flex items-center justify-between pt-2 text-xs text-white/30">
            <div className="flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              <span>{data.viewCount} views</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Shared {new Date(data.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center space-y-3">
          <p className="text-white/40 text-sm">
            Powered by Trust Agent - everyone deserves an expert who knows them.
          </p>
          <a
            href="https://app.trust-agent.ai"
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-sm hover:bg-emerald-500/30 transition-colors"
          >
            Get your own companion <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/[0.03] rounded-lg p-3">
      <p className="text-xs text-white/40 mb-0.5">{label}</p>
      <p className="text-white font-semibold text-sm">{value}</p>
    </div>
  );
}
