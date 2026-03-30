/**
 * Phase 10 - Admin Impact Page
 * Onboarding funnel calling admin.getOnboardingFunnel.
 * Mission metrics admin view.
 */
import React from 'react';
import { TrendingUp, Users, UserCheck, Briefcase, MessageSquare, Target, ChevronDown } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.trust-agent.ai';

interface FunnelStep {
  step: string;
  label: string;
  count: number;
  percentage: number;
}

interface FunnelData {
  steps: FunnelStep[];
  period: { days: number; from: string; to: string };
  generatedAt: string;
}

export function AdminImpactPage() {
  const [funnel, setFunnel] = React.useState<FunnelData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [days, setDays] = React.useState(30);

  const token = localStorage.getItem('ta_access_token');
  const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  async function loadFunnel(d: number) {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        input: JSON.stringify({ days: d }),
      });
      const res = await fetch(`${API_BASE}/trpc/admin.getOnboardingFunnel?${params}`, { headers });
      const json = await res.json();
      setFunnel(json.result?.data ?? null);
    } catch {
      setError('Unable to load onboarding funnel data');
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    loadFunnel(days);
  }, [days]);

  const STEP_ICONS: Record<string, React.ElementType> = {
    signup: Users,
    onboarding_complete: UserCheck,
    first_hire: Briefcase,
    first_session: MessageSquare,
    retained_7d: Target,
  };

  const STEP_COLORS: Record<string, string> = {
    signup: 'var(--color-electric-blue)',
    onboarding_complete: '#A78BFA',
    first_hire: '#FFB740',
    first_session: '#00AA78',
    retained_7d: '#67E8F9',
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <TrendingUp size={20} style={{ color: '#67E8F9' }} />
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#E8EDF5', margin: 0, fontFamily: 'var(--font-sans)' }}>
          Impact and Onboarding
        </h1>
      </div>

      {/* Period Selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {[7, 14, 30, 60, 90].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            style={{
              padding: '6px 14px',
              borderRadius: 6,
              border: days === d ? '1px solid rgba(108, 142, 255, 0.5)' : '1px solid rgba(255,255,255,0.1)',
              background: days === d ? 'rgba(108, 142, 255, 0.15)' : 'rgba(255,255,255,0.03)',
              color: days === d ? '#6C8EFF' : 'rgba(255,255,255,0.5)',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
              fontFamily: 'var(--font-sans)',
            }}
          >
            {d} Days
          </button>
        ))}
      </div>

      {error && (
        <div style={{ padding: 12, background: 'rgba(255,0,64,0.1)', borderRadius: 8, color: '#FF6B6B', fontSize: 13, marginBottom: 16, fontFamily: 'var(--font-sans)' }}>
          {error}
        </div>
      )}

      {loading && (
        <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-sans)' }}>
          Loading funnel data...
        </div>
      )}

      {/* Onboarding Funnel */}
      {funnel && !loading && (
        <div style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#E8EDF5', marginBottom: 16, fontFamily: 'var(--font-sans)' }}>
            Onboarding Funnel ({days}-day window)
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {funnel.steps.map((step, i) => {
              const Icon = STEP_ICONS[step.step] || Target;
              const color = STEP_COLORS[step.step] || 'var(--color-electric-blue)';
              const barWidth = step.percentage;
              const dropOff = i > 0
                ? (funnel.steps[i - 1].count - step.count)
                : 0;

              return (
                <React.Fragment key={step.step}>
                  <Card style={{ padding: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Icon size={16} style={{ color }} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#E8EDF5', fontFamily: 'var(--font-sans)' }}>
                          {step.label}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 18, fontWeight: 800, color, fontFamily: 'var(--font-sans)' }}>
                          {step.count.toLocaleString()}
                        </span>
                        <Badge variant={step.percentage >= 50 ? 'success' : step.percentage >= 20 ? 'info' : 'error'}>
                          {step.percentage.toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div
                      style={{
                        height: 6,
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: 3,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${Math.max(barWidth, 2)}%`,
                          background: color,
                          borderRadius: 3,
                          transition: 'width 600ms ease',
                        }}
                      />
                    </div>
                  </Card>

                  {/* Drop-off indicator between steps */}
                  {i < funnel.steps.length - 1 && dropOff > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2px 0' }}>
                      <ChevronDown size={12} style={{ color: 'rgba(255,255,255,0.2)' }} />
                      <span style={{ fontSize: 10, color: '#FF6B6B', fontFamily: 'var(--font-sans)', marginLeft: 4 }}>
                        -{dropOff.toLocaleString()} drop-off
                      </span>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* Mission Metrics */}
      <Card style={{ padding: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#E8EDF5', marginBottom: 12, fontFamily: 'var(--font-sans)', marginTop: 0 }}>
          Mission Metrics
        </h2>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, margin: 0, fontFamily: 'var(--font-sans)' }}>
          The Trust Agent Foundation commits 5% of all revenue to free companion access for
          NHS patients, elderly care homes, and underprivileged students. Every metric here
          represents real human impact - not vanity numbers.
        </p>
        <div style={{ marginTop: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {[
            { label: 'Foundation Goal', value: 'Free access for 10,000 users', color: '#00AA78' },
            { label: 'Revenue Allocation', value: '5% of gross', color: '#FFB740' },
            { label: 'Impact Tracking', value: 'Lives changed, not MAU', color: '#6C8EFF' },
          ].map((item) => (
            <div key={item.label} style={{ flex: '1 1 200px' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-sans)', marginBottom: 2 }}>
                {item.label}
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: item.color, fontFamily: 'var(--font-sans)' }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {funnel && (
        <div style={{ marginTop: 16, fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-sans)' }}>
          Data generated: {new Date(funnel.generatedAt).toLocaleString('en-GB')}
        </div>
      )}
    </div>
  );
}
