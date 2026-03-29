import React from 'react';
import {
  Shield,
  Clock,
  TrendingUp,
  Bell,
  BellOff,
  AlertTriangle,
  CheckCircle2,
  Users,
  Baby,
  Heart,
  BarChart3,
  Settings,
  Plus,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useGuardianStore, type DependentProfile, type WellbeingFlag } from '@/store/guardianStore';

// --- Add Dependent Modal ---

function AddDependentModal({ onClose, onAdd }: { onClose: () => void; onAdd: (p: DependentProfile) => void }) {
  const [name, setName] = React.useState('');
  const [type, setType] = React.useState<'child' | 'elderly'>('child');
  const [limit, setLimit] = React.useState(45);

  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd({
      id: `dep-${Date.now()}`,
      name: name.trim(),
      type,
      companionName: type === 'child' ? 'Learning Companion' : 'Daily Companion',
      dailyTimeLimitMinutes: limit,
      todayUsageMinutes: 0,
      totalSessions: 0,
      currentStreak: 0,
      lastSessionAt: null,
      sessionLogs: [],
      wellbeingFlags: [],
      notificationsEnabled: true,
    });
    onClose();
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
  const { dependents, notifications, addDependent, updateTimeLimit, acknowledgeFlag } =
    useGuardianStore();
  const [selectedDepId, setSelectedDepId] = React.useState<string | null>(
    dependents.length > 0 ? dependents[0].id : null,
  );
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [showTimeLimitEditor, setShowTimeLimitEditor] = React.useState(false);
  const [timeLimitValue, setTimeLimitValue] = React.useState(45);

  const selected = dependents.find((d) => d.id === selectedDepId) || null;
  const { getWeeklyStats } = useGuardianStore();
  const weeklyStats = selectedDepId ? getWeeklyStats(selectedDepId) : null;
  const unreadNotifs = notifications.filter((n) => !n.read);
  const activeFlags = selected
    ? selected.wellbeingFlags.filter((f) => !f.acknowledged)
    : [];

  // Generate mock session logs for demo
  const recentLogs = selected ? selected.sessionLogs.slice(-7).reverse() : [];

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
          {unreadNotifs.length > 0 && (
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
                {unreadNotifs.length}
              </span>
            </div>
          )}
          <Button variant="primary" size="md" onClick={() => setShowAddModal(true)} icon={<Plus size={14} />}>
            Add Dependent
          </Button>
        </div>
      </div>

      {/* No dependents state */}
      {dependents.length === 0 && (
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
      {dependents.length > 0 && (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto' }}>
            {dependents.map((dep) => {
              const isActive = selectedDepId === dep.id;
              return (
                <button
                  key={dep.id}
                  onClick={() => setSelectedDepId(dep.id)}
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
                  {dep.type === 'child' ? <Baby size={14} /> : <Heart size={14} />}
                  {dep.name}
                </button>
              );
            })}
          </div>

          {selected && (
            <>
              {/* Stat cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
                <StatCard
                  icon={<Clock size={18} />}
                  label="Today"
                  value={`${selected.todayUsageMinutes}m`}
                  subValue={`of ${selected.dailyTimeLimitMinutes}m limit`}
                  color={
                    selected.todayUsageMinutes >= selected.dailyTimeLimitMinutes
                      ? 'var(--color-error)'
                      : 'var(--color-electric-blue)'
                  }
                  progress={Math.min(selected.todayUsageMinutes / selected.dailyTimeLimitMinutes, 1)}
                />
                <StatCard
                  icon={<BarChart3 size={18} />}
                  label="This Week"
                  value={`${weeklyStats?.totalMinutes || 0}m`}
                  subValue={`${weeklyStats?.sessionCount || 0} sessions`}
                  color="var(--color-ion-cyan)"
                />
                <StatCard
                  icon={<TrendingUp size={18} />}
                  label="Avg / Day"
                  value={`${weeklyStats?.avgPerDay || 0}m`}
                  subValue="last 7 days"
                  color="#FFB740"
                />
                <StatCard
                  icon={<CheckCircle2 size={18} />}
                  label="Total Sessions"
                  value={String(selected.totalSessions)}
                  subValue={selected.lastSessionAt ? `Last: ${new Date(selected.lastSessionAt).toLocaleDateString()}` : 'No sessions yet'}
                  color="var(--color-success)"
                />
              </div>

              {/* Wellbeing flags */}
              {activeFlags.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <SectionHeader title="Wellbeing Alerts" />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {activeFlags.map((flag) => (
                      <FlagCard
                        key={flag.id}
                        flag={flag}
                        onAcknowledge={() => acknowledgeFlag(selected.id, flag.id)}
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
                  {recentLogs.length === 0 ? (
                    <Card padding="20px">
                      <p style={{ fontSize: 13, color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)' }}>
                        No sessions recorded yet.
                      </p>
                    </Card>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {recentLogs.map((log) => (
                        <Card key={log.date} padding="12px 16px">
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: '#E8EDF5', fontFamily: 'var(--font-sans)' }}>
                                {new Date(log.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
                                {log.sessionCount} session{log.sessionCount !== 1 ? 's' : ''} - {log.totalMinutes}m total
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              {log.topicsDiscussed.slice(0, 3).map((topic, i) => (
                                <span
                                  key={i}
                                  style={{
                                    fontSize: 10,
                                    padding: '2px 8px',
                                    borderRadius: 100,
                                    background: 'var(--color-surface-2)',
                                    color: 'var(--color-text-muted)',
                                    fontFamily: 'var(--font-sans)',
                                    fontWeight: 500,
                                  }}
                                >
                                  {topic}
                                </span>
                              ))}
                            </div>
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
                            setTimeLimitValue(selected.dailyTimeLimitMinutes);
                            setShowTimeLimitEditor(!showTimeLimitEditor);
                          }}
                          icon={<Settings size={12} />}
                        >
                          Edit
                        </Button>
                      </div>

                      {!showTimeLimitEditor ? (
                        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-electric-blue)', fontFamily: 'var(--font-sans)' }}>
                          {selected.dailyTimeLimitMinutes} minutes
                        </div>
                      ) : (
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                            <input
                              type="range"
                              min={15}
                              max={selected.type === 'child' ? 45 : 180}
                              step={15}
                              value={timeLimitValue}
                              onChange={(e) => setTimeLimitValue(Number(e.target.value))}
                              style={{ flex: 1, accentColor: 'var(--color-electric-blue)' }}
                            />
                            <span style={{ fontSize: 14, fontWeight: 700, color: '#E8EDF5', fontFamily: 'var(--font-mono)', minWidth: 50 }}>
                              {timeLimitValue}m
                            </span>
                          </div>
                          {selected.type === 'child' && (
                            <p style={{ fontSize: 11, color: '#F59E0B', marginBottom: 8, fontFamily: 'var(--font-sans)' }}>
                              Hard limit: 45 minutes maximum for children. Cannot be overridden.
                            </p>
                          )}
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => {
                              updateTimeLimit(selected.id, timeLimitValue);
                              setShowTimeLimitEditor(false);
                            }}
                          >
                            Save
                          </Button>
                        </div>
                      )}
                    </Card>

                    {/* Notifications control */}
                    <Card padding="16px">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {selected.notificationsEnabled ? (
                            <Bell size={16} style={{ color: 'var(--color-success)' }} />
                          ) : (
                            <BellOff size={16} style={{ color: 'var(--color-text-muted)' }} />
                          )}
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#E8EDF5', fontFamily: 'var(--font-sans)' }}>
                            Pattern Change Alerts
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            padding: '3px 10px',
                            borderRadius: 100,
                            background: selected.notificationsEnabled ? 'rgba(34,197,94,0.12)' : 'var(--color-surface-2)',
                            color: selected.notificationsEnabled ? 'var(--color-success)' : 'var(--color-text-muted)',
                          }}
                        >
                          {selected.notificationsEnabled ? 'On' : 'Off'}
                        </span>
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 8, fontFamily: 'var(--font-sans)' }}>
                        Get notified when session patterns change significantly, such as unusual usage spikes or long gaps between sessions.
                      </p>
                    </Card>

                    {/* Companion info */}
                    <Card padding="16px">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 'var(--radius-sm)',
                            background: 'rgba(30,111,255,0.12)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 14,
                            fontWeight: 800,
                            color: 'var(--color-electric-blue)',
                            fontFamily: 'var(--font-sans)',
                          }}
                        >
                          {selected.companionName.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#E8EDF5', fontFamily: 'var(--font-sans)' }}>
                            {selected.companionName}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                            Assigned companion
                          </div>
                        </div>
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)' }}>
                        {selected.type === 'child'
                          ? 'All sessions encourage human connection and healthy learning habits.'
                          : 'Sessions focus on companionship, wellbeing check-ins, and cognitive engagement.'}
                      </p>
                    </Card>
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
          onAdd={(p) => {
            addDependent(p);
            setSelectedDepId(p.id);
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

function FlagCard({ flag, onAcknowledge }: { flag: WellbeingFlag; onAcknowledge: () => void }) {
  const severityColors = {
    info: { bg: 'rgba(30,111,255,0.08)', border: 'rgba(30,111,255,0.2)', text: 'var(--color-electric-blue)' },
    warning: { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', text: '#F59E0B' },
    critical: { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)', text: 'var(--color-error)' },
  };
  const colors = severityColors[flag.severity];

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
          {flag.message}
        </div>
        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
          {new Date(flag.timestamp).toLocaleString()}
        </div>
      </div>
      <Button variant="ghost" size="sm" onClick={onAcknowledge}>
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
