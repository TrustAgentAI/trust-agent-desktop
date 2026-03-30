/**
 * Phase 11.3 - Admin Follow-Up Queue
 * Lists queued follow-ups by priority.
 * Assign to team member, record notes and resolution.
 * SLA tracking (urgent: 4hr, high: 24hr, medium: 48hr).
 */
import React from 'react';
import { AlertTriangle, Clock, User, CheckCircle, MessageSquare, ChevronDown } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  type FollowUpEntry,
  type FollowUpStatus,
  type FollowUpPriority,
  fetchFollowUpQueue,
  assignFollowUp,
  resolveFollowUp,
  addFollowUpNotes,
  getSLATimeRemaining,
  isSLABreached,
} from '@/lib/human-followup';

interface FollowUpQueueProps {
  /** Team members available for assignment */
  teamMembers?: { id: string; name: string }[];
}

const PRIORITY_COLORS: Record<string, string> = {
  URGENT: '#EF4444',
  HIGH: '#F59E0B',
  MEDIUM: '#3B82F6',
  LOW: '#6B7280',
};

const PRIORITY_ORDER: FollowUpPriority[] = ['URGENT', 'HIGH', 'MEDIUM', 'LOW'];

const STATUS_LABELS: Record<FollowUpStatus, string> = {
  QUEUED: 'Queued',
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
};

const REASON_LABELS: Record<string, string> = {
  WELLBEING_DECLINE: 'Wellbeing Decline',
  CRISIS_FLAG: 'Crisis Flag',
  GUARDIAN_REQUEST: 'Guardian Request',
  ADMIN_REFERRAL: 'Admin Referral',
  MISSED_SESSIONS: 'Missed Sessions',
};

export function HumanFollowUpQueue({ teamMembers = [] }: FollowUpQueueProps) {
  const [entries, setEntries] = React.useState<FollowUpEntry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState<FollowUpStatus | 'ALL'>('ALL');
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [assignModalId, setAssignModalId] = React.useState<string | null>(null);
  const [resolveModalId, setResolveModalId] = React.useState<string | null>(null);
  const [noteText, setNoteText] = React.useState('');
  const [resolutionText, setResolutionText] = React.useState('');

  const loadQueue = React.useCallback(async () => {
    setLoading(true);
    const filters: { status?: FollowUpStatus } = {};
    if (statusFilter !== 'ALL') filters.status = statusFilter;
    const data = await fetchFollowUpQueue(filters);
    // Sort by priority order, then by creation date
    data.sort((a, b) => {
      const pa = PRIORITY_ORDER.indexOf(a.priority as FollowUpPriority);
      const pb = PRIORITY_ORDER.indexOf(b.priority as FollowUpPriority);
      if (pa !== pb) return pa - pb;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
    setEntries(data);
    setLoading(false);
  }, [statusFilter]);

  React.useEffect(() => {
    loadQueue();
    // Refresh every 60 seconds for SLA tracking
    const interval = setInterval(loadQueue, 60000);
    return () => clearInterval(interval);
  }, [loadQueue]);

  const handleAssign = async (entryId: string, memberId: string) => {
    try {
      await assignFollowUp(entryId, memberId);
      setAssignModalId(null);
      await loadQueue();
    } catch (err) {
      console.error('Failed to assign follow-up:', err);
    }
  };

  const handleResolve = async (entryId: string) => {
    if (!resolutionText.trim()) return;
    try {
      await resolveFollowUp(entryId, resolutionText.trim(), noteText.trim() || undefined);
      setResolveModalId(null);
      setResolutionText('');
      setNoteText('');
      await loadQueue();
    } catch (err) {
      console.error('Failed to resolve follow-up:', err);
    }
  };

  const handleAddNote = async (entryId: string) => {
    if (!noteText.trim()) return;
    try {
      await addFollowUpNotes(entryId, noteText.trim());
      setNoteText('');
      await loadQueue();
    } catch (err) {
      console.error('Failed to add note:', err);
    }
  };

  const activeCount = entries.filter((e) => e.status !== 'RESOLVED').length;
  const urgentCount = entries.filter((e) => e.priority === 'URGENT' && e.status !== 'RESOLVED').length;
  const breachedCount = entries.filter(
    (e) => e.slaDeadline && isSLABreached(e.slaDeadline) && e.status !== 'RESOLVED',
  ).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2
            style={{
              fontSize: 18,
              fontWeight: 800,
              color: '#E8EDF5',
              fontFamily: 'var(--font-sans)',
              margin: 0,
            }}
          >
            Human Follow-Up Queue
          </h2>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)', marginTop: 4 }}>
            {activeCount} active {activeCount === 1 ? 'case' : 'cases'}
            {urgentCount > 0 && (
              <span style={{ color: '#EF4444', marginLeft: 8 }}>
                {urgentCount} urgent
              </span>
            )}
            {breachedCount > 0 && (
              <span style={{ color: '#EF4444', marginLeft: 8 }}>
                {breachedCount} SLA breached
              </span>
            )}
          </div>
        </div>

        {/* Status filter */}
        <div style={{ display: 'flex', gap: 6 }}>
          {(['ALL', 'QUEUED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              style={{
                padding: '4px 10px',
                fontSize: 11,
                fontWeight: 600,
                fontFamily: 'var(--font-sans)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid',
                borderColor: statusFilter === s ? 'var(--color-electric-blue)' : 'rgba(255,255,255,0.1)',
                background: statusFilter === s ? 'rgba(30,111,255,0.1)' : 'transparent',
                color: statusFilter === s ? 'var(--color-electric-blue)' : 'var(--color-text-muted)',
                cursor: 'pointer',
                transition: 'all 150ms ease',
              }}
            >
              {s === 'ALL' ? 'All' : STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Queue list */}
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 13 }}>
          Loading follow-up queue...
        </div>
      ) : entries.length === 0 ? (
        <Card padding="40px">
          <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 13, fontFamily: 'var(--font-sans)' }}>
            <CheckCircle size={24} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.5 }} />
            No follow-ups in queue
          </div>
        </Card>
      ) : (
        entries.map((entry) => (
          <FollowUpCard
            key={entry.id}
            entry={entry}
            isExpanded={expandedId === entry.id}
            onToggle={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
            onAssign={() => setAssignModalId(entry.id)}
            onResolve={() => setResolveModalId(entry.id)}
            teamMembers={teamMembers}
            assignModalOpen={assignModalId === entry.id}
            resolveModalOpen={resolveModalId === entry.id}
            noteText={noteText}
            resolutionText={resolutionText}
            onNoteChange={setNoteText}
            onResolutionChange={setResolutionText}
            onSubmitAssign={(memberId) => handleAssign(entry.id, memberId)}
            onSubmitResolve={() => handleResolve(entry.id)}
            onSubmitNote={() => handleAddNote(entry.id)}
            onCancelAssign={() => setAssignModalId(null)}
            onCancelResolve={() => setResolveModalId(null)}
          />
        ))
      )}
    </div>
  );
}

