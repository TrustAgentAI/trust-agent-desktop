/**
 * CompanionDetailPage - Phase 3: /companions/:slug
 * Full role detail from roles.getBySlug
 * 47-check audit expandable (from audit.getAuditDetail)
 * Expert review section
 * Community reviews from reviews.getReviews
 * HireFlow component calling hires.hire
 *
 * ALL data from real tRPC. No hardcoded arrays.
 */
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { trpc } from '@/lib/trpc';
import { useTrpcQuery, useTrpcMutation } from '@/lib/useTrpcQuery';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Shield,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Star,
  ArrowLeft,
  Lock,
  Mic,
  MessageSquare,
} from 'lucide-react';

/* ─── Types ─── */
interface AuditCheck {
  checkNumber: number;
  name: string;
  description: string;
  outcome: string;
  score: number;
  maxScore: number;
  details: unknown;
}

interface AuditStage {
  stage: number;
  name: string;
  description: string;
  score: number;
  passed: number;
  failed: number;
  total: number;
  weight: number;
  weightedScore: number;
  checks: AuditCheck[];
}

interface AuditDetail {
  roleId: string;
  roleName: string;
  companionName: string;
  trustScore: number;
  badge: string;
  stages: AuditStage[];
  totalChecks: number;
  totalPassed: number;
  totalFailed: number;
  auditedBy: string;
  completedAt: string;
  badgeExplanation: string;
  artefactHash: string | null;
  hashVerified: boolean | string;
  // Phase 6F: Expert review fields
  expertReviewText?: string | null;
  reviewerName?: string | null;
  reviewerCredentials?: string | null;
}

interface ReviewItem {
  id: string;
  rating: number;
  reviewText: string;
  createdAt: string;
  authorName: string;
}

interface ReviewsData {
  reviews: ReviewItem[];
  total: number;
  page: number;
  pages: number;
  averageRating: number;
  totalReviews: number;
}

const BADGE_COLOURS: Record<string, string> = {
  PLATINUM: 'var(--accent-600)',
  GOLD: '#B8860B',
  SILVER: '#7A7A74',
  BASIC: 'var(--text-muted)',
};

const CATEGORY_BG: Record<string, string> = {
  education: 'var(--cat-education-bg)',
  health: 'var(--cat-health-bg)',
  children: 'var(--cat-children-bg)',
  language: 'var(--cat-language-bg)',
  business: 'var(--cat-business-bg)',
  career: 'var(--cat-career-bg)',
  elderly: 'var(--cat-elderly-bg)',
  navigation: 'var(--cat-navigation-bg)',
};

