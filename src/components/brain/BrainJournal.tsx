import React from 'react';
import {
  Brain,
  BookOpen,
  Sparkles,
  AlertTriangle,
  Target,
  Heart,
  Lightbulb,
  ChevronDown,
  Edit3,
  Check,
  X,
  TrendingUp,
  Award,
  MessageCircle,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';

// ── Types ──────────────────────────────────────────────────────────────────

interface BrainMemoryNote {
  id: string;
  entryType: string;
  entryDate: string;
  content: string;
  topicsCovered: string[];
  nextFocus: string | null;
  correctRate: number | null;
  breakthrough: string | null;
  userEdited: boolean;
  userAddedNote: string | null;
  sessionId: string | null;
}

interface BrainSummary {
  companionName: string;
  roleName: string;
  category: string;
  sessionCount: number;
  totalMinutes: number;
  streakDays: number;
  lastSessionAt: string | null;
  lastNote: { content: string; nextFocus: string | null; entryDate: string } | null;
  milestones: Array<{ id: string; type: string; achievedAt: string; celebrated: boolean }>;
  wellbeingScore: number | null;
  wellbeingTrend: string | null;
  entryCounts: Record<string, number>;
  topicsCovered: string[];
  totalEntries: number;
}

interface BrainJournalProps {
  hireId: string;
  companionName?: string;
}

// ── Entry type config ──────────────────────────────────────────────────────

const ENTRY_TYPE_CONFIG: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  SESSION_NOTE: {
    icon: <BookOpen size={14} />,
    label: 'Session Note',
    color: 'var(--color-electric-blue)',
  },
  TOPIC_MASTERED: {
    icon: <Award size={14} />,
    label: 'Topic Mastered',
    color: '#22C55E',
  },
  STRUGGLE_NOTED: {
    icon: <AlertTriangle size={14} />,
    label: 'Area to Revisit',
    color: '#F59E0B',
  },
  EMOTIONAL_MOMENT: {
    icon: <Heart size={14} />,
    label: 'Emotional Moment',
    color: '#EC4899',
  },
  GOAL_SET: {
    icon: <Target size={14} />,
    label: 'Goal Set',
    color: '#8B5CF6',
  },
  BREAKTHROUGH: {
    icon: <Sparkles size={14} />,
    label: 'Breakthrough',
    color: '#06B6D4',
  },
  PREFERENCE_LEARNED: {
    icon: <Lightbulb size={14} />,
    label: 'Preference Learned',
    color: '#F97316',
  },
};

// ── Helper functions ───────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatMinutes(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `${hours}h ${rem}m` : `${hours}h`;
}

// ── Component ──────────────────────────────────────────────────────────────

