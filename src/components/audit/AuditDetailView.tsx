/**
 * Phase 5: Trust Transparency - AuditDetailView Component
 * Makes the 47-check audit visible to users, not hidden.
 *
 * 3-stage accordion (config checks, behaviour tests, doc quality)
 * Each check: name, description, status (pass/warning/fail), score, evidence
 * Overall trust score with gauge
 * Badge tier explanation
 */

import React, { useState, useEffect } from 'react';
import {
  Shield,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ArrowLeft,
  Lock,
  Calendar,
  Hash,
  BarChart3,
  User,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AuditCheck {
  checkNumber: number;
  name: string;
  description: string;
  outcome: string; // PASS | FAIL | WARN | SKIP
  score: number;
  maxScore: number;
  details: string | null;
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
  roleSlug: string;
  roleName: string;
  companionName: string;
  category: string;
  trustScore: number;
  badge: string;
  stages: AuditStage[];
  scoring: {
    stage1Raw: number;
    stage2Raw: number;
    stage3Raw: number;
    communityScore: number;
    stage1Weighted: number;
    stage2Weighted: number;
    stage3Weighted: number;
    finalScore: number;
  };
  artefactHash: string;
  hashVerified: boolean;
  auditedBy: string;
  completedAt: string;
  expiresAt: string;
  isExpired: boolean;
  badgeExplanation: string;
  totalChecks: number;
  totalPassed: number;
  totalFailed: number;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AuditDetailViewProps {
  roleId: string;
  onBack: () => void;
}

// ---------------------------------------------------------------------------
// Badge styling
// ---------------------------------------------------------------------------

const BADGE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  PLATINUM: { bg: 'rgba(229,228,226,0.08)', border: 'rgba(229,228,226,0.3)', text: '#E5E4E2' },
  GOLD: { bg: 'rgba(255,215,0,0.08)', border: 'rgba(255,215,0,0.3)', text: '#FFD700' },
  SILVER: { bg: 'rgba(192,192,192,0.08)', border: 'rgba(192,192,192,0.3)', text: '#C0C0C0' },
  BASIC: { bg: 'rgba(139,90,43,0.08)', border: 'rgba(139,90,43,0.3)', text: '#8B5A2B' },
  REJECTED: { bg: 'rgba(255,59,48,0.08)', border: 'rgba(255,59,48,0.3)', text: '#FF3B30' },
};

const BADGE_VARIANT: Record<string, 'platinum' | 'gold' | 'silver' | 'basic'> = {
  PLATINUM: 'platinum',
  GOLD: 'gold',
  SILVER: 'silver',
  BASIC: 'basic',
};

// ---------------------------------------------------------------------------
// Outcome icons
// ---------------------------------------------------------------------------

function OutcomeIcon({ outcome }: { outcome: string }) {
  switch (outcome) {
    case 'PASS':
      return <CheckCircle size={14} color="#4ECB71" />;
    case 'WARN':
      return <AlertTriangle size={14} color="#FFB740" />;
    case 'FAIL':
      return <XCircle size={14} color="#FF6B6B" />;
    default:
      return <div style={{ width: 14, height: 14, borderRadius: 7, background: 'var(--color-border)' }} />;
  }
}

function outcomeColor(outcome: string): string {
  switch (outcome) {
    case 'PASS': return '#4ECB71';
    case 'WARN': return '#FFB740';
    case 'FAIL': return '#FF6B6B';
    default: return 'var(--color-text-muted)';
  }
}

// ---------------------------------------------------------------------------
// Trust Score Gauge
// ---------------------------------------------------------------------------

function TrustScoreGauge({ score, badge }: { score: number; badge: string }) {
  const circumference = 2 * Math.PI * 54;
  const progress = (score / 100) * circumference;
  const colors = BADGE_COLORS[badge] || BADGE_COLORS.BASIC;

  return (
    <div style={{ position: 'relative', width: 140, height: 140 }}>
      <svg width="140" height="140" viewBox="0 0 140 140">
        {/* Background circle */}
        <circle
          cx="70" cy="70" r="54"
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="8"
        />
        {/* Progress circle */}
        <circle
          cx="70" cy="70" r="54"
          fill="none"
          stroke={colors.text}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference}`}
          transform="rotate(-90 70 70)"
          style={{ transition: 'stroke-dasharray 1s ease' }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            fontSize: 32,
            fontWeight: 800,
            color: colors.text,
            fontFamily: 'var(--font-sans)',
            lineHeight: 1,
          }}
        >
          {score}
        </span>
        <span
          style={{
            fontSize: 10,
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-sans)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            marginTop: 4,
          }}
        >
          Trust Score
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stage Accordion
// ---------------------------------------------------------------------------

function StageAccordion({ stage }: { stage: AuditStage }) {
  const [isOpen, setIsOpen] = useState(false);
  const passRate = stage.total > 0 ? Math.round((stage.passed / stage.total) * 100) : 0;

  return (
    <Card padding="0">
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          padding: '14px 16px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          gap: 12,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'rgba(255,255,255,0.04)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            fontWeight: 800,
            color: 'var(--color-electric-blue)',
            fontFamily: 'var(--font-sans)',
            flexShrink: 0,
          }}
        >
          {stage.stage}
        </div>

        <div style={{ flex: 1, textAlign: 'left' }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: '#E8EDF5',
              fontFamily: 'var(--font-sans)',
            }}
          >
            {stage.name}
          </div>
          <div
            style={{
              fontSize: 11,
              color: 'var(--color-text-muted)',
              fontFamily: 'var(--font-sans)',
              marginTop: 2,
            }}
          >
            {stage.passed}/{stage.total} passed - {passRate}% pass rate - Weight: {Math.round(stage.weight * 100)}%
          </div>
        </div>

        {/* Score */}
        <div
          style={{
            fontSize: 18,
            fontWeight: 800,
            color: stage.score >= 80 ? '#4ECB71' : stage.score >= 60 ? '#FFB740' : '#FF6B6B',
            fontFamily: 'var(--font-sans)',
            flexShrink: 0,
          }}
        >
          {stage.score}
        </div>

        <div style={{ color: 'var(--color-text-muted)', flexShrink: 0 }}>
          {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </div>
      </button>

      {/* Expanded checks */}
      {isOpen && (
        <div
          style={{
            borderTop: '1px solid var(--color-border)',
            padding: '4px 0',
          }}
        >
          {/* Stage description */}
          <div
            style={{
              padding: '10px 16px',
              fontSize: 12,
              color: 'var(--color-text-muted)',
              fontFamily: 'var(--font-sans)',
              lineHeight: 1.6,
              borderBottom: '1px solid rgba(255,255,255,0.03)',
            }}
          >
            {stage.description}
          </div>

          {stage.checks.length === 0 && (
            <div
              style={{
                padding: '16px',
                fontSize: 12,
                color: 'var(--color-text-muted)',
                fontFamily: 'var(--font-sans)',
                textAlign: 'center',
              }}
            >
              Detailed check data not available for this stage. Summary: {stage.passed} passed, {stage.failed} failed.
            </div>
          )}

          {stage.checks.map((check, idx) => (
            <CheckRow key={idx} check={check} />
          ))}
        </div>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Individual Check Row
// ---------------------------------------------------------------------------

function CheckRow({ check }: { check: AuditCheck }) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div
      style={{
        padding: '10px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.02)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
          cursor: check.details ? 'pointer' : 'default',
        }}
        onClick={() => check.details && setShowDetails(!showDetails)}
      >
        <OutcomeIcon outcome={check.outcome} />
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: '#E8EDF5',
              fontFamily: 'var(--font-sans)',
            }}
          >
            {check.name}
          </div>
          <div
            style={{
              fontSize: 11,
              color: 'var(--color-text-muted)',
              fontFamily: 'var(--font-sans)',
              lineHeight: 1.5,
              marginTop: 2,
            }}
          >
            {check.description}
          </div>
        </div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: outcomeColor(check.outcome),
            fontFamily: 'var(--font-sans)',
            flexShrink: 0,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          {check.outcome}
        </div>
      </div>

      {/* Evidence/details */}
      {showDetails && check.details && (
        <div
          style={{
            marginTop: 8,
            marginLeft: 24,
            padding: '8px 12px',
            background: 'rgba(255,255,255,0.02)',
            borderRadius: 6,
            border: '1px solid rgba(255,255,255,0.04)',
            fontSize: 11,
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-mono)',
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
          }}
        >
          {check.details}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function AuditDetailView({ roleId, onBack }: AuditDetailViewProps) {
  const [audit, setAudit] = useState<AuditDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAudit() {
      try {
        setIsLoading(true);
        const result = await api.get<any>(
          '/trpc/audit.getAuditDetail?input=' + encodeURIComponent(JSON.stringify({ json: { roleId } }))
        );
        const data = result?.result?.data?.json || result;
        if (data.error) {
          setError(data.error);
        } else if (data.audit) {
          setAudit(data.audit);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load audit details');
      } finally {
        setIsLoading(false);
      }
    }
    fetchAudit();
  }, [roleId]);

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: 'var(--color-text-muted)',
          fontFamily: 'var(--font-sans)',
          fontSize: 13,
        }}
      >
        Loading audit details...
      </div>
    );
  }

  if (error || !audit) {
    return (
      <div style={{ padding: 24 }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            background: 'transparent',
            border: 'none',
            color: 'var(--color-text-muted)',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
            fontFamily: 'var(--font-sans)',
            padding: 0,
            marginBottom: 16,
          }}
        >
          <ArrowLeft size={14} />
          Back
        </button>
        <div
          style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: 'var(--color-text-muted)',
            fontSize: 13,
            fontFamily: 'var(--font-sans)',
          }}
        >
          {error || 'Audit details not available.'}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div
        style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--color-border)',
          flexShrink: 0,
        }}
      >
        <button
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            background: 'transparent',
            border: 'none',
            color: 'var(--color-text-muted)',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
            fontFamily: 'var(--font-sans)',
            padding: 0,
            marginBottom: 12,
          }}
        >
          <ArrowLeft size={14} />
          Back to role
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <Shield size={18} color="var(--color-electric-blue)" />
          <span
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: '#E8EDF5',
              fontFamily: 'var(--font-sans)',
            }}
          >
            Trust Audit - {audit.roleName}
          </span>
        </div>
        <div
          style={{
            fontSize: 12,
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-sans)',
          }}
        >
          Full 47-check audit report for {audit.companionName}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 700 }}>
          {/* Score overview */}
          <Card padding="20px">
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <TrustScoreGauge score={audit.trustScore} badge={audit.badge} />

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Badge variant={BADGE_VARIANT[audit.badge] || 'basic'} size="md">
                    {audit.badge}
                  </Badge>
                  {audit.isExpired && (
                    <Badge variant="basic" size="md">
                      EXPIRED
                    </Badge>
                  )}
                </div>

                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--color-text-muted)',
                    fontFamily: 'var(--font-sans)',
                    lineHeight: 1.7,
                    marginBottom: 12,
                  }}
                >
                  {audit.badgeExplanation}
                </div>

                {/* Quick stats */}
                <div style={{ display: 'flex', gap: 16 }}>
                  <StatPill
                    icon={<CheckCircle size={12} />}
                    label="Passed"
                    value={String(audit.totalPassed)}
                    color="#4ECB71"
                  />
                  <StatPill
                    icon={<XCircle size={12} />}
                    label="Failed"
                    value={String(audit.totalFailed)}
                    color="#FF6B6B"
                  />
                  <StatPill
                    icon={<BarChart3 size={12} />}
                    label="Total"
                    value={String(audit.totalChecks)}
                    color="var(--color-electric-blue)"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Score Calculation Breakdown */}
          <Card padding="16px">
            <SectionTitle icon={<BarChart3 size={14} />}>Score Calculation</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <ScoreRow label="Stage 1: Configuration (35%)" raw={audit.scoring.stage1Raw} weighted={audit.scoring.stage1Weighted} />
              <ScoreRow label="Stage 2: Behaviour (40%)" raw={audit.scoring.stage2Raw} weighted={audit.scoring.stage2Weighted} />
              <ScoreRow label="Stage 3: Documentation (25%)" raw={audit.scoring.stage3Raw} weighted={audit.scoring.stage3Weighted} />
              <div
                style={{
                  borderTop: '1px solid var(--color-border)',
                  paddingTop: 8,
                  marginTop: 4,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#E8EDF5',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  Final Trust Score
                </span>
                <span
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: audit.trustScore >= 80 ? '#4ECB71' : audit.trustScore >= 60 ? '#FFB740' : '#FF6B6B',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  {audit.scoring.finalScore}/100
                </span>
              </div>
            </div>
          </Card>

          {/* Stage accordions */}
          {audit.stages.map((stage) => (
            <StageAccordion key={stage.stage} stage={stage} />
          ))}

          {/* Verification */}
          <Card padding="16px">
            <SectionTitle icon={<Lock size={14} />}>Verification</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <VerifRow
                icon={<User size={12} />}
                label="Reviewed by"
                value={audit.auditedBy}
              />
              <VerifRow
                icon={<Calendar size={12} />}
                label="Completed"
                value={new Date(audit.completedAt).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              />
              <VerifRow
                icon={<Calendar size={12} />}
                label="Expires"
                value={new Date(audit.expiresAt).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              />
              <VerifRow
                icon={<Hash size={12} />}
                label="SHA-256 Hash"
                value={audit.artefactHash ? `${audit.artefactHash.substring(0, 16)}...${audit.artefactHash.substring(48)}` : 'N/A'}
              />
              <VerifRow
                icon={audit.hashVerified ? <CheckCircle size={12} /> : <AlertTriangle size={12} />}
                label="Hash Status"
                value={audit.hashVerified ? 'Verified - role configuration unchanged since audit' : 'Unverified - role may have been modified'}
                valueColor={audit.hashVerified ? '#4ECB71' : '#FFB740'}
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SectionTitle({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 12,
        fontWeight: 700,
        color: '#E8EDF5',
        fontFamily: 'var(--font-sans)',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        marginBottom: 12,
      }}
    >
      {icon && <span style={{ color: 'var(--color-text-muted)', display: 'flex' }}>{icon}</span>}
      {children}
    </div>
  );
}

function StatPill({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        background: `${color}10`,
        borderRadius: 6,
        border: `1px solid ${color}20`,
      }}
    >
      <span style={{ color, display: 'flex' }}>{icon}</span>
      <span
        style={{
          fontSize: 12,
          fontWeight: 700,
          color,
          fontFamily: 'var(--font-sans)',
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontSize: 10,
          color: 'var(--color-text-muted)',
          fontFamily: 'var(--font-sans)',
        }}
      >
        {label}
      </span>
    </div>
  );
}

function ScoreRow({ label, raw, weighted }: { label: string; raw: number; weighted: number }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span
        style={{
          fontSize: 12,
          color: 'var(--color-text-muted)',
          fontFamily: 'var(--font-sans)',
        }}
      >
        {label}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span
          style={{
            fontSize: 12,
            color: '#E8EDF5',
            fontFamily: 'var(--font-sans)',
          }}
        >
          {raw}/100
        </span>
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--color-electric-blue)',
            fontFamily: 'var(--font-sans)',
            minWidth: 32,
            textAlign: 'right',
          }}
        >
          {weighted}
        </span>
      </div>
    </div>
  );
}

function VerifRow({
  icon,
  label,
  value,
  valueColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
      <span style={{ color: 'var(--color-text-muted)', display: 'flex', marginTop: 2, flexShrink: 0 }}>
        {icon}
      </span>
      <div>
        <span
          style={{
            fontSize: 11,
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-sans)',
            marginRight: 8,
          }}
        >
          {label}:
        </span>
        <span
          style={{
            fontSize: 12,
            color: valueColor || '#E8EDF5',
            fontFamily: 'var(--font-sans)',
            fontWeight: valueColor ? 600 : 400,
            wordBreak: 'break-all',
          }}
        >
          {value}
        </span>
      </div>
    </div>
  );
}

export default AuditDetailView;
