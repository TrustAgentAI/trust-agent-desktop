import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  Calendar,
  Crown,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import api from '@/lib/api';

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.trust-agent.ai';

interface Subscription {
  id: string;
  plan: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

const PLAN_DISPLAY: Record<string, { name: string; price: string; color: string }> = {
  STARTER: { name: 'Starter', price: '9.99', color: 'var(--color-electric-blue)' },
  ESSENTIAL: { name: 'Essential', price: '19.99', color: '#A78BFA' },
  FAMILY: { name: 'Family', price: '24.99', color: '#4ADE80' },
  PROFESSIONAL: { name: 'Professional', price: '39.99', color: '#FFB740' },
  FREE: { name: 'Free', price: '0', color: 'var(--color-text-muted)' },
};

const STATUS_DISPLAY: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  ACTIVE: { label: 'Active', color: '#4ADE80', icon: <CheckCircle size={14} /> },
  PAST_DUE: { label: 'Past Due', color: '#FFB740', icon: <AlertTriangle size={14} /> },
  CANCELLED: { label: 'Cancelled', color: 'var(--color-error)', icon: <XCircle size={14} /> },
};

const CANCEL_REASONS = [
  { value: 'too_expensive', label: 'It costs more than I can afford right now' },
  { value: 'not_using_enough', label: "I'm not using it enough" },
  { value: 'found_alternative', label: 'I found something else that works for me' },
  { value: 'technical_issues', label: 'I had technical problems' },
  { value: 'personal_circumstances', label: 'Personal circumstances changed' },
  { value: 'other', label: 'Something else' },
];

