import React from 'react';
import { Shield, AlertTriangle, CheckCircle, Download, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '@/lib/api';

interface SafeguardingEvent {
  id: string;
  userId: string;
  sessionId: string | null;
  eventType: string;
  severity: string;
  details: string | null;
  resolved: boolean;
  resolvedAt: string | null;
  createdAt: string;
}

interface SafeguardingSummary {
  totalEvents: number;
  unresolvedCount: number;
  bySeverity: Array<{ severity: string; count: number }>;
  byType: Array<{ eventType: string; count: number }>;
  periodDays: number;
}

interface EventsResponse {
  result: {
    data: {
      events: SafeguardingEvent[];
      total: number;
      page: number;
      totalPages: number;
    };
  };
}

interface SummaryResponse {
  result: {
    data: SafeguardingSummary;
  };
}

const SEVERITY_COLORS: Record<string, string> = {
  low: '#6C757D',
  medium: '#FFB740',
  high: '#FF6B6B',
  critical: '#FF0040',
};

const SEVERITY_BG: Record<string, string> = {
  low: 'rgba(108, 117, 125, 0.15)',
  medium: 'rgba(255, 183, 64, 0.15)',
  high: 'rgba(255, 107, 107, 0.15)',
  critical: 'rgba(255, 0, 64, 0.15)',
};

export function SafeguardingDashboardPage() {
  const [events, setEvents] = React.useState<SafeguardingEvent[]>([]);
  const [summary, setSummary] = React.useState<SafeguardingSummary | null>(null);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [severityFilter, setSeverityFilter] = React.useState<string>('');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const adminKey = React.useMemo(() => localStorage.getItem('ta_admin_key') || '', []);

  const fetchEvents = React.useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        'input': JSON.stringify({
          page,
          limit: 20,
          ...(severityFilter ? { severity: severityFilter } : {}),
        }),
      });

      const res = await fetch(
        `${import.meta.env.VITE_API_URL || 'https://api.trust-agent.ai'}/trpc/safeguarding.listEvents?${params}`,
        {
          headers: {
            'x-admin-api-key': adminKey,
          },
        },
      );
      const data: EventsResponse = await res.json();
      setEvents(data.result.data.events);
      setTotalPages(data.result.data.totalPages);
    } catch (err) {
      setError('Failed to load safeguarding events');
    } finally {
      setLoading(false);
    }
  }, [page, severityFilter, adminKey]);

  const fetchSummary = React.useCallback(async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || 'https://api.trust-agent.ai'}/trpc/safeguarding.summary`,
        {
          headers: {
            'x-admin-api-key': adminKey,
          },
        },
      );
      const data: SummaryResponse = await res.json();
      setSummary(data.result.data);
    } catch {
      // Summary is non-critical
    }
  }, [adminKey]);

  React.useEffect(() => {
    fetchEvents();
    fetchSummary();
  }, [fetchEvents, fetchSummary]);

  const handleResolve = async (eventId: string) => {
    try {
      await fetch(
        `${import.meta.env.VITE_API_URL || 'https://api.trust-agent.ai'}/trpc/safeguarding.resolveEvent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-api-key': adminKey,
          },
          body: JSON.stringify({ eventId }),
        },
      );
      fetchEvents();
      fetchSummary();
    } catch {
      // Silently handle
    }
  };

  const handleExport = async () => {
    const now = new Date();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);

    try {
      const params = new URLSearchParams({
        'input': JSON.stringify({
          dateFrom: thirtyDaysAgo.toISOString(),
          dateTo: now.toISOString(),
          ...(severityFilter ? { severity: severityFilter } : {}),
        }),
      });

      const res = await fetch(
        `${import.meta.env.VITE_API_URL || 'https://api.trust-agent.ai'}/trpc/safeguarding.exportEvents?${params}`,
        {
          headers: {
            'x-admin-api-key': adminKey,
          },
        },
      );
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data.result.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `safeguarding-export-${now.toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Export failed');
    }
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Shield size={24} style={{ color: '#FF6B6B' }} />
        <h1
          style={{
            fontSize: 20,
            fontWeight: 800,
            fontFamily: 'var(--font-sans)',
            color: '#E8EDF5',
            margin: 0,
          }}
        >
          Safeguarding Dashboard
        </h1>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
          <SummaryCard
            label="Total Events"
            value={summary.totalEvents}
            color="#6C8EFF"
          />
          <SummaryCard
            label="Unresolved"
            value={summary.unresolvedCount}
            color="#FF6B6B"
          />
          {summary.bySeverity.map((s) => (
            <SummaryCard
              key={s.severity}
              label={s.severity.charAt(0).toUpperCase() + s.severity.slice(1)}
              value={s.count}
              color={SEVERITY_COLORS[s.severity] || '#6C757D'}
            />
          ))}
        </div>
      )}

      {/* Filters and Export */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
        <Filter size={16} style={{ color: 'rgba(255,255,255,0.5)' }} />
        <select
          value={severityFilter}
          onChange={(e) => { setSeverityFilter(e.target.value); setPage(1); }}
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 6,
            padding: '6px 12px',
            color: '#E8EDF5',
            fontSize: 13,
            fontFamily: 'var(--font-sans)',
          }}
        >
          <option value="">All Severities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>

        <button
          onClick={handleExport}
          style={{
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 14px',
            background: 'rgba(108, 142, 255, 0.15)',
            border: '1px solid rgba(108, 142, 255, 0.3)',
            borderRadius: 6,
            color: '#6C8EFF',
            cursor: 'pointer',
            fontSize: 13,
            fontFamily: 'var(--font-sans)',
          }}
        >
          <Download size={14} />
          Export
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: 12, background: 'rgba(255,0,64,0.1)', borderRadius: 8, marginBottom: 16, color: '#FF6B6B', fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* Events Table */}
      <div
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
            Loading safeguarding events...
          </div>
        ) : events.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
            No safeguarding events found
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                {['Time', 'Type', 'Severity', 'Details', 'Status', 'Action'].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '10px 14px',
                      textAlign: 'left',
                      fontSize: 11,
                      fontWeight: 600,
                      color: 'rgba(255,255,255,0.5)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr
                  key={event.id}
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                >
                  <td style={{ padding: '10px 14px', fontSize: 13, color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-sans)' }}>
                    {new Date(event.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: 13, color: '#E8EDF5', fontFamily: 'var(--font-mono, monospace)', fontWeight: 500 }}>
                    {event.eventType}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 600,
                        color: SEVERITY_COLORS[event.severity] || '#6C757D',
                        background: SEVERITY_BG[event.severity] || 'rgba(108,117,125,0.15)',
                        fontFamily: 'var(--font-sans)',
                      }}
                    >
                      {event.severity.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: 12, color: 'rgba(255,255,255,0.6)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-sans)' }}>
                    {event.details || '-'}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    {event.resolved ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#4ADE80' }}>
                        <CheckCircle size={14} /> Resolved
                      </span>
                    ) : (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#FFB740' }}>
                        <AlertTriangle size={14} /> Open
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    {!event.resolved && (
                      <button
                        onClick={() => handleResolve(event.id)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: 4,
                          border: '1px solid rgba(74, 222, 128, 0.3)',
                          background: 'rgba(74, 222, 128, 0.1)',
                          color: '#4ADE80',
                          fontSize: 12,
                          cursor: 'pointer',
                          fontFamily: 'var(--font-sans)',
                        }}
                      >
                        Resolve
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 16 }}>
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            style={{
              padding: '6px 10px',
              borderRadius: 6,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.03)',
              color: page <= 1 ? 'rgba(255,255,255,0.2)' : '#E8EDF5',
              cursor: page <= 1 ? 'not-allowed' : 'pointer',
            }}
          >
            <ChevronLeft size={16} />
          </button>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-sans)' }}>
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            style={{
              padding: '6px 10px',
              borderRadius: 6,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.03)',
              color: page >= totalPages ? 'rgba(255,255,255,0.2)' : '#E8EDF5',
              cursor: page >= totalPages ? 'not-allowed' : 'pointer',
            }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 10,
        padding: '16px 20px',
      }}
    >
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 6, fontFamily: 'var(--font-sans)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color, fontFamily: 'var(--font-sans)' }}>
        {value.toLocaleString()}
      </div>
    </div>
  );
}
