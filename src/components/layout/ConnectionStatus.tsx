import React from 'react';
import { wsClient } from '@/lib/ws';

export function ConnectionStatus() {
  const [status, setStatus] = React.useState(wsClient.getStatus());

  React.useEffect(() => {
    const interval = setInterval(() => {
      setStatus(wsClient.getStatus());
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const config = {
    connected: { color: 'var(--color-success)', label: 'Connected' },
    connecting: { color: '#F59E0B', label: 'Connecting...' },
    disconnected: { color: 'var(--color-error)', label: 'Disconnected' },
  }[status];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 12px',
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: config.color,
          flexShrink: 0,
          animation: status === 'connecting' ? 'pulse 1.5s ease-in-out infinite' : 'none',
        }}
      />
      <span
        style={{
          fontSize: 11,
          fontFamily: 'var(--font-mono)',
          color: config.color,
          fontWeight: 500,
        }}
      >
        {config.label}
      </span>
    </div>
  );
}

export default ConnectionStatus;
