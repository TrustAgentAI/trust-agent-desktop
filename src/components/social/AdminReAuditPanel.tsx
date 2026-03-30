import React from 'react';
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Star,
  Users,
  Calendar,
  Wrench,
  ChevronDown,
  Play,
  Ban,
} from 'lucide-react';
import { api } from '@/lib/api';

interface AuditInfo {
  trustScore: number;
  badge: string;
  completedAt: string;
  expiresAt: string;
}

interface Trigger {
  id: string;
  roleId: string;
  roleSlug: string;
  roleName: string;
  companionName: string;
  category: string;
  triggerType: string;
  triggerData: Record<string, unknown>;
  status: string;
  createdAt: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
  currentAudit: AuditInfo | null;
}

interface TriggersResponse {
  triggers: Trigger[];
  total: number;
  page: number;
  pages: number;
}

const TRIGGER_TYPE_CONFIG: Record<
  string,
  { icon: React.ElementType; label: string; color: string; bgColor: string }
> = {
  LOW_RATING: {
    icon: Star,
    label: 'Low Rating',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
  },
  USER_REPORT: {
    icon: Users,
    label: 'User Reports',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
  },
  SCHEDULED: {
    icon: Calendar,
    label: 'Scheduled',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
  },
  ADMIN: {
    icon: Wrench,
    label: 'Admin Triggered',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
  },
};

const STATUS_CONFIG: Record<
  string,
  { icon: React.ElementType; label: string; color: string }
> = {
  PENDING: { icon: Clock, label: 'Pending', color: 'text-amber-400' },
  IN_PROGRESS: { icon: Play, label: 'In Progress', color: 'text-blue-400' },
  COMPLETED: { icon: CheckCircle2, label: 'Completed', color: 'text-emerald-400' },
  DISMISSED: { icon: XCircle, label: 'Dismissed', color: 'text-white/40' },
};

