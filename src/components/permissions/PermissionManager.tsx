import React from 'react';
import { Shield, Trash2, Plus, FolderOpen, Eye, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { DriveSelector } from '@/components/permissions/DriveSelector';
import { usePermissionStore } from '@/store/permissionStore';
import { useAgentStore } from '@/store/agentStore';
import type { FilePermissionGrant } from '@/lib/roleConfig';

interface PermissionManagerProps {
  activeRoleId: string | null;
}

export function PermissionManager({ activeRoleId }: PermissionManagerProps) {
  const { grants, addGrant, removeGrant, loadGrants, getGrantsForRole } =
    usePermissionStore();
  const { hiredRoles } = useAgentStore();
  const [showSelector, setShowSelector] = React.useState(false);
  const [confirmRemoveId, setConfirmRemoveId] = React.useState<string | null>(null);

  React.useEffect(() => {
    loadGrants().catch(() => {});
  }, [loadGrants]);

  const roleGrants = activeRoleId ? getGrantsForRole(activeRoleId) : grants;
  const activeRole = hiredRoles.find((r) => r.id === activeRoleId);

  const handleGrantAccess = async (path: string, permissions: ('read' | 'write')[]) => {
    if (!activeRoleId) return;

    const grant: FilePermissionGrant = {
      id: `perm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      roleHireId: activeRoleId,
      path,
      permissions,
      grantedAt: Date.now(),
    };

    try {
      await addGrant(grant);
      setShowSelector(false);
    } catch {
      // Error handled by store
    }
  };

  const handleRemove = async (grantId: string) => {
    try {
      await removeGrant(grantId);
      setConfirmRemoveId(null);
    } catch {
      // Error handled by store
    }
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={20} style={{ color: 'var(--color-electric-blue)' }} />
            <span style={{ fontSize: '18px', fontWeight: 700, color: '#E8EDF5' }}>
              Permissions
            </span>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: 4 }}>
            {activeRole
              ? `Manage folder access for ${activeRole.name}`
              : 'Select an agent to manage folder permissions'}
          </div>
        </div>

        {activeRoleId && (
          <Button
            size="sm"
            icon={<Plus size={14} />}
            onClick={() => setShowSelector(true)}
          >
            Grant Access
          </Button>
        )}
      </div>

      {/* Folder Selector */}
      {showSelector && activeRoleId && (
        <div style={{ marginBottom: 16 }}>
          <DriveSelector
            onConfirm={handleGrantAccess}
            onCancel={() => setShowSelector(false)}
          />
        </div>
      )}

      {/* No agent selected */}
      {!activeRoleId && (
        <div
          style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: 'var(--color-text-muted)',
            fontSize: '13px',
          }}
        >
          Select an agent from the sidebar to manage its file permissions.
        </div>
      )}

      {/* Permissions list */}
      {activeRoleId && roleGrants.length === 0 && !showSelector && (
        <div
          style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: 'var(--color-text-muted)',
            fontSize: '13px',
          }}
        >
          No folder access granted to this agent yet.
        </div>
      )}

      {activeRoleId && roleGrants.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {roleGrants.map((grant) => (
            <PermissionRow
              key={grant.id}
              grant={grant}
              agentName={activeRole?.name || 'Agent'}
              isConfirming={confirmRemoveId === grant.id}
              onRevoke={() => setConfirmRemoveId(grant.id)}
              onConfirmRevoke={() => handleRemove(grant.id)}
              onCancelRevoke={() => setConfirmRemoveId(null)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PermissionRow({
  grant,
  agentName,
  isConfirming,
  onRevoke,
  onConfirmRevoke,
  onCancelRevoke,
}: {
  grant: FilePermissionGrant;
  agentName: string;
  isConfirming: boolean;
  onRevoke: () => void;
  onConfirmRevoke: () => void;
  onCancelRevoke: () => void;
}) {
  const hasWrite = grant.permissions.includes('write');
  const accessLabel = hasWrite ? 'Read + Write' : 'Read Only';
  const grantDate = new Date(grant.grantedAt).toLocaleDateString();

  return (
    <Card variant="dark" padding="14px 16px">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <FolderOpen size={18} style={{ color: 'var(--color-electric-blue)', flexShrink: 0 }} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: '#E8EDF5',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {grant.path}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <Badge
              variant="default"
              label={accessLabel}
              size="sm"
            />
            <span style={{ fontSize: '10px', color: 'var(--color-text-mid)' }}>
              Granted {grantDate} to {agentName}
            </span>
          </div>
        </div>

        {/* Access level icon */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          <Eye size={12} style={{ color: 'var(--color-success)' }} />
          {hasWrite && <Pencil size={12} style={{ color: 'var(--color-ion-cyan)' }} />}
        </div>

        {/* Revoke */}
        {!isConfirming ? (
          <Button variant="ghost" size="sm" onClick={onRevoke}>
            <Trash2 size={14} style={{ color: 'var(--color-error)' }} />
          </Button>
        ) : (
          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
            <Button variant="danger" size="sm" onClick={onConfirmRevoke}>
              Revoke
            </Button>
            <Button variant="ghost" size="sm" onClick={onCancelRevoke}>
              Keep
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
