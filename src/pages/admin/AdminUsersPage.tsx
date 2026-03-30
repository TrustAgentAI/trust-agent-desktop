/**
 * Phase 10 - Admin Users Page
 * User list with search, calling admin.listUsers.
 */
import React from 'react';
import { Users, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.trust-agent.ai';

interface UserRecord {
  id: string;
  email: string;
  name: string | null;
  plan: string;
  accountType: string;
  onboardingDone: boolean;
  tagntBalance: number;
  createdAt: string;
  updatedAt: string;
  _count: { hires: number; sessions: number };
}

interface UsersResponse {
  users: UserRecord[];
  total: number;
  page: number;
  totalPages: number;
}

export function AdminUsersPage() {
  const [data, setData] = React.useState<UsersResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [searchTimeout, setSearchTimeout] = React.useState<ReturnType<typeof setTimeout> | null>(null);

  async function loadUsers(p: number, q: string) {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('ta_access_token');
      const input: Record<string, unknown> = { page: p, limit: 20 };
      if (q.trim()) input.search = q.trim();
      const params = new URLSearchParams({ input: JSON.stringify(input) });
      const res = await fetch(`${API_BASE}/trpc/admin.listUsers?${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = await res.json();
      setData(json.result?.data ?? null);
    } catch {
      setError('Unable to load users');
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    loadUsers(page, search);
  }, [page]);

  function handleSearchChange(val: string) {
    setSearch(val);
    if (searchTimeout) clearTimeout(searchTimeout);
    const t = setTimeout(() => {
      setPage(1);
      loadUsers(1, val);
    }, 400);
    setSearchTimeout(t);
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Users size={20} style={{ color: 'var(--color-electric-blue)' }} />
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#E8EDF5', margin: 0, fontFamily: 'var(--font-sans)' }}>
          Users
        </h1>
        {data && (
          <Badge variant="info">{data.total.toLocaleString()} total</Badge>
        )}
      </div>

      {/* Search */}
      <div style={{ maxWidth: 400, marginBottom: 20 }}>
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          icon={<Search size={14} />}
        />
      </div>

      {error && (
        <div style={{ padding: 12, background: 'rgba(255,0,64,0.1)', borderRadius: 8, color: '#FF6B6B', fontSize: 13, marginBottom: 16, fontFamily: 'var(--font-sans)' }}>
          {error}
        </div>
      )}

      {loading && !data && (
        <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-sans)' }}>
          Loading users...
        </div>
      )}

      {data && (
        <>
          {/* User Table */}
          <Card style={{ padding: 0, overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-sans)' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    {['Name', 'Email', 'Plan', 'Hires', 'Sessions', 'Balance', 'Joined'].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: '10px 14px',
                          textAlign: 'left',
                          fontSize: 11,
                          fontWeight: 700,
                          color: 'rgba(255,255,255,0.4)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.users.map((user) => (
                    <tr key={user.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '10px 14px', fontSize: 13, color: '#E8EDF5', fontWeight: 600 }}>
                        {user.name || '-'}
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
                        {user.email}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <Badge variant={user.plan === 'professional' ? 'info' : user.plan === 'enterprise' ? 'platinum' : 'default'}>
                          {user.plan}
                        </Badge>
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
                        {user._count.hires}
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
                        {user._count.sessions}
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 13, color: '#FFB740', fontWeight: 600 }}>
                        {user.tagntBalance}
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                        {new Date(user.createdAt).toLocaleDateString('en-GB')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

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
