import type { HiredRole } from '@/store/agentStore';

interface AgentCardProps {
  role: HiredRole;
}

export function AgentCard({ role }: AgentCardProps) {
  const badgeConfig = {
    PLATINUM: { bg: 'rgba(0,212,255,0.15)', color: 'var(--color-ion-cyan)' },
    GOLD: { bg: 'rgba(255,183,64,0.15)', color: '#FFB740' },
    SILVER: { bg: 'rgba(192,200,216,0.15)', color: '#C0C8D8' },
    BASIC: { bg: 'rgba(136,153,187,0.15)', color: 'var(--color-text-muted)' },
  }[role.trustBadge];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, var(--color-electric-blue), var(--color-ion-cyan))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            fontWeight: 800,
            color: '#fff',
            flexShrink: 0,
          }}
        >
          {role.roleName.charAt(0).toUpperCase()}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: '#fff',
              fontFamily: 'var(--font-sans)',
            }}
          >
            {role.roleName}
          </div>
          <div
            style={{
              fontSize: 12,
              color: 'var(--color-text-muted)',
            }}
          >
            {role.roleCategory}
          </div>
        </div>
      </div>

      {/* Trust badge + score */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            padding: '2px 10px',
            borderRadius: 100,
            background: badgeConfig.bg,
            color: badgeConfig.color,
            letterSpacing: '0.04em',
          }}
        >
          {role.trustBadge}
        </span>
        <span
          style={{
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            color: 'var(--color-text-muted)',
          }}
        >
          Trust: {role.trustScore}%
        </span>
      </div>
    </div>
  );
}