export function BillingPage() {
  const navigate = useNavigate();
  const [subscription, setSubscription] = React.useState<Subscription | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Cancellation modal state
  const [showCancel, setShowCancel] = React.useState(false);
  const [cancelReason, setCancelReason] = React.useState('');
  const [cancelFreeText, setCancelFreeText] = React.useState('');
  const [cancelWouldReturn, setCancelWouldReturn] = React.useState<boolean | null>(null);
  const [cancelling, setCancelling] = React.useState(false);
  const [cancelSuccess, setCancelSuccess] = React.useState(false);

  React.useEffect(() => {
    fetchSubscription();
  }, []);

  async function fetchSubscription() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(
        `${API_BASE}/trpc/payments.getSubscription`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('ta_access_token')}`,
          },
        },
      );
      const data = await res.json();
      setSubscription(data.result?.data ?? null);
    } catch {
      setError('Unable to load your subscription. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    if (!cancelReason) return;
    try {
      setCancelling(true);
      await api.post('/trpc/payments.cancelSubscription', {
        json: {
          reason: cancelReason,
          freeText: cancelFreeText || undefined,
          wouldReturn: cancelWouldReturn ?? undefined,
        },
      });
      setCancelSuccess(true);
      // Refresh subscription data
      await fetchSubscription();
    } catch {
      setError('Something went wrong cancelling. Please contact support.');
    } finally {
      setCancelling(false);
    }
  }

  // Loading skeleton
  if (loading) {
    return (
      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        <Skeleton width={200} height={24} style={{ marginBottom: 24 }} />
        <div style={{ display: 'grid', gap: 16 }}>
          <Skeleton height={140} borderRadius="var(--radius-lg)" />
          <Skeleton height={80} borderRadius="var(--radius-lg)" />
          <Skeleton height={80} borderRadius="var(--radius-lg)" />
        </div>
      </div>
    );
  }

  // Error state
  if (error && !subscription) {
    return (
      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        <div
          style={{
            padding: 16,
            background: 'rgba(255,0,64,0.08)',
            border: '1px solid rgba(255,0,64,0.2)',
            borderRadius: 'var(--radius-lg)',
            color: 'var(--color-error)',
            fontSize: 13,
            fontFamily: 'var(--font-sans)',
          }}
        >
          {error}
        </div>
        <Button variant="ghost" size="md" onClick={fetchSubscription} style={{ marginTop: 12 }}>
          Try again
        </Button>
      </div>
    );
  }

  // No subscription
  if (!subscription) {
    return (
      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        <h1 style={headingStyle}>Billing</h1>
        <EmptyState
          icon={<CreditCard size={24} />}
          title="No active subscription"
          description="You are currently on the free plan. Upgrade to unlock more companions and longer sessions."
          ctaText="View Plans"
          ctaAction={() => navigate('/checkout/ESSENTIAL')}
        />
      </div>
    );
  }

  const plan = PLAN_DISPLAY[subscription.plan] || PLAN_DISPLAY.FREE;
  const status = STATUS_DISPLAY[subscription.status] || STATUS_DISPLAY.ACTIVE;
  const renewalDate = new Date(subscription.currentPeriodEnd).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
      <h1 style={headingStyle}>Billing</h1>

      {/* Error banner */}
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
          }}
        >
          {error}
        </div>
      )}

      {/* Current Plan Card */}
      <Card style={{ marginBottom: 16, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Crown size={20} style={{ color: plan.color }} />
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#E8EDF5', fontFamily: 'var(--font-sans)' }}>
                {plan.name} Plan
              </div>
              <div style={{ fontSize: 13, color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)' }}>
                {plan.price !== '0' ? `\u00A3${plan.price}/month` : 'Free tier'}
              </div>
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              borderRadius: 'var(--radius-sm)',
              background: `${status.color}15`,
              color: status.color,
              fontSize: 12,
              fontWeight: 600,
              fontFamily: 'var(--font-sans)',
            }}
          >
            {status.icon}
            {status.label}
          </div>
        </div>

        {/* Renewal info */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 13,
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-sans)',
          }}
        >
          <Calendar size={14} />
          {subscription.cancelAtPeriodEnd
            ? `Access until ${renewalDate} - not renewing`
            : `Renews ${renewalDate}`}
        </div>
      </Card>

      {/* Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
        <Card
          onClick={() => navigate('/checkout/ESSENTIAL')}
          style={{ padding: 16, cursor: 'pointer', textAlign: 'center' }}
        >
          <Crown size={18} style={{ color: 'var(--color-electric-blue)', marginBottom: 8 }} />
          <div style={{ fontSize: 13, fontWeight: 600, color: '#E8EDF5', fontFamily: 'var(--font-sans)' }}>
            Change Plan
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>
            Upgrade or downgrade
          </div>
        </Card>

        <Card
          onClick={() => {
            // Redirect to Stripe billing portal
            window.open('https://billing.stripe.com/p/login/trust-agent', '_blank');
          }}
          style={{ padding: 16, cursor: 'pointer', textAlign: 'center' }}
        >
          <ExternalLink size={18} style={{ color: 'var(--color-electric-blue)', marginBottom: 8 }} />
          <div style={{ fontSize: 13, fontWeight: 600, color: '#E8EDF5', fontFamily: 'var(--font-sans)' }}>
            Payment Method
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>
            Manage via Stripe
          </div>
        </Card>
      </div>

      {/* Cancel section */}
      {subscription.status === 'ACTIVE' && !subscription.cancelAtPeriodEnd && (
        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 20 }}>
          <Button
            variant="ghost"
            size="md"
            onClick={() => setShowCancel(true)}
            style={{ color: 'var(--color-text-muted)', fontSize: 13 }}
          >
            Cancel subscription
          </Button>
        </div>
      )}

      {/* Cancellation Modal */}
      {showCancel && !cancelSuccess && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 24,
          }}
          onClick={() => !cancelling && setShowCancel(false)}
        >
          <div
            style={{
              background: 'var(--color-dark-navy)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: 28,
              maxWidth: 480,
              width: '100%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#E8EDF5', marginBottom: 8, fontFamily: 'var(--font-sans)' }}>
              Cancel your subscription
            </h2>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 20, lineHeight: 1.6, fontFamily: 'var(--font-sans)' }}>
              We are sorry to see you go. Your Brain and all companion memories will be preserved
              forever - if you come back, everything will be exactly as you left it.
            </p>

            {/* Reason selection */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: 8 }}>
                What could we have done better?
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {CANCEL_REASONS.map((r) => (
                  <label
                    key={r.value}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      background: cancelReason === r.value ? 'rgba(30,111,255,0.08)' : 'var(--color-surface-1)',
                      border: `1px solid ${cancelReason === r.value ? 'rgba(30,111,255,0.3)' : 'var(--color-border)'}`,
                      cursor: 'pointer',
                      fontSize: 13,
                      color: '#E8EDF5',
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    <input
                      type="radio"
                      name="cancelReason"
                      value={r.value}
                      checked={cancelReason === r.value}
                      onChange={() => setCancelReason(r.value)}
                      style={{ accentColor: 'var(--color-electric-blue)' }}
                    />
                    {r.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Free text */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>
                Anything else? (optional)
              </label>
              <textarea
                value={cancelFreeText}
                onChange={(e) => setCancelFreeText(e.target.value)}
                maxLength={1000}
                rows={3}
                style={{
                  width: '100%',
                  background: 'var(--color-surface-2)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  color: '#E8EDF5',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 13,
                  padding: '8px 12px',
                  resize: 'vertical',
                  outline: 'none',
                }}
                placeholder="Tell us what we could improve..."
              />
            </div>

            {/* Would return */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: 6 }}>
                Would you consider coming back?
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { val: true, label: 'Maybe' },
                  { val: false, label: 'Probably not' },
                ].map((opt) => (
                  <button
                    key={String(opt.val)}
                    onClick={() => setCancelWouldReturn(opt.val)}
                    style={{
                      padding: '6px 16px',
                      borderRadius: 'var(--radius-md)',
                      border: `1px solid ${cancelWouldReturn === opt.val ? 'rgba(30,111,255,0.3)' : 'var(--color-border)'}`,
                      background: cancelWouldReturn === opt.val ? 'rgba(30,111,255,0.08)' : 'transparent',
                      color: '#E8EDF5',
                      fontSize: 13,
                      cursor: 'pointer',
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Equal-weight buttons */}
            <div style={{ display: 'flex', gap: 12 }}>
              <Button
                variant="secondary"
                size="md"
                onClick={() => setShowCancel(false)}
                disabled={cancelling}
                style={{ flex: 1 }}
              >
                Keep subscription
              </Button>
              <Button
                variant="danger"
                size="md"
                onClick={handleCancel}
                loading={cancelling}
                disabled={!cancelReason || cancelling}
                style={{ flex: 1 }}
              >
                Confirm cancellation
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel success */}
      {cancelSuccess && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 24,
          }}
          onClick={() => {
            setCancelSuccess(false);
            setShowCancel(false);
          }}
        >
          <div
            style={{
              background: 'var(--color-dark-navy)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: 28,
              maxWidth: 420,
              width: '100%',
              textAlign: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <CheckCircle size={32} style={{ color: '#4ADE80', marginBottom: 12 }} />
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#E8EDF5', marginBottom: 8, fontFamily: 'var(--font-sans)' }}>
              Subscription cancelled
            </h2>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.6, marginBottom: 20, fontFamily: 'var(--font-sans)' }}>
              Your access continues until {renewalDate}. Your Brain, memory notes, and everything
              your companions know about you is preserved. If you come back, everything will be
              exactly as you left it.
            </p>
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                setCancelSuccess(false);
                setShowCancel(false);
              }}
            >
              Got it
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

const headingStyle: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 800,
  color: '#E8EDF5',
  fontFamily: 'var(--font-sans)',
  marginBottom: 24,
};
