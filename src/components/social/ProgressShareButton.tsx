import React from 'react';
import { Share2, Copy, Check, ExternalLink, Trophy, Flame, GraduationCap, Brain } from 'lucide-react';
import { api } from '@/lib/api';

type ShareType = 'MILESTONE' | 'STREAK' | 'EXAM_RESULT' | 'BRAIN_SUMMARY';

interface ShareResult {
  id: string;
  shareUrl: string;
  shareType: string;
  expiresAt: string;
  fullUrl: string;
}

interface Props {
  hireId: string;
  shareType: ShareType;
  label?: string;
  compact?: boolean;
}

const SHARE_CONFIG: Record<ShareType, { icon: React.ElementType; label: string; color: string }> = {
  MILESTONE: { icon: Trophy, label: 'Share milestone', color: 'text-amber-400' },
  STREAK: { icon: Flame, label: 'Share your streak', color: 'text-orange-400' },
  EXAM_RESULT: { icon: GraduationCap, label: 'Share exam result', color: 'text-emerald-400' },
  BRAIN_SUMMARY: { icon: Brain, label: 'Share progress', color: 'text-blue-400' },
};

export function ProgressShareButton({ hireId, shareType, label, compact = false }: Props) {
  const [shareUrl, setShareUrl] = React.useState<string | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const config = SHARE_CONFIG[shareType];
  const Icon = config.icon;

  async function handleShare() {
    if (shareUrl) {
      await copyToClipboard(shareUrl);
      return;
    }

    setCreating(true);
    setError(null);
    try {
      const result = await api.post<ShareResult>('/trpc/progressSharing.createShare', {
        hireId,
        shareType,
      });
      setShareUrl(result.fullUrl);
      await copyToClipboard(result.fullUrl);
    } catch (err) {
      setError('We could not create a share link right now. Please try again.');
    } finally {
      setCreating(false);
    }
  }

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for Tauri
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (compact) {
    return (
      <button
        onClick={handleShare}
        disabled={creating}
        title={label || config.label}
        className={`p-2 rounded-lg bg-white/[0.03] border border-white/[0.07] hover:bg-white/[0.06] transition-colors disabled:opacity-50 ${config.color}`}
      >
        {creating ? (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : copied ? (
          <Check className="w-4 h-4 text-emerald-400" />
        ) : (
          <Share2 className="w-4 h-4" />
        )}
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleShare}
        disabled={creating}
        className={`flex items-center gap-2 px-4 py-2.5 bg-white/[0.03] border border-white/[0.07] rounded-xl text-sm hover:bg-white/[0.06] transition-colors disabled:opacity-50 ${config.color}`}
      >
        {creating ? (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <Icon className="w-4 h-4" />
        )}
        <span>{label || config.label}</span>
        {copied && <Check className="w-4 h-4 text-emerald-400" />}
      </button>

      {shareUrl && (
        <div className="flex items-center gap-2 text-xs text-white/40">
          <span className="truncate max-w-[200px]">{shareUrl}</span>
          <button
            onClick={() => copyToClipboard(shareUrl)}
            className="text-white/40 hover:text-white/60"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <a
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/40 hover:text-white/60"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
