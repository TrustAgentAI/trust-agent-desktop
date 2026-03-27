import React from 'react';

interface CardProps {
  variant?: 'dark' | 'light';
  glow?: boolean;
  padding?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export function Card({
  variant = 'dark',
  glow = false,
  padding = '16px',
  children,
  style,
  onClick,
}: CardProps) {
  const [hovered, setHovered] = React.useState(false);

  const baseStyle: React.CSSProperties = {
    background: variant === 'dark' ? 'var(--color-surface-1)' : 'var(--color-surface-2)',
    border: `1px solid ${hovered && onClick ? 'var(--color-border-active)' : 'var(--color-border)'}`,
    borderRadius: 'var(--radius-lg)',
    padding,
    transition: 'all 200ms ease',
    cursor: onClick ? 'pointer' : 'default',
    boxShadow: glow ? 'var(--shadow-glow)' : 'none',
    ...style,
  };

  return (
    <div
      style={baseStyle}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
    </div>
  );
}
