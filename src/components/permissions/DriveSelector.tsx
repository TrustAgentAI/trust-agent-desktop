import React from 'react';
import { FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface DriveSelectorProps {
  onConfirm: (path: string, permissions: ('read' | 'write')[]) => void;
  onCancel: () => void;
}

export function DriveSelector({ onConfirm, onCancel }: DriveSelectorProps) {
  const [selectedPath, setSelectedPath] = React.useState<string | null>(null);
  const [accessLevel, setAccessLevel] = React.useState<'read' | 'read-write'>('read');

  const handlePickFolder = async () => {
    try {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const result = await open({
        directory: true,
        multiple: false,
        title: 'Select Folder to Grant Access',
      });

      if (result) {
        const path = typeof result === 'string' ? result : String(result);
        setSelectedPath(path);
      }
    } catch {
      // Not in Tauri context or dialog was cancelled
    }
  };

  const handleConfirm = () => {
    if (!selectedPath) return;
    const perms: ('read' | 'write')[] =
      accessLevel === 'read-write' ? ['read', 'write'] : ['read'];
    onConfirm(selectedPath, perms);
  };

  return (
    <div
      style={{
        background: 'var(--color-surface-1)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <div style={{ fontSize: '14px', fontWeight: 700, color: '#E8EDF5' }}>
        Grant Folder Access
      </div>

      {/* Folder picker */}
      <div>
        <Button
          variant="secondary"
          size="md"
          icon={<FolderOpen size={14} />}
          onClick={handlePickFolder}
        >
          {selectedPath ? 'Change Folder' : 'Choose Folder'}
        </Button>

        {selectedPath && (
          <div
            style={{
              marginTop: 8,
              padding: '8px 12px',
              background: 'var(--color-surface-2)',
              borderRadius: 'var(--radius-md)',
              fontSize: '12px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--color-text-muted)',
              wordBreak: 'break-all',
            }}
          >
            {selectedPath}
          </div>
        )}
      </div>

      {/* Access level */}
      <div>
        <div
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--color-text-muted)',
            marginBottom: 8,
          }}
        >
          Access Level
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <AccessToggle
            label="Read Only"
            active={accessLevel === 'read'}
            onClick={() => setAccessLevel('read')}
          />
          <AccessToggle
            label="Read + Write"
            active={accessLevel === 'read-write'}
            onClick={() => setAccessLevel('read-write')}
          />
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" disabled={!selectedPath} onClick={handleConfirm}>
          Grant Access
        </Button>
      </div>
    </div>
  );
}

function AccessToggle({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 14px',
        borderRadius: 'var(--radius-md)',
        background: active ? 'rgba(30,111,255,0.12)' : 'transparent',
        border: `1px solid ${active ? 'var(--color-electric-blue)' : 'var(--color-border)'}`,
        color: active ? 'var(--color-electric-blue)' : 'var(--color-text-muted)',
        fontFamily: 'var(--font-sans)',
        fontSize: '12px',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 150ms ease',
      }}
    >
      {label}
    </button>
  );
}
