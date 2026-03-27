import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export function Input({ label, error, icon, style, ...props }: InputProps) {
  const [focused, setFocused] = React.useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {label && (
        <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)' }}>
          {label}
        </label>
      )}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'var(--color-surface-2)',
          border: `1px solid ${error ? 'var(--color-error)' : focused ? 'var(--color-electric-blue)' : 'var(--color-border)'}`,
          borderRadius: 'var(--radius-md)',
          padding: '8px 12px',
          transition: 'border-color 150ms ease',
          boxShadow: focused ? '0 0 0 2px rgba(30,111,255,0.15)' : 'none',
        }}
      >
        {icon && (
          <span style={{ color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center' }}>
            {icon}
          </span>
        )}
        <input
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#E8EDF5',
            fontFamily: 'var(--font-sans)',
            fontSize: '13px',
            lineHeight: '20px',
            ...style,
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
      </div>
      {error && (
        <span style={{ fontSize: '11px', color: 'var(--color-error)' }}>{error}</span>
      )}
    </div>
  );
}
