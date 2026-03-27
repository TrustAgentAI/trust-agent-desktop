// File permission management hook - interfaces with Tauri commands
import { useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { usePermissionStore } from '../store/permissionStore';
import type { FilePermissionGrant } from '../lib/roleConfig';

interface UsePermissionsReturn {
  grants: FilePermissionGrant[];
  isLoading: boolean;
  error: string | null;
  grantFolder: (roleHireId: string, path: string, permissions: ('read' | 'write' | 'execute')[]) => Promise<void>;
  revokeFolder: (grantId: string) => Promise<void>;
  listPermissions: (roleHireId?: string) => FilePermissionGrant[];
  loadPermissions: () => Promise<void>;
}

export function usePermissions(): UsePermissionsReturn {
  const grants = usePermissionStore((s) => s.grants);
  const isLoading = usePermissionStore((s) => s.isLoading);
  const error = usePermissionStore((s) => s.error);
  const addGrant = usePermissionStore((s) => s.addGrant);
  const removeGrant = usePermissionStore((s) => s.removeGrant);
  const loadGrants = usePermissionStore((s) => s.loadGrants);
  const getGrantsForRole = usePermissionStore((s) => s.getGrantsForRole);

  const grantFolder = useCallback(
    async (
      roleHireId: string,
      path: string,
      permissions: ('read' | 'write' | 'execute')[]
    ) => {
      try {
        // Call Tauri command to register the permission at OS level
        await invoke('grant_folder_access', {
          roleHireId,
          path,
          permissions,
        });

        const grant: FilePermissionGrant = {
          id: `grant-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          roleHireId,
          path,
          permissions,
          grantedAt: Date.now(),
        };

        await addGrant(grant);
      } catch (err) {
        console.error('Failed to grant folder access:', err);
        throw err;
      }
    },
    [addGrant]
  );

  const revokeFolder = useCallback(
    async (grantId: string) => {
      const grant = grants.find((g) => g.id === grantId);
      if (!grant) {
        throw new Error('Grant not found');
      }

      try {
        // Call Tauri command to revoke the permission at OS level
        await invoke('revoke_folder_access', {
          roleHireId: grant.roleHireId,
          path: grant.path,
        });

        await removeGrant(grantId);
      } catch (err) {
        console.error('Failed to revoke folder access:', err);
        throw err;
      }
    },
    [grants, removeGrant]
  );

  const listPermissions = useCallback(
    (roleHireId?: string) => {
      if (roleHireId) {
        return getGrantsForRole(roleHireId);
      }
      return grants;
    },
    [grants, getGrantsForRole]
  );

  const loadPermissions = useCallback(async () => {
    await loadGrants();
  }, [loadGrants]);

  return {
    grants,
    isLoading,
    error,
    grantFolder,
    revokeFolder,
    listPermissions,
    loadPermissions,
  };
}

export default usePermissions;
