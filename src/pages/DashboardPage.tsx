import React from 'react';
import { Users, MessageSquare, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { useAgentStore } from '@/store/agentStore';
import type { HiredRole as StoreHiredRole } from '@/store/agentStore';
import { useAuditStore } from '@/store/auditStore';
import { api } from '@/lib/api';
import { wsClient } from '@/lib/ws';
import { useNavigate } from 'react-router-dom';
import { EmptyState, GhostCard } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { getErrorMessage } from '@/components/ui/Toast';

/** Normalised shape used in the dashboard UI */
interface DashboardRole {
  hireId: string;
  roleName: string;
  roleCategory: string;
  trustBadge: string;
}

/** Map agentStore HiredRole to dashboard shape (fallback) */
function normaliseStoreRole(r: StoreHiredRole): DashboardRole {
  return {
    hireId: r.hireId,
    roleName: r.roleName,
    roleCategory: r.roleCategory,
    trustBadge: r.trustBadge,
  };
}

export function DashboardPage() {
  const storeRoles = useAgentStore((s) => s.roles);
  const { events } = useAuditStore();
  const navigate = useNavigate();
  const [wsStatus, setWsStatus] = React.useState<string>('Disconnected');
  const [hiredRoles, setHiredRoles] = React.useState<DashboardRole[]>(
    storeRoles.map(normaliseStoreRole),
  );
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  // Phase 6: Fetch hired roles from hires.listMyHires via tRPC
  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);

    api.post<Record<string, unknown>>('/api/trpc/hires.listMyHires', { json: {} })
      .then((res) => {
        if (cancelled) return;
        const data = (res as Record<string, unknown>)?.result
          ? ((res as Record<string, unknown>).result as Record<string, unknown>)?.data
          : res;
        const hiresArray = Array.isArray(data) ? data : (data as Record<string, unknown>)?.hires;
        if (Array.isArray(hiresArray)) {
          setHiredRoles(hiresArray.map((r: Record<string, unknown>) => ({
            hireId: (r.id as string) || (r.hireId as string) || '',
            roleName: (r.roleName as string) || (r.name as string) || '',
            roleCategory: (r.roleCategory as string) || (r.category as string) || (r.title as string) || '',
            trustBadge: (r.trustBadge as string) || ((r.tier as string) === 'professional' ? 'GOLD' : (r.tier as string) === 'enterprise' ? 'PLATINUM' : 'BASIC'),
          })));
        }
      })
      .catch(() => {
        if (cancelled) return;
        setLoadError(getErrorMessage());
        // Fall back to agentStore data
        if (storeRoles.length > 0) {
          setHiredRoles(storeRoles.map(normaliseStoreRole));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  // Keep in sync when agentStore changes (e.g. after a new hire)
  React.useEffect(() => {
    setHiredRoles((prev) => {
      // Only update from store if we never got API data
      if (prev.length === 0 && storeRoles.length > 0) {
        return storeRoles.map(normaliseStoreRole);
      }
      return prev;
    });
  }, [storeRoles]);

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
    TOOL_USE: 'var(--color-warning, #FFB740)',
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
          color: 'var(--text-inverse, #E8EDF5)',
          marginBottom: 20,
        }}
      >
        Dashboard
      </h1>

      {/* Phase 13: Loading state */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <Skeleton height={80} borderRadius="var(--radius-lg)" />
            <Skeleton height={80} borderRadius="var(--radius-lg)" />
            <Skeleton height={80} borderRadius="var(--radius-lg)" />
          </div>
          <Skeleton height={20} width="120px" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
            <Skeleton height={120} borderRadius="var(--radius-lg)" />
            <Skeleton height={120} borderRadius="var(--radius-lg)" />
            <Skeleton height={120} borderRadius="var(--radius-lg)" />
          </div>
        </div>
      )}

      {/* Phase 13: Error state */}
      {!loading && loadError && (
        <div
          style={{
            padding: '20px 24px',
            background: 'rgba(239,68,68,0.06)',
            border: '1px solid rgba(239,68,68,0.15)',
            borderRadius: 'var(--radius-lg)',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <AlertTriangle size={18} style={{ color: 'var(--color-error)', flexShrink: 0 }} />
          <div style={{ fontSize: 13, color: 'var(--color-error)', fontFamily: 'var(--font-sans)' }}>
            {loadError}
          </div>
        </div>
      )}

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
            {hiredRoles.map((role) => (
              <div
                key={role.hireId}
                style={{
                  padding: 16,
                  background: 'var(--color-surface-1)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                }}
              >
                <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-inverse, #E8EDF5)', marginBottom: 4 }}>
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
                  <span style={{ fontSize: '12px', color: 'var(--text-inverse, #E8EDF5)' }}>
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
