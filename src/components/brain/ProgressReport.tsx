/**
 * ProgressReport - UI panel for generating and sharing progress reports.
 * Displays a preview of report data and offers Download PDF / Share actions.
 */
import React, { useMemo, useState, useEffect } from 'react';
import {
  Download,
  Share2,
  FileText,
  Clock,
  Flame,
  Trophy,
  Check,
  BookOpen,
  Languages,
  Heart,
  Briefcase,
  Loader2,
  BarChart3,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { api } from '@/lib/api';
import type { BrainSummary } from '@/components/brain/BrainViewer';
import {
  printReport,
  copyReportSummary,
  type ProgressReportData,
} from '@/lib/progress-report';

interface ProgressReportProps {
  roleId: string;
  roleName: string;
  companionName?: string;
  roleCategory?: 'education' | 'language' | 'health' | 'career' | 'general';
  brain: BrainSummary;
  accentColor?: string;
  /** Optional category-specific data */
  education?: ProgressReportData['education'];
  language?: ProgressReportData['language'];
  health?: ProgressReportData['health'];
  career?: ProgressReportData['career'];
}

function formatMinutes(mins: number): string {
  const hours = Math.floor(mins / 60);
  const remaining = Math.round(mins % 60);
  if (hours === 0) return `${remaining}m`;
  if (remaining === 0) return `${hours}h`;
  return `${hours}h ${remaining}m`;
}

export function ProgressReport({
  roleId,
  roleName,
  companionName,
  roleCategory = 'general',
  brain,
  accentColor,
  education,
  language,
  health,
  career,
}: ProgressReportProps) {
  const accent = accentColor || 'var(--color-electric-blue)';
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [loadingMilestones, setLoadingMilestones] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hireData] = useState<{ totalSessions: number; totalMinutes: number; streakDays: number; longestStreakDays: number } | null>(null);
  const [milestonesList, setMilestonesList] = useState<{ id: string; type: 'session' | 'streak' | 'time'; label: string; achievedAt: number; roleId?: string; roleName?: string }[]>([]);

  // Fetch real data from API on mount
  useEffect(() => {
    async function loadData() {
      setLoadingMilestones(true);
      setLoadError(null);
      try {
        const milestonesRes = await api.post<Record<string, unknown>>('/api/trpc/milestones.getMilestones', { json: { hireId: roleId } });
        const mData = (milestonesRes as Record<string, unknown>)?.result
          ? ((milestonesRes as Record<string, unknown>).result as Record<string, unknown>)?.data
          : milestonesRes;
        const mArray = Array.isArray(mData) ? mData : [];
        // Map API milestone types to the local Milestone type union
        const mapped = mArray.map((m: Record<string, unknown>) => {
          const typeStr = ((m.type as string) || '').toLowerCase();
          let mappedType: 'session' | 'streak' | 'time' = 'session';
          if (typeStr.includes('streak')) mappedType = 'streak';
          else if (typeStr.includes('time')) mappedType = 'time';
          return { ...m, type: mappedType, achievedAt: new Date(m.achievedAt as string).getTime() } as { id: string; type: 'session' | 'streak' | 'time'; label: string; achievedAt: number; roleId?: string; roleName?: string };
        });
        setMilestonesList(mapped);
      } catch {
        setLoadError('Unable to load progress data. Please try again later.');
      } finally {
        setLoadingMilestones(false);
      }
    }
    loadData();
  }, [roleId]);

  const totalSessions = hireData?.totalSessions ?? 0;
  const totalMinutes = hireData?.totalMinutes ?? 0;
  const roleMilestones = milestonesList;
  const currentStreak = hireData?.streakDays ?? 0;
  const longestStreak = hireData?.longestStreakDays ?? 0;

  const dateRange = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const fmt = (d: Date) =>
      d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${fmt(thirtyDaysAgo)} - ${fmt(now)}`;
  }, []);

  const reportData: ProgressReportData = useMemo(
    () => ({
      roleName,
      companionName,
      roleCategory,
      dateRange,
      brain,
      stats: {
        totalSessions,
        totalMinutes,
        currentStreak,
        longestStreak,
      },
      milestones: roleMilestones,
      accentColor: accent,
      education,
      language,
      health,
      career,
    }),
    [
      roleName,
      companionName,
      roleCategory,
      dateRange,
      brain,
      totalSessions,
      totalMinutes,
      currentStreak,
      longestStreak,
      roleMilestones,
      accent,
      education,
      language,
      health,
      career,
    ],
  );

  const handleDownload = async () => {
    setGenerating(true);
    try {
      const result = await api.post<any>('/api/trpc/reports.generateProgressReport', {
        json: { hireId: roleId, reportType: 'weekly' },
      });
      const data = result?.result?.data ?? result;
      if (data?.reportUrl) {
        window.open(data.reportUrl, '_blank');
      }
    } catch {
      // Fallback to local print
      printReport(reportData);
    } finally {
      setGenerating(false);
    }
  };

  const handleShare = async () => {
    const success = await copyReportSummary(reportData);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const categoryIcon =
    roleCategory === 'education' ? <BookOpen size={14} /> :
    roleCategory === 'language' ? <Languages size={14} /> :
    roleCategory === 'health' ? <Heart size={14} /> :
    roleCategory === 'career' ? <Briefcase size={14} /> :
    <FileText size={14} />;

  // Phase 13: Loading state
  if (loadingMilestones) {
    return (
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ width: '50%', height: 20, borderRadius: 4, background: 'var(--color-surface-2)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent 0%, rgba(30,111,255,0.06) 50%, transparent 100%)', animation: 'shimmer 1.5s ease-in-out infinite' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: 60, borderRadius: 'var(--radius-lg)', background: 'var(--color-surface-2)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent 0%, rgba(30,111,255,0.06) 50%, transparent 100%)', animation: 'shimmer 1.5s ease-in-out infinite' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Phase 13: Error state
  if (loadError) {
    return (
      <div style={{ padding: 16, textAlign: 'center' }}>
        <BarChart3 size={32} style={{ color: 'var(--color-error)', opacity: 0.5, marginBottom: 12 }} />
        <div style={{ fontSize: 14, color: 'var(--color-error)', fontFamily: 'var(--font-sans)' }}>
          {loadError}
        </div>
      </div>
    );
  }

  // Phase 13: Empty state when no sessions completed yet
  if (totalSessions < 3 && roleMilestones.length === 0) {
    return (
      <div style={{ padding: 16 }}>
        <EmptyState
          icon={<BarChart3 size={24} />}
          title="Progress reports unlock after 3 sessions"
          description="Complete 3 sessions to see your first progress report. Your companion tracks topics, strengths, and areas for growth automatically."
        />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-md)',
              background: `color-mix(in srgb, ${accent} 15%, transparent)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: accent,
            }}
          >
            <FileText size={16} />
          </div>
          <div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: '#E8EDF5',
                fontFamily: 'var(--font-sans)',
              }}
            >
              Progress Report
            </div>
            <div
              style={{
                fontSize: 11,
                color: 'var(--color-text-muted)',
                fontFamily: 'var(--font-sans)',
              }}
            >
              {dateRange}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <Button
            variant="secondary"
            size="sm"
            icon={copied ? <Check size={12} /> : <Share2 size={12} />}
            onClick={handleShare}
          >
            {copied ? 'Copied' : 'Share'}
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={generating ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={12} />}
            onClick={handleDownload}
            disabled={generating}
          >
            {generating ? 'Generating...' : 'Download PDF'}
          </Button>
        </div>
      </div>

      {/* Role info */}
      <Card padding="12px">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 'var(--radius-sm)',
              background: `color-mix(in srgb, ${accent} 12%, transparent)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: accent,
            }}
          >
            {categoryIcon}
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: '#E8EDF5',
                fontFamily: 'var(--font-sans)',
              }}
            >
              {companionName || roleName}
            </div>
            {companionName && (
              <div
                style={{
                  fontSize: 10,
                  color: 'var(--color-text-muted)',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                {roleName}
              </div>
            )}
          </div>
          <Badge variant="info" size="md">
            {roleCategory}
          </Badge>
        </div>
      </Card>

      {/* Stats grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 8,
        }}
      >
        <StatCard
          icon={<FileText size={14} />}
          label="Sessions"
          value={totalSessions.toString()}
          accent={accent}
        />
        <StatCard
          icon={<Clock size={14} />}
          label="Total Time"
          value={formatMinutes(totalMinutes)}
          accent={accent}
        />
        <StatCard
          icon={<Flame size={14} />}
          label="Streak"
          value={`${currentStreak} days`}
          accent="#F59E0B"
        />
        <StatCard
          icon={<Trophy size={14} />}
          label="Milestones"
          value={milestonesList.length.toString()}
          accent="var(--color-ion-cyan)"
        />
      </div>

      {/* Progress bar */}
      {brain.progressPercent !== undefined && (
        <Card padding="12px">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 6,
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--color-text-muted)',
                fontFamily: 'var(--font-sans)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Overall Progress
            </span>
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: accent,
                fontFamily: 'var(--font-mono)',
              }}
            >
              {brain.progressPercent}%
            </span>
          </div>
          <div
            style={{
              height: 4,
              borderRadius: 2,
              background: 'var(--color-surface-2)',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${brain.progressPercent}%`,
                background: accent,
                borderRadius: 2,
                transition: 'width 300ms ease',
              }}
            />
          </div>
        </Card>
      )}

      {/* Category-specific previews */}
      {roleCategory === 'education' && brain.examReadinessScore !== undefined && (
        <Card padding="12px">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--color-text-muted)',
                fontFamily: 'var(--font-sans)',
              }}
            >
              Exam Readiness
            </span>
            <Badge variant="trust" value={brain.examReadinessScore} />
          </div>
        </Card>
      )}

      {roleCategory === 'language' && brain.cefrLevel && (
        <Card padding="12px">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--color-text-muted)',
                fontFamily: 'var(--font-sans)',
              }}
            >
              Language Level
            </span>
            <Badge variant="info" size="md">
              {brain.cefrLevel}
            </Badge>
          </div>
        </Card>
      )}

      {/* Footer */}
      <div
        style={{
          fontSize: 10,
          color: 'var(--color-text-muted)',
          textAlign: 'center',
          fontFamily: 'var(--font-sans)',
          opacity: 0.6,
          marginTop: 4,
        }}
      >
        Download PDF for the full detailed report
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <Card padding="10px">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 'var(--radius-sm)',
            background: `color-mix(in srgb, ${accent} 12%, transparent)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: accent,
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: '#E8EDF5',
              fontFamily: 'var(--font-mono)',
              lineHeight: 1,
            }}
          >
            {value}
          </div>
          <div
            style={{
              fontSize: 9,
              color: 'var(--color-text-muted)',
              fontFamily: 'var(--font-sans)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            {label}
          </div>
        </div>
      </div>
    </Card>
  );
}

export default ProgressReport;
