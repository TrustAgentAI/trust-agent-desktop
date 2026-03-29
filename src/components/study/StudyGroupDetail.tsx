import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Users, Copy, Check, Play, LogOut, RefreshCw,
  Clock, MessageSquare, BookOpen,
} from 'lucide-react';
import { api } from '@/lib/api';

interface GroupMember {
  id: string;
  role: 'OWNER' | 'MEMBER';
  joinedAt: string;
  user: { id: string; name: string | null; avatarUrl: string | null; email: string };
}

interface SessionHistory {
  id: string;
  status: string;
  startedAt: string;
  endedAt: string | null;
  messageCount: number;
  duration: number | null;
  initiatedBy: { id: string; name: string | null };
}

interface GroupDetail {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  inviteCode: string;
  maxMembers: number;
  myRole: 'OWNER' | 'MEMBER';
  role: {
    id: string;
    name: string;
    companionName: string;
    category: string;
    environmentSlug: string;
    environmentConfig: Record<string, unknown>;
  };
  members: GroupMember[];
  sharedSessions: SessionHistory[];
}

const MEMBER_COLORS = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981',
  '#06b6d4', '#f43f5e', '#84cc16', '#6366f1', '#14b8a6',
];

function getMemberColor(index: number): string {
  return MEMBER_COLORS[index % MEMBER_COLORS.length];
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '-';
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  const remainMins = mins % 60;
  return `${hours}h ${remainMins}m`;
}

