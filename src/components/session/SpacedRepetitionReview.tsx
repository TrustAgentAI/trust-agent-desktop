/**
 * SpacedRepetitionReview - Flashcard-style review UI
 *
 * Presents due spaced repetition items as flashcards.
 * Users see the question, reveal the answer, then rate their recall.
 * SM-2 algorithm determines the next review interval.
 */
import React from 'react';
import { ChevronRight, CheckCircle2, Brain, Eye, SkipForward } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useSpacedRepetitionStore } from '@/store/spacedRepetitionStore';
import { type Rating, type SpacedRepItem, getNextIntervalPreview } from '@/lib/spaced-repetition';
import api from '@/lib/api';

interface SpacedRepetitionReviewProps {
  roleId: string;
  roleName?: string;
  accentColor?: string;
  onComplete?: () => void;
  onSkip?: () => void;
}

type ReviewPhase = 'overview' | 'question' | 'answer' | 'complete';

const RATING_OPTIONS: { rating: Rating; label: string; color: string; description: string }[] = [
  { rating: 0, label: 'Again', color: '#EF4444', description: 'No recall at all' },
  { rating: 3, label: 'Hard', color: '#F59E0B', description: 'Recalled with effort' },
  { rating: 4, label: 'Good', color: 'var(--color-electric-blue)', description: 'Recalled correctly' },
  { rating: 5, label: 'Easy', color: 'var(--color-success)', description: 'Instant recall' },
];

