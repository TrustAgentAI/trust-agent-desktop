import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, LogIn, BookOpen, Clock } from 'lucide-react';
import { api } from '@/lib/api';
import { CreateGroupModal } from './CreateGroupModal';

interface StudyGroupSummary {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  role: { id: string; name: string; companionName: string; category: string };
  memberCount: number;
  maxMembers: number;
  myRole: 'OWNER' | 'MEMBER';
  inviteCode: string;
  lastSession: { startedAt: string; status: string } | null;
  createdAt: string;
}

export function StudyGroupList() {
  const navigate = useNavigate();
  const [groups, setGroups] = React.useState<StudyGroupSummary[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showCreate, setShowCreate] = React.useState(false);
  const [joinCode, setJoinCode] = React.useState('');
  const [joinError, setJoinError] = React.useState<string | null>(null);
  const [joining, setJoining] = React.useState(false);

  async function fetchGroups() {
    try {
      const data = await api.get<StudyGroupSummary[]>('/trpc/studyGroups.getMyGroups');
      setGroups(data);
    } catch {
      // Silently handle - empty state shown
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    fetchGroups();
  }, []);

  async function handleJoin() {
    if (!joinCode.trim()) return;
    setJoining(true);
    setJoinError(null);
    try {
      const result = await api.post<{ groupId: string }>('/trpc/studyGroups.joinGroup', {
        inviteCode: joinCode.trim(),
      });
      setJoinCode('');
      navigate(`/study/${result.groupId}`);
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : 'Invalid invite code');
    } finally {
      setJoining(false);
    }
  }

  function formatTimeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  return (
    <div style={{ padding: '24px 32px', maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Users size={28} color="var(--color-electric-blue)" />
          <h1 style={{ margin: 0, fontSize: 24, color: 'var(--color-text-primary)', fontFamily: 'var(--font-sans)' }}>
            Study Groups
          </h1>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          style={{
            background: 'var(--color-electric-blue)',
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
          <Plus size={16} />
          Create Group
        </button>
      </div>

      {/* Join group section */}
      <div
        style={{
          background: 'var(--color-navy-2)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: 20,
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <LogIn size={18} color="var(--color-text-muted)" />
        <span style={{ fontSize: 14, color: 'var(--color-text-secondary)', fontFamily: 'var(--font-sans)' }}>
          Join a group:
        </span>
        <input
          type="text"
          value={joinCode}
          onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setJoinError(null); }}
          placeholder="Enter invite code"
          maxLength={8}
          style={{
            background: 'var(--color-dark-navy)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '8px 14px',
            fontSize: 14,
            color: 'var(--color-text-primary)',
            outline: 'none',
            width: 160,
            fontFamily: 'var(--font-sans)',
            letterSpacing: 2,
            textTransform: 'uppercase',
          }}
        />
        <button
          onClick={handleJoin}
          disabled={joining || !joinCode.trim()}
          style={{
            background: 'var(--color-navy-3)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '8px 16px',
            fontSize: 13,
            cursor: joining ? 'wait' : 'pointer',
            opacity: !joinCode.trim() ? 0.5 : 1,
            fontFamily: 'var(--font-sans)',
          }}
        >
          {joining ? 'Joining...' : 'Join'}
        </button>
        {joinError && (
          <span style={{ color: '#ef4444', fontSize: 13, width: '100%', marginTop: 4 }}>{joinError}</span>
        )}
      </div>

      {/* Group cards */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)' }}>
          Loading study groups...
        </div>
      ) : groups.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: 60,
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-sans)',
          }}
        >
          <BookOpen size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
          <p style={{ fontSize: 16, margin: '0 0 8px' }}>No study groups yet</p>
          <p style={{ fontSize: 13, opacity: 0.7 }}>
            Create a group to study with friends, or join one with an invite code.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {groups.map((group) => (
            <div
              key={group.id}
              onClick={() => navigate(`/study/${group.id}`)}
              style={{
                background: 'var(--color-navy-2)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                padding: 20,
                cursor: 'pointer',
                transition: 'border-color 150ms',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--color-electric-blue)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <h3 style={{ margin: 0, fontSize: 16, color: 'var(--color-text-primary)', fontFamily: 'var(--font-sans)' }}>
                  {group.name}
                </h3>
                {group.myRole === 'OWNER' && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: 'var(--color-electric-blue)',
                      background: 'rgba(30,111,255,0.1)',
                      padding: '2px 8px',
                      borderRadius: 99,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                    }}
                  >
                    Owner
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 13, color: 'var(--color-text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <BookOpen size={14} />
                  {group.role.name}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Users size={14} />
                  {group.memberCount}/{group.maxMembers}
                </span>
                {group.lastSession && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={14} />
                    {group.lastSession.status === 'ACTIVE' ? (
                      <span style={{ color: '#22c55e' }}>Live now</span>
                    ) : (
                      formatTimeAgo(group.lastSession.startedAt)
                    )}
                  </span>
                )}
              </div>

              {group.description && (
                <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                  {group.description}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <CreateGroupModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => fetchGroups()}
      />
    </div>
  );
}
