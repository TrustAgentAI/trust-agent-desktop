import React from 'react';
import { FileText, Target, BookOpen, Star, Download, ChevronDown, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export interface BrainSummary {
  userName?: string;
  goals?: string[];
  topicsMastered?: string[];
  topicsInProgress?: string[];
  topicsNotStarted?: string[];
  struggleAreas?: string[];
  strongAreas?: string[];
  examReadinessScore?: number;
  cefrLevel?: string;
  lastSessionSummary?: string;
  nextSessionFocus?: string;
  motivationalContext?: string;
  progressPercent?: number;
}

interface BrainViewerProps {
  summary: BrainSummary;
  milestones?: { type: string; achievedAt: string }[];
  preferences?: { key: string; value: string }[];
  onExport?: () => void;
  accentColor?: string;
}

export function BrainViewer({ summary, milestones, preferences, onExport, accentColor }: BrainViewerProps) {
  const accent = accentColor || 'var(--color-electric-blue)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16, overflowY: 'auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-md)',
              background: `${accent}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FileText size={16} color={accent} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#E8EDF5', fontFamily: 'var(--font-sans)' }}>
              Brain Contents
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)' }}>
              Read-only view of your Brain file
            </div>
          </div>
        </div>
        {onExport && (
          <Button variant="ghost" size="sm" icon={<Download size={12} />} onClick={onExport}>
            Export
          </Button>
        )}
      </div>

      {/* Summary overview */}
      {summary.progressPercent !== undefined && (
        <Card padding="12px">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)' }}>
              Overall Progress
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: accent, fontFamily: 'var(--font-mono)' }}>
              {summary.progressPercent}%
            </span>
          </div>
          <div style={{ height: 4, borderRadius: 2, background: 'var(--color-surface-2)' }}>
            <div
              style={{
                height: '100%',
                width: `${summary.progressPercent}%`,
                background: accent,
                borderRadius: 2,
                transition: 'width 300ms ease',
              }}
            />
          </div>
        </Card>
      )}

      {/* CEFR Level */}
      {summary.cefrLevel && (
        <Card padding="12px">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)' }}>
              Language Level
            </span>
            <Badge variant="info" size="md">{summary.cefrLevel}</Badge>
          </div>
        </Card>
      )}

      {/* Exam readiness */}
      {summary.examReadinessScore !== undefined && (
        <Card padding="12px">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)' }}>
              Exam Readiness
            </span>
            <Badge variant="trust" value={summary.examReadinessScore} />
          </div>
          <div style={{ height: 4, borderRadius: 2, background: 'var(--color-surface-2)' }}>
            <div
              style={{
                height: '100%',
                width: `${summary.examReadinessScore}%`,
                background:
                  summary.examReadinessScore >= 70
                    ? 'var(--color-success)'
                    : summary.examReadinessScore >= 40
                      ? '#F59E0B'
                      : 'var(--color-error)',
                borderRadius: 2,
              }}
            />
          </div>
        </Card>
      )}

      {/* Topics */}
      <CollapsibleSection title="Topics Mastered" icon={<Star size={14} />} count={summary.topicsMastered?.length}>
        {summary.topicsMastered?.map((t) => (
          <TopicItem key={t} label={t} status="mastered" />
        ))}
      </CollapsibleSection>

      <CollapsibleSection title="Topics In Progress" icon={<BookOpen size={14} />} count={summary.topicsInProgress?.length}>
        {summary.topicsInProgress?.map((t) => (
          <TopicItem key={t} label={t} status="in-progress" />
        ))}
      </CollapsibleSection>

      {/* Goals */}
      {summary.goals && summary.goals.length > 0 && (
        <CollapsibleSection title="Goals" icon={<Target size={14} />} count={summary.goals.length}>
          {summary.goals.map((g) => (
            <div
              key={g}
              style={{
                fontSize: 12,
                color: '#E8EDF5',
                padding: '4px 0',
                fontFamily: 'var(--font-sans)',
              }}
            >
              {g}
            </div>
          ))}
        </CollapsibleSection>
      )}

      {/* Milestones */}
      {milestones && milestones.length > 0 && (
        <CollapsibleSection title="Milestones" icon={<Star size={14} />} count={milestones.length}>
          {milestones.map((ms, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '4px 0',
              }}
            >
              <span style={{ fontSize: 12, color: '#E8EDF5', fontFamily: 'var(--font-sans)' }}>
                {ms.type.replace(/_/g, ' ')}
              </span>
              <span style={{ fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                {new Date(ms.achievedAt).toLocaleDateString()}
              </span>
            </div>
          ))}
        </CollapsibleSection>
      )}

      {/* Preferences */}
      {preferences && preferences.length > 0 && (
        <CollapsibleSection title="Preferences" count={preferences.length}>
          {preferences.map((p) => (
            <div
              key={p.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '4px 0',
              }}
            >
              <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)' }}>
                {p.key}
              </span>
              <span style={{ fontSize: 12, color: '#E8EDF5', fontFamily: 'var(--font-sans)' }}>
                {p.value}
              </span>
            </div>
          ))}
        </CollapsibleSection>
      )}

      {/* Last session summary */}
      {summary.lastSessionSummary && (
        <Card padding="12px">
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 6, fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Last Session
          </div>
          <div style={{ fontSize: 12, color: '#E8EDF5', lineHeight: 1.6, fontFamily: 'var(--font-sans)' }}>
            {summary.lastSessionSummary}
          </div>
        </Card>
      )}

      {/* Next focus */}
      {summary.nextSessionFocus && (
        <Card padding="12px">
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 6, fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Next Session Focus
          </div>
          <div style={{ fontSize: 12, color: accent, lineHeight: 1.6, fontFamily: 'var(--font-sans)', fontWeight: 600 }}>
            {summary.nextSessionFocus}
          </div>
        </Card>
      )}
    </div>
  );
}

function CollapsibleSection({
  title,
  icon,
  count,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  count?: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <Card padding="0">
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 12px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: '#E8EDF5',
          fontFamily: 'var(--font-sans)',
        }}
      >
        {icon && <span style={{ color: 'var(--color-text-muted)', display: 'flex' }}>{icon}</span>}
        <span style={{ fontSize: 12, fontWeight: 600, flex: 1, textAlign: 'left' }}>{title}</span>
        {count !== undefined && (
          <span style={{ fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
            {count}
          </span>
        )}
        {open ? <ChevronDown size={14} color="var(--color-text-muted)" /> : <ChevronRight size={14} color="var(--color-text-muted)" />}
      </button>
      {open && (
        <div style={{ padding: '0 12px 10px', borderTop: '1px solid var(--color-border)' }}>
          {children}
        </div>
      )}
    </Card>
  );
}

function TopicItem({ label, status }: { label: string; status: 'mastered' | 'in-progress' | 'not-started' }) {
  const color =
    status === 'mastered'
      ? 'var(--color-success)'
      : status === 'in-progress'
        ? 'var(--color-electric-blue)'
        : 'var(--color-text-muted)';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
      <span style={{ fontSize: 12, color: '#E8EDF5', fontFamily: 'var(--font-sans)' }}>{label}</span>
    </div>
  );
}

export default BrainViewer;
