/**
 * Permission management hook.
 * Uses tauri-compat for browser/Tauri portability.
 */
import { useCallback } from 'react';
import { invoke, openDirectoryDialog } from '@/lib/tauri-compat';
import { usePermissionStore } from '@/store/permissionStore';
import type { PermissionGrant } from '@/store/permissionStore';

interface UsePermissionsReturn {
  grants: PermissionGrant[];
  grantFolder: (agentRoleId: string, access: 'read' | 'read-write') => Promise<void>;
  revokeGrant: (path: string, agentRoleId: string) => void;
  getGrantsForRole: (agentRoleId: string) => PermissionGrant[];
}

export function usePermissions(): UsePermissionsReturn {
  const grants = usePermissionStore((s) => s.grants);
  const addGrant = usePermissionStore((s) => s.addGrant);
  const removeGrant = usePermissionStore((s) => s.removeGrant);
  const getGrantsForRole = usePermissionStore((s) => s.getGrantsForRole);

  const grantFolder = useCallback(
    async (agentRoleId: string, access: 'read' | 'read-write') => {
      const path = await openDirectoryDialog();
      if (!path) return;

      try {
        await invoke('grant_folder_access', {
          roleHireId: agentRoleId,
          path,
          access,
        });
      } catch {
        // Browser mode fallback already handled
      }

      const grant: PermissionGrant = {
        path,
        access,
        agentRoleId,
        grantedAt: new Date().toISOString(),
      };
      addGrant(grant);
    },
    [addGrant]
  );

  const revokeGrant = useCallback(
    (path: string, agentRoleId: string) => {
      removeGrant(path, agentRoleId);
    },
    [removeGrant]
  );

  return {
    grants,
    grantFolder,
    revokeGrant,
    getGrantsForRole,
  };
}

export default usePermissions;
