import React from 'react';
import { Shield, X, FolderPlus } from 'lucide-react';
import { usePermissionStore } from '@/store/permissionStore';
import { openDirectoryDialog } from '@/lib/tauri-compat';

interface PermissionManagerProps {
  activeRoleId?: string | null;
}

export function PermissionManager({ activeRoleId }: PermissionManagerProps) {
  const { grants, addGrant, removeGrant, getGrantsForRole, loadGrants } =
    usePermissionStore();

  React.useEffect(() => {
    loadGrants().catch(() => {});
  }, [loadGrants]);

  const roleId = activeRoleId || 'default';
  const roleGrants = activeRoleId ? getGrantsForRole(activeRoleId) : grants;

  const handleAddFolder = async (access: 'read' | 'read-write') => {
    const path = await openDirectoryDialog();
    if (!path) return;
    addGrant({
      path,
      access,
      agentRoleId: roleId,
      grantedAt: new Date().toISOString(),
    });
  };

  const handleRevoke = (path: string) => {
    removeGrant(path, roleId);
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <Shield size={20} style={{ color: 'var(--color-electric-blue)' }} />
        <span
          style={{
            fontSize: '18px',
            fontWeight: 800,
            fontFamily: 'var(--font-sans)',
            color: '#E8EDF5',
          }}
        >
          Permissions
        </span>
      </div>
      <p
        style={{
          fontSize: '13px',
          color: 'var(--color-text-muted)',
          marginBottom: 20,
        }}
      >
        Control which local folders this role can access.
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button
          onClick={() => handleAddFolder('read')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            background: 'transparent',
            border: '1px solid var(--color-border-active)',
            borderRadius: 'var(--radius-md)',
            color: '#E8EDF5',
            fontFamily: 'var(--font-sans)',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <FolderPlus size={14} />
          Add folder (read only)
        </button>
        <button
          onClick={() => handleAddFolder('read-write')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            background: 'transparent',
            border: '1px solid var(--color-ion-cyan)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-ion-cyan)',
            fontFamily: 'var(--font-sans)',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <FolderPlus size={14} />
          Add folder (read & write)
        </button>
      </div>

      {roleGrants.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '48px 20px',
            color: 'var(--color-text-muted)',
            fontSize: '13px',
            lineHeight: 1.6,
          }}
        >
          No folders granted. Add a folder to give this role access to local files.
        </div>
      )}

      {roleGrants.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {roleGrants.map((grant) => (
            <div
              key={`${grant.path}-${grant.agentRoleId}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 14px',
                background: 'var(--color-surface-1)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  color: '#E8EDF5',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {grant.path}
              </div>

              <span
                style={{
                  flexShrink: 0,
                  padding: '2px 8px',
                  fontSize: '10px',
                  fontWeight: 600,
                  fontFamily: 'var(--font-sans)',
                  borderRadius: 100,
                  border: `1px solid ${
                    grant.access === 'read-write'
                      ? 'var(--color-ion-cyan)'
                      : 'var(--color-text-muted)'
                  }`,
                  color:
                    grant.access === 'read-write'
                      ? 'var(--color-ion-cyan)'
                      : 'var(--color-text-muted)',
                }}
              >
                {grant.access === 'read-write' ? 'Read & Write' : 'Read'}
              </span>

              <button
                onClick={() => handleRevoke(grant.path)}
                title="Revoke access"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 24,
                  height: 24,
                  borderRadius: 'var(--radius-sm)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--color-text-muted)',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'color 0.15s ease',
                }}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