export function StudyGroupDetail() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const [group, setGroup] = React.useState<GroupDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [copied, setCopied] = React.useState(false);
  const [leaving, setLeaving] = React.useState(false);
  const [starting, setStarting] = React.useState(false);
  const [regenerating, setRegenerating] = React.useState(false);

  async function fetchGroup() {
    if (!groupId) return;
    try {
      const data = await api.get<GroupDetail>(`/trpc/studyGroups.getGroupDetail?input=${encodeURIComponent(JSON.stringify({ groupId }))}`);
      setGroup(data);
    } catch {
      navigate('/study');
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    fetchGroup();
  }, [groupId]);

  async function handleCopyCode() {
    if (!group) return;
    await navigator.clipboard.writeText(group.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleLeave() {
    if (!groupId || !confirm('Are you sure you want to leave this group?')) return;
    setLeaving(true);
    try {
      await api.post('/trpc/studyGroups.leaveGroup', { groupId });
      navigate('/study');
    } catch {
      setLeaving(false);
    }
  }

  async function handleStartSession() {
    if (!groupId) return;
    setStarting(true);
    try {
      const result = await api.post<{ sessionId: string }>('/trpc/studyGroups.startSharedSession', { groupId });
      navigate(`/study/${groupId}/session/${result.sessionId}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to start session');
      setStarting(false);
    }
  }

  async function handleRegenerateCode() {
    if (!groupId) return;
    setRegenerating(true);
    try {
      const result = await api.post<{ inviteCode: string }>('/trpc/studyGroups.generateInviteCode', { groupId });
      setGroup((prev) => prev ? { ...prev, inviteCode: result.inviteCode } : prev);
    } catch {
      // silent
    } finally {
      setRegenerating(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)' }}>
        Loading group...
      </div>
    );
  }

  if (!group) return null;

  // Check for an active session to jump into
  const activeSession = group.sharedSessions.find((s) => s.status === 'ACTIVE');

  return (
    <div style={{ padding: '24px 32px', maxWidth: 900, margin: '0 auto' }}>
      {/* Back nav */}
      <button
        onClick={() => navigate('/study')}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--color-text-muted)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 13,
          marginBottom: 20,
          padding: 0,
          fontFamily: 'var(--font-sans)',
        }}
      >
        <ArrowLeft size={16} />
        Back to Study Groups
      </button>

      {/* Group header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: '0 0 6px', fontSize: 24, color: 'var(--color-text-primary)', fontFamily: 'var(--font-sans)' }}>
            {group.name}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: 'var(--color-text-muted)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <BookOpen size={14} />
              {group.role.name} - {group.role.companionName}
            </span>
            {group.category && (
              <span
                style={{
                  background: 'rgba(30,111,255,0.1)',
                  color: 'var(--color-electric-blue)',
                  padding: '2px 8px',
                  borderRadius: 99,
                  fontSize: 11,
                  fontWeight: 500,
                }}
              >
                {group.category}
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {activeSession ? (
            <button
              onClick={() => navigate(`/study/${groupId}/session/${activeSession.id}`)}
              style={{
                background: '#22c55e',
                color: '#fff',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                padding: '10px 20px',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontFamily: 'var(--font-sans)',
              }}
            >
              <Play size={16} />
              Join Live Session
            </button>
          ) : (
            <button
              onClick={handleStartSession}
              disabled={starting}
              style={{
                background: 'var(--color-electric-blue)',
                color: '#fff',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                padding: '10px 20px',
                fontSize: 14,
                fontWeight: 600,
                cursor: starting ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontFamily: 'var(--font-sans)',
                opacity: starting ? 0.6 : 1,
              }}
            >
              <Play size={16} />
              {starting ? 'Starting...' : 'Start Study Session'}
            </button>
          )}
        </div>
      </div>

      {group.description && (
        <p style={{ margin: '0 0 24px', fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
          {group.description}
        </p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Members panel */}
        <div
          style={{
            background: 'var(--color-navy-2)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            padding: 20,
          }}
        >
          <h3 style={{ margin: '0 0 16px', fontSize: 15, color: 'var(--color-text-primary)', fontFamily: 'var(--font-sans)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={16} />
            Members ({group.members.length}/{group.maxMembers})
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {group.members.map((member, index) => (
              <div key={member.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {member.user.avatarUrl ? (
                  <img
                    src={member.user.avatarUrl}
                    alt=""
                    style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: getMemberColor(index),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#fff',
                    }}
                  >
                    {(member.user.name || member.user.email)[0]?.toUpperCase()}
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, color: 'var(--color-text-primary)', fontFamily: 'var(--font-sans)' }}>
                    {member.user.name || member.user.email}
                  </div>
                </div>
                {member.role === 'OWNER' && (
                  <span style={{ fontSize: 11, color: 'var(--color-electric-blue)', fontWeight: 600 }}>Owner</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Invite & actions panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Invite code */}
          <div
            style={{
              background: 'var(--color-navy-2)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: 20,
            }}
          >
            <h3 style={{ margin: '0 0 12px', fontSize: 15, color: 'var(--color-text-primary)', fontFamily: 'var(--font-sans)' }}>
              Invite Code
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  flex: 1,
                  background: 'var(--color-dark-navy)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 14px',
                  fontSize: 18,
                  fontWeight: 700,
                  letterSpacing: 4,
                  color: 'var(--color-electric-blue)',
                  textAlign: 'center',
                  fontFamily: 'var(--font-mono, monospace)',
                }}
              >
                {group.inviteCode}
              </div>
              <button
                onClick={handleCopyCode}
                style={{
                  background: 'var(--color-navy-3)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: 10,
                  cursor: 'pointer',
                  color: copied ? '#22c55e' : 'var(--color-text-muted)',
                }}
                title="Copy invite code"
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
              </button>
              {group.myRole === 'OWNER' && (
                <button
                  onClick={handleRegenerateCode}
                  disabled={regenerating}
                  style={{
                    background: 'var(--color-navy-3)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: 10,
                    cursor: regenerating ? 'wait' : 'pointer',
                    color: 'var(--color-text-muted)',
                  }}
                  title="Regenerate invite code"
                >
                  <RefreshCw size={18} style={{ animation: regenerating ? 'spin 1s linear infinite' : 'none' }} />
                </button>
              )}
            </div>
            <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--color-text-muted)' }}>
              Share this code with friends to invite them to your group.
            </p>
          </div>

          {/* Leave group */}
          <button
            onClick={handleLeave}
            disabled={leaving}
            style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 16px',
              color: '#ef4444',
              fontSize: 13,
              cursor: leaving ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              fontFamily: 'var(--font-sans)',
            }}
          >
            <LogOut size={14} />
            {leaving ? 'Leaving...' : 'Leave Group'}
          </button>
        </div>
      </div>

      {/* Session history */}
      <div style={{ marginTop: 24 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 15, color: 'var(--color-text-primary)', fontFamily: 'var(--font-sans)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Clock size={16} />
          Session History
        </h3>

        {group.sharedSessions.length === 0 ? (
          <div
            style={{
              background: 'var(--color-navy-2)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: 40,
              textAlign: 'center',
              color: 'var(--color-text-muted)',
              fontSize: 13,
            }}
          >
            No sessions yet. Start one to begin studying together.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {group.sharedSessions.map((session) => (
              <div
                key={session.id}
                onClick={() => session.status === 'ACTIVE' ? navigate(`/study/${groupId}/session/${session.id}`) : undefined}
                style={{
                  background: 'var(--color-navy-2)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: session.status === 'ACTIVE' ? 'pointer' : 'default',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: 'var(--color-text-secondary)' }}>
                  {session.status === 'ACTIVE' ? (
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
                  ) : (
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-text-muted)', opacity: 0.3, flexShrink: 0 }} />
                  )}
                  <span>
                    Started by {session.initiatedBy.name || 'Unknown'}
                  </span>
                  <span style={{ opacity: 0.6 }}>
                    {new Date(session.startedAt).toLocaleDateString()} {new Date(session.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: 'var(--color-text-muted)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <MessageSquare size={12} />
                    {session.messageCount}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={12} />
                    {formatDuration(session.duration)}
                  </span>
                  {session.status === 'ACTIVE' && (
                    <span style={{ color: '#22c55e', fontWeight: 600, fontSize: 11 }}>LIVE</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