// --- Follow-Up Card ---

interface FollowUpCardProps {
  entry: FollowUpEntry;
  isExpanded: boolean;
  onToggle: () => void;
  onAssign: () => void;
  onResolve: () => void;
  teamMembers: { id: string; name: string }[];
  assignModalOpen: boolean;
  resolveModalOpen: boolean;
  noteText: string;
  resolutionText: string;
  onNoteChange: (v: string) => void;
  onResolutionChange: (v: string) => void;
  onSubmitAssign: (memberId: string) => void;
  onSubmitResolve: () => void;
  onSubmitNote: () => void;
  onCancelAssign: () => void;
  onCancelResolve: () => void;
}

function FollowUpCard({
  entry,
  isExpanded,
  onToggle,
  onAssign,
  onResolve,
  teamMembers,
  assignModalOpen,
  resolveModalOpen,
  noteText,
  resolutionText,
  onNoteChange,
  onResolutionChange,
  onSubmitAssign,
  onSubmitResolve,
  onSubmitNote,
  onCancelAssign,
  onCancelResolve,
}: FollowUpCardProps) {
  const priorityColor = PRIORITY_COLORS[entry.priority] || PRIORITY_COLORS.MEDIUM;
  const breached = entry.slaDeadline && isSLABreached(entry.slaDeadline) && entry.status !== 'RESOLVED';
  const slaText = entry.slaDeadline ? getSLATimeRemaining(entry.slaDeadline) : '';

  return (
    <Card
      padding="0"
      style={{
        borderLeft: `3px solid ${breached ? '#EF4444' : priorityColor}`,
        overflow: 'hidden',
      }}
    >
      {/* Summary row */}
      <button
        onClick={onToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          padding: '12px 16px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          gap: 12,
          textAlign: 'left',
        }}
      >
        <AlertTriangle size={16} color={priorityColor} style={{ flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#E8EDF5', fontFamily: 'var(--font-sans)' }}>
              {REASON_LABELS[entry.reason] || entry.reason}
            </span>
            <Badge
              variant={entry.priority === 'URGENT' ? 'destructive' : 'default'}
              size="sm"
            >
              {entry.priority}
            </Badge>
            <Badge variant="default" size="sm">
              {STATUS_LABELS[entry.status as FollowUpStatus] || entry.status}
            </Badge>
          </div>
          <div
            style={{
              fontSize: 11,
              color: 'var(--color-text-muted)',
              fontFamily: 'var(--font-sans)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            User: {entry.userId.slice(0, 8)}...
            {entry.assignedTo && ` | Assigned to: ${entry.assignedTo}`}
          </div>
        </div>

        {/* SLA indicator */}
        {slaText && entry.status !== 'RESOLVED' && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 10,
              fontWeight: 600,
              fontFamily: 'var(--font-sans)',
              color: breached ? '#EF4444' : slaText.includes('h') && parseInt(slaText) < 2 ? '#F59E0B' : 'var(--color-text-muted)',
              flexShrink: 0,
            }}
          >
            <Clock size={11} />
            {slaText}
          </div>
        )}

        <ChevronDown
          size={14}
          color="var(--color-text-muted)"
          style={{
            flexShrink: 0,
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 150ms ease',
          }}
        />
      </button>

      {/* Expanded detail */}
      {isExpanded && (
        <div style={{ padding: '0 16px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {/* Details */}
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
              Details
            </div>
            <div style={{ fontSize: 12, color: '#E8EDF5', lineHeight: 1.6, fontFamily: 'var(--font-sans)' }}>
              {entry.details}
            </div>
          </div>

          {/* Notes */}
          {entry.notes && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                Notes
              </div>
              <div style={{ fontSize: 12, color: '#E8EDF5', lineHeight: 1.6, fontFamily: 'var(--font-sans)', padding: 8, background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)' }}>
                {entry.notes}
              </div>
            </div>
          )}

          {/* Resolution */}
          {entry.resolution && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-success)', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                Resolution
              </div>
              <div style={{ fontSize: 12, color: '#E8EDF5', lineHeight: 1.6, fontFamily: 'var(--font-sans)', padding: 8, background: 'rgba(20,184,106,0.06)', borderRadius: 'var(--radius-sm)' }}>
                {entry.resolution}
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)' }}>
            <span>Created: {new Date(entry.createdAt).toLocaleString()}</span>
            {entry.assignedAt && <span>Assigned: {new Date(entry.assignedAt).toLocaleString()}</span>}
            {entry.resolvedAt && <span>Resolved: {new Date(entry.resolvedAt).toLocaleString()}</span>}
          </div>

          {/* Actions */}
          {entry.status !== 'RESOLVED' && (
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              {entry.status === 'QUEUED' && (
                <Button variant="primary" size="sm" onClick={onAssign} icon={<User size={12} />}>
                  Assign
                </Button>
              )}
              <Button variant="primary" size="sm" onClick={onResolve} icon={<CheckCircle size={12} />}>
                Resolve
              </Button>
              <div style={{ flex: 1 }} />
              {/* Inline note input */}
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Add note..."
                  value={noteText}
                  onChange={(e) => onNoteChange(e.target.value)}
                  style={{
                    padding: '4px 8px',
                    fontSize: 11,
                    fontFamily: 'var(--font-sans)',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 'var(--radius-sm)',
                    color: '#E8EDF5',
                    width: 180,
                    outline: 'none',
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && onSubmitNote()}
                />
                <button
                  onClick={onSubmitNote}
                  disabled={!noteText.trim()}
                  style={{
                    padding: '4px 8px',
                    fontSize: 11,
                    fontWeight: 600,
                    fontFamily: 'var(--font-sans)',
                    background: noteText.trim() ? 'var(--color-electric-blue)' : 'transparent',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 'var(--radius-sm)',
                    color: noteText.trim() ? '#fff' : 'var(--color-text-muted)',
                    cursor: noteText.trim() ? 'pointer' : 'not-allowed',
                  }}
                >
                  <MessageSquare size={11} />
                </button>
              </div>
            </div>
          )}

          {/* Assign modal */}
          {assignModalOpen && (
            <div style={{ marginTop: 12, padding: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#E8EDF5', fontFamily: 'var(--font-sans)', marginBottom: 8 }}>
                Assign to team member
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {teamMembers.length === 0 ? (
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>No team members configured</div>
                ) : (
                  teamMembers.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => onSubmitAssign(m.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '6px 10px',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 'var(--radius-sm)',
                        color: '#E8EDF5',
                        fontSize: 12,
                        fontFamily: 'var(--font-sans)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        width: '100%',
                        transition: 'background 150ms ease',
                      }}
                    >
                      <User size={12} />
                      {m.name}
                    </button>
                  ))
                )}
              </div>
              <button
                onClick={onCancelAssign}
                style={{ marginTop: 8, fontSize: 11, color: 'var(--color-text-muted)', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}
              >
                Cancel
              </button>
            </div>
          )}

          {/* Resolve modal */}
          {resolveModalOpen && (
            <div style={{ marginTop: 12, padding: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#E8EDF5', fontFamily: 'var(--font-sans)', marginBottom: 8 }}>
                Resolve follow-up
              </div>
              <textarea
                placeholder="Resolution summary (required)..."
                value={resolutionText}
                onChange={(e) => onResolutionChange(e.target.value)}
                rows={3}
                style={{
                  width: '100%',
                  padding: 8,
                  fontSize: 12,
                  fontFamily: 'var(--font-sans)',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 'var(--radius-sm)',
                  color: '#E8EDF5',
                  resize: 'vertical',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={onSubmitResolve}
                  disabled={!resolutionText.trim()}
                  icon={<CheckCircle size={12} />}
                >
                  Resolve
                </Button>
                <button
                  onClick={onCancelResolve}
                  style={{ fontSize: 11, color: 'var(--color-text-muted)', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
