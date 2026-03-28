import React from 'react';
import { RefreshCw, CheckCircle, AlertCircle, Cloud } from 'lucide-react';
import { Button } from '@/components/ui/Button';

type CloudDriveType = 'GOOGLE_DRIVE' | 'ICLOUD' | 'ONEDRIVE';
type SyncStatus = 'synced' | 'syncing' | 'error' | 'never';

interface BrainStatusProps {
  cloudDriveType?: CloudDriveType | null;
  lastSyncAt?: string | null;
  fileSizeBytes?: number | null;
  syncStatus?: SyncStatus;
  errorMessage?: string | null;
  onSync?: () => void;
  isSyncing?: boolean;
}

const DRIVE_LABELS: Record<CloudDriveType, string> = {
  GOOGLE_DRIVE: 'Google Drive',
  ICLOUD: 'iCloud',
  ONEDRIVE: 'OneDrive',
};

const DRIVE_ICONS: Record<CloudDriveType, React.ReactNode> = {
  GOOGLE_DRIVE: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M8 2L1 14h6l7-12H8z" fill="#4285F4" />
      <path d="M14 2l7 12h-6L8 2h6z" fill="#FBBC04" />
      <path d="M1 14l3.5 6h15l3.5-6H1z" fill="#34A853" />
    </svg>
  ),
  ICLOUD: <Cloud size={16} color="#007AFF" />,
  ONEDRIVE: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M10 8c2-3 6-3 8-1 2 0 4 1 5 3s0 5-2 6H5c-3-1-4-4-3-6s3-4 5-3l3 1z" fill="#0078D4" />
    </svg>
  ),
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatSyncTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function BrainStatus({
  cloudDriveType,
  lastSyncAt,
  fileSizeBytes,
  syncStatus = 'never',
  errorMessage,
  onSync,
  isSyncing,
}: BrainStatusProps) {
  const statusColor =
    syncStatus === 'synced'
      ? 'var(--color-success)'
      : syncStatus === 'error'
        ? 'var(--color-error)'
        : syncStatus === 'syncing'
          ? 'var(--color-ion-cyan)'
          : 'var(--color-text-muted)';

  const statusLabel =
    syncStatus === 'synced'
      ? 'Synced'
      : syncStatus === 'syncing'
        ? 'Syncing...'
        : syncStatus === 'error'
          ? 'Sync Error'
          : 'Not synced';

  return (
    <div
      style={{
        background: 'var(--color-surface-1)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: 16,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: statusColor,
              flexShrink: 0,
              animation: syncStatus === 'syncing' ? 'pulse 1.5s ease-in-out infinite' : 'none',
            }}
          />
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: '#E8EDF5',
              fontFamily: 'var(--font-sans)',
            }}
          >
            Brain Status
          </span>
        </div>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: statusColor,
            fontFamily: 'var(--font-sans)',
          }}
        >
          {statusLabel}
        </span>
      </div>

      {/* Cloud drive info */}
      {cloudDriveType && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 10px',
            background: 'var(--color-surface-2)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 10,
          }}
        >
          {DRIVE_ICONS[cloudDriveType]}
          <span style={{ fontSize: 12, color: '#E8EDF5', fontFamily: 'var(--font-sans)' }}>
            {DRIVE_LABELS[cloudDriveType]}
          </span>
          {fileSizeBytes != null && fileSizeBytes > 0 && (
            <span
              style={{
                fontSize: 11,
                color: 'var(--color-text-muted)',
                fontFamily: 'var(--font-mono)',
                marginLeft: 'auto',
              }}
            >
              {formatFileSize(fileSizeBytes)}
            </span>
          )}
        </div>
      )}

      {/* Last sync */}
      {lastSyncAt && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 11,
            color: 'var(--color-text-muted)',
            marginBottom: 10,
            fontFamily: 'var(--font-sans)',
          }}
        >
          <CheckCircle size={12} color="var(--color-success)" />
          Last synced {formatSyncTime(lastSyncAt)}
        </div>
      )}

      {/* Error message */}
      {syncStatus === 'error' && errorMessage && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 6,
            fontSize: 11,
            color: 'var(--color-error)',
            marginBottom: 10,
            padding: '6px 8px',
            background: 'rgba(204,51,51,0.06)',
            borderRadius: 'var(--radius-sm)',
            fontFamily: 'var(--font-sans)',
          }}
        >
          <AlertCircle size={12} style={{ flexShrink: 0, marginTop: 1 }} />
          {errorMessage}
        </div>
      )}

      {/* Sync button */}
      {onSync && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onSync}
          loading={isSyncing}
          icon={<RefreshCw size={12} />}
          style={{ width: '100%' }}
        >
          {isSyncing ? 'Syncing...' : 'Sync Now'}
        </Button>
      )}

      {/* No drive connected */}
      {!cloudDriveType && (
        <div
          style={{
            fontSize: 12,
            color: 'var(--color-text-muted)',
            textAlign: 'center',
            padding: '8px 0',
            fontFamily: 'var(--font-sans)',
          }}
        >
          No cloud drive connected. Connect one in Settings to enable Brain sync.
        </div>
      )}
    </div>
  );
}

export default BrainStatus;
