import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Send, Clock, Users, Square, Circle,
} from 'lucide-react';
import { EnvironmentRenderer, type EnvironmentConfig } from '@/components/session/EnvironmentRenderer';
import { api } from '@/lib/api';
import { wsClient } from '@/lib/ws';
import { useAuthStore } from '@/store/authStore';

interface SharedMessageData {
  id: string;
  sessionId: string;
  senderUserId: string | null;
  senderType: 'USER' | 'AI_ROLE';
  content: string;
  isVisible: boolean;
  createdAt: string;
  sender: { id: string; name: string | null; avatarUrl: string | null } | null;
}

interface SessionInfo {
  sessionId: string;
  groupId: string;
  groupName: string;
  role: {
    id: string;
    name: string;
    companionName: string;
    environmentSlug: string;
    environmentConfig: Record<string, unknown>;
  };
  startedAt: string;
}

const MEMBER_COLORS = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981',
  '#06b6d4', '#f43f5e', '#84cc16', '#6366f1', '#14b8a6',
];

function getMemberColor(userId: string): string {
  // Simple hash to get a consistent color per user
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash) + userId.charCodeAt(i);
    hash = hash & hash;
  }
  return MEMBER_COLORS[Math.abs(hash) % MEMBER_COLORS.length];
}

function formatElapsed(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function SharedSessionView() {
  const { groupId, sessionId } = useParams<{ groupId: string; sessionId: string }>();
  const navigate = useNavigate();
  const { userId } = useAuthStore();

  const [sessionInfo, setSessionInfo] = React.useState<SessionInfo | null>(null);
  const [messages, setMessages] = React.useState<SharedMessageData[]>([]);
  const [inputValue, setInputValue] = React.useState('');
  const [isSending, setIsSending] = React.useState(false);
  const [sessionElapsed, setSessionElapsed] = React.useState(0);
  const [sessionEnded, setSessionEnded] = React.useState(false);
  const [presentMembers, setPresentMembers] = React.useState<Set<string>>(new Set());
  const [isOwnerOrInitiator, setIsOwnerOrInitiator] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  const bottomRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Fetch session info on mount
  React.useEffect(() => {
    async function init() {
      if (!groupId || !sessionId) return;
      try {
        // Load group detail to get role info
        const group = await api.get<{
          id: string;
          name: string;
          myRole: string;
          role: SessionInfo['role'];
          members: { user: { id: string } }[];
          sharedSessions: { id: string; status: string; initiatedByUserId?: string; startedAt: string }[];
        }>(`/trpc/studyGroups.getGroupDetail?input=${encodeURIComponent(JSON.stringify({ groupId }))}`);

        const session = group.sharedSessions.find((s) => s.id === sessionId);
        if (!session) {
          navigate(`/study/${groupId}`);
          return;
        }

        setSessionInfo({
          sessionId,
          groupId: group.id,
          groupName: group.name,
          role: group.role,
          startedAt: session.startedAt,
        });

        setIsOwnerOrInitiator(
          group.myRole === 'OWNER' || session.initiatedByUserId === userId
        );

        if (session.status === 'ENDED') {
          setSessionEnded(true);
        }

        // Present members - initialize with all group members
        setPresentMembers(new Set(group.members.map((m) => m.user.id)));

        // Load existing messages
        const msgResult = await api.get<{ messages: SharedMessageData[] }>(
          `/trpc/studyGroups.getSessionMessages?input=${encodeURIComponent(JSON.stringify({ sessionId, limit: 100 }))}`
        );
        setMessages(msgResult.messages);
      } catch {
        navigate(`/study/${groupId || ''}`);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [groupId, sessionId]);

  // Session timer
  React.useEffect(() => {
    if (!sessionInfo || sessionEnded) return;
    const startTime = new Date(sessionInfo.startedAt).getTime();
    const interval = setInterval(() => {
      setSessionElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionInfo, sessionEnded]);

  // WebSocket listeners for real-time messages
  React.useEffect(() => {
    function handleSharedMessage(data: unknown) {
      const msg = data as SharedMessageData;
      if (msg.sessionId === sessionId) {
        setMessages((prev) => {
          // Avoid duplicates
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
    }

    function handleMemberJoined(data: unknown) {
      const d = data as { userId: string; sessionId: string };
      if (d.sessionId === sessionId) {
        setPresentMembers((prev) => new Set([...prev, d.userId]));
      }
    }

    function handleMemberLeft(data: unknown) {
      const d = data as { userId: string; sessionId: string };
      if (d.sessionId === sessionId) {
        setPresentMembers((prev) => {
          const next = new Set(prev);
          next.delete(d.userId);
          return next;
        });
      }
    }

    function handleSessionEnd(data: unknown) {
      const d = data as { sessionId: string };
      if (d.sessionId === sessionId) {
        setSessionEnded(true);
      }
    }

    wsClient.on('shared-message', handleSharedMessage);
    wsClient.on('member-joined', handleMemberJoined);
    wsClient.on('member-left', handleMemberLeft);
    wsClient.on('shared-session-end', handleSessionEnd);

    // Announce presence
    if (sessionId && wsClient.isConnected) {
      wsClient.emit('shared:join-session', { sessionId });
    }

    return () => {
      wsClient.off('shared-message', handleSharedMessage);
      wsClient.off('member-joined', handleMemberJoined);
      wsClient.off('member-left', handleMemberLeft);
      wsClient.off('shared-session-end', handleSessionEnd);

      if (sessionId && wsClient.isConnected) {
        wsClient.emit('shared:leave-session', { sessionId });
      }
    };
  }, [sessionId]);

  // Auto-scroll on new messages
  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend() {
    if (!inputValue.trim() || !sessionId || isSending || sessionEnded) return;
    const content = inputValue.trim();
    setInputValue('');
    setIsSending(true);

    try {
      await api.post('/trpc/studyGroups.sendSharedMessage', {
        sessionId,
        content,
      });
    } catch {
      setInputValue(content);
    } finally {
      setIsSending(false);
      textareaRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  async function handleEndSession() {
    if (!sessionId || !confirm('End this study session for everyone?')) return;
    try {
      await api.post('/trpc/studyGroups.endSharedSession', { sessionId });
      setSessionEnded(true);
    } catch {
      // silent
    }
  }

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
        Loading session...
      </div>
    );
  }

  if (!sessionInfo) return null;

  const envConfig: EnvironmentConfig = {
    colorTemperature: (sessionInfo.role.environmentConfig?.colorTemperature as 'cool' | 'warm' | 'neutral') || 'cool',
    categoryAccentColor: (sessionInfo.role.environmentConfig?.categoryAccentColor as string) || '#1E6FFF',
    sessionMood: 'focused',
  };

  return (
    <EnvironmentRenderer config={envConfig}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        {/* Session header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 20px',
            background: 'rgba(0,0,0,0.3)',
            backdropFilter: 'blur(8px)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => navigate(`/study/${groupId}`)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-text-muted)',
                cursor: 'pointer',
                padding: 4,
              }}
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)', fontFamily: 'var(--font-sans)' }}>
                {sessionInfo.groupName}
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                with {sessionInfo.role.companionName}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Presence indicators */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Users size={14} color="var(--color-text-muted)" />
              <div style={{ display: 'flex', gap: -4 }}>
                {Array.from(presentMembers).slice(0, 5).map((uid, i) => (
                  <div
                    key={uid}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: getMemberColor(uid),
                      border: '2px solid rgba(0,0,0,0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 10,
                      fontWeight: 600,
                      color: '#fff',
                      marginLeft: i > 0 ? -6 : 0,
                      position: 'relative',
                      zIndex: 5 - i,
                    }}
                  >
                    <Circle size={6} fill="#22c55e" color="#22c55e" />
                  </div>
                ))}
              </div>
              <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                {presentMembers.size} online
              </span>
            </div>

            {/* Session timer */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--color-text-muted)' }}>
              <Clock size={14} />
              {formatElapsed(sessionElapsed)}
            </div>

            {/* End session button (owner/initiator only) */}
            {isOwnerOrInitiator && !sessionEnded && (
              <button
                onClick={handleEndSession}
                style={{
                  background: 'rgba(239,68,68,0.15)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: 'var(--radius-md)',
                  padding: '6px 12px',
                  color: '#ef4444',
                  fontSize: 12,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontFamily: 'var(--font-sans)',
                }}
              >
                <Square size={12} />
                End Session
              </button>
            )}
          </div>
        </div>

        {/* Messages area */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-muted)', fontSize: 14, fontFamily: 'var(--font-sans)' }}>
              Session started. Send a message to begin studying together.
            </div>
          )}

          {messages.filter((m) => m.isVisible).map((msg) => {
            const isAI = msg.senderType === 'AI_ROLE';
            const isMe = msg.senderUserId === userId;
            const senderName = isAI
              ? sessionInfo.role.companionName
              : msg.sender?.name || 'Unknown';
            const senderColor = isAI
              ? (envConfig.categoryAccentColor || '#1E6FFF')
              : getMemberColor(msg.senderUserId || '');

            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: isMe ? 'row-reverse' : 'row',
                  alignItems: 'flex-start',
                  gap: 8,
                  maxWidth: '85%',
                  alignSelf: isMe ? 'flex-end' : 'flex-start',
                }}
              >
                {/* Avatar */}
                {!isMe && (
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: isAI ? 'linear-gradient(135deg, #667eea, #764ba2)' : senderColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#fff',
                      flexShrink: 0,
                    }}
                  >
                    {isAI ? 'AI' : senderName[0]?.toUpperCase()}
                  </div>
                )}

                <div>
                  {/* Sender name */}
                  {!isMe && (
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: senderColor,
                        marginBottom: 3,
                        paddingLeft: 2,
                      }}
                    >
                      {senderName}
                    </div>
                  )}

                  {/* Message bubble */}
                  <div
                    style={{
                      background: isMe
                        ? 'var(--color-electric-blue)'
                        : isAI
                        ? 'var(--color-navy-2)'
                        : 'rgba(255,255,255,0.06)',
                      borderRadius: 'var(--radius-md)',
                      padding: '10px 14px',
                      fontSize: 14,
                      lineHeight: 1.5,
                      color: 'var(--color-text-primary)',
                      borderLeft: isAI ? `2px solid ${envConfig.categoryAccentColor || '#1E6FFF'}` : 'none',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {msg.content}
                  </div>

                  <div
                    style={{
                      fontSize: 10,
                      color: 'var(--color-text-muted)',
                      opacity: 0.5,
                      marginTop: 2,
                      textAlign: isMe ? 'right' : 'left',
                      paddingLeft: 2,
                      paddingRight: 2,
                    }}
                  >
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })}

          <div ref={bottomRef} />
        </div>

        {/* Session ended banner */}
        {sessionEnded && (
          <div
            style={{
              padding: '12px 20px',
              textAlign: 'center',
              background: 'rgba(239,68,68,0.1)',
              borderTop: '1px solid rgba(239,68,68,0.2)',
              color: '#ef4444',
              fontSize: 13,
              fontFamily: 'var(--font-sans)',
            }}
          >
            This study session has ended.
            <button
              onClick={() => navigate(`/study/${groupId}`)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-electric-blue)',
                cursor: 'pointer',
                marginLeft: 8,
                fontSize: 13,
                textDecoration: 'underline',
              }}
            >
              Back to group
            </button>
          </div>
        )}

        {/* Input area */}
        {!sessionEnded && (
          <div
            style={{
              padding: '12px 20px',
              background: 'rgba(0,0,0,0.2)',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              display: 'flex',
              gap: 10,
              alignItems: 'flex-end',
            }}
          >
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
              style={{
                flex: 1,
                background: 'var(--color-navy-2)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 14px',
                fontSize: 14,
                color: 'var(--color-text-primary)',
                outline: 'none',
                resize: 'none',
                fontFamily: 'var(--font-sans)',
                lineHeight: 1.4,
                maxHeight: 120,
              }}
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isSending}
              style={{
                background: 'var(--color-electric-blue)',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                padding: 10,
                cursor: !inputValue.trim() || isSending ? 'not-allowed' : 'pointer',
                opacity: !inputValue.trim() || isSending ? 0.4 : 1,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Send size={18} />
            </button>
          </div>
        )}
      </div>
    </EnvironmentRenderer>
  );
}
