import { Badge } from '@/components/ui/Badge';
import type { HiredRole } from '@/lib/roleConfig';

interface AgentCardProps {
  role: HiredRole;
  sessionActive?: boolean;
}

function getTierLabel(tier: string): string {
  if (tier === 'professional') return 'PRO';
  if (tier === 'enterprise') return 'ENT';
  return 'FREE';
}

export function AgentCard({ role, sessionActive = false }: AgentCardProps) {
  const status = sessionActive ? 'online' : 'offline';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Avatar */}
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, var(--color-electric-blue), var(--color-ion-cyan))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            fontWeight: 800,
            color: '#fff',
            flexShrink: 0,
            position: 'relative',
          }}
        >
          {role.name.charAt(0).toUpperCase()}
          {/* Status dot */}
          <span
            style={{
              position: 'absolute',
              bottom: -1,
              right: -1,
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: status === 'online' ? 'var(--color-success)' : 'var(--color-text-mid)',
              border: '2px solid var(--color-dark-navy)',
            }}
          />
        </div>

        {/* Name / persona */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#E8EDF5' }}>
            {role.name}
          </div>
          <div
            style={{
              fontSize: '12px',
              color: 'var(--color-text-muted)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {role.persona}
          </div>
        </div>
      </div>

      {/* Badges */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        <Badge variant="status" label={status} />
        <Badge variant="tier" label={getTierLabel(role.tier)} />
      </div>

      {/* Capabilities */}
      {role.capabilities.length > 0 && (
        <div>
          <div
            style={{
              fontSize: '10px',
              fontWeight: 700,
              color: 'var(--color-text-mid)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: 6,
            }}
          >
            Capabilities
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {role.capabilities.slice(0, 5).map((cap) => (
              <span
                key={cap}
                style={{
                  fontSize: '10px',
                  padding: '2px 8px',
                  borderRadius: '100px',
                  background: 'var(--color-surface-2)',
                  color: 'var(--color-text-muted)',
                  fontWeight: 500,
                }}
              >
                {cap}
              </span>
            ))}
            {role.capabilities.length > 5 && (
              <span
                style={{
                  fontSize: '10px',
                  padding: '2px 8px',
                  borderRadius: '100px',
                  background: 'var(--color-surface-2)',
                  color: 'var(--color-text-mid)',
                }}
              >
                +{role.capabilities.length - 5} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Session info */}
      {sessionActive && (
        <div
          style={{
            fontSize: '11px',
            color: 'var(--color-text-mid)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          Session active since{' '}
          {new Date(role.hiredAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      )}
    </div>
  );
}
