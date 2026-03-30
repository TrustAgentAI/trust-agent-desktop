import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Share2,
  Link2,
  Copy,
  Check,
  Plus,
  Eye,
  Clock,
  ArrowLeft,
  Trophy,
  Flame,
  Brain,
  BarChart3,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import api from '@/lib/api';

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.trust-agent.ai';

interface ShareLink {
  id: string;
  shareUrl: string;
  shareType: string;
  viewCount: number;
  expiresAt: string;
  createdAt: string;
  isExpired: boolean;
  fullUrl: string;
  roleName: string;
  companionName: string;
}

interface HiredRole {
  id: string;
  roleName: string;
  companionName: string;
}

const TYPE_LABELS: Record<string, string> = {
  MILESTONE: 'Milestone',
  STREAK: 'Streak',
  EXAM_RESULT: 'Exam Result',
  BRAIN_SUMMARY: 'Brain Summary',
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  MILESTONE: <Trophy size={14} />,
  STREAK: <Flame size={14} />,
  BRAIN_SUMMARY: <Brain size={14} />,
  EXAM_RESULT: <BarChart3 size={14} />,
};

export function MySharesPage() {
  const navigate = useNavigate();
  const [shares, setShares] = React.useState<ShareLink[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  // Create share modal
  const [showCreate, setShowCreate] = React.useState(false);
  const [hires, setHires] = React.useState<HiredRole[]>([]);
  const [selectedHire, setSelectedHire] = React.useState('');
  const [selectedType, setSelectedType] = React.useState('BRAIN_SUMMARY');
  const [creating, setCreating] = React.useState(false);

  React.useEffect(() => {
    fetchShares();
  }, []);

  async function fetchShares() {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('ta_access_token');
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${API_BASE}/trpc/progressSharing.getMyShares`, { headers });
      const json = await res.json();
      setShares(json.result?.data ?? []);
    } catch {
      setError('Unable to load your share links. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function fetchHires() {
    try {
      const token = localStorage.getItem('ta_access_token');
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${API_BASE}/trpc/hires.getMyHires`, { headers });
      const json = await res.json();
      const hiresData = json.result?.data ?? [];
      setHires(hiresData);
      if (hiresData.length > 0 && !selectedHire) {
        setSelectedHire(hiresData[0].id);
      }
    } catch {
      // Non-critical
    }
  }

  async function handleCreate() {
    if (!selectedHire) return;
    try {
      setCreating(true);
      await api.post('/trpc/progressSharing.createShare', {
        json: {
          hireId: selectedHire,
          shareType: selectedType,
          expiresInDays: 30,
        },
      });
      setShowCreate(false);
      await fetchShares();
    } catch (err: any) {
      setError(err?.message || 'Could not create share link.');
    } finally {
      setCreating(false);
    }
  }

  function handleCopy(share: ShareLink) {
    navigator.clipboard.writeText(share.fullUrl).then(() => {
      setCopiedId(share.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }

  function openCreateModal() {
    fetchHires();
    setShowCreate(true);
  }

  // Loading
  if (loading) {
    return (
      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        <Skeleton width={180} height={24} style={{ marginBottom: 24 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Skeleton height={80} borderRadius="var(--radius-lg)" />
          <Skeleton height={80} borderRadius="var(--radius-lg)" />
          <Skeleton height={80} borderRadius="var(--radius-lg)" />
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--color-text-muted)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 13,
          fontFamily: 'var(--font-sans)',
          marginBottom: 20,
          padding: 0,
        }}
      >
        <ArrowLeft size={16} />
        Back
      </button>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#E8EDF5', fontFamily: 'var(--font-sans)', marginBottom: 4 }}>
            Progress Sharing
          </h1>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)' }}>
            Share your achievements safely - never session content, only milestones.
          </p>
        </div>
        <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={openCreateModal}>
          New share
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            padding: 12,
            background: 'rgba(255,0,64,0.08)',
            border: '1px solid rgba(255,0,64,0.2)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-error)',
            fontSize: 13,
            fontFamily: 'var(--font-sans)',
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      )}

      {/* Share list */}
      {shares.length === 0 ? (
        <EmptyState
          icon={<Share2 size={24} />}
          title="No shared links yet"
          description="Create a share link to show friends and family your progress. Only milestones and summaries are shared - never private session content."
          ctaText="Create your first share"
          ctaAction={openCreateModal}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {shares.map((share) => (
            <Card key={share.id} style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ color: 'var(--color-electric-blue)' }}>
                      {TYPE_ICONS[share.shareType] || <Link2 size={14} />}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#E8EDF5', fontFamily: 'var(--font-sans)' }}>
                      {TYPE_LABELS[share.shareType] || share.shareType}
                    </span>
                    {share.isExpired && (
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'rgba(255,0,64,0.1)',
                          color: 'var(--color-error)',
                          textTransform: 'uppercase',
                        }}
                      >
                        Expired
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)', marginBottom: 4 }}>
                    {share.companionName} - {share.roleName}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, color: 'var(--color-text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Eye size={10} /> {share.viewCount} views
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={10} />
                      {share.isExpired
                        ? 'Expired'
                        : `Expires ${new Date(share.expiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button
                    onClick={() => handleCopy(share)}
                    title="Copy link"
                    style={{
                      background: 'var(--color-surface-2)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-sm)',
                      color: copiedId === share.id ? '#4ADE80' : 'var(--color-text-muted)',
                      cursor: 'pointer',
                      padding: 8,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {copiedId === share.id ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create share modal */}
      {showCreate && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 24,
          }}
          onClick={() => !creating && setShowCreate(false)}
        >
          <div
            style={{
              background: 'var(--color-dark-navy)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: 24,
              maxWidth: 420,
              width: '100%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#E8EDF5', fontFamily: 'var(--font-sans)', marginBottom: 16 }}>
              Create share link
            </h2>

            {/* Hire selection */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: 6 }}>
                Companion
              </label>
              {hires.length === 0 ? (
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                  No active companions found
                </div>
              ) : (
                <select
                  value={selectedHire}
                  onChange={(e) => setSelectedHire(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-surface-2)',
                    color: '#E8EDF5',
                    fontSize: 13,
                    fontFamily: 'var(--font-sans)',
                    outline: 'none',
                  }}
                >
                  {hires.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.companionName || h.roleName}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Share type */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: 6 }}>
                What to share
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {['BRAIN_SUMMARY', 'MILESTONE', 'STREAK', 'EXAM_RESULT'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedType(t)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: selectedType === t
                        ? '2px solid var(--color-electric-blue)'
                        : '1px solid var(--color-border)',
                      background: selectedType === t ? 'rgba(30,111,255,0.08)' : 'transparent',
                      color: '#E8EDF5',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    <span style={{ color: 'var(--color-electric-blue)' }}>
                      {TYPE_ICONS[t]}
                    </span>
                    {TYPE_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <Button
                variant="secondary"
                size="md"
                onClick={() => setShowCreate(false)}
                disabled={creating}
                style={{ flex: 1 }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleCreate}
                loading={creating}
                disabled={creating || !selectedHire}
                style={{ flex: 1 }}
              >
                Create link
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
