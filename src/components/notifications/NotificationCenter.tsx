import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  BookOpen,
  Flame,
  Heart,
  Trophy,
  Calendar,
  Brain,
  X,
} from 'lucide-react';
import { api } from '@/lib/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, any> | null;
  priority: string;
  readAt: string | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Icon map by notification type
// ---------------------------------------------------------------------------

const TYPE_ICON: Record<string, React.ReactNode> = {
  EXAM_COUNTDOWN: <Calendar size={16} />,
  SESSION_REMINDER: <BookOpen size={16} />,
  STREAK_AT_RISK: <Flame size={16} />,
  MILESTONE_REACHED: <Trophy size={16} />,
  PROGRESS_UPDATE: <Brain size={16} />,
  WELLBEING_SIGNAL: <Heart size={16} />,
  GUARDIAN_ALERT: <Bell size={16} />,
  MICRO_MOMENT: <Bell size={16} />,
};

const TYPE_COLOR: Record<string, string> = {
  EXAM_COUNTDOWN: '#FF6B6B',
  SESSION_REMINDER: 'var(--color-electric-blue)',
  STREAK_AT_RISK: '#FFB740',
  MILESTONE_REACHED: '#4ECB71',
  PROGRESS_UPDATE: 'var(--color-ion-cyan)',
  WELLBEING_SIGNAL: '#E879F9',
  GUARDIAN_ALERT: '#FF9F0A',
  MICRO_MOMENT: 'var(--color-text-muted)',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await api.get<{
        notifications: Notification[];
        total: number;
      }>('/trpc/notifications.getNotifications?input=' + encodeURIComponent(JSON.stringify({ json: { page: 1, limit: 20 } })));

      // tRPC wraps in result.result.data.json
      const data = (result as any)?.result?.data?.json || result;
      setNotifications(data.notifications || []);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const result = await api.get<any>('/trpc/notifications.getUnreadCount');
      const data = (result as any)?.result?.data?.json || result;
      setUnreadCount(data.count || 0);
    } catch {
      // Silently fail for badge count
    }
  }, []);

  // Phase 6D: Wire exam context to notifications - check Brain for upcoming exams
  const syncExamContext = useCallback(async () => {
    try {
      // Fetch active hires to check for exam-related brain data
      const hiresRes = await api.get<any>('/trpc/hires.listHires');
      const hiresData = (hiresRes as any)?.result?.data?.json || (hiresRes as any)?.result?.data || hiresRes;
      const hires = Array.isArray(hiresData) ? hiresData : hiresData?.hires || [];

      for (const hire of hires) {
        if (!hire.hireId) continue;
        try {
          const brainRes = await api.get<any>(
            '/trpc/brain.getBrainSummary?input=' + encodeURIComponent(JSON.stringify({ json: { hireId: hire.hireId } }))
          );
          const brainData = (brainRes as any)?.result?.data?.json || (brainRes as any)?.result?.data || brainRes;
          // If brain has exam-related notes, fire setExamContext
          if (brainData?.lastNote?.nextFocus && /exam|test|assessment|gcse|a-level/i.test(brainData.lastNote.nextFocus)) {
            await api.post('/trpc/notifications.setExamContext', {
              json: {
                hireId: hire.hireId,
                examTopic: brainData.lastNote.nextFocus,
                companionName: brainData.companionName || hire.companionName,
              },
            });
          }
        } catch {
          // Brain data not available for this hire - skip
        }
      }
    } catch {
      // Hires API may not be available
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    syncExamContext(); // Phase 6D: Sync exam context on mount
    const interval = setInterval(fetchUnreadCount, 60000); // Poll every minute
    return () => clearInterval(interval);
  }, [fetchUnreadCount, syncExamContext]);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  const markRead = async (ids: string[]) => {
    try {
      await api.post('/trpc/notifications.markRead', { json: { notificationIds: ids } });
      setNotifications(prev =>
        prev.map(n => ids.includes(n.id) ? { ...n, readAt: new Date().toISOString() } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - ids.length));
    } catch (err) {
      console.error('Failed to mark notifications read:', err);
    }
  };

  const markAllRead = async () => {
    try {
      await api.post('/trpc/notifications.markAllRead', { json: {} });
      setNotifications(prev => prev.map(n => ({ ...n, readAt: new Date().toISOString() })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 36,
          height: 36,
          background: isOpen ? 'rgba(255,255,255,0.08)' : 'transparent',
          border: '1px solid transparent',
          borderRadius: 'var(--radius-sm)',
          color: isOpen ? '#E8EDF5' : 'var(--color-text-muted)',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: 4,
              right: 4,
              width: unreadCount > 9 ? 18 : 14,
              height: 14,
              borderRadius: 7,
              background: '#FF6B6B',
              color: '#fff',
              fontSize: 9,
              fontWeight: 700,
              fontFamily: 'var(--font-sans)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1,
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setIsOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 999,
            }}
          />

          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              width: 380,
              maxHeight: 480,
              background: 'var(--color-dark-navy)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 16px 48px rgba(0,0,0,0.4)',
              zIndex: 1000,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                borderBottom: '1px solid var(--color-border)',
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#E8EDF5',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                Notifications
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '4px 8px',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--color-electric-blue)',
                      fontSize: 11,
                      fontWeight: 600,
                      fontFamily: 'var(--font-sans)',
                      cursor: 'pointer',
                      borderRadius: 4,
                    }}
                  >
                    <CheckCheck size={12} />
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 24,
                    height: 24,
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--color-text-muted)',
                    cursor: 'pointer',
                    borderRadius: 4,
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Notification list */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {isLoading && notifications.length === 0 && (
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0' }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--color-surface-2)', flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent 0%, rgba(30,111,255,0.06) 50%, transparent 100%)', animation: 'shimmer 1.5s ease-in-out infinite' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ width: '80%', height: 12, borderRadius: 4, background: 'var(--color-surface-2)', marginBottom: 6, position: 'relative', overflow: 'hidden' }}>
                          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent 0%, rgba(30,111,255,0.06) 50%, transparent 100%)', animation: 'shimmer 1.5s ease-in-out infinite' }} />
                        </div>
                        <div style={{ width: '60%', height: 10, borderRadius: 4, background: 'var(--color-surface-2)', position: 'relative', overflow: 'hidden' }}>
                          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent 0%, rgba(30,111,255,0.06) 50%, transparent 100%)', animation: 'shimmer 1.5s ease-in-out infinite' }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!isLoading && notifications.length === 0 && (
                <div
                  style={{
                    padding: '40px 16px',
                    textAlign: 'center',
                    color: 'var(--color-text-muted)',
                    fontSize: 13,
                    fontFamily: 'var(--font-sans)',
                    lineHeight: 1.6,
                  }}
                >
                  No notifications yet. Your companions will reach out when they have something meaningful to share.
                </div>
              )}

              {notifications.map((notif) => {
                const isUnread = !notif.readAt;
                const icon = TYPE_ICON[notif.type] || <Bell size={16} />;
                const color = TYPE_COLOR[notif.type] || 'var(--color-text-muted)';

                return (
                  <div
                    key={notif.id}
                    onClick={() => {
                      if (isUnread) markRead([notif.id]);
                    }}
                    style={{
                      display: 'flex',
                      gap: 12,
                      padding: '12px 16px',
                      cursor: isUnread ? 'pointer' : 'default',
                      background: isUnread ? 'rgba(255,255,255,0.02)' : 'transparent',
                      borderBottom: '1px solid rgba(255,255,255,0.03)',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    {/* Icon */}
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: `${color}15`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color,
                        flexShrink: 0,
                        marginTop: 2,
                      }}
                    >
                      {icon}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          marginBottom: 2,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: isUnread ? 700 : 600,
                            color: isUnread ? '#E8EDF5' : 'var(--color-text-muted)',
                            fontFamily: 'var(--font-sans)',
                          }}
                        >
                          {notif.title}
                        </span>
                        {notif.priority === 'high' && (
                          <span
                            style={{
                              fontSize: 9,
                              fontWeight: 700,
                              color: '#FF6B6B',
                              fontFamily: 'var(--font-sans)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.04em',
                            }}
                          >
                            urgent
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: isUnread ? 'rgba(232,237,245,0.7)' : 'var(--color-text-muted)',
                          fontFamily: 'var(--font-sans)',
                          lineHeight: 1.5,
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {notif.body}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: 'var(--color-text-muted)',
                          fontFamily: 'var(--font-sans)',
                          marginTop: 4,
                        }}
                      >
                        {formatTime(notif.createdAt)}
                      </div>
                    </div>

                    {/* Unread indicator */}
                    {isUnread && (
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          background: 'var(--color-electric-blue)',
                          flexShrink: 0,
                          marginTop: 6,
                        }}
                      />
                    )}
                    {!isUnread && (
                      <div
                        style={{
                          flexShrink: 0,
                          marginTop: 6,
                          color: 'rgba(255,255,255,0.15)',
                        }}
                      >
                        <Check size={12} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default NotificationCenter;
