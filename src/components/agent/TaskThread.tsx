import React from 'react';
import { CheckCircle2, Circle, Loader2, XCircle, ChevronDown, ChevronRight, Ban } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { TaskStep } from '@/lib/roleConfig';

interface TaskThreadTask {
  id: string;
  title: string;
  agentId: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  steps: TaskStep[];
  createdAt: number;
  completedAt?: number;
}

interface TaskThreadProps {
  task: TaskThreadTask;
  onCancel: () => void;
}

const statusIcon: Record<string, React.ReactNode> = {
  pending: <Circle size={16} style={{ color: 'var(--color-text-mid)' }} />,
  running: <Loader2 size={16} style={{ color: 'var(--color-ion-cyan)', animation: 'spin 1s linear infinite' }} />,
  completed: <CheckCircle2 size={16} style={{ color: 'var(--color-success)' }} />,
  failed: <XCircle size={16} style={{ color: 'var(--color-error)' }} />,
  cancelled: <Ban size={16} style={{ color: 'var(--color-text-mid)' }} />,
};

export function TaskThread({ task, onCancel }: TaskThreadProps) {
  if (task.steps.length === 0) {
    return (
      <div
        style={{
          padding: 24,
          textAlign: 'center',
          color: 'var(--color-text-muted)',
          fontSize: '13px',
        }}
      >
        No active task steps. Start a conversation to trigger tasks.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Task header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8,
        }}
      >
        <div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#E8EDF5' }}>
            {task.title}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: 2 }}>
            Started {new Date(task.createdAt).toLocaleString()}
          </div>
        </div>
        {(task.status === 'running' || task.status === 'queued') && (
          <Button variant="danger" size="sm" onClick={onCancel}>
            Cancel Task
          </Button>
        )}
      </div>

      {/* Progress bar */}
      <TaskProgressBar steps={task.steps} />

      {/* Steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 8 }}>
        {task.steps.map((step, index) => (
          <StepItem key={step.id} step={step} index={index} />
        ))}
      </div>
    </div>
  );
}

function TaskProgressBar({ steps }: { steps: TaskStep[] }) {
  const completed = steps.filter((s) => s.status === 'completed').length;
  const total = steps.length;
  const pct = total > 0 ? (completed / total) * 100 : 0;

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '11px',
          color: 'var(--color-text-muted)',
          marginBottom: 4,
          fontFamily: 'var(--font-mono)',
        }}
      >
        <span>{completed}/{total} steps completed</span>
        <span>{Math.round(pct)}%</span>
      </div>
      <div
        style={{
          height: 4,
          borderRadius: 2,
          background: 'var(--color-surface-2)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            borderRadius: 2,
            background: 'var(--color-electric-blue)',
            transition: 'width 300ms ease',
          }}
        />
      </div>
    </div>
  );
}

function StepItem({ step, index }: { step: TaskStep; index: number }) {
  const [expanded, setExpanded] = React.useState(step.status === 'running');

  const isExpandable = step.status === 'completed' || step.status === 'running';

  return (
    <div
      style={{
        background: 'var(--color-surface-1)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
      }}
    >
      <button
        onClick={() => isExpandable && setExpanded(!expanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          width: '100%',
          padding: '10px 14px',
          background: 'transparent',
          border: 'none',
          color: '#E8EDF5',
          fontFamily: 'var(--font-sans)',
          fontSize: '13px',
          fontWeight: 500,
          textAlign: 'left',
          cursor: isExpandable ? 'pointer' : 'default',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          {statusIcon[step.status] || statusIcon.pending}
        </span>
        <span style={{ fontSize: '11px', color: 'var(--color-text-mid)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
          {String(index + 1).padStart(2, '0')}
        </span>
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {step.description}
        </span>
        {isExpandable && (
          <span style={{ display: 'flex', alignItems: 'center', color: 'var(--color-text-mid)', flexShrink: 0 }}>
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
        )}
        {step.completedAt && step.startedAt && (
          <span
            style={{
              fontSize: '10px',
              color: 'var(--color-text-mid)',
              fontFamily: 'var(--font-mono)',
              flexShrink: 0,
            }}
          >
            {formatDuration(step.completedAt - step.startedAt)}
          </span>
        )}
      </button>

      {expanded && (
        <div
          style={{
            padding: '0 14px 12px 52px',
            fontSize: '12px',
            color: 'var(--color-text-muted)',
            lineHeight: 1.6,
            borderTop: '1px solid var(--color-border)',
            paddingTop: 10,
            animation: 'fadeIn 150ms ease',
          }}
        >
          {step.status === 'running' && (
            <div style={{ color: 'var(--color-ion-cyan)' }}>
              Processing this step...
            </div>
          )}
          {step.status === 'completed' && (
            <div>Step completed successfully.</div>
          )}
        </div>
      )}
    </div>
  );
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}
