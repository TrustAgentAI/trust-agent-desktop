/**
 * Phase 10 - Admin Overview Dashboard
 * Key stats dashboard calling admin.systemHealth.
 */
import React from 'react';
import { Activity, Users, Briefcase, MessageSquare, Shield, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.trust-agent.ai';

interface SystemHealth {
  status: string;
  timestamp: string;
  stats: {
    totalUsers: number;
    activeRoles: number;
    activeHires: number;
    activeSessions: number;
  };
}

export function AdminOverviewPage() {
  const [health, setHealth] = React.useState<SystemHealth | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function loadHealth() {
      try {
        const token = localStorage.getItem('ta_access_token');
        const res = await fetch(`${API_BASE}/trpc/admin.systemHealth`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        setHealth(data.result?.data ?? null);
      } catch {
        setError('Unable to load system health');
      } finally {
        setLoading(false);
      }
    }
    loadHealth();
  }, []);

  if (loading) {
    return (
      <div style={{ flex: 1, padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-sans)' }}>
        Loading admin dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ flex: 1, padding: 24 }}>
        <div style={{ padding: 12, background: 'rgba(255,0,64,0.1)', borderRadius: 8, color: '#FF6B6B', fontSize: 13, fontFamily: 'var(--font-sans)' }}>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Activity size={20} style={{ color: 'var(--color-electric-blue)' }} />
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#E8EDF5', margin: 0, fontFamily: 'var(--font-sans)' }}>
          Admin Overview
        </h1>
        {health && (
          <Badge variant={health.status === 'healthy' ? 'success' : 'error'}>
            {health.status}
          </Badge>
        )}
      </div>

      {health && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
            <StatCard icon={<Users size={20} />} label="Total Users" value={health.stats.totalUsers} color="var(--color-electric-blue)" />
            <StatCard icon={<Shield size={20} />} label="Active Roles" value={health.stats.activeRoles} color="#00AA78" />
            <StatCard icon={<Briefcase size={20} />} label="Active Hires" value={health.stats.activeHires} color="#FFB740" />
            <StatCard icon={<MessageSquare size={20} />} label="Active Sessions" value={health.stats.activeSessions} color="#A78BFA" />
          </div>

          {/* Quick Links */}
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#E8EDF5', marginBottom: 12, fontFamily: 'var(--font-sans)' }}>
            Admin Sections
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            {[
              { label: 'Users', href: '/admin/users', icon: Users, color: 'var(--color-electric-blue)' },
              { label: 'Roles', href: '/admin/roles', icon: Shield, color: '#00AA78' },
              { label: 'Pricing', href: '/admin/pricing', icon: TrendingUp, color: '#FFB740' },
              { label: 'System', href: '/admin/system', icon: Activity, color: '#A78BFA' },
              { label: 'Follow-Ups', href: '/admin/followup', icon: MessageSquare, color: '#FF6B6B' },
              { label: 'Impact', href: '/admin/impact', icon: TrendingUp, color: '#67E8F9' },
            ].map((link) => (
              <Card
                key={link.label}
                onClick={() => { window.location.hash = link.href; }}
                style={{ padding: 20, cursor: 'pointer', textAlign: 'center' }}
              >
                <link.icon size={20} style={{ color: link.color, marginBottom: 8 }} />
                <div style={{ fontSize: 14, fontWeight: 700, color: '#E8EDF5', fontFamily: 'var(--font-sans)' }}>
                  {link.label}
                </div>
              </Card>
            ))}
          </div>

          <div style={{ marginTop: 24, fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-sans)' }}>
            Last updated: {new Date(health.timestamp).toLocaleString('en-GB')}
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <Card style={{ padding: 20, textAlign: 'center' }}>
      <div style={{ color, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color, fontFamily: 'var(--font-sans)' }}>
        {value.toLocaleString()}
      </div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-sans)' }}>
        {label}
      </div>
    </Card>
  );
}
