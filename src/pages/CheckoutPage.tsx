import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Crown, Check, ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';

type PlanKey = 'STARTER' | 'ESSENTIAL' | 'FAMILY' | 'PROFESSIONAL';

interface PlanInfo {
  key: PlanKey;
  name: string;
  price: string;
  period: string;
  comparison: string;
  color: string;
  features: string[];
  highlight?: boolean;
}

const PLANS: PlanInfo[] = [
  {
    key: 'STARTER',
    name: 'Starter',
    price: '9.99',
    period: '/month',
    comparison: 'Less than a coffee a week',
    color: 'var(--color-electric-blue)',
    features: [
      '1 companion',
      '10 sessions per month',
      'Brain memory',
      'Progress tracking',
    ],
  },
  {
    key: 'ESSENTIAL',
    name: 'Essential',
    price: '19.99',
    period: '/month',
    comparison: 'Less than one tutoring session',
    color: '#A78BFA',
    highlight: true,
    features: [
      '3 companions',
      'Unlimited sessions',
      'Brain memory with notes',
      'Progress sharing',
      'Spaced repetition',
      'Study groups',
    ],
  },
  {
    key: 'FAMILY',
    name: 'Family',
    price: '24.99',
    period: '/month',
    comparison: 'Cover the whole family',
    color: '#4ADE80',
    features: [
      'Up to 5 family members',
      'Guardian dashboard',
      'All Essential features',
      'Family progress view',
      'Safeguarding controls',
    ],
  },
  {
    key: 'PROFESSIONAL',
    name: 'Professional',
    price: '39.99',
    period: '/month',
    comparison: 'A fraction of a coaching session',
    color: '#FFB740',
    features: [
      'Unlimited companions',
      'Unlimited sessions',
      'Priority support',
      'API access',
      'Custom integrations',
      'Advanced analytics',
    ],
  },
];

export function CheckoutPage() {
  const { plan } = useParams<{ plan: string }>();
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = React.useState<PlanKey>(
    (plan?.toUpperCase() as PlanKey) || 'ESSENTIAL',
  );
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleCheckout() {
    try {
      setLoading(true);
      setError(null);
      const result = await api.post<{ result: { data: { url: string } } }>(
        '/trpc/payments.createCheckout',
        {
          json: {
            plan: selectedPlan,
            successUrl: `${window.location.origin}/checkout/success`,
            cancelUrl: `${window.location.origin}/checkout/${selectedPlan}`,
          },
        },
      );
      // Redirect to Stripe Checkout
      const url = (result as any).result?.data?.url ?? (result as any).url;
      if (url) {
        window.location.href = url;
      } else {
        setError('Could not create checkout session. Please try again.');
      }
    } catch {
      setError('Something went wrong. Please try again or contact support.');
    } finally {
      setLoading(false);
    }
  }

  const activePlan = PLANS.find((p) => p.key === selectedPlan) || PLANS[1];

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--color-text-muted)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 13,
          fontFamily: 'var(--font-sans)',
          marginBottom: 20,
          padding: 0,
        }}
      >
        <ArrowLeft size={16} />
        Back
      </button>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <Crown size={28} style={{ color: 'var(--color-electric-blue)', marginBottom: 12 }} />
        <h1
          style={{
            fontSize: 24,
            fontWeight: 800,
            color: '#E8EDF5',
            fontFamily: 'var(--font-sans)',
            marginBottom: 8,
          }}
        >
          Choose your plan
        </h1>
        <p
          style={{
            fontSize: 14,
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-sans)',
            maxWidth: 400,
            margin: '0 auto',
          }}
        >
          Everyone deserves an expert who knows them. Pick the plan that fits your life.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            padding: 12,
            background: 'rgba(255,0,64,0.08)',
            border: '1px solid rgba(255,0,64,0.2)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-error)',
            fontSize: 13,
            fontFamily: 'var(--font-sans)',
            marginBottom: 16,
            textAlign: 'center',
          }}
        >
          {error}
        </div>
      )}

      {/* Plan Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 12,
          marginBottom: 32,
        }}
      >
        {PLANS.map((p) => (
          <Card
            key={p.key}
            onClick={() => setSelectedPlan(p.key)}
            style={{
              padding: 20,
              cursor: 'pointer',
              border: selectedPlan === p.key
                ? `2px solid ${p.color}`
                : '1px solid var(--color-border)',
              position: 'relative',
            }}
          >
            {p.highlight && (
              <div
                style={{
                  position: 'absolute',
                  top: -1,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: p.color,
                  color: '#fff',
                  fontSize: 9,
                  fontWeight: 700,
                  padding: '2px 12px',
                  borderRadius: '0 0 6px 6px',
                  fontFamily: 'var(--font-sans)',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                Most popular
              </div>
            )}

            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: '#E8EDF5',
                fontFamily: 'var(--font-sans)',
                marginBottom: 4,
              }}
            >
              {p.name}
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, marginBottom: 4 }}>
              <span style={{ fontSize: 28, fontWeight: 800, color: p.color, fontFamily: 'var(--font-sans)' }}>
                {'\u00A3'}{p.price}
              </span>
              <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{p.period}</span>
            </div>

            <div
              style={{
                fontSize: 11,
                color: 'var(--color-text-muted)',
                fontFamily: 'var(--font-sans)',
                marginBottom: 12,
                fontStyle: 'italic',
              }}
            >
              {p.comparison}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {p.features.map((f) => (
                <div
                  key={f}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 12,
                    color: 'rgba(255,255,255,0.7)',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  <Check size={12} style={{ color: p.color, flexShrink: 0 }} />
                  {f}
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {/* CTA */}
      <div style={{ textAlign: 'center', maxWidth: 400, margin: '0 auto' }}>
        <Button
          variant="primary"
          size="lg"
          onClick={handleCheckout}
          loading={loading}
          disabled={loading}
          style={{
            width: '100%',
            background: activePlan.color,
            fontSize: 15,
            fontWeight: 700,
            padding: '14px 24px',
          }}
        >
          {loading ? 'Redirecting to checkout...' : `Subscribe to ${activePlan.name} - \u00A3${activePlan.price}/mo`}
        </Button>
        <p
          style={{
            fontSize: 11,
            color: 'var(--color-text-muted)',
            marginTop: 12,
            fontFamily: 'var(--font-sans)',
          }}
        >
          Cancel anytime. No dark patterns. Your data is always yours.
        </p>
      </div>
    </div>
  );
}