export function SpacedRepetitionReview({
  roleId,
  roleName,
  accentColor,
  onComplete,
  onSkip,
}: SpacedRepetitionReviewProps) {
  const { getDueItems, updateItem, getStats } = useSpacedRepetitionStore();
  const [phase, setPhase] = React.useState<ReviewPhase>('overview');
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [showAnswer, setShowAnswer] = React.useState(false);
  const [reviewedCount, setReviewedCount] = React.useState(0);
  const [dueItems, setDueItems] = React.useState<SpacedRepItem[]>([]);

  const accent = accentColor || 'var(--color-electric-blue)';

  // B.8: Load due items from tRPC (server), fall back to local store
  React.useEffect(() => {
    let cancelled = false;

    async function loadDueItems() {
      try {
        // Fetch from server (SM-2 runs server-side)
        const response = await api.get<{ result: { data: Array<{
          id: string; concept: string; context: string; topic?: string;
          easeFactor: number; interval: number; repetitions: number; dueAt: string;
        }> } }>(`/trpc/spaced-repetition.getDueItems?input=${encodeURIComponent(JSON.stringify({ hireId: roleId }))}`);
        if (cancelled) return;

        const serverItems: SpacedRepItem[] = (response?.result?.data || []).map((item) => ({
          id: item.id,
          roleId: roleId,
          question: item.concept,
          answer: item.context,
          topic: item.topic || '',
          easinessFactor: item.easeFactor,
          interval: item.interval,
          repetitions: item.repetitions,
          totalReviews: item.repetitions,
          lapses: 0,
          nextReview: item.dueAt,
          createdAt: item.dueAt,
          lastReviewed: null,
        }));

        if (serverItems.length > 0) {
          setDueItems(serverItems);
          setPhase('overview');
        } else {
          // Fall back to local store if server has no items
          const localItems = getDueItems(roleId);
          setDueItems(localItems);
          setPhase(localItems.length > 0 ? 'overview' : 'complete');
        }
      } catch {
        // Server unavailable - fall back to local store
        const localItems = getDueItems(roleId);
        setDueItems(localItems);
        setPhase(localItems.length > 0 ? 'overview' : 'complete');
      }
      setCurrentIndex(0);
      setReviewedCount(0);
      setShowAnswer(false);
    }

    loadDueItems();
    return () => { cancelled = true; };
  }, [roleId, getDueItems]);

  const currentItem = dueItems[currentIndex] || null;
  const totalDue = dueItems.length;
  const stats = getStats(roleId);
  const progressPercent = totalDue > 0 ? Math.round((reviewedCount / totalDue) * 100) : 100;

  const handleStartReview = () => {
    if (dueItems.length > 0) {
      setPhase('question');
      setShowAnswer(false);
    }
  };

  const handleRevealAnswer = () => {
    setShowAnswer(true);
    setPhase('answer');
  };

  // B.8: Rate item via tRPC (SM-2 runs server-side), fall back to local store
  const handleRate = async (rating: Rating) => {
    if (!currentItem) return;

    // Try server-side SM-2 first
    try {
      await api.post('/trpc/spaced-repetition.reviewItem', {
        json: { itemId: currentItem.id, quality: rating },
      });
    } catch {
      // Fall back to local store SM-2
      updateItem(currentItem.id, rating);
    }

    setReviewedCount((prev) => prev + 1);

    const nextIndex = currentIndex + 1;
    if (nextIndex < dueItems.length) {
      setCurrentIndex(nextIndex);
      setShowAnswer(false);
      setPhase('question');
    } else {
      setPhase('complete');
    }
  };

  const handleSkip = () => {
    if (onSkip) onSkip();
  };

  // Overview: show count of due items with option to start or skip
  if (phase === 'overview') {
    return (
      <Card padding="20px" style={{ maxWidth: 480, margin: '0 auto' }}>
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: `${accent}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <Brain size={24} color={accent} />
          </div>

          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: '#E8EDF5',
              fontFamily: 'var(--font-sans)',
              marginBottom: 6,
            }}
          >
            Review Items
          </div>

          <div
            style={{
              fontSize: 13,
              color: 'var(--color-text-muted)',
              fontFamily: 'var(--font-sans)',
              marginBottom: 20,
            }}
          >
            You have <span style={{ color: accent, fontWeight: 600 }}>{totalDue}</span> item
            {totalDue !== 1 ? 's' : ''} due for review
            {roleName ? ` with ${roleName}` : ''}.
          </div>

          {/* Stats mini row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 8,
              marginBottom: 20,
            }}
          >
            <MiniStat label="Total" value={stats.total} />
            <MiniStat label="Due" value={stats.due} color={accent} />
            <MiniStat label="Learning" value={stats.learning} color="#F59E0B" />
            <MiniStat label="Mastered" value={stats.mastered} color="var(--color-success)" />
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <Button variant="primary" size="md" onClick={handleStartReview} icon={<Brain size={14} />}>
              Start Review
            </Button>
            {onSkip && (
              <Button variant="ghost" size="md" onClick={handleSkip} icon={<SkipForward size={14} />}>
                Skip for now
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  }

  // Complete: all items reviewed
  if (phase === 'complete') {
    const updatedStats = getStats(roleId);
    return (
      <Card padding="20px" style={{ maxWidth: 480, margin: '0 auto' }}>
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: 'rgba(34, 197, 94, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <CheckCircle2 size={24} color="var(--color-success)" />
          </div>

          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: '#E8EDF5',
              fontFamily: 'var(--font-sans)',
              marginBottom: 6,
            }}
          >
            {reviewedCount > 0 ? 'Review Complete!' : 'All caught up!'}
          </div>

          <div
            style={{
              fontSize: 13,
              color: 'var(--color-text-muted)',
              fontFamily: 'var(--font-sans)',
              marginBottom: 20,
            }}
          >
            {reviewedCount > 0
              ? `You reviewed ${reviewedCount} item${reviewedCount !== 1 ? 's' : ''}. Keep it up!`
              : 'No items are due for review right now. Great job staying on top of your learning!'}
          </div>

          {/* Updated stats */}
          {updatedStats.total > 0 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 8,
                marginBottom: 20,
              }}
            >
              <MiniStat label="Retention" value={`${updatedStats.retentionRate}%`} color="var(--color-success)" />
              <MiniStat label="Mastered" value={updatedStats.mastered} color="var(--color-success)" />
              <MiniStat label="Learning" value={updatedStats.learning} color="#F59E0B" />
            </div>
          )}

          <Button variant="primary" size="md" onClick={onComplete} icon={<ChevronRight size={14} />}>
            Continue to Session
          </Button>
        </div>
      </Card>
    );
  }

  // Question/Answer flashcard view
  if (!currentItem) return null;

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Progress bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 4px' }}>
        <div
          style={{
            flex: 1,
            height: 4,
            borderRadius: 2,
            background: 'var(--color-surface-2)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progressPercent}%`,
              background: accent,
              borderRadius: 2,
              transition: 'width 300ms ease',
            }}
          />
        </div>
        <span
          style={{
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            color: 'var(--color-text-muted)',
            flexShrink: 0,
          }}
        >
          {reviewedCount}/{totalDue}
        </span>
      </div>

      {/* Flashcard */}
      <Card padding="0" style={{ overflow: 'hidden' }}>
        {/* Topic badge */}
        {currentItem.topic && (
          <div
            style={{
              padding: '8px 16px',
              borderBottom: '1px solid var(--color-border)',
              fontSize: 10,
              fontWeight: 600,
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              fontFamily: 'var(--font-sans)',
            }}
          >
            {currentItem.topic}
          </div>
        )}

        {/* Question */}
        <div style={{ padding: '24px 20px' }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: accent,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: 10,
              fontFamily: 'var(--font-sans)',
            }}
          >
            Question
          </div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 500,
              color: '#E8EDF5',
              lineHeight: 1.5,
              fontFamily: 'var(--font-sans)',
            }}
          >
            {currentItem.question}
          </div>
        </div>

        {/* Answer (revealed) */}
        {showAnswer && (
          <div
            style={{
              padding: '20px',
              borderTop: '1px solid var(--color-border)',
              background: 'rgba(255,255,255,0.02)',
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: 'var(--color-success)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: 10,
                fontFamily: 'var(--font-sans)',
              }}
            >
              Answer
            </div>
            <div
              style={{
                fontSize: 14,
                color: '#C8D0DD',
                lineHeight: 1.6,
                fontFamily: 'var(--font-sans)',
              }}
            >
              {currentItem.answer}
            </div>
          </div>
        )}

        {/* Actions */}
        <div
          style={{
            padding: '12px 16px',
            borderTop: '1px solid var(--color-border)',
            background: 'rgba(0,0,0,0.1)',
          }}
        >
          {phase === 'question' && !showAnswer ? (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="secondary"
                size="md"
                onClick={handleRevealAnswer}
                icon={<Eye size={14} />}
              >
                Reveal Answer
              </Button>
            </div>
          ) : (
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--color-text-muted)',
                  textAlign: 'center',
                  marginBottom: 10,
                  fontFamily: 'var(--font-sans)',
                }}
              >
                How well did you recall this?
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                {RATING_OPTIONS.map((opt) => {
                  const preview = getNextIntervalPreview(
                    opt.rating,
                    currentItem.easinessFactor,
                    currentItem.interval,
                    currentItem.repetitions
                  );
                  return (
                    <button
                      key={opt.rating}
                      onClick={() => handleRate(opt.rating)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                        padding: '10px 6px',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        transition: 'all 150ms ease',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = opt.color;
                        (e.currentTarget as HTMLButtonElement).style.background = `${opt.color}10`;
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-border)';
                        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.03)';
                      }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: opt.color,
                          fontFamily: 'var(--font-sans)',
                        }}
                      >
                        {opt.label}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          color: 'var(--color-text-muted)',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {preview}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Item meta */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 4px',
          fontSize: 10,
          color: 'var(--color-text-muted)',
          fontFamily: 'var(--font-mono)',
        }}
      >
        <span>
          Reviews: {currentItem.totalReviews} | Lapses: {currentItem.lapses}
        </span>
        <span>EF: {currentItem.easinessFactor.toFixed(2)}</span>
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  color,
}: {
  label: string;
  value: number | string;
  color?: string;
}) {
  return (
    <div
      style={{
        background: 'var(--color-surface-2)',
        borderRadius: 'var(--radius-sm)',
        padding: '8px 6px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontSize: 16,
          fontWeight: 700,
          color: color || '#E8EDF5',
          fontFamily: 'var(--font-sans)',
          lineHeight: 1.2,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 9,
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

export default SpacedRepetitionReview;
