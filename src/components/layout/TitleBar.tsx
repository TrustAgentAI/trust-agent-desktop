import React from 'react';
import { PanelRightClose, PanelRightOpen, Minus, X } from 'lucide-react';
import { isTauri, minimizeWindow, closeWindow } from '@/lib/tauri-compat';

interface TitleBarProps {
  rightPanelOpen?: boolean;
  onToggleRightPanel?: () => void;
}

export function TitleBar({ rightPanelOpen = true, onToggleRightPanel }: TitleBarProps) {
  const [closeHovered, setCloseHovered] = React.useState(false);
  const [minHovered, setMinHovered] = React.useState(false);

  // Hide the custom title bar in browser mode
  if (!isTauri()) {
    return null;
  }

  return (
    <div
      data-tauri-drag-region
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 44,
        minHeight: 44,
        background: 'var(--color-navy-2)',
        borderBottom: '1px solid var(--color-border)',
        paddingLeft: 16,
        paddingRight: 4,
        zIndex: 100,
      }}
    >
      {/* Left: wordmark + version */}
      <div
        data-tauri-drag-region
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-sans)',
            fontWeight: 800,
            fontSize: 13,
            color: '#E8EDF5',
            letterSpacing: '-0.02em',
          }}
        >
          Trust Agent
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            fontWeight: 500,
            color: 'var(--color-electric-blue)',
            background: 'rgba(30,111,255,0.1)',
            padding: '2px 8px',
            borderRadius: 'var(--radius-sm)',
            letterSpacing: '0.02em',
          }}
        >
          Desktop v1.0
        </span>
      </div>

      {/* Right: controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {onToggleRightPanel && (
          <button
            onClick={onToggleRightPanel}
            title={rightPanelOpen ? 'Hide panel' : 'Show panel'}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 28,
              background: 'transparent',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              transition: 'color 150ms',
            }}
          >
            {rightPanelOpen ? <PanelRightClose size={14} /> : <PanelRightOpen size={14} />}
          </button>
        )}
        <button
          onClick={() => minimizeWindow()}
          onMouseEnter={() => setMinHovered(true)}
          onMouseLeave={() => setMinHovered(false)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 36,
            height: 28,
            background: minHovered ? 'rgba(255,255,255,0.06)' : 'transparent',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--color-text-muted)',
            cursor: 'pointer',
            transition: 'background 150ms',
          }}
        >
          <Minus size={14} />
        </button>
        <button
          onClick={() => closeWindow()}
          onMouseEnter={() => setCloseHovered(true)}
          onMouseLeave={() => setCloseHovered(false)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 36,
            height: 28,
            background: closeHovered ? '#CC3333' : 'transparent',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            color: closeHovered ? '#fff' : 'var(--color-text-muted)',
            cursor: 'pointer',
            transition: 'all 150ms',
          }}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
