import React from 'react';
import ReactDOM from 'react-dom/client';
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';

type ToastType = 'info' | 'success' | 'warning' | 'error';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

/**
 * Human-readable error message map.
 * Components should call getErrorMessage(code) rather than showing raw errors.
 */
const ERROR_MESSAGES: Record<string, string> = {
  NETWORK_ERROR: 'We could not reach the server. Please check your connection and try again.',
  AUTH_EXPIRED: 'Your session has expired. Please sign in again.',
  AUTH_INVALID: 'The email or password you entered is incorrect.',
  NOT_FOUND: 'We could not find what you were looking for.',
  RATE_LIMITED: 'You are making requests too quickly. Please wait a moment.',
  SERVER_ERROR: 'Something went wrong on our end. We are looking into it.',
  PERMISSION_DENIED: 'You do not have permission to do that.',
  VALIDATION_ERROR: 'Please check the information you entered and try again.',
  PAYMENT_FAILED: 'Your payment could not be processed. Please try a different method.',
  SUBSCRIPTION_REQUIRED: 'This feature requires an active subscription.',
  UNKNOWN: 'Something unexpected happened. Please try again.',
};

export function getErrorMessage(code?: string): string {
  if (!code) return ERROR_MESSAGES.UNKNOWN;
  return ERROR_MESSAGES[code] || ERROR_MESSAGES.UNKNOWN;
}

const typeConfig: Record<
  ToastType,
  { color: string; bg: string; borderColor: string; icon: React.ReactNode }
> = {
  success: {
    color: 'var(--color-success)',
    bg: '#F0FDF4',
    borderColor: 'var(--color-success)',
    icon: <CheckCircle size={16} />,
  },
  warning: {
    color: 'var(--color-warning)',
    bg: '#FFFBEB',
    borderColor: 'var(--color-warning)',
    icon: <AlertTriangle size={16} />,
  },
  error: {
    color: 'var(--color-error)',
    bg: '#FEF2F2',
    borderColor: 'var(--color-error)',
    icon: <AlertCircle size={16} />,
  },
  info: {
    color: 'var(--color-info)',
    bg: '#EFF6FF',
    borderColor: 'var(--color-info)',
    icon: <Info size={16} />,
  },
};

const AUTO_DISMISS_MS = 5000;

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
      }, AUTO_DISMISS_MS);
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
      role="region"
      aria-label="Notifications"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        zIndex: 'var(--z-toast, 10000)' as unknown as number,
        pointerEvents: 'none',
        maxWidth: 420,
      }}
    >
      {toasts.map((toast) => {
        const config = typeConfig[toast.type];
        return (
          <div
            key={toast.id}
            role="alert"
            style={{
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 'var(--space-3, 12px)',
              padding: '12px 16px',
              background: config.bg,
              border: `1px solid ${config.borderColor}`,
              borderLeft: `4px solid ${config.borderColor}`,
              borderRadius: 'var(--radius-md, 12px)',
              boxShadow: 'var(--shadow-card, 0 8px 28px rgba(12,24,16,0.09))',
              color: 'var(--text-primary, #1A1A18)',
              fontFamily: 'var(--font-sans, "DM Sans", sans-serif)',
              fontSize: 14,
              lineHeight: 1.5,
              animation: 'ws-slideInRight 0.25s ease forwards',
            }}
          >
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                color: config.color,
                flexShrink: 0,
                marginTop: 1,
              }}
            >
              {config.icon}
            </span>
            <span style={{ flex: 1 }}>{toast.message}</span>
            <button
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss notification"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted, #7A7A74)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: 2,
                flexShrink: 0,
                borderRadius: 'var(--radius-sm, 6px)',
                minWidth: 24,
                minHeight: 24,
                justifyContent: 'center',
              }}
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
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

/**
 * Show an error toast with a human-readable message.
 * Pass an error code from the backend, or leave empty for a generic message.
 */
export function showErrorToast(errorCode?: string) {
  showToast(getErrorMessage(errorCode), 'error');
}
