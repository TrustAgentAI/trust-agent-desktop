import React from 'react';
import {
  Shield,
  Clock,
  TrendingUp,
  Bell,
  AlertTriangle,
  CheckCircle2,
  Users,
  Baby,
  Heart,
  BarChart3,
  Settings,
  Plus,
  Eye,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { api } from '@/lib/api';

// ── Types from API ──
interface LinkedChild {
  linkId: string;
  childId: string;
  childName: string | null;
  childEmail: string;
  accountType: string;
  maxDailyMins: number;
  createdAt: string;
}

interface GuardianAlertData {
  id: string;
  childName: string;
  childId: string;
  type: string;
  message: string;
  hireId: string | null;
  readAt: string | null;
  createdAt: string;
}

interface ChildActivity {
  childId: string;
  days: number;
  sessions: { id: string; hireId: string; startedAt: string; endedAt: string | null; durationSeconds: number | null; messageCount: number; environmentSlug: string }[];
  hires: { id: string; roleName: string; companionName: string; category: string; streakDays: number; longestStreakDays: number; lastSessionAt: string | null; sessionCount: number; totalMinutes: number }[];
  totalSessionCount: number;
  totalSessionMinutes: number;
  dependencyFlagCount: number;
  wellbeingScore: number;
  wellbeingTrend: string;
  safeguardingAlerts: { id: string; type: string; message: string; readAt: string | null; createdAt: string }[];
}

// --- Add Dependent Modal ---

function AddDependentModal({ onClose, onAdd }: { onClose: () => void; onAdd: () => void }) {
  const [name, setName] = React.useState('');
  const [type, setType] = React.useState<'child' | 'elderly'>('child');
  const [limit, setLimit] = React.useState(45);

  const handleAdd = () => {
    if (!name.trim()) return;
    // In production, this would call an API to create the family link.
    // The guardian adds a child by email/invite code, not by creating one locally.
    onAdd();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 420,
          background: 'var(--color-dark-navy)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: 24,
        }}
      >
        <h2
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: '#E8EDF5',
            fontFamily: 'var(--font-sans)',
            marginBottom: 20,
          }}
        >
          Add Dependent
        </h2>

        {/* Name */}
        <label style={labelStyle}>Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter name"
          style={inputStyle}
        />

        {/* Type */}
        <label style={{ ...labelStyle, marginTop: 14 }}>Type</label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {(['child', 'elderly'] as const).map((t) => (
            <button
              key={t}
              onClick={() => {
                setType(t);
                if (t === 'child') setLimit(45);
                if (t === 'elderly') setLimit(120);
              }}
              style={{
                flex: 1,
                padding: '10px 14px',
                background: type === t ? 'rgba(30,111,255,0.12)' : 'var(--color-surface-1)',
                border: type === t ? '1px solid var(--color-electric-blue)' : '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                color: type === t ? 'var(--color-electric-blue)' : 'var(--color-text-muted)',
                fontSize: 13,
                fontWeight: 600,
                fontFamily: 'var(--font-sans)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              {t === 'child' ? <Baby size={14} /> : <Heart size={14} />}
              {t === 'child' ? 'Child' : 'Elderly'}
            </button>
          ))}
        </div>

        {/* Time limit */}
        <label style={labelStyle}>Daily Time Limit (minutes)</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input
            type="range"
            min={15}
            max={180}
            step={15}
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            style={{ flex: 1, accentColor: 'var(--color-electric-blue)' }}
          />
          <span
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: '#E8EDF5',
              fontFamily: 'var(--font-mono)',
              minWidth: 50,
              textAlign: 'right',
            }}
          >
            {limit}m
          </span>
        </div>
        {type === 'child' && (
          <div
            style={{
              fontSize: 11,
              color: '#F59E0B',
              fontFamily: 'var(--font-sans)',
              marginTop: 6,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <AlertTriangle size={11} />
            Children have a hard 45-minute limit that cannot be overridden.
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24 }}>
          <Button variant="ghost" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="md" onClick={handleAdd} disabled={!name.trim()}>
            Add Dependent
          </Button>
        </div>
      </div>
    </div>
  );
}

// --- Main Page ---