/* ─── 47-Check Audit Section ─── */
function AuditSection({ roleId }: { roleId: string }) {
  const [expanded, setExpanded] = React.useState(false);
  const [expandedStage, setExpandedStage] = React.useState<number | null>(null);

  const { data, isLoading } = useTrpcQuery(
    () => trpc.audit.getAuditDetail.query({ roleId }) as Promise<{ audit: AuditDetail | null; error: string | null }>,
    [roleId],
  );

  const audit: AuditDetail | null = data?.audit ?? null;

  if (isLoading) {
    return (
      <div style={{ padding: 'var(--space-6)' }}>
        <Skeleton height={24} width="50%" />
        <Skeleton height={16} width="80%" style={{ marginTop: 12 }} />
        <Skeleton height={80} style={{ marginTop: 12 }} />
      </div>
    );
  }

  if (!audit) {
    return (
      <div
        style={{
          padding: 'var(--space-6)',
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-card)',
          textAlign: 'center',
        }}
      >
        <Shield size={24} style={{ color: 'var(--text-muted)', marginBottom: 8 }} />
        <p style={{ fontSize: 14, fontFamily: 'var(--font-sans)', color: 'var(--text-muted)' }}>
          Audit not yet available for this companion.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        background: 'var(--bg-elevated)',
        borderRadius: 'var(--radius-card)',
        boxShadow: 'var(--shadow-card)',
        overflow: 'hidden',
      }}
    >
      {/* Audit summary bar */}
      <button
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        aria-label="Toggle audit details"
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'var(--space-5) var(--space-6)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          minHeight: 48,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <Shield size={20} style={{ color: BADGE_COLOURS[audit.badge] ?? 'var(--text-muted)' }} />
          <div style={{ textAlign: 'left' }}>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                fontFamily: 'var(--font-sans)',
                color: 'var(--text-primary)',
              }}
            >
              {audit.totalChecks}-Check Trust Audit
            </div>
            <div
              style={{
                fontSize: 13,
                fontFamily: 'var(--font-sans)',
                color: 'var(--text-muted)',
              }}
            >
              {audit.totalPassed} passed - {audit.totalFailed} failed - Score: {audit.trustScore}/100 - {audit.badge}
            </div>
          </div>
        </div>
        {expanded ? <ChevronUp size={20} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={20} style={{ color: 'var(--text-muted)' }} />}
      </button>

      {expanded && (
        <div style={{ padding: '0 var(--space-6) var(--space-6)' }}>
          {/* Badge explanation */}
          <p
            style={{
              fontSize: 13,
              fontFamily: 'var(--font-sans)',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              marginBottom: 'var(--space-4)',
              padding: 'var(--space-3)',
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            {audit.badgeExplanation}
          </p>

          {/* Expert reviewer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              fontSize: 13,
              fontFamily: 'var(--font-sans)',
              color: 'var(--text-muted)',
              marginBottom: 'var(--space-4)',
            }}
          >
            <Lock size={14} />
            Reviewed by: <strong style={{ color: 'var(--text-primary)' }}>{audit.reviewerName || audit.auditedBy}</strong>
            {audit.reviewerCredentials && (
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                ({audit.reviewerCredentials})
              </span>
            )}
            {' '} - {new Date(audit.completedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>

          {/* Phase 6F: Expert review text */}
          {audit.expertReviewText && (
            <div
              style={{
                padding: 'var(--space-4)',
                background: 'var(--bg-surface)',
                borderRadius: 'var(--radius-md)',
                borderLeft: '3px solid var(--accent-600)',
                marginBottom: 'var(--space-4)',
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  fontFamily: 'var(--font-sans)',
                  color: 'var(--accent-600)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginBottom: 'var(--space-2)',
                }}
              >
                Expert Review
              </div>
              <p
                style={{
                  fontSize: 13,
                  fontFamily: 'var(--font-serif)',
                  fontStyle: 'italic',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.7,
                  margin: 0,
                }}
              >
                {audit.expertReviewText}
              </p>
              <div
                style={{
                  marginTop: 'var(--space-3)',
                  fontSize: 12,
                  fontFamily: 'var(--font-sans)',
                  color: 'var(--text-muted)',
                }}
              >
                - {audit.reviewerName || audit.auditedBy}
                {audit.reviewerCredentials ? `, ${audit.reviewerCredentials}` : ''}
              </div>
            </div>
          )}

          {/* Hash verification */}
          {audit.artefactHash && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                fontSize: 12,
                fontFamily: 'var(--font-mono, monospace)',
                color: audit.hashVerified ? 'var(--color-success)' : 'var(--color-error)',
                marginBottom: 'var(--space-5)',
                wordBreak: 'break-all',
              }}
            >
              {audit.hashVerified ? <CheckCircle size={14} /> : <XCircle size={14} />}
              SHA-256: {audit.artefactHash.substring(0, 16)}...{audit.artefactHash.substring(48)}
              {audit.hashVerified ? ' (verified)' : ' (mismatch)'}
            </div>
          )}

          {/* Stage breakdown */}
          {audit.stages.map((stage) => (
            <div
              key={stage.stage}
              style={{
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                marginBottom: 'var(--space-3)',
                overflow: 'hidden',
              }}
            >
              <button
                onClick={() =>
                  setExpandedStage(expandedStage === stage.stage ? null : stage.stage)
                }
                aria-expanded={expandedStage === stage.stage}
                aria-label={`Toggle ${stage.name} details`}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 'var(--space-3) var(--space-4)',
                  background: 'var(--bg-surface)',
                  border: 'none',
                  cursor: 'pointer',
                  minHeight: 44,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      fontFamily: 'var(--font-sans)',
                      color: 'var(--text-primary)',
                      textAlign: 'left',
                    }}
                  >
                    Stage {stage.stage}: {stage.name}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      fontFamily: 'var(--font-sans)',
                      color: 'var(--text-muted)',
                      textAlign: 'left',
                    }}
                  >
                    {stage.passed}/{stage.total} passed - Weight: {(stage.weight * 100).toFixed(0)}%
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    fontFamily: 'var(--font-sans)',
                    color: stage.score >= 80 ? 'var(--color-success)' : stage.score >= 60 ? 'var(--color-warning)' : 'var(--color-error)',
                  }}
                >
                  {stage.score}%
                </div>
              </button>

              {expandedStage === stage.stage && (
                <div style={{ padding: 'var(--space-3) var(--space-4)' }}>
                  <p
                    style={{
                      fontSize: 12,
                      fontFamily: 'var(--font-sans)',
                      color: 'var(--text-muted)',
                      marginBottom: 'var(--space-3)',
                    }}
                  >
                    {stage.description}
                  </p>
                  {stage.checks.map((check) => (
                    <div
                      key={check.checkNumber}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 'var(--space-2)',
                        padding: 'var(--space-2) 0',
                        borderBottom: '1px solid var(--border-default)',
                      }}
                    >
                      {check.outcome === 'PASS' ? (
                        <CheckCircle size={16} style={{ color: 'var(--color-success)', flexShrink: 0, marginTop: 2 }} />
                      ) : (
                        <XCircle size={16} style={{ color: 'var(--color-error)', flexShrink: 0, marginTop: 2 }} />
                      )}
                      <div>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 500,
                            fontFamily: 'var(--font-sans)',
                            color: 'var(--text-primary)',
                          }}
                        >
                          #{check.checkNumber} {check.name}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            fontFamily: 'var(--font-sans)',
                            color: 'var(--text-muted)',
                            marginTop: 2,
                          }}
                        >
                          {check.description}
                        </div>
                      </div>
                      <span
                        style={{
                          marginLeft: 'auto',
                          fontSize: 12,
                          fontWeight: 600,
                          fontFamily: 'var(--font-sans)',
                          color: 'var(--text-muted)',
                          flexShrink: 0,
                        }}
                      >
                        {check.score}/{check.maxScore}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Community Reviews ─── */
