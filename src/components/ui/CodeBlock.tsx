import React from 'react';

interface CodeBlockProps {
  code: string;
  language?: string;
}

export function CodeBlock({ code, language }: CodeBlockProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard may not be available
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        background: 'var(--color-dark-navy)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        margin: '8px 0',
      }}
    >
      {language && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '6px 12px',
            background: 'var(--color-surface-2)',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <span
            style={{
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {language}
          </span>
          <button
            onClick={handleCopy}
            style={{
              background: 'transparent',
              border: 'none',
              color: copied ? 'var(--color-success)' : 'var(--color-text-muted)',
              cursor: 'pointer',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              padding: '2px 6px',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      )}
      <pre
        style={{
          padding: '12px 16px',
          margin: 0,
          overflowX: 'auto',
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
          lineHeight: 1.6,
          color: '#E8EDF5',
          tabSize: 2,
        }}
      >
        <code>{code}</code>
      </pre>
      {!language && (
        <button
          onClick={handleCopy}
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            background: 'var(--color-surface-2)',
            border: '1px solid var(--color-border)',
            color: copied ? 'var(--color-success)' : 'var(--color-text-muted)',
            cursor: 'pointer',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            padding: '2px 8px',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      )}
    </div>
  );
}