export function GuardianDashboardPage() {
  const [children, setChildren] = React.useState<LinkedChild[]>([]);
  const [alerts, setAlerts] = React.useState<GuardianAlertData[]>([]);
  const [activity, setActivity] = React.useState<ChildActivity | null>(null);
  const [selectedChildId, setSelectedChildId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [showTimeLimitEditor, setShowTimeLimitEditor] = React.useState(false);
  const [timeLimitValue, setTimeLimitValue] = React.useState(45);

  // Load linked children and alerts from API
  React.useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [childrenRes, alertsRes] = await Promise.all([
          api.post<any>('/api/trpc/guardian.getLinkedChildren', { json: null }),
          api.post<any>('/api/trpc/guardian.getAlerts', { json: { unreadOnly: false } }),
        ]);
        const childrenData = childrenRes?.result?.data ?? childrenRes ?? [];
        const alertsData = alertsRes?.result?.data ?? alertsRes ?? [];
        setChildren(childrenData);
        setAlerts(alertsData);
        if (childrenData.length > 0 && !selectedChildId) {
          setSelectedChildId(childrenData[0].childId);
        }
      } catch {
        // API may not be available yet
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Load child activity when selected child changes
  React.useEffect(() => {
    if (!selectedChildId) return;
    async function loadActivity() {
      try {
        const res = await api.post<any>('/api/trpc/guardian.getChildActivity', {
          json: { childId: selectedChildId, days: 7 },
        });
        const data = res?.result?.data ?? res;
        setActivity(data);
      } catch {
        // API may not be available yet
      }
    }
    loadActivity();
  }, [selectedChildId]);

  const selected = children.find((c) => c.childId === selectedChildId) || null;
  const unreadAlerts = alerts.filter((a) => !a.readAt);
  const activeAlerts = alerts.filter((a) => !a.readAt && selectedChildId && a.childId === selectedChildId);

  const handleDismissAlert = async (alertId: string) => {
    try {
      await api.post('/api/trpc/guardian.dismissAlert', { json: { alertId } });
      setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, readAt: new Date().toISOString() } : a)));
    } catch {
      // ignore
    }
  };

  const handleSetDailyLimit = async (childId: string, minutes: number) => {
    try {
      await api.post('/api/trpc/guardian.setDailyLimit', { json: { childId, minutes } });
      setChildren((prev) => prev.map((c) => (c.childId === childId ? { ...c, maxDailyMins: minutes } : c)));
      setShowTimeLimitEditor(false);
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <Loader2 size={32} style={{ color: 'var(--color-electric-blue)', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: '#E8EDF5',
              fontFamily: 'var(--font-sans)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <Shield size={22} style={{ color: 'var(--color-electric-blue)' }} />
            Guardian Dashboard
          </h1>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4, fontFamily: 'var(--font-sans)' }}>
            Monitor usage, set limits, and review wellbeing indicators.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {unreadAlerts.length > 0 && (
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-md)',
                background: 'rgba(245,158,11,0.1)',
                cursor: 'pointer',
              }}
            >
              <Bell size={18} style={{ color: '#F59E0B' }} />
              <span
                style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background: 'var(--color-error)',
                  color: '#fff',
                  fontSize: 10,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {unreadAlerts.length}
              </span>
            </div>
          )}
          <Button variant="primary" size="md" onClick={() => setShowAddModal(true)} icon={<Plus size={14} />}>
            Add Dependent
          </Button>
        </div>
      </div>

      {/* No dependents state */}
      {children.length === 0 && (
        <Card padding="40px" style={{ textAlign: 'center' }}>
          <Users size={40} style={{ color: 'var(--color-text-muted)', marginBottom: 16 }} />
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#E8EDF5', marginBottom: 8, fontFamily: 'var(--font-sans)' }}>
            No dependents added yet
          </h2>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 20, fontFamily: 'var(--font-sans)' }}>
            Add a child or elderly family member to monitor their Trust Agent usage and set appropriate limits.
          </p>
          <Button variant="primary" size="md" onClick={() => setShowAddModal(true)} icon={<Plus size={14} />}>
            Add Your First Dependent
          </Button>
        </Card>
      )}

      {/* Dependent selector tabs */}
      {children.length > 0 && (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto' }}>
            {children.map((child) => {
              const isActive = selectedChildId === child.childId;
              return (
                <button
                  key={child.childId}
                  onClick={() => setSelectedChildId(child.childId)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 16px',
                    background: isActive ? 'rgba(30,111,255,0.1)' : 'var(--color-surface-1)',
                    border: isActive ? '1px solid var(--color-electric-blue)' : '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    color: isActive ? 'var(--color-electric-blue)' : 'var(--color-text-muted)',
                    fontSize: 13,
                    fontWeight: 600,
                    fontFamily: 'var(--font-sans)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 150ms ease',
                  }}
                >
                  {child.accountType === 'CHILD' ? <Baby size={14} /> : <Heart size={14} />}
                  {child.childName || child.childEmail}
                </button>
              );
            })}
          </div>

          {selected && activity && (
            <>
              {/* Stat cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
                <StatCard
                  icon={<Clock size={18} />}
                  label="This Week"
                  value={`${activity.totalSessionMinutes}m`}
                  subValue={`${activity.totalSessionCount} sessions`}
                  color="var(--color-electric-blue)"
                />
                <StatCard
                  icon={<BarChart3 size={18} />}
                  label="Wellbeing"
                  value={`${activity.wellbeingScore}/100`}
                  subValue={`Trend: ${activity.wellbeingTrend}`}
                  color={activity.wellbeingTrend === 'declining' ? 'var(--color-error)' : activity.wellbeingTrend === 'improving' ? 'var(--color-success)' : '#F59E0B'}
                />
                <StatCard
                  icon={<TrendingUp size={18} />}
                  label="Avg / Day"
                  value={`${activity.totalSessionCount > 0 ? Math.round(activity.totalSessionMinutes / Math.min(activity.days, 7)) : 0}m`}
                  subValue="last 7 days"
                  color="#FFB740"
                />
                <StatCard
                  icon={<CheckCircle2 size={18} />}
                  label="Total Sessions"
                  value={String(activity.totalSessionCount)}
                  subValue={activity.sessions[0] ? `Last: ${new Date(activity.sessions[0].startedAt).toLocaleDateString()}` : 'No sessions yet'}
                  color="var(--color-success)"
                />
              </div>

              {/* Wellbeing alerts */}
              {activeAlerts.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <SectionHeader title="Wellbeing Alerts" />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {activeAlerts.map((alert) => (
                      <AlertCard
                        key={alert.id}
                        alert={alert}
                        onDismiss={() => handleDismissAlert(alert.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Two columns: Session history + Controls */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {/* Session history */}
                <div>
                  <SectionHeader title="Recent Sessions" />
                  {activity.sessions.length === 0 ? (
                    <Card padding="20px">
                      <p style={{ fontSize: 13, color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)' }}>
                        No sessions recorded yet.
                      </p>
                    </Card>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {activity.sessions.slice(0, 7).map((sess) => (
                        <Card key={sess.id} padding="12px 16px">
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: '#E8EDF5', fontFamily: 'var(--font-sans)' }}>
                                {new Date(sess.startedAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
                                {Math.ceil((sess.durationSeconds || 0) / 60)}m - {sess.messageCount} messages
                              </div>
                            </div>
                            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 100, background: 'var(--color-surface-2)', color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)' }}>
                              {sess.environmentSlug}
                            </span>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}

                  {/* Privacy note */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      marginTop: 12,
                      fontSize: 11,
                      color: 'var(--color-text-muted)',
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    <Eye size={12} />
                    Topics only. No raw session transcripts are available for privacy.
                  </div>
                </div>

                {/* Controls */}
                <div>
                  <SectionHeader title="Controls" />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {/* Time limit control */}
                    <Card padding="16px">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Clock size={16} style={{ color: 'var(--color-electric-blue)' }} />
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#E8EDF5', fontFamily: 'var(--font-sans)' }}>
                            Daily Time Limit
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setTimeLimitValue(selected.maxDailyMins);
                            setShowTimeLimitEditor(!showTimeLimitEditor);
                          }}
                          icon={<Settings size={12} />}
                        >
                          Edit
                        </Button>
                      </div>

                      {!showTimeLimitEditor ? (
                        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-electric-blue)', fontFamily: 'var(--font-sans)' }}>
                          {selected.maxDailyMins} minutes
                        </div>
                      ) : (
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                            <input
                              type="range"
                              min={15}
                              max={selected.accountType === 'CHILD' ? 45 : 180}
                              step={15}
                              value={timeLimitValue}
                              onChange={(e) => setTimeLimitValue(Number(e.target.value))}
                              style={{ flex: 1, accentColor: 'var(--color-electric-blue)' }}
                            />
                            <span style={{ fontSize: 14, fontWeight: 700, color: '#E8EDF5', fontFamily: 'var(--font-mono)', minWidth: 50 }}>
                              {timeLimitValue}m
                            </span>
                          </div>
                          {selected.accountType === 'CHILD' && (
                            <p style={{ fontSize: 11, color: '#F59E0B', marginBottom: 8, fontFamily: 'var(--font-sans)' }}>
                              Hard limit: 45 minutes maximum for children. Cannot be overridden.
                            </p>
                          )}
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleSetDailyLimit(selected.childId, timeLimitValue)}
                          >
                            Save
                          </Button>
                        </div>
                      )}
                    </Card>

                    {/* Hired companions */}
                    {activity.hires.length > 0 && (
                      <Card padding="16px">
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-ion-cyan)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, fontFamily: 'var(--font-mono)' }}>
                          Active Companions
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {activity.hires.map((h) => (
                            <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', background: 'rgba(30,111,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: 'var(--color-electric-blue)' }}>
                                {h.companionName.charAt(0)}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: '#E8EDF5', fontFamily: 'var(--font-sans)' }}>{h.companionName}</div>
                                <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{h.roleName} - {h.streakDays} day streak</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {showAddModal && (
        <AddDependentModal
          onClose={() => setShowAddModal(false)}
          onAdd={() => {
            setShowAddModal(false);
            // Reload children from API
            api.post<any>('/api/trpc/guardian.getLinkedChildren', { json: null })
              .then((res: any) => {
                const data = res?.result?.data ?? res ?? [];
                setChildren(data);
              })
              .catch(() => {});
          }}
        />
      )}
    </div>
  );
}

// --- Sub-components ---

function StatCard({
  icon,
  label,
  value,
  subValue,
  color,
  progress,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue: string;
  color: string;
  progress?: number;
}) {
  return (
    <div
      style={{
        padding: 16,
        background: 'var(--color-surface-1)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ color }}>{icon}</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color, fontFamily: 'var(--font-sans)', marginBottom: 2 }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)' }}>
        {subValue}
      </div>
      {progress !== undefined && (
        <div style={{ marginTop: 8, height: 4, borderRadius: 2, background: 'var(--color-surface-2)' }}>
          <div
            style={{
              height: '100%',
              borderRadius: 2,
              width: `${Math.min(progress * 100, 100)}%`,
              background: progress >= 1 ? 'var(--color-error)' : color,
              transition: 'width 300ms ease',
            }}
          />
        </div>
      )}
    </div>
  );
}

function AlertCard({ alert, onDismiss }: { alert: GuardianAlertData; onDismiss: () => void }) {
  const typeColors: Record<string, { bg: string; border: string; text: string }> = {
    wellbeing_concern: { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)', text: 'var(--color-error)' },
    topic_flagged: { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', text: '#F59E0B' },
    session_limit_reached: { bg: 'rgba(30,111,255,0.08)', border: 'rgba(30,111,255,0.2)', text: 'var(--color-electric-blue)' },
  };
  const colors = typeColors[alert.type] || typeColors.topic_flagged;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        borderRadius: 'var(--radius-md)',
      }}
    >
      <AlertTriangle size={18} style={{ color: colors.text, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: colors.text, fontFamily: 'var(--font-sans)' }}>
          {alert.message}
        </div>
        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
          {new Date(alert.createdAt).toLocaleString()}
        </div>
      </div>
      <Button variant="ghost" size="sm" onClick={onDismiss}>
        Dismiss
      </Button>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
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
      {title}
    </div>
  );
}

// Styles
const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--color-text-muted)',
  fontFamily: 'var(--font-sans)',
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  background: 'var(--color-surface-1)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  color: '#E8EDF5',
  fontSize: 13,
  fontFamily: 'var(--font-sans)',
  outline: 'none',
  marginBottom: 14,
};

export default GuardianDashboardPage;
