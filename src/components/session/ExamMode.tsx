import React from 'react';
import {
  Timer,
  Play,
  Square,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronDown,
  FileText,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

// --- Types ---

export type ExamDuration = 30 | 45 | 60 | 90 | 120;

export type ExamStatus = 'setup' | 'in_progress' | 'marking' | 'complete';

export interface ExamAnswer {
  questionNumber: number;
  studentAnswer: string;
  marksAwarded: number;
  marksAvailable: number;
  feedback: string;
  correct: boolean;
}

export interface ExamReport {
  totalMarks: number;
  marksAwarded: number;
  percentage: number;
  grade: string;
  answers: ExamAnswer[];
  improvementPlan: string[];
  timeUsed: number; // seconds
  timeDuration: number; // seconds
}

interface ExamModeProps {
  onStartExam: (duration: ExamDuration) => void;
  onEndExam: () => void;
  onSubmitForMarking: () => void;
  examStatus: ExamStatus;
  examReport?: ExamReport | null;
  onDismiss: () => void;
}

const DURATION_OPTIONS: { value: ExamDuration; label: string }[] = [
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' },
];

// --- Exam Setup Panel ---

function ExamSetup({
  onStart,
  onCancel,
}: {
  onStart: (duration: ExamDuration) => void;
  onCancel: () => void;
}) {
  const [selectedDuration, setSelectedDuration] = React.useState<ExamDuration>(60);
  const [showDurations, setShowDurations] = React.useState(false);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 440,
          background: 'var(--color-dark-navy)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: 28,
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'rgba(239,68,68,0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <Timer size={28} style={{ color: 'var(--color-error)' }} />
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
            Start Exam Mode
          </h2>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)', lineHeight: 1.5 }}>
            Exam conditions will be enforced. No hints, no encouragement,
            strict timed environment. Your answers will be marked against the mark scheme when time ends.
          </p>
        </div>

        {/* Duration selector */}
        <div style={{ marginBottom: 24 }}>
          <label
            style={{
              display: 'block',
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--color-text-muted)',
              fontFamily: 'var(--font-sans)',
              marginBottom: 8,
            }}
          >
            Exam Duration
          </label>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowDurations(!showDurations)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '12px 14px',
                background: 'var(--color-surface-1)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                color: '#E8EDF5',
                fontSize: 14,
                fontWeight: 600,
                fontFamily: 'var(--font-sans)',
                cursor: 'pointer',
              }}
            >
              {DURATION_OPTIONS.find((d) => d.value === selectedDuration)?.label}
              <ChevronDown size={16} style={{ color: 'var(--color-text-muted)' }} />
            </button>
            {showDurations && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: 4,
                  background: 'var(--color-dark-navy)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  zIndex: 10,
                }}
              >
                {DURATION_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setSelectedDuration(opt.value);
                      setShowDurations(false);
                    }}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '10px 14px',
                      background: selectedDuration === opt.value ? 'rgba(30,111,255,0.1)' : 'transparent',
                      border: 'none',
                      color: selectedDuration === opt.value ? 'var(--color-electric-blue)' : '#E8EDF5',
                      fontSize: 13,
                      fontWeight: 500,
                      fontFamily: 'var(--font-sans)',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Warning */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8,
            padding: '10px 14px',
            background: 'rgba(245,158,11,0.08)',
            border: '1px solid rgba(245,158,11,0.2)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 24,
          }}
        >
          <AlertTriangle size={16} style={{ color: '#F59E0B', flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 12, color: '#F59E0B', fontFamily: 'var(--font-sans)', lineHeight: 1.5 }}>
            During the exam: no AI hints, no encouragement, no skipping.
            When the timer ends, your companion will mark every answer against the mark scheme.
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="ghost" size="lg" onClick={onCancel} style={{ flex: 1 }}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={() => onStart(selectedDuration)}
            style={{ flex: 1, background: 'var(--color-error)' }}
            icon={<Play size={16} />}
          >
            Begin Exam
          </Button>
        </div>
      </div>
    </div>
  );
}

// --- Exam Timer Bar ---

export function ExamTimerBar({
  durationSeconds,
  elapsedSeconds,
  onEndEarly,
}: {
  durationSeconds: number;
  elapsedSeconds: number;
  onEndEarly: () => void;
}) {
  const remaining = Math.max(durationSeconds - elapsedSeconds, 0);
  const progress = elapsedSeconds / durationSeconds;
  const isLow = remaining <= 300; // 5 minutes
  const isCritical = remaining <= 60; // 1 minute

  const formatTime = (secs: number): string => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const barColor = isCritical ? 'var(--color-error)' : isLow ? '#F59E0B' : 'var(--color-electric-blue)';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '8px 20px',
        background: isCritical ? 'rgba(239,68,68,0.08)' : 'rgba(239,68,68,0.04)',
        borderBottom: `1px solid ${isCritical ? 'rgba(239,68,68,0.3)' : 'rgba(239,68,68,0.15)'}`,
      }}
    >
      <Timer
        size={16}
        style={{
          color: barColor,
          animation: isCritical ? 'pulse 1s ease-in-out infinite' : undefined,
        }}
      />
      <span
        style={{
          fontSize: 14,
          fontWeight: 800,
          fontFamily: 'var(--font-mono)',
          color: barColor,
          letterSpacing: '0.02em',
        }}
      >
        {formatTime(remaining)}
      </span>

      {/* Progress bar */}
      <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)' }}>
        <div
          style={{
            height: '100%',
            borderRadius: 2,
            width: `${Math.min(progress * 100, 100)}%`,
            background: barColor,
            transition: 'width 1s linear',
          }}
        />
      </div>

      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: 'var(--color-error)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          fontFamily: 'var(--font-mono)',
          padding: '3px 10px',
          background: 'rgba(239,68,68,0.1)',
          borderRadius: 100,
        }}
      >
        Exam Mode
      </span>

      <Button
        variant="ghost"
        size="sm"
        onClick={onEndEarly}
        icon={<Square size={12} />}
        style={{ color: 'var(--color-error)' }}
      >
        End Early
      </Button>
    </div>
  );
}

