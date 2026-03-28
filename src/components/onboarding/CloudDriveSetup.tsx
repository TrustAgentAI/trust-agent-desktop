import React from 'react';
import { CheckCircle, ExternalLink, Cloud } from 'lucide-react';
import { Button } from '@/components/ui/Button';

type CloudDriveType = 'GOOGLE_DRIVE' | 'ICLOUD' | 'ONEDRIVE';

interface CloudDriveSetupProps {
  selected?: CloudDriveType | null;
  onSelect: (drive: CloudDriveType) => void;
  onConnect: (drive: CloudDriveType) => void;
  isConnecting?: boolean;
  isConnected?: boolean;
  error?: string | null;
}

interface DriveOption {
  type: CloudDriveType;
  label: string;
  description: string;
  iconColor: string;
}

const DRIVE_OPTIONS: DriveOption[] = [
  {
    type: 'GOOGLE_DRIVE',
    label: 'Google Drive',
    description: 'Store your Brain file in Google Drive. Works across all devices.',
    iconColor: '#4285F4',
  },
  {
    type: 'ICLOUD',
    label: 'iCloud',
    description: 'Store your Brain file in iCloud. Best for Apple ecosystem users.',
    iconColor: '#007AFF',
  },
  {
    type: 'ONEDRIVE',
    label: 'OneDrive',
    description: 'Store your Brain file in OneDrive. Integrates with Microsoft 365.',
    iconColor: '#0078D4',
  },
];

export function CloudDriveSetup({
  selected,
  onSelect,
  onConnect,
  isConnecting,
  isConnected,
  error,
}: CloudDriveSetupProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 480 }}>
      <div>
        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: '#E8EDF5',
            marginBottom: 4,
            fontFamily: 'var(--font-sans)',
          }}
        >
          Choose your cloud drive
        </div>
        <div
          style={{
            fontSize: 13,
            color: 'var(--color-text-muted)',
            lineHeight: 1.6,
            fontFamily: 'var(--font-sans)',
          }}
        >
          Your Brain file stores your learning progress, preferences, and session summaries.
          It is encrypted and stored in YOUR cloud drive - Trust Agent never has access to it.
        </div>
      </div>

      {/* Drive options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {DRIVE_OPTIONS.map((drive) => {
          const isSelected = selected === drive.type;
          return (
            <DriveCard
              key={drive.type}
              drive={drive}
              isSelected={isSelected}
              isConnected={isConnected && isSelected}
              onClick={() => onSelect(drive.type)}
            />
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            fontSize: 12,
            color: 'var(--color-error)',
            padding: '8px 12px',
            background: 'rgba(204,51,51,0.06)',
            borderRadius: 'var(--radius-md)',
            fontFamily: 'var(--font-sans)',
          }}
        >
          {error}
        </div>
      )}

      {/* Connect button */}
      {selected && !isConnected && (
        <Button
          variant="primary"
          size="lg"
          onClick={() => onConnect(selected)}
          loading={isConnecting}
          icon={<ExternalLink size={14} />}
          style={{ width: '100%' }}
        >
          {isConnecting ? 'Connecting...' : `Connect ${DRIVE_OPTIONS.find((d) => d.type === selected)?.label}`}
        </Button>
      )}

      {/* Connected state */}
      {isConnected && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 14px',
            background: 'rgba(0,170,120,0.08)',
            border: '1px solid rgba(0,170,120,0.2)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <CheckCircle size={16} color="var(--color-success)" />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-success)', fontFamily: 'var(--font-sans)' }}>
              Connected
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)' }}>
              A Trust Agent Brain folder has been created in your drive.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DriveCard({
  drive,
  isSelected,
  isConnected,
  onClick,
}: {
  drive: DriveOption;
  isSelected: boolean;
  isConnected?: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = React.useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        background: isSelected ? 'var(--color-surface-2)' : 'var(--color-surface-1)',
        border: `1px solid ${isSelected ? drive.iconColor : hovered ? 'var(--color-border-active)' : 'var(--color-border)'}`,
        borderRadius: 'var(--radius-lg)',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 150ms ease',
        width: '100%',
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 'var(--radius-md)',
          background: `${drive.iconColor}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Cloud size={18} color={drive.iconColor} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#E8EDF5', fontFamily: 'var(--font-sans)' }}>
          {drive.label}
        </div>
        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.4, fontFamily: 'var(--font-sans)' }}>
          {drive.description}
        </div>
      </div>
      {isConnected && <CheckCircle size={16} color="var(--color-success)" />}
      {isSelected && !isConnected && (
        <div
          style={{
            width: 16,
            height: 16,
            borderRadius: '50%',
            border: `2px solid ${drive.iconColor}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: drive.iconColor,
            }}
          />
        </div>
      )}
    </button>
  );
}

export default CloudDriveSetup;
