import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PartyPopper, Sparkles, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.trust-agent.ai';

interface Subscription {
  plan: string;
  status: string;
  currentPeriodEnd: string;
}

interface HiredRole {
  id: string;
  roleId: string;
  roleName: string;
  companionName: string;
  companionEmoji: string;
  status: string;
}

const PLAN_NAMES: Record<string, string> = {
  STARTER: 'Starter',
  ESSENTIAL: 'Essential',
  FAMILY: 'Family',
  PROFESSIONAL: 'Professional',
};

export function CheckoutSuccessPage() {
  const navigate = useNavigate();
  const [subscription, setSubscription] = React.useState<Subscription | null>(null);
  const [hires, setHires] = React.useState<HiredRole[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function load() {
      try {
        const token = localStorage.getItem('ta_access_token');
        const headers: Record<string, string> = token
          ? { Authorization: `Bearer ${token}` }
          : {};

        const [subRes, hiresRes] = await Promise.all([
          fetch(`${API_BASE}/trpc/payments.getSubscription`, { headers }),
          fetch(`${API_BASE}/trpc/hires.getMyHires`, { headers }),
        ]);

        const subData = await subRes.json();
        const hiresData = await hiresRes.json();

        setSubscription(subData.result?.data ?? null);
        setHires(hiresData.result?.data ?? []);
      } catch {
        // Non-critical - page still shows success
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const latestHire = hires.find((h) => h.status === 'ACTIVE') || hires[0];
  const planName = subscription ? (PLAN_NAMES[subscription.plan] || subscription.plan) : '';

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <Skeleton width={48} height={48} borderRadius="50%" style={{ margin: '0 auto 16px' }} />
          <Skeleton width={250} height={24} style={{ margin: '0 auto 12px' }} />
          <Skeleton width={300} height={14} style={{ margin: '0 auto' }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        {/* Celebration icon */}
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'rgba(74,222,128,0.12)',
            border: '1px solid rgba(74,222,128,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
          }}
        >
          <PartyPopper size={28} style={{ color: '#4ADE80' }} />
        </div>

        <h1
          style={{
            fontSize: 26,
            fontWeight: 800,
            color: '#E8EDF5',
            fontFamily: 'var(--font-sans)',
            marginBottom: 8,
          }}
        >
          Welcome to Trust Agent
        </h1>

        {planName && (
          <p
            style={{
              fontSize: 14,
              color: 'var(--color-text-muted)',
              fontFamily: 'var(--font-sans)',
              marginBottom: 24,
            }}
          >
            Your {planName} plan is now active. You are all set.
          </p>
        )}

        {/* Show companion they just hired */}
        {latestHire && (
          <Card style={{ padding: 20, marginBottom: 24, textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(30,111,255,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                  flexShrink: 0,
                }}
              >
                {latestHire.companionEmoji || <Sparkles size={20} style={{ color: 'var(--color-electric-blue)' }} />}
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#E8EDF5', fontFamily: 'var(--font-sans)' }}>
                  {latestHire.companionName || latestHire.roleName}
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)', marginTop: 2 }}>
                  Your companion is ready and waiting
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* What happens next */}
        <Card style={{ padding: 16, marginBottom: 24, textAlign: 'left' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 10, fontFamily: 'var(--font-sans)' }}>
            What happens next
          </div>
          {[
            'Your companion starts learning about you from session one',
            'The Brain builds a living memory of your progress',
            'Share milestones with friends and family',
          ].map((item, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                marginBottom: i < 2 ? 10 : 0,
                fontSize: 13,
                color: 'rgba(255,255,255,0.7)',
                fontFamily: 'var(--font-sans)',
                lineHeight: 1.5,
              }}
            >
              <Sparkles size={14} style={{ color: '#A78BFA', flexShrink: 0, marginTop: 3 }} />
              {item}
            </div>
          ))}
        </Card>

        {/* CTA */}
        <Button
          variant="primary"
          size="lg"
          icon={<ArrowRight size={16} />}
          onClick={() => navigate('/')}
          style={{ width: '100%', fontSize: 15, fontWeight: 700, padding: '14px 24px' }}
        >
          Start your first session
        </Button>

        <button
          onClick={() => navigate('/settings/billing')}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-text-muted)',
            fontSize: 12,
            fontFamily: 'var(--font-sans)',
            cursor: 'pointer',
            marginTop: 12,
            display: 'block',
            margin: '12px auto 0',
          }}
        >
          View billing details
        </button>
      </div>
    </div>
  );
}
