import React from 'react';
import ReactDOM from 'react-dom/client';
import { X } from 'lucide-react';

type ToastType = 'info' | 'success' | 'error';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

const typeColors: Record<ToastType, string> = {
  info: 'var(--color-electric-blue)',
  success: 'var(--color-success)',
  error: 'var(--color-error)',
};

let addToastFn: ((message: string, type: ToastType) => void) | null = null;
let containerMounted = false;

function ToastContainer() {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);
  const nextId = React.useRef(0);

  React.useEffect(() => {
    addToastFn = (message: string, type: ToastType) => {
      const id = nextId.current++;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    };
    return () => {
      addToastFn = null;
    };
  }, []);

  const dismiss = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        zIndex: 10000,
        pointerEvents: 'none',
      }}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          style={{
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 16px',
            background: 'var(--color-surface-1)',
            border: `1px solid ${typeColors[toast.type]}`,
            borderLeft: `3px solid ${typeColors[toast.type]}`,
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            color: '#E8EDF5',
            fontFamily: 'var(--font-sans)',
            fontSize: '13px',
            lineHeight: 1.4,
            maxWidth: 380,
            animation: 'fadeSlideIn 0.25s ease forwards',
          }}
        >
          <span style={{ flex: 1 }}>{toast.message}</span>
          <button
            onClick={() => dismiss(toast.id)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: 2,
              flexShrink: 0,
            }}
          >
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  );
}

function ensureContainer() {
  if (containerMounted) return;
  containerMounted = true;
  const div = document.createElement('div');
  div.id = 'toast-root';
  document.body.appendChild(div);
  const root = ReactDOM.createRoot(div);
  root.render(<ToastContainer />);
}

export function showToast(message: string, type: ToastType = 'info') {
  ensureContainer();
  if (addToastFn) {
    addToastFn(message, type);
  } else {
    requestAnimationFrame(() => {
      if (addToastFn) {
        addToastFn(message, type);
      }
    });
  }
}
