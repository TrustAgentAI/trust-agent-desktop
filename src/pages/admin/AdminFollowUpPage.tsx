/**
 * Phase 10 - Admin Follow-Up Queue Page
 * Wraps the existing HumanFollowUpQueue component at a dedicated route.
 * Also provides direct tRPC fetch for follow-up stats if available.
 */
import React from 'react';
import { AlertTriangle, Clock } from 'lucide-react';
import { HumanFollowUpQueue } from '@/components/admin/HumanFollowUpQueue';
import { Card } from '@/components/ui/Card';

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.trust-agent.ai';

interface FollowUpStats {
  total: number;
  queued: number;
  assigned: number;
  resolved: number;
  slaBreached: number;
}

export function AdminFollowUpPage() {
  const [stats, setStats] = React.useState<FollowUpStats | null>(null);

  React.useEffect(() => {
    async function loadStats() {
      try {
        const token = localStorage.getItem('ta_access_token');
        // Try to load follow-up queue stats from the human-followup lib
        // This is a best-effort call - the endpoint may not exist yet
        const res = await fetch(`${API_BASE}/api/v1/admin/follow-ups/stats`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data.data ?? data);
        }
      } catch {
        // Stats endpoint not available - that's okay
      }
    }
    loadStats();
  }, []);

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <AlertTriangle size={20} style={{ color: '#FF6B6B' }} />
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#E8EDF5', margin: 0, fontFamily: 'var(--font-sans)' }}>
          Follow-Up Queue
        </h1>
      </div>

      {/* Stats Bar */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
          <Card style={{ padding: 14, textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-electric-blue)', fontFamily: 'var(--font-sans)' }}>
              {stats.total}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-sans)' }}>Total</div>
          </Card>
          <Card style={{ padding: 14, textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#FFB740', fontFamily: 'var(--font-sans)' }}>
              {stats.queued}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-sans)' }}>Queued</div>
          </Card>
          <Card style={{ padding: 14, textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#A78BFA', fontFamily: 'var(--font-sans)' }}>
              {stats.assigned}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-sans)' }}>Assigned</div>
          </Card>
          <Card style={{ padding: 14, textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#00AA78', fontFamily: 'var(--font-sans)' }}>
              {stats.resolved}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-sans)' }}>Resolved</div>
          </Card>
          {stats.slaBreached > 0 && (
            <Card style={{ padding: 14, textAlign: 'center', border: '1px solid rgba(255,0,64,0.2)' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#FF6B6B', fontFamily: 'var(--font-sans)' }}>
                {stats.slaBreached}
              </div>
              <div style={{ fontSize: 11, color: '#FF6B6B', fontFamily: 'var(--font-sans)' }}>SLA Breached</div>
            </Card>
          )}
        </div>
      )}

      {/* SLA Reference */}
      <Card style={{ padding: 14, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Clock size={14} style={{ color: '#FFB740' }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#E8EDF5', fontFamily: 'var(--font-sans)' }}>
            SLA Targets
          </span>
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {[
            { priority: 'Urgent', time: '4 hours', color: '#EF4444' },
            { priority: 'High', time: '24 hours', color: '#F59E0B' },
            { priority: 'Medium', time: '48 hours', color: '#3B82F6' },
            { priority: 'Low', time: '7 days', color: '#6B7280' },
          ].map((sla) => (
            <div key={sla.priority} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: sla.color }} />
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-sans)' }}>
                {sla.priority}: {sla.time}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Existing Follow-Up Queue Component */}
      <HumanFollowUpQueue />
    </div>
  );
}
