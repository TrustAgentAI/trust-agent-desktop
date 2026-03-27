import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  loading?: boolean;
}

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: 'var(--color-electric-blue)',
    color: '#fff',
    border: 'none',
  },
  secondary: {
    background: 'transparent',
    color: '#E8EDF5',
    border: '1px solid var(--color-border-active)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--color-text-muted)',
    border: 'none',
  },
  danger: {
    background: 'var(--color-error)',
    color: '#fff',
    border: 'none',
  },
};

const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
  sm: { padding: '5px 10px', fontSize: '12px', borderRadius: 'var(--radius-sm)' },
  md: { padding: '8px 16px', fontSize: '13px', borderRadius: 'var(--radius-md)' },
  lg: { padding: '10px 20px', fontSize: '14px', borderRadius: 'var(--radius-md)' },
};

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  loading,
  disabled,
  children,
  style,
  ...props
}: ButtonProps) {
  const [hovered, setHovered] = React.useState(false);

  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    fontFamily: 'var(--font-sans)',
    fontWeight: 600,
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : hovered ? 0.85 : 1,
    transition: 'all 150ms ease',
    whiteSpace: 'nowrap',
    ...variantStyles[variant],
    ...sizeStyles[size],
    ...style,
  };

  return (
    <button
      style={baseStyle}
      disabled={disabled || loading}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      {...props}
    >
      {loading ? (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
          <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="24" strokeDashoffset="8" />
        </svg>
      ) : icon ? (
        <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>
      ) : null}
      {children}
    </button>
  );
}
