import React from 'react';

type BadgeVariant = 'platinum' | 'gold' | 'silver' | 'basic' | 'success' | 'error' | 'info' | 'trust' | 'status' | 'tier' | 'default';

interface BadgeProps {
  variant?: BadgeVariant;
  value?: number;
  label?: string;
  size?: 'sm' | 'md';
  children?: React.ReactNode;
}

const variantStyles: Record<string, { color: string; bg: string }> = {
  platinum: { color: 'var(--color-ion-cyan)', bg: 'rgba(0,212,255,0.12)' },
  gold: { color: '#FFB740', bg: 'rgba(255,183,64,0.12)' },
  silver: { color: '#C0C8D8', bg: 'rgba(192,200,216,0.12)' },
  basic: { color: 'var(--color-text-muted)', bg: 'var(--color-surface-2)' },
  success: { color: 'var(--color-success)', bg: 'rgba(0,170,120,0.12)' },
  error: { color: 'var(--color-error)', bg: 'rgba(204,51,51,0.12)' },
  info: { color: 'var(--color-electric-blue)', bg: 'rgba(30,111,255,0.12)' },
  default: { color: 'var(--color-text-muted)', bg: 'var(--color-surface-2)' },
};

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

export function Badge({ variant = 'default', value, label, size = 'sm', children }: BadgeProps) {
  let color = 'var(--color-text-muted)';
  let bg = 'var(--color-surface-2)';

  if (variant === 'trust') {
    color = getTrustColor(value ?? 0);
    bg = `color-mix(in srgb, ${color} 15%, transparent)`;
  } else if (variant === 'status') {
    color = getStatusColor(label || '');
    bg = `color-mix(in srgb, ${color} 15%, transparent)`;
  } else if (variant === 'tier') {
    color = getTierColor(label || '');
    bg = `color-mix(in srgb, ${color} 15%, transparent)`;
  } else if (variantStyles[variant]) {
    color = variantStyles[variant].color;
    bg = variantStyles[variant].bg;
  }

  const pad = size === 'sm' ? '2px 8px' : '4px 12px';
  const fs = size === 'sm' ? '10px' : '12px';
  const displayText = children || (variant === 'trust' && value !== undefined ? `${value}%` : label);

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
            animation: (label || '').toLowerCase() === 'thinking' ? 'pulse 1.5s ease-in-out infinite' : 'none',
          }}
        />
      )}
      {displayText}
    </span>
  );
}
