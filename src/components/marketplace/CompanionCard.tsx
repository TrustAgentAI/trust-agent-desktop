/**
 * CompanionCard - Phase 16: Companion Card Redesign
 *
 * Airbnb-style card showing ONLY 4 things:
 * 1. Who is this companion? (name + avatar)
 * 2. What can they help with? (one-line tagline)
 * 3. Can I trust them? (trust badge + score)
 * 4. What does it cost? (price or "Free trial")
 *
 * Everything else goes to the detail page.
 * Hire button appears on hover - not visible by default.
 */
import React from 'react';
import { Badge } from '@/components/ui/Badge';

export interface CompanionCardProps {
  slug: string;
  companionName: string;
  roleTitle: string;
  emoji?: string;
  avatarUrl?: string;
  badge: 'PLATINUM' | 'GOLD' | 'SILVER' | 'BASIC';
  trustScore: number;
  category: string;
  priceMonthly: number; // pence
  isHired?: boolean;
  accentColor?: string;
  onClick?: () => void;
}

const BADGE_COLORS: Record<string, { bg: string; color: string }> = {
  PLATINUM: { bg: 'rgba(0,212,255,0.12)', color: 'var(--color-ion-cyan)' },
  GOLD: { bg: 'rgba(255,183,64,0.12)', color: '#FFB740' },
  SILVER: { bg: 'rgba(192,200,216,0.12)', color: '#C0C8D8' },
  BASIC: { bg: 'rgba(136,153,187,0.12)', color: 'var(--color-text-muted)' },
};

function formatPrice(pence: number): string {
  if (pence === 0) return 'Free trial';
  const pounds = (pence / 100).toFixed(2);
  return `\u00A3${pounds}/mo`;
}

export function CompanionCard({
  companionName,
  roleTitle,
  emoji,
  avatarUrl,
  badge,
  trustScore,
  priceMonthly,
  isHired,
  accentColor,
  onClick,
}: CompanionCardProps) {
  const [hovered, setHovered] = React.useState(false);
  const accent = accentColor || 'var(--color-electric-blue)';
  const badgeConfig = BADGE_COLORS[badge] || BADGE_COLORS.BASIC;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClick?.();
      }}
      style={{
        position: 'relative',
        background: 'var(--color-surface-1)',
        border: `1px solid ${hovered ? 'rgba(30,111,255,0.3)' : 'var(--color-border)'}`,
        borderRadius: 'var(--radius-lg)',
        padding: 0,
        cursor: 'pointer',
        transition: 'all 200ms ease',
        transform: hovered ? 'translateY(-2px)' : 'none',
        boxShadow: hovered ? '0 8px 24px rgba(0,0,0,0.25)' : 'none',
        overflow: 'hidden',
      }}
    >
      {/* Accent top bar */}
      <div
        style={{
          height: 3,
          background: accent,
          borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
        }}
      />

      <div style={{ padding: '16px' }}>
        {/* 1. WHO: Avatar + Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          {/* Portrait */}
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={companionName}
              style={{
                width: 44,
                height: 44,
                borderRadius: 'var(--radius-md)',
                flexShrink: 0,
                objectFit: 'cover',
              }}
            />
          ) : (
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 'var(--radius-md)',
                background: `${accent}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: emoji ? '22px' : '16px',
                fontWeight: 800,
                color: accent,
                fontFamily: 'var(--font-sans)',
                flexShrink: 0,
              }}
            >
              {emoji || companionName.charAt(0)}
            </div>
          )}

          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: '14px',
                fontWeight: 700,
                color: '#E8EDF5',
                fontFamily: 'var(--font-sans)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                lineHeight: 1.3,
              }}
            >
              {companionName}
            </div>
            {isHired && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                  fontSize: '10px',
                  fontWeight: 600,
                  color: 'var(--color-success)',
                  marginTop: 2,
                }}
              >
                <span style={{ fontSize: '12px' }}>&#10003;</span> Hired
              </span>
            )}
          </div>
        </div>

        {/* 2. WHAT: One-line tagline */}
        <p
          style={{
            fontSize: '12px',
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-sans)',
            lineHeight: 1.5,
            margin: '0 0 14px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {roleTitle}
        </p>

        {/* 3 + 4: TRUST + PRICE row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Trust badge + score */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                fontSize: '9px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 100,
                background: badgeConfig.bg,
                color: badgeConfig.color,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              {badge}
            </span>
            <Badge variant="trust" value={trustScore} />
          </div>

          {/* Price */}
          <span
            style={{
              fontSize: '12px',
              fontWeight: 700,
              color: priceMonthly === 0 ? 'var(--color-success)' : '#E8EDF5',
              fontFamily: 'var(--font-sans)',
            }}
          >
            {formatPrice(priceMonthly)}
          </span>
        </div>
      </div>

      {/* Hover CTA - appears on hover */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '10px 16px',
          background: 'linear-gradient(transparent, rgba(10,12,25,0.95) 40%)',
          display: 'flex',
          justifyContent: 'center',
          opacity: hovered ? 1 : 0,
          transform: hovered ? 'translateY(0)' : 'translateY(8px)',
          transition: 'all 200ms ease',
          pointerEvents: hovered ? 'auto' : 'none',
        }}
        aria-hidden={!hovered}
      >
        <span
          style={{
            fontSize: '12px',
            fontWeight: 600,
            fontFamily: 'var(--font-sans)',
            color: 'var(--color-electric-blue)',
          }}
        >
          {isHired ? 'View companion \u2192' : 'Hire companion \u2192'}
        </span>
      </div>
    </div>
  );
}

export default CompanionCard;