// --- Post-Exam Report ---

export function ExamReportView({
  report,
  onDismiss,
}: {
  report: ExamReport;
  onDismiss: () => void;
}) {
  const gradeColor =
    report.percentage >= 70
      ? 'var(--color-success)'
      : report.percentage >= 50
      ? '#F59E0B'
      : 'var(--color-error)';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        overflow: 'auto',
        padding: 32,
      }}
    >
      <div
        style={{
          width: 560,
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'var(--color-dark-navy)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: 28,
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: `${gradeColor}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <span style={{ fontSize: 28, fontWeight: 800, color: gradeColor, fontFamily: 'var(--font-sans)' }}>
              {report.grade}
            </span>
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#E8EDF5', fontFamily: 'var(--font-sans)', marginBottom: 4 }}>
            Exam Complete
          </h2>
          <p style={{ fontSize: 14, color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)' }}>
            {report.marksAwarded} / {report.totalMarks} marks ({report.percentage}%)
          </p>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 24 }}>
          <MiniStat icon={<CheckCircle2 size={14} />} label="Marks" value={`${report.marksAwarded}/${report.totalMarks}`} color={gradeColor} />
          <MiniStat icon={<Clock size={14} />} label="Time Used" value={formatDuration(report.timeUsed)} color="var(--color-electric-blue)" />
          <MiniStat icon={<TrendingUp size={14} />} label="Score" value={`${report.percentage}%`} color={gradeColor} />
        </div>

        {/* Question breakdown */}
        <div style={{ marginBottom: 24 }}>
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
            Question Breakdown
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {report.answers.map((answer) => (
              <Card key={answer.questionNumber} padding="12px 16px">
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ flexShrink: 0, marginTop: 2 }}>
                    {answer.correct ? (
                      <CheckCircle2 size={16} style={{ color: 'var(--color-success)' }} />
                    ) : (
                      <XCircle size={16} style={{ color: 'var(--color-error)' }} />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#E8EDF5', fontFamily: 'var(--font-sans)' }}>
                        Question {answer.questionNumber}
                      </span>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: answer.correct ? 'var(--color-success)' : 'var(--color-error)',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {answer.marksAwarded}/{answer.marksAvailable}
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)', lineHeight: 1.5, margin: 0 }}>
                      {answer.feedback}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Improvement plan */}
        {report.improvementPlan.length > 0 && (
          <div style={{ marginBottom: 24 }}>
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
              Improvement Plan
            </div>
            <Card padding="14px 16px">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {report.improvementPlan.map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-electric-blue)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
                      {i + 1}.
                    </span>
                    <span style={{ fontSize: 12, color: '#E8EDF5', fontFamily: 'var(--font-sans)', lineHeight: 1.5 }}>
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button variant="ghost" size="md" onClick={onDismiss}>
            Close Report
          </Button>
          <Button variant="primary" size="md" onClick={onDismiss} icon={<FileText size={14} />}>
            Save to Notes
          </Button>
        </div>
      </div>
    </div>
  );
}

// --- Main ExamMode wrapper ---

export function ExamMode({
  onStartExam,
  onEndExam: _onEndExam,
  onSubmitForMarking: _onSubmitForMarking,
  examStatus,
  examReport,
  onDismiss,
}: ExamModeProps) {
  if (examStatus === 'setup') {
    return (
      <ExamSetup
        onStart={onStartExam}
        onCancel={onDismiss}
      />
    );
  }

  if (examStatus === 'complete' && examReport) {
    return <ExamReportView report={examReport} onDismiss={onDismiss} />;
  }

  return null;
}

// --- Helpers ---

function MiniStat({
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
        padding: '10px 12px',
        background: 'var(--color-surface-1)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        textAlign: 'center',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 4 }}>
        <span style={{ color }}>{icon}</span>
        <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>{label}</span>
      </div>
      <div style={{ fontSize: 16, fontWeight: 800, color, fontFamily: 'var(--font-sans)' }}>{value}</div>
    </div>
  );
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    return `${h}h ${m % 60}m`;
  }
  return `${m}m ${s}s`;
}

export default ExamMode;
