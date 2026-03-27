import { ScrollText, Trash2 } from 'lucide-react';
import { useAuditStore } from '@/store/auditStore';
import type { AuditAction } from '@/store/auditStore';

const actionColors: Record<AuditAction, string> = {
  READ: 'var(--color-text-muted)',
  WRITE: 'var(--color-electric-blue)',
  API_CALL: 'var(--color-ion-cyan)',
  TOOL_USE: '#FFB740',
  MESSAGE: 'var(--color-text-muted)',
  ERROR: 'var(--color-error)',
};

export function AuditLog() {
  const { events, clearEvents } = useAuditStore();

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 24 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ScrollText size={20} style={{ color: 'var(--color-electric-blue)' }} />
          <span
            style={{
              fontSize: '18px',
              fontWeight: 800,
              fontFamily: 'var(--font-sans)',
              color: '#E8EDF5',
            }}
          >
            Audit Log
          </span>
        </div>
        {events.length > 0 && (
          <button
            onClick={clearEvents}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '5px 10px',
              background: 'transparent',
              border: 'none',
              color: 'var(--color-text-muted)',
              fontFamily: 'var(--font-sans)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              borderRadius: 'var(--radius-sm)',
              transition: 'color 0.15s ease',
            }}
          >
            <Trash2 size={12} />
            Clear log
          </button>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {events.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '48px 20px',
              color: 'var(--color-text-muted)',
              fontSize: '13px',
              lineHeight: 1.6,
            }}
          >
            No actions logged yet. Activity will appear here in real time.
          </div>
        )}

        {events.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {events.map((event, idx) => {
              const time = new Date(event.timestamp);
              const timeStr = time.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              });
              return (
                <div
                  key={event.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background:
                      idx % 2 === 0
                        ? 'transparent'
                        : 'rgba(255,255,255,0.01)',
                    animation: 'fadeSlideIn 0.3s ease forwards',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      color: 'var(--color-text-muted)',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      marginTop: 1,
                    }}
                  >
                    {timeStr}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: actionColors[event.action],
                      minWidth: 70,
                      flexShrink: 0,
                      marginTop: 1,
                    }}
                  >
                    {event.action}
                  </span>
                  <span
                    style={{
                      fontSize: '12px',
                      color: '#E8EDF5',
                      lineHeight: 1.4,
                    }}
                  >
                    {event.description}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