export function AdminReAuditPanel() {
  const [data, setData] = React.useState<TriggersResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<string>('PENDING');
  const [page, setPage] = React.useState(1);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  async function fetchTriggers() {
    setLoading(true);
    try {
      const result = await api.get<TriggersResponse>(
        `/trpc/admin.listReAuditTriggers?input=${encodeURIComponent(
          JSON.stringify({ status: filter || undefined, page, limit: 20 })
        )}`
      );
      setData(result);
    } catch {
      // empty state
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    fetchTriggers();
  }, [filter, page]);

  async function handleApprove(triggerId: string) {
    setActionLoading(triggerId);
    try {
      await api.post('/trpc/admin.approveReAudit', { triggerId });
      fetchTriggers();
    } catch (err) {
      alert((err as Error).message || 'Failed to approve re-audit');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDismiss(triggerId: string) {
    setActionLoading(triggerId);
    try {
      await api.post('/trpc/admin.dismissReAudit', { triggerId });
      fetchTriggers();
    } catch (err) {
      alert((err as Error).message || 'Failed to dismiss re-audit');
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-emerald-400" />
          <div>
            <h2 className="text-xl font-semibold text-white">Quality Drift Prevention</h2>
            <p className="text-sm text-white/40">
              Re-audit triggers for companion roles
            </p>
          </div>
        </div>
        {data && (
          <div className="text-sm text-white/40">
            {data.total} trigger{data.total !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2">
        {['PENDING', 'IN_PROGRESS', 'COMPLETED', 'DISMISSED'].map((s) => {
          const config = STATUS_CONFIG[s];
          const StatusIcon = config.icon;
          return (
            <button
              key={s}
              onClick={() => {
                setFilter(s);
                setPage(1);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                filter === s
                  ? 'bg-white/[0.08] text-white border border-white/[0.15]'
                  : 'bg-white/[0.03] text-white/40 border border-transparent hover:text-white/60'
              }`}
            >
              <StatusIcon className="w-3.5 h-3.5" />
              {config.label}
            </button>
          );
        })}
      </div>

      {/* Triggers list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-white/[0.03] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : data && data.triggers.length > 0 ? (
        <div className="space-y-3">
          {data.triggers.map((trigger) => {
            const typeConfig =
              TRIGGER_TYPE_CONFIG[trigger.triggerType] || TRIGGER_TYPE_CONFIG.ADMIN;
            const statusConfig = STATUS_CONFIG[trigger.status] || STATUS_CONFIG.PENDING;
            const TypeIcon = typeConfig.icon;
            const StatusIcon = statusConfig.icon;
            const isExpanded = expandedId === trigger.id;
            const isLoading = actionLoading === trigger.id;

            return (
              <div
                key={trigger.id}
                className="bg-white/[0.03] border border-white/[0.07] rounded-xl overflow-hidden"
              >
                {/* Main row */}
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : trigger.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${typeConfig.bgColor}`}>
                      <TypeIcon className={`w-4 h-4 ${typeConfig.color}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium text-sm">
                          {trigger.companionName}
                        </span>
                        <span className="text-white/30 text-xs">({trigger.roleSlug})</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-white/40">
                        <span className={typeConfig.color}>{typeConfig.label}</span>
                        <span>-</span>
                        <span>{trigger.category}</span>
                        <span>-</span>
                        <span>{new Date(trigger.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-1 text-xs ${statusConfig.color}`}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      {statusConfig.label}
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-white/30 transition-transform ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="border-t border-white/[0.05] p-4 space-y-4">
                    {/* Trigger data */}
                    <div>
                      <p className="text-xs text-white/40 mb-2 uppercase tracking-wide">
                        Trigger details
                      </p>
                      <div className="bg-white/[0.02] rounded-lg p-3 text-sm text-white/60 font-mono">
                        {Object.entries(trigger.triggerData || {}).map(([key, val]) => (
                          <div key={key} className="flex gap-2">
                            <span className="text-white/30">{key}:</span>
                            <span>{String(val)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Current audit info */}
                    {trigger.currentAudit && (
                      <div>
                        <p className="text-xs text-white/40 mb-2 uppercase tracking-wide">
                          Current audit
                        </p>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-white/60">
                            Trust Score: {trigger.currentAudit.trustScore}
                          </span>
                          <span className="text-white/60">
                            Badge: {trigger.currentAudit.badge}
                          </span>
                          <span className="text-white/60">
                            Last audit:{' '}
                            {new Date(trigger.currentAudit.completedAt).toLocaleDateString()}
                          </span>
                          <span className="text-white/60">
                            Expires:{' '}
                            {new Date(trigger.currentAudit.expiresAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    {trigger.status === 'PENDING' && (
                      <div className="flex items-center gap-3 pt-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApprove(trigger.id);
                          }}
                          disabled={isLoading}
                          className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-sm hover:bg-emerald-500/30 disabled:opacity-50 transition-colors"
                        >
                          <Play className="w-4 h-4" />
                          {isLoading ? 'Processing...' : 'Approve re-audit'}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDismiss(trigger.id);
                          }}
                          disabled={isLoading}
                          className="flex items-center gap-2 px-4 py-2 bg-white/[0.03] text-white/40 border border-white/[0.07] rounded-lg text-sm hover:text-white/60 disabled:opacity-50 transition-colors"
                        >
                          <Ban className="w-4 h-4" />
                          Dismiss
                        </button>
                      </div>
                    )}

                    {/* Resolution info */}
                    {trigger.resolvedAt && (
                      <div className="text-xs text-white/30">
                        Resolved on {new Date(trigger.resolvedAt).toLocaleDateString()}
                        {trigger.resolvedBy ? ` by ${trigger.resolvedBy}` : ''}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Pagination */}
          {data.pages > 1 && (
            <div className="flex justify-center gap-2 pt-2">
              {Array.from({ length: data.pages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-sm ${
                    p === page
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-white/[0.03] text-white/40 hover:text-white/60'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 text-white/30 text-sm">
          <AlertTriangle className="w-8 h-8 mx-auto mb-3 text-white/20" />
          No {filter.toLowerCase().replace('_', ' ')} re-audit triggers
        </div>
      )}
    </div>
  );
}
