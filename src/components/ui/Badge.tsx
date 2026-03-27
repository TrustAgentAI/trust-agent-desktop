type BadgeVariant = 'trust' | 'status' | 'tier' | 'default';

interface BadgeProps {
  variant?: BadgeVariant;
  value?: number;
  label: string;
  size?: 'sm' | 'md';
}

function getTrustColor(score: number): string {
  if (score >= 90) return 'var(--color-success)';
  if (score >= 70) return 'var(--color-electric-blue)';
  if (score >= 50) return '#F59E0B';
  return 'var(--color-error)';
}

function getStatusColor(label: string): string {
  const l = label.toLowerCase();
  if (l === 'online') return 'var(--color-success)';
  if (l === 'thinking') return 'var(--color-ion-cyan)';
  return 'var(--color-text-muted)';
}

function getTierColor(label: string): string {
  const l = label.toLowerCase();
  if (l === 'professional') return 'var(--color-electric-blue)';
  if (l === 'enterprise') return 'var(--color-ion-cyan)';
  return 'var(--color-text-muted)';
}

export function Badge({ variant = 'default', value, label, size = 'sm' }: BadgeProps) {
  let color = 'var(--color-text-muted)';
  let bg = 'var(--color-surface-2)';

  switch (variant) {
    case 'trust':
      color = getTrustColor(value ?? 0);
      bg = `color-mix(in srgb, ${color} 15%, transparent)`;
      break;
    case 'status':
      color = getStatusColor(label);
      bg = `color-mix(in srgb, ${color} 15%, transparent)`;
      break;
    case 'tier':
      color = getTierColor(label);
      bg = `color-mix(in srgb, ${color} 15%, transparent)`;
      break;
  }

  const pad = size === 'sm' ? '2px 8px' : '4px 12px';
  const fs = size === 'sm' ? '10px' : '12px';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: pad,
        fontSize: fs,
        fontWeight: 600,
        fontFamily: 'var(--font-sans)',
        color,
        background: bg,
        borderRadius: '100px',
        whiteSpace: 'nowrap',
        lineHeight: 1.4,
        letterSpacing: '0.02em',
        textTransform: variant === 'tier' ? 'uppercase' : 'none',
      }}
    >
      {variant === 'status' && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: color,
            animation: label.toLowerCase() === 'thinking' ? 'pulse 1.5s ease-in-out infinite' : 'none',
          }}
        />
      )}
      {variant === 'trust' && value !== undefined ? `${value}%` : label}
    </span>
  );
}