function ReviewsSection({ slug }: { slug: string }) {
  const [page, setPage] = React.useState(1);

  const { data, isLoading } = useTrpcQuery(
    () => trpc.reviews.getReviews.query({ roleSlug: slug, page, limit: 10 }) as Promise<ReviewsData>,
    [slug, page],
  );

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} height={80} style={{ borderRadius: 'var(--radius-md)' }} />
        ))}
      </div>
    );
  }

  if (!data || data.reviews.length === 0) {
    return (
      <div
        style={{
          padding: 'var(--space-8)',
          textAlign: 'center',
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-card)',
        }}
      >
        <Star size={24} style={{ color: 'var(--text-muted)', marginBottom: 8 }} />
        <p style={{ fontSize: 14, fontFamily: 'var(--font-sans)', color: 'var(--text-muted)' }}>
          No community reviews yet. Be the first after your first session.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Rating summary */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-5)',
        }}
      >
        <div
          style={{
            fontSize: 36,
            fontWeight: 700,
            fontFamily: 'var(--font-sans)',
            color: 'var(--text-primary)',
          }}
        >
          {data.averageRating.toFixed(1)}
        </div>
        <div>
          <div style={{ display: 'flex', gap: 2 }}>
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                size={16}
                fill={s <= Math.round(data.averageRating) ? 'var(--color-warning)' : 'none'}
                stroke={s <= Math.round(data.averageRating) ? 'var(--color-warning)' : 'var(--text-muted)'}
              />
            ))}
          </div>
          <div
            style={{
              fontSize: 12,
              fontFamily: 'var(--font-sans)',
              color: 'var(--text-muted)',
              marginTop: 2,
            }}
          >
            {data.totalReviews} review{data.totalReviews !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Individual reviews */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {data.reviews.map((review) => (
          <div
            key={review.id}
            style={{
              padding: 'var(--space-4)',
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--space-2)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    fontFamily: 'var(--font-sans)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {review.authorName}
                </span>
                <div style={{ display: 'flex', gap: 1 }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={12}
                      fill={s <= review.rating ? 'var(--color-warning)' : 'none'}
                      stroke={s <= review.rating ? 'var(--color-warning)' : 'var(--text-muted)'}
                    />
                  ))}
                </div>
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontFamily: 'var(--font-sans)',
                  color: 'var(--text-muted)',
                }}
              >
                {new Date(review.createdAt).toLocaleDateString('en-GB')}
              </span>
            </div>
            <p
              style={{
                fontSize: 13,
                fontFamily: 'var(--font-sans)',
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
              }}
            >
              {review.reviewText}
            </p>
          </div>
        ))}
      </div>

      {/* Review pagination */}
      {data.pages > 1 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 'var(--space-2)',
            marginTop: 'var(--space-4)',
          }}
        >
          {Array.from({ length: data.pages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              style={{
                width: 32,
                height: 32,
                borderRadius: 'var(--radius-full)',
                border: 'none',
                background: page === i + 1 ? 'var(--primary-600)' : 'var(--bg-surface)',
                color: page === i + 1 ? 'var(--text-inverse)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: 13,
                fontFamily: 'var(--font-sans)',
                fontWeight: 600,
                minHeight: 44,
                minWidth: 44,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label={`Go to review page ${i + 1}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Hire Flow ─── */
function HireFlow({ roleId, companionName }: { roleId: string; companionName: string }) {
  const navigate = useNavigate();
  const [customName, setCustomName] = React.useState('');
  const [hireStatus, setHireStatus] = React.useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = React.useState('');

  const hireMutation = useTrpcMutation(
    (input: { roleId: string; customCompanionName?: string }) => trpc.hires.hire.mutate(input),
  );

  const handleHire = async () => {
    setHireStatus('loading');
    setErrorMessage('');
    try {
      await hireMutation.mutate({
        roleId,
        ...(customName.trim() ? { customCompanionName: customName.trim() } : {}),
      });
      setHireStatus('success');
    } catch (err: unknown) {
      setErrorMessage('Something went wrong completing the hire. Your data is safe - please try again.');
      setHireStatus('error');
    }
  };

  if (hireStatus === 'success') {
    return (
      <div
        style={{
          background: 'var(--accent-50)',
          borderRadius: 'var(--radius-card)',
          padding: 'var(--space-6)',
          textAlign: 'center',
        }}
      >
        <CheckCircle size={32} style={{ color: 'var(--accent-600)', marginBottom: 12 }} />
        <h3
          style={{
            fontSize: 18,
            fontWeight: 700,
            fontFamily: 'var(--font-sans)',
            color: 'var(--text-primary)',
            marginBottom: 'var(--space-2)',
          }}
        >
          {companionName} is ready for you
        </h3>
        <p
          style={{
            fontSize: 14,
            fontFamily: 'var(--font-sans)',
            color: 'var(--text-secondary)',
            marginBottom: 'var(--space-4)',
          }}
        >
          Head to your dashboard to start your first session.
        </p>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: 'var(--space-3) var(--space-6)',
            background: 'var(--primary-600)',
            color: 'var(--text-inverse)',
            fontFamily: 'var(--font-sans)',
            fontWeight: 600,
            fontSize: 14,
            border: 'none',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            minHeight: 44,
          }}
        >
          Go to dashboard
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        background: 'var(--bg-elevated)',
        borderRadius: 'var(--radius-card)',
        boxShadow: 'var(--shadow-card)',
        padding: 'var(--space-6)',
      }}
    >
      <h3
        style={{
          fontSize: 18,
          fontWeight: 700,
          fontFamily: 'var(--font-sans)',
          color: 'var(--text-primary)',
          marginBottom: 'var(--space-4)',
        }}
      >
        Hire {companionName}
      </h3>

      {/* Optional custom name */}
      <label
        style={{
          display: 'block',
          fontSize: 13,
          fontFamily: 'var(--font-sans)',
          color: 'var(--text-secondary)',
          marginBottom: 'var(--space-2)',
        }}
      >
        Custom name (optional)
      </label>
      <input
        type="text"
        value={customName}
        onChange={(e) => setCustomName(e.target.value)}
        placeholder={companionName}
        maxLength={50}
        style={{
          width: '100%',
          padding: 'var(--space-3)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)',
          fontSize: 14,
          fontFamily: 'var(--font-sans)',
          color: 'var(--text-primary)',
          background: 'var(--bg-page)',
          marginBottom: 'var(--space-4)',
          outline: 'none',
          minHeight: 44,
        }}
      />

      {/* Error message */}
      {hireStatus === 'error' && errorMessage && (
        <div
          style={{
            padding: 'var(--space-3)',
            background: 'rgba(184, 37, 37, 0.08)',
            borderRadius: 'var(--radius-md)',
            fontSize: 13,
            fontFamily: 'var(--font-sans)',
            color: 'var(--color-error)',
            marginBottom: 'var(--space-4)',
          }}
        >
          {errorMessage}
        </div>
      )}

      <button
        onClick={handleHire}
        disabled={hireStatus === 'loading'}
        style={{
          width: '100%',
          padding: 'var(--space-4)',
          background: 'var(--primary-600)',
          color: 'var(--text-inverse)',
          fontFamily: 'var(--font-sans)',
          fontWeight: 700,
          fontSize: 16,
          border: 'none',
          borderRadius: 'var(--radius-md)',
          cursor: hireStatus === 'loading' ? 'wait' : 'pointer',
          opacity: hireStatus === 'loading' ? 0.7 : 1,
          transition: 'opacity var(--transition-fast)',
          minHeight: 48,
        }}
      >
        {hireStatus === 'loading' ? 'Hiring...' : `Hire ${companionName}`}
      </button>
    </div>
  );
}

/* ─── Skeleton ─── */
function DetailSkeleton() {
  return (
    <div style={{ background: 'var(--bg-page)', minHeight: '100vh', padding: 'var(--space-8) var(--space-6)' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <Skeleton height={200} style={{ borderRadius: 'var(--radius-card)', marginBottom: 24 }} />
        <Skeleton height={32} width="60%" style={{ marginBottom: 12 }} />
        <Skeleton height={16} width="80%" style={{ marginBottom: 24 }} />
        <Skeleton height={120} style={{ borderRadius: 'var(--radius-card)', marginBottom: 24 }} />
        <Skeleton height={80} style={{ borderRadius: 'var(--radius-card)' }} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════ */
/* MAIN DETAIL PAGE                                       */
/* ═══════════════════════════════════════════════════════ */
export function CompanionDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const { data: role, isLoading, isError, error } = useTrpcQuery(
    () => trpc.roles.getBySlug.query({ slug: slug ?? '' }),
    [slug],
  );

  if (isLoading) return <DetailSkeleton />;

  if (isError || !role) {
    return (
      <div
        style={{
          background: 'var(--bg-page)',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 'var(--space-4)',
        }}
      >
        <h2
          style={{
            fontSize: 20,
            fontWeight: 700,
            fontFamily: 'var(--font-sans)',
            color: 'var(--text-primary)',
          }}
        >
          Companion not found
        </h2>
        <p
          style={{
            fontSize: 14,
            fontFamily: 'var(--font-sans)',
            color: 'var(--text-muted)',
          }}
        >
          {error ?? 'This companion may have been removed or is not available.'}
        </p>
        <button
          onClick={() => navigate('/companions')}
          style={{
            padding: 'var(--space-3) var(--space-6)',
            background: 'var(--primary-600)',
            color: 'var(--text-inverse)',
            fontFamily: 'var(--font-sans)',
            fontWeight: 600,
            fontSize: 14,
            border: 'none',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            minHeight: 44,
          }}
        >
          Browse companions
        </button>
      </div>
    );
  }

  const catBg = CATEGORY_BG[role.category?.toLowerCase()] ?? 'var(--bg-surface)';

  return (
    <div style={{ background: 'var(--bg-page)', minHeight: '100vh' }}>
      {/* Hero banner */}
      <div
        style={{
          background: catBg,
          padding: 'var(--space-6)',
        }}
      >
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <button
            onClick={() => navigate('/companions')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--space-1)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 14,
              fontFamily: 'var(--font-sans)',
              color: 'var(--primary-600)',
              marginBottom: 'var(--space-4)',
              minHeight: 44,
              padding: 0,
            }}
          >
            <ArrowLeft size={16} /> Back to marketplace
          </button>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-4)',
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: 'var(--radius-card)',
                background: 'var(--bg-elevated)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 40,
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              {role.emoji ?? '🤖'}
            </div>
            <div style={{ flex: 1 }}>
              <h1
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  fontFamily: 'var(--font-serif)',
                  color: 'var(--text-primary)',
                  margin: 0,
                }}
              >
                {role.companionName}
              </h1>
              <p
                style={{
                  fontSize: 15,
                  fontFamily: 'var(--font-sans)',
                  color: 'var(--text-secondary)',
                  margin: '4px 0 0',
                }}
              >
                {role.tagline}
              </p>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  marginTop: 'var(--space-2)',
                  flexWrap: 'wrap',
                }}
              >
                {role.audit && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '2px 10px',
                      borderRadius: 'var(--radius-pill)',
                      background: BADGE_COLOURS[role.audit.badge] ?? 'var(--text-muted)',
                      color: 'var(--text-inverse)',
                      textTransform: 'uppercase',
                    }}
                  >
                    {role.audit.badge}
                  </span>
                )}
                <span
                  style={{
                    fontSize: 13,
                    fontFamily: 'var(--font-sans)',
                    color: 'var(--text-muted)',
                    textTransform: 'capitalize',
                  }}
                >
                  {role.category}
                </span>
                {role.supportsVoice && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-muted)' }}>
                    <Mic size={12} /> Voice
                  </span>
                )}
                {role.supportsTextOnly && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-muted)' }}>
                    <MessageSquare size={12} /> Text
                  </span>
                )}
              </div>
            </div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                fontFamily: 'var(--font-sans)',
                color: 'var(--text-primary)',
              }}
            >
              {'\u00A3'}{(role.priceMonthly / 100).toFixed(2)}/mo
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          maxWidth: 960,
          margin: '0 auto',
          padding: 'var(--space-8) var(--space-6)',
          display: 'grid',
          gridTemplateColumns: '1fr 320px',
          gap: 'var(--space-8)',
          alignItems: 'start',
        }}
      >
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Description */}
          <div>
            <h2
              style={{
                fontSize: 18,
                fontWeight: 700,
                fontFamily: 'var(--font-sans)',
                color: 'var(--text-primary)',
                marginBottom: 'var(--space-3)',
              }}
            >
              About {role.companionName}
            </h2>
            <p
              style={{
                fontSize: 14,
                fontFamily: 'var(--font-sans)',
                color: 'var(--text-secondary)',
                lineHeight: 1.7,
              }}
            >
              {role.description}
            </p>
          </div>

          {/* Capabilities */}
          {role.capabilities && role.capabilities.length > 0 && (
            <div>
              <h3
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  fontFamily: 'var(--font-sans)',
                  color: 'var(--text-primary)',
                  marginBottom: 'var(--space-3)',
                }}
              >
                What {role.companionName} can help with
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {role.capabilities.map((cap: string) => (
                  <li
                    key={cap}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 'var(--space-2)',
                      fontSize: 13,
                      fontFamily: 'var(--font-sans)',
                      color: 'var(--text-secondary)',
                      marginBottom: 'var(--space-2)',
                      lineHeight: 1.5,
                    }}
                  >
                    <CheckCircle size={14} style={{ color: 'var(--accent-600)', flexShrink: 0, marginTop: 3 }} />
                    {cap}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 47-check Audit */}
          <div>
            <h3
              style={{
                fontSize: 16,
                fontWeight: 600,
                fontFamily: 'var(--font-sans)',
                color: 'var(--text-primary)',
                marginBottom: 'var(--space-3)',
              }}
            >
              Trust audit
            </h3>
            <AuditSection roleId={role.id} />
          </div>

          {/* Community Reviews */}
          <div>
            <h3
              style={{
                fontSize: 16,
                fontWeight: 600,
                fontFamily: 'var(--font-sans)',
                color: 'var(--text-primary)',
                marginBottom: 'var(--space-3)',
              }}
            >
              Community reviews
            </h3>
            {slug && <ReviewsSection slug={slug} />}
          </div>
        </div>

        {/* Right column - Hire flow (sticky) */}
        <div style={{ position: 'sticky', top: 'var(--space-6)' }}>
          <HireFlow roleId={role.id} companionName={role.companionName} />
        </div>
      </div>
    </div>
  );
}
