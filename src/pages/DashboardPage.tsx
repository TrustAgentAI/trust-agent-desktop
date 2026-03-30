import React from 'react';
import { Users, MessageSquare, Wifi, WifiOff } from 'lucide-react';
import { useAgentStore } from '@/store/agentStore';
import { useAuditStore } from '@/store/auditStore';
import { wsClient } from '@/lib/ws';
import { useNavigate } from 'react-router-dom';
import { EmptyState, GhostCard } from '@/components/ui/EmptyState';

export function DashboardPage() {
  const { roles: hiredRoles } = useAgentStore();
  const { events } = useAuditStore();
  const navigate = useNavigate();
  const [wsStatus, setWsStatus] = React.useState<string>('Disconnected');

  React.useEffect(() => {
    const interval = setInterval(() => {
      setWsStatus(wsClient.isConnected ? 'Connected' : 'Disconnected');
    }, 3000);
    setWsStatus(wsClient.isConnected ? 'Connected' : 'Disconnected');
    return () => clearInterval(interval);
  }, []);

  const todayMessages = events.filter((e) => {
    if (e.action !== 'MESSAGE') return false;
    const eventDate = new Date(e.timestamp).toDateString();
    return eventDate === new Date().toDateString();
  });

  const recentEvents = events.slice(0, 5);

  const actionColors: Record<string, string> = {
    READ: 'var(--color-text-muted)',
    WRITE: 'var(--color-electric-blue)',
    API_CALL: 'var(--color-ion-cyan)',
    TOOL_USE: '#FFB740',
    MESSAGE: 'var(--color-text-muted)',
    ERROR: 'var(--color-error)',
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
      <h1
        style={{
          fontSize: '20px',
          fontWeight: 800,
          fontFamily: 'var(--font-sans)',
          color: '#E8EDF5',
          marginBottom: 20,
        }}
      >
        Dashboard
      </h1>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
        <StatCard
          icon={<Users size={18} />}
          label="Active Roles"
          value={String(hiredRoles.length)}
          color="var(--color-electric-blue)"
        />
        <StatCard
          icon={<MessageSquare size={18} />}
          label="Sessions Today"
          value={String(todayMessages.length)}
          color="var(--color-ion-cyan)"
        />
        <StatCard
          icon={wsStatus === 'Connected' ? <Wifi size={18} /> : <WifiOff size={18} />}
          label="Connection"
          value={wsStatus}
          color={wsStatus === 'Connected' ? 'var(--color-success)' : 'var(--color-error)'}
        />
      </div>

      {/* Role cards grid */}
      <div style={{ marginBottom: 28 }}>
        <h2
          style={{
            fontSize: '11px',
            fontWeight: 700,
            fontFamily: 'var(--font-mono)',
            color: 'var(--color-ion-cyan)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: 12,
          }}
        >
          Hired Roles
        </h2>

        {hiredRoles.length === 0 && (
          <div
            style={{
              background: 'var(--color-surface-1)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            <EmptyState
              icon={<Users size={24} />}
              title="Your first companion is waiting"
              description="Browse the marketplace to find the expert who will change everything. Tutors, coaches, therapists, advisors - all independently audited."
              ctaText="Browse Marketplace"
              ctaAction={() => navigate('/marketplace')}
              ghostContent={
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <GhostCard
                    emoji="🎓"
                    name="A-Level Maths Tutor"
                    tagline="Expert exam preparation and concept mastery"
                    badge="PLATINUM"
                  />
                  <GhostCard
                    emoji="🧠"
                    name="Mental Wellness Companion"
                    tagline="CBT-informed daily emotional support"
                    badge="GOLD"
                  />
                  <GhostCard
                    emoji="💼"
                    name="Career Counsellor"
                    tagline="CV reviews, interview prep, career planning"
                    badge="GOLD"
                  />
                </div>
              }
            />
          </div>
        )}

        {hiredRoles.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
            {hiredRoles.map((role: { hireId: string; roleName: string; roleCategory: string; trustBadge: string }) => (
              <div
                key={role.hireId}
                style={{
                  padding: 16,
                  background: 'var(--color-surface-1)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                }}
              >
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#E8EDF5', marginBottom: 4 }}>
                  {role.roleName}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: 4 }}>
                  {role.roleCategory}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <span
                    style={{
                      padding: '2px 8px',
                      fontSize: '10px',
                      fontWeight: 600,
                      borderRadius: 100,
                      textTransform: 'uppercase',
                      color: 'var(--color-text-muted)',
                      background: 'var(--color-surface-2)',
                    }}
                  >
                    {role.trustBadge}
                  </span>
                </div>
                <button
                  onClick={() => navigate('/')}
                  style={{
                    width: '100%',
                    padding: '6px 12px',
                    background: 'transparent',
                    border: '1px solid var(--color-electric-blue)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--color-electric-blue)',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  Open Session
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent audit activity */}
      <div>
        <h2
          style={{
            fontSize: '11px',
            fontWeight: 700,
            fontFamily: 'var(--font-mono)',
            color: 'var(--color-ion-cyan)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: 12,
          }}
        >
          Recent Activity
        </h2>

        {recentEvents.length === 0 && (
          <div
            style={{
              padding: '24px 16px',
              background: 'var(--color-surface-1)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              textAlign: 'center',
            }}
          >
            <p
              style={{
                fontSize: '13px',
                color: 'var(--color-text-muted)',
                lineHeight: 1.6,
              }}
            >
              Activity will appear here once you start your first session. Every action is logged for full transparency.
            </p>
          </div>
        )}

        {recentEvents.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {recentEvents.map((event) => {
              const time = new Date(event.timestamp);
              const timeStr = time.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });
              return (
                <div
                  key={event.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '6px 10px',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      color: 'var(--color-text-muted)',
                      flexShrink: 0,
                    }}
                  >
                    {timeStr}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: actionColors[event.action] || 'var(--color-text-muted)',
                      minWidth: 70,
                      flexShrink: 0,
                    }}
                  >
                    {event.action}
                  </span>
                  <span style={{ fontSize: '12px', color: '#E8EDF5' }}>
                    {event.description}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
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
        padding: 16,
        background: 'var(--color-surface-1)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ color }}>{icon}</span>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--color-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          {label}
        </span>
      </div>
      <div
        style={{
          fontSize: '22px',
          fontWeight: 800,
          fontFamily: 'var(--font-sans)',
          color,
        }}
      >
        {value}
      </div>
    </div>
  );
}