export function BrainJournal({ hireId, companionName }: BrainJournalProps) {
  const [summary, setSummary] = React.useState<BrainSummary | null>(null);
  const [notes, setNotes] = React.useState<BrainMemoryNote[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [nextCursor, setNextCursor] = React.useState<string | null>(null);
  const [_totalNotes, setTotalNotes] = React.useState(0);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editNote, setEditNote] = React.useState('');
  const [activeFilter, setActiveFilter] = React.useState<string | null>(null);

  // Fetch summary and initial notes
  React.useEffect(() => {
    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        const [summaryRes, notesRes] = await Promise.all([
          api.get<BrainSummary>(`/api/trpc/brain.getBrainSummary?input=${encodeURIComponent(JSON.stringify({ json: { hireId } }))}`),
          api.get<{ notes: BrainMemoryNote[]; nextCursor: string | null; total: number }>(
            `/api/trpc/brain.getMemoryNotes?input=${encodeURIComponent(JSON.stringify({ json: { hireId, limit: 20 } }))}`
          ),
        ]);

        const sRaw = summaryRes as unknown as Record<string, unknown>;
        const sData = sRaw?.result
          ? (sRaw.result as Record<string, unknown>)?.data
          : summaryRes;
        const nRaw = notesRes as unknown as Record<string, unknown>;
        const nData = nRaw?.result
          ? (nRaw.result as Record<string, unknown>)?.data
          : notesRes;

        setSummary(sData as BrainSummary);
        const nd = nData as { notes?: BrainMemoryNote[]; nextCursor?: string | null; total?: number };
        setNotes(nd.notes || []);
        setNextCursor(nd.nextCursor ?? null);
        setTotalNotes(nd.total || 0);
      } catch (err) {
        console.error('[BrainJournal] Failed to load:', err);
        setLoadError('Unable to load your Brain journal. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [hireId]);

  const loadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const params: Record<string, unknown> = { hireId, limit: 20, cursor: nextCursor };
      if (activeFilter) params.entryType = activeFilter;
      const res = await api.get<{ notes: BrainMemoryNote[]; nextCursor: string | null; total: number }>(
        `/api/trpc/brain.getMemoryNotes?input=${encodeURIComponent(JSON.stringify({ json: params }))}`
      );
      const data = (res as any)?.result?.data ?? res;
      setNotes((prev) => [...prev, ...(data.notes || [])]);
      setNextCursor(data.nextCursor);
    } catch (err) {
      console.error('[BrainJournal] Failed to load more:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleSaveNote = async (entryId: string) => {
    try {
      await api.post('/api/trpc/brain.editMemoryNote', {
        json: { entryId, userAddedNote: editNote },
      });
      setNotes((prev) =>
        prev.map((n) =>
          n.id === entryId ? { ...n, userAddedNote: editNote, userEdited: true } : n
        )
      );
      setEditingId(null);
      setEditNote('');
    } catch (err) {
      console.error('[BrainJournal] Failed to save note:', err);
    }
  };

  const name = companionName || summary?.companionName || 'Your companion';

  if (loading) {
    return (
      <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Phase 13: Skeleton shimmer loading state */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '12px 0' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--color-surface-2)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent 0%, rgba(30,111,255,0.06) 50%, transparent 100%)', animation: 'shimmer 1.5s ease-in-out infinite' }} />
          </div>
          <div style={{ width: 180, height: 16, borderRadius: 4, background: 'var(--color-surface-2)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent 0%, rgba(30,111,255,0.06) 50%, transparent 100%)', animation: 'shimmer 1.5s ease-in-out infinite' }} />
          </div>
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ padding: 16, background: 'var(--color-surface-1)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ width: 100, height: 10, borderRadius: 4, background: 'var(--color-surface-2)', marginBottom: 10, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent 0%, rgba(30,111,255,0.06) 50%, transparent 100%)', animation: 'shimmer 1.5s ease-in-out infinite' }} />
            </div>
            <div style={{ width: '90%', height: 14, borderRadius: 4, background: 'var(--color-surface-2)', marginBottom: 6, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent 0%, rgba(30,111,255,0.06) 50%, transparent 100%)', animation: 'shimmer 1.5s ease-in-out infinite' }} />
            </div>
            <div style={{ width: '70%', height: 14, borderRadius: 4, background: 'var(--color-surface-2)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent 0%, rgba(30,111,255,0.06) 50%, transparent 100%)', animation: 'shimmer 1.5s ease-in-out infinite' }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Phase 13: Error state
  if (loadError) {
    return (
      <div style={{ padding: 32, textAlign: 'center' }}>
        <Brain size={32} style={{ color: 'var(--color-error)', opacity: 0.5, marginBottom: 12 }} />
        <div style={{ fontSize: 14, color: 'var(--color-error)', fontFamily: 'var(--font-sans)', marginBottom: 12 }}>
          {loadError}
        </div>
        <button
          onClick={() => window.location.reload()}
          style={{ fontSize: 13, color: 'var(--color-electric-blue)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'var(--font-sans)' }}
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '0 0 32px' }}>
      {/* ── Header: "Your companion remembers..." ──────────────────────── */}
      <div style={{ textAlign: 'center', padding: '24px 16px 0' }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'rgba(30,111,255,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}
        >
          <Brain size={28} style={{ color: 'var(--color-electric-blue)' }} />
        </div>
        <h2
          style={{
            fontSize: 20,
            fontWeight: 800,
            color: '#E8EDF5',
            fontFamily: 'var(--font-sans)',
            marginBottom: 6,
          }}
        >
          {name} remembers...
        </h2>
        <p
          style={{
            fontSize: 13,
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-sans)',
            maxWidth: 400,
            margin: '0 auto',
            lineHeight: 1.5,
          }}
        >
          Every session builds your relationship. This is your Brain journal - everything {name} has
          learned about you.
        </p>
      </div>

      {/* ── Summary stats ──────────────────────────────────────────────── */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, padding: '0 16px' }}>
          <StatCard label="Sessions" value={String(summary.sessionCount)} />
          <StatCard label="Time Together" value={formatMinutes(summary.totalMinutes)} />
          <StatCard label="Streak" value={`${summary.streakDays}d`} />
          <StatCard label="Memories" value={String(summary.totalEntries)} />
        </div>
      )}

      {/* ── Topics covered ─────────────────────────────────────────────── */}
      {summary && summary.topicsCovered.length > 0 && (
        <Card padding="14px 16px" style={{ margin: '0 16px' }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--color-ion-cyan)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: 10,
              fontFamily: 'var(--font-mono)',
            }}
          >
            Topics Covered
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {summary.topicsCovered.map((topic) => (
              <span
                key={topic}
                style={{
                  fontSize: 11,
                  padding: '3px 10px',
                  borderRadius: 12,
                  background: 'rgba(30,111,255,0.1)',
                  color: 'var(--color-electric-blue)',
                  fontFamily: 'var(--font-sans)',
                  fontWeight: 500,
                }}
              >
                {topic}
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* ── Last session note ──────────────────────────────────────────── */}
      {summary?.lastNote && (
        <Card padding="14px 16px" style={{ margin: '0 16px', borderLeft: '3px solid var(--color-electric-blue)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <MessageCircle size={14} style={{ color: 'var(--color-electric-blue)' }} />
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--color-ion-cyan)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontFamily: 'var(--font-mono)',
              }}
            >
              Latest Memory
            </span>
            <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', marginLeft: 'auto' }}>
              {formatDate(summary.lastNote.entryDate)}
            </span>
          </div>
          <p style={{ fontSize: 13, color: '#C8D0DC', fontFamily: 'var(--font-sans)', lineHeight: 1.5, margin: 0 }}>
            {summary.lastNote.content}
          </p>
          {summary.lastNote.nextFocus && (
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Target size={12} style={{ color: '#8B5CF6' }} />
              <span style={{ fontSize: 12, color: '#8B5CF6', fontFamily: 'var(--font-sans)' }}>
                Next focus: {summary.lastNote.nextFocus}
              </span>
            </div>
          )}
        </Card>
      )}

      {/* ── Entry type filters ─────────────────────────────────────────── */}
      {summary && summary.totalEntries > 0 && (
        <div style={{ display: 'flex', gap: 6, padding: '0 16px', overflowX: 'auto' }}>
          <FilterPill
            label="All"
            active={activeFilter === null}
            onClick={() => setActiveFilter(null)}
          />
          {Object.entries(ENTRY_TYPE_CONFIG).map(([type, config]) => {
            const count = summary.entryCounts[type] || 0;
            if (count === 0) return null;
            return (
              <FilterPill
                key={type}
                label={`${config.label} (${count})`}
                active={activeFilter === type}
                color={config.color}
                onClick={() => setActiveFilter(activeFilter === type ? null : type)}
              />
            );
          })}
        </div>
      )}

      {/* ── Timeline of memory entries ─────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, padding: '0 16px' }}>
        {notes.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: '32px 16px' }}>
            <BookOpen size={28} style={{ color: 'var(--color-text-muted)', opacity: 0.4, marginBottom: 12 }} />
            <div style={{ fontSize: 13, color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)' }}>
              No memory entries yet. Complete your first session to start building your journal.
            </div>
          </div>
        )}

        {notes
          .filter((n) => !activeFilter || n.entryType === activeFilter)
          .map((note, index) => {
            const config = ENTRY_TYPE_CONFIG[note.entryType] || ENTRY_TYPE_CONFIG.SESSION_NOTE;
            const isEditing = editingId === note.id;

            return (
              <div
                key={note.id}
                style={{
                  display: 'flex',
                  gap: 12,
                  paddingBottom: 16,
                  marginBottom: 16,
                  borderBottom: index < notes.length - 1 ? '1px solid var(--color-border)' : 'none',
                }}
              >
                {/* Timeline dot */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 28 }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: `${config.color}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: config.color,
                      flexShrink: 0,
                    }}
                  >
                    {config.icon}
                  </div>
                  {index < notes.length - 1 && (
                    <div
                      style={{
                        width: 1,
                        flex: 1,
                        background: 'var(--color-border)',
                        marginTop: 4,
                      }}
                    />
                  )}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: config.color,
                        fontFamily: 'var(--font-sans)',
                      }}
                    >
                      {config.label}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        color: 'var(--color-text-muted)',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {formatDate(note.entryDate)}
                    </span>
                    {!isEditing && (
                      <button
                        onClick={() => {
                          setEditingId(note.id);
                          setEditNote(note.userAddedNote || '');
                        }}
                        style={{
                          marginLeft: 'auto',
                          background: 'none',
                          border: 'none',
                          color: 'var(--color-text-muted)',
                          cursor: 'pointer',
                          padding: 2,
                          opacity: 0.6,
                        }}
                        title="Add your own note"
                      >
                        <Edit3 size={12} />
                      </button>
                    )}
                  </div>

                  <p
                    style={{
                      fontSize: 13,
                      color: '#C8D0DC',
                      fontFamily: 'var(--font-sans)',
                      lineHeight: 1.5,
                      margin: 0,
                    }}
                  >
                    {note.content}
                  </p>

                  {/* Correct rate badge */}
                  {note.correctRate !== null && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                      <TrendingUp size={12} style={{ color: note.correctRate >= 0.8 ? '#22C55E' : '#F59E0B' }} />
                      <span
                        style={{
                          fontSize: 11,
                          color: note.correctRate >= 0.8 ? '#22C55E' : '#F59E0B',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {Math.round(note.correctRate * 100)}% accuracy
                      </span>
                    </div>
                  )}

                  {/* Topics */}
                  {note.topicsCovered.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                      {note.topicsCovered.map((t) => (
                        <span
                          key={t}
                          style={{
                            fontSize: 10,
                            padding: '2px 8px',
                            borderRadius: 10,
                            background: 'var(--color-surface-2)',
                            color: 'var(--color-text-muted)',
                            fontFamily: 'var(--font-sans)',
                          }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* User's own note */}
                  {note.userAddedNote && !isEditing && (
                    <div
                      style={{
                        marginTop: 8,
                        padding: '8px 10px',
                        background: 'rgba(139,92,246,0.06)',
                        borderRadius: 8,
                        borderLeft: '2px solid rgba(139,92,246,0.3)',
                      }}
                    >
                      <div style={{ fontSize: 10, color: '#8B5CF6', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>
                        Your note
                      </div>
                      <div style={{ fontSize: 12, color: '#C8D0DC', fontFamily: 'var(--font-sans)', lineHeight: 1.4 }}>
                        {note.userAddedNote}
                      </div>
                    </div>
                  )}

                  {/* Editing inline */}
                  {isEditing && (
                    <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <textarea
                        value={editNote}
                        onChange={(e) => setEditNote(e.target.value)}
                        placeholder="Add your own note to this memory..."
                        maxLength={1000}
                        style={{
                          width: '100%',
                          minHeight: 60,
                          padding: 8,
                          fontSize: 12,
                          fontFamily: 'var(--font-sans)',
                          background: 'var(--color-surface-2)',
                          color: '#E8EDF5',
                          border: '1px solid var(--color-border)',
                          borderRadius: 8,
                          resize: 'vertical',
                          outline: 'none',
                        }}
                        autoFocus
                      />
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleSaveNote(note.id)}
                          icon={<Check size={12} />}
                        >
                          Save
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setEditingId(null); setEditNote(''); }}
                          icon={<X size={12} />}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

        {/* Load more */}
        {nextCursor && (
          <div style={{ textAlign: 'center', paddingTop: 8 }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={loadMore}
              disabled={loadingMore}
              icon={<ChevronDown size={14} />}
            >
              {loadingMore ? 'Loading...' : 'Load older memories'}
            </Button>
          </div>
        )}
      </div>

      {/* ── Milestones ─────────────────────────────────────────────────── */}
      {summary && summary.milestones.length > 0 && (
        <Card padding="14px 16px" style={{ margin: '0 16px' }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#F59E0B',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: 10,
              fontFamily: 'var(--font-mono)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Award size={14} />
            Milestones
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {summary.milestones.map((m) => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#F59E0B',
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: 12, color: '#C8D0DC', fontFamily: 'var(--font-sans)', flex: 1 }}>
                  {m.type.replace(/_/g, ' ')}
                </span>
                <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {formatDate(m.achievedAt)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        background: 'var(--color-surface-1)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        padding: '12px 8px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontSize: 18,
          fontWeight: 800,
          color: '#E8EDF5',
          fontFamily: 'var(--font-sans)',
          lineHeight: 1,
          marginBottom: 4,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 10,
          color: 'var(--color-text-muted)',
          fontFamily: 'var(--font-mono)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        {label}
      </div>
    </div>
  );
}

function FilterPill({
  label,
  active,
  color,
  onClick,
}: {
  label: string;
  active: boolean;
  color?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        fontSize: 11,
        padding: '4px 12px',
        borderRadius: 14,
        background: active ? (color ? `${color}20` : 'rgba(30,111,255,0.15)') : 'var(--color-surface-2)',
        color: active ? (color || 'var(--color-electric-blue)') : 'var(--color-text-muted)',
        border: active ? `1px solid ${color || 'var(--color-electric-blue)'}40` : '1px solid transparent',
        cursor: 'pointer',
        fontFamily: 'var(--font-sans)',
        fontWeight: 500,
        whiteSpace: 'nowrap',
        transition: 'all 150ms ease',
      }}
    >
      {label}
    </button>
  );
}

export default BrainJournal;
