/**
 * Phase 10 - Admin Roles Page
 * Role management calling admin.listRoles, admin.updateRole, admin.toggleRoleActive.
 */
import React from 'react';
import { Shield, ChevronLeft, ChevronRight, Eye, EyeOff, Edit3 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.trust-agent.ai';

interface RoleRecord {
  id: string;
  slug: string;
  name: string;
  companionName: string | null;
  category: string;
  emoji: string | null;
  isActive: boolean;
  isFeatured: boolean;
  tagline: string | null;
  createdAt: string;
  _count: { hires: number };
}

interface RolesResponse {
  roles: RoleRecord[];
  total: number;
  page: number;
  totalPages: number;
}

export function AdminRolesPage() {
  const [data, setData] = React.useState<RolesResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(1);
  const [toggling, setToggling] = React.useState<string | null>(null);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editName, setEditName] = React.useState('');

  const token = localStorage.getItem('ta_access_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  async function loadRoles(p: number) {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        input: JSON.stringify({ page: p, limit: 20 }),
      });
      const res = await fetch(`${API_BASE}/trpc/admin.listRoles?${params}`, { headers });
      const json = await res.json();
      setData(json.result?.data ?? null);
    } catch {
      setError('Unable to load roles');
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    loadRoles(page);
  }, [page]);

  async function handleToggleActive(roleId: string, isActive: boolean) {
    setToggling(roleId);
    try {
      await fetch(`${API_BASE}/trpc/admin.toggleRoleActive`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ roleId, isActive: !isActive }),
      });
      loadRoles(page);
    } catch {
      setError('Failed to toggle role status');
    } finally {
      setToggling(null);
    }
  }

  async function handleSaveName(roleId: string) {
    if (!editName.trim()) return;
    try {
      await fetch(`${API_BASE}/trpc/admin.updateRole`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ roleId, name: editName.trim() }),
      });
      setEditingId(null);
      loadRoles(page);
    } catch {
      setError('Failed to update role');
    }
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Shield size={20} style={{ color: '#00AA78' }} />
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#E8EDF5', margin: 0, fontFamily: 'var(--font-sans)' }}>
          Role Management
        </h1>
        {data && <Badge variant="info">{data.total} roles</Badge>}
      </div>

      {error && (
        <div style={{ padding: 12, background: 'rgba(255,0,64,0.1)', borderRadius: 8, color: '#FF6B6B', fontSize: 13, marginBottom: 16, fontFamily: 'var(--font-sans)' }}>
          {error}
        </div>
      )}

      {loading && !data && (
        <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-sans)' }}>
          Loading roles...
        </div>
      )}

      {data && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {data.roles.map((role) => (
              <Card key={role.id} style={{ padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 200 }}>
                    {role.emoji && <span style={{ fontSize: 18 }}>{role.emoji}</span>}
                    <div>
                      {editingId === role.id ? (
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveName(role.id)}
                            style={{
                              background: 'var(--color-surface-2)',
                              border: '1px solid var(--color-electric-blue)',
                              borderRadius: 4,
                              padding: '4px 8px',
                              color: '#E8EDF5',
                              fontSize: 13,
                              fontFamily: 'var(--font-sans)',
                              outline: 'none',
                            }}
                            autoFocus
                          />
                          <Button size="sm" onClick={() => handleSaveName(role.id)}>Save</Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#E8EDF5', fontFamily: 'var(--font-sans)' }}>
                            {role.name}
                          </span>
                          <button
                            onClick={() => { setEditingId(role.id); setEditName(role.name); }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: 2 }}
                          >
                            <Edit3 size={12} />
                          </button>
                        </div>
                      )}
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-sans)' }}>
                        {role.slug} - {role.category}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Badge variant={role.isActive ? 'success' : 'error'}>
                      {role.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    {role.isFeatured && <Badge variant="gold">Featured</Badge>}
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-sans)', minWidth: 60, textAlign: 'right' }}>
                      {role._count.hires} hires
                    </span>
                    <Button
                      size="sm"
                      variant={role.isActive ? 'ghost' : 'secondary'}
                      loading={toggling === role.id}
                      onClick={() => handleToggleActive(role.id, role.isActive)}
                      icon={role.isActive ? <EyeOff size={12} /> : <Eye size={12} />}
                    >
                      {role.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-sans)' }}>
              Page {data.page} of {data.totalPages}
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                <ChevronLeft size={14} /> Previous
              </Button>
              <Button variant="ghost" size="sm" disabled={page >= data.totalPages} onClick={() => setPage(page + 1)}>
                Next <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
