/**
 * EmptyState - Shared component for guiding users when no data exists.
 * Phase 13: Empty State Excellence - no blank screens anywhere.
 *
 * Supports:
 * - icon: Lucide icon element
 * - title: Primary heading
 * - description: Supportive copy explaining what will appear here
 * - ctaText / ctaAction: Optional call-to-action button
 * - ghostContent: Optional pre-rendered "ghost cards" showing what COULD exist
 */
import React from 'react';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  ctaText?: string;
  ctaAction?: () => void;
  ghostContent?: React.ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  ctaText,
  ctaAction,
  ghostContent,
}: EmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        textAlign: 'center',
      }}
    >
      {/* Icon container */}
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 'var(--radius-lg)',
          background: 'rgba(30,111,255,0.08)',
          border: '1px solid rgba(30,111,255,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
          color: 'var(--color-electric-blue)',
        }}
      >
        {icon}
      </div>

      {/* Title */}
      <h3
        style={{
          fontSize: '16px',
          fontWeight: 700,
          fontFamily: 'var(--font-sans)',
          color: '#E8EDF5',
          marginBottom: 8,
          lineHeight: 1.3,
        }}
      >
        {title}
      </h3>

      {/* Description */}
      <p
        style={{
          fontSize: '13px',
          fontFamily: 'var(--font-sans)',
          color: 'var(--color-text-muted)',
          lineHeight: 1.6,
          maxWidth: 360,
          marginBottom: ctaText ? 20 : ghostContent ? 24 : 0,
        }}
      >
        {description}
      </p>

      {/* CTA button */}
      {ctaText && ctaAction && (
        <button
          onClick={ctaAction}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '10px 24px',
            background: 'var(--color-electric-blue)',
            color: '#fff',
            fontFamily: 'var(--font-sans)',
            fontWeight: 600,
            fontSize: '13px',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            transition: 'opacity 0.15s ease',
            marginBottom: ghostContent ? 28 : 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.85';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
        >
          {ctaText}
        </button>
      )}

      {/* Ghost content area */}
      {ghostContent && (
        <div
          style={{
            width: '100%',
            maxWidth: 600,
          }}
        >
          {ghostContent}
        </div>
      )}
    </div>
  );
}

/**
 * GhostCard - Semi-transparent placeholder card showing what COULD exist.
 * Used inside EmptyState ghostContent to preview possible companions/items.
 */
interface GhostCardProps {
  emoji: string;
  name: string;
  tagline: string;
  badge?: string;
}

export function GhostCard({ emoji, name, tagline, badge }: GhostCardProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        background: 'rgba(255,255,255,0.02)',
        border: '1px dashed rgba(255,255,255,0.08)',
        borderRadius: 'var(--radius-lg)',
        opacity: 0.5,
        transition: 'opacity 0.2s ease',
        cursor: 'default',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.opacity = '0.75';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = '0.5';
      }}
    >
      {/* Emoji avatar */}
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 'var(--radius-md)',
          background: 'rgba(30,111,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px',
          flexShrink: 0,
        }}
      >
        {emoji}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
        <div
          style={{
            fontSize: '13px',
            fontWeight: 600,
            color: '#E8EDF5',
            fontFamily: 'var(--font-sans)',
          }}
        >
          {name}
        </div>
        <div
          style={{
            fontSize: '11px',
            color: 'var(--color-text-muted)',
            marginTop: 2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {tagline}
        </div>
      </div>

      {/* Badge */}
      {badge && (
        <span
          style={{
            fontSize: '9px',
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: 100,
            background: 'rgba(0,212,255,0.1)',
            color: 'var(--color-ion-cyan)',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            flexShrink: 0,
          }}
        >
          {badge}
        </span>
      )}
    </div>
  );
}
