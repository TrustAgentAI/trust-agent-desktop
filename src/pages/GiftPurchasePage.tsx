import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Gift, ArrowLeft, Mail, MessageSquare, Crown } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import api from '@/lib/api';

type GiftPlan = 'STARTER' | 'ESSENTIAL' | 'FAMILY' | 'PROFESSIONAL';

interface PlanOption {
  key: GiftPlan;
  name: string;
  pricePerMonth: number;
  color: string;
}

const PLAN_OPTIONS: PlanOption[] = [
  { key: 'STARTER', name: 'Starter', pricePerMonth: 999, color: 'var(--color-electric-blue)' },
  { key: 'ESSENTIAL', name: 'Essential', pricePerMonth: 1999, color: '#A78BFA' },
  { key: 'FAMILY', name: 'Family', pricePerMonth: 2499, color: '#4ADE80' },
  { key: 'PROFESSIONAL', name: 'Professional', pricePerMonth: 3999, color: '#FFB740' },
];

const MONTH_OPTIONS = [1, 3, 6, 12];

export function GiftPurchasePage() {
  const navigate = useNavigate();
  const [recipientEmail, setRecipientEmail] = React.useState('');
  const [selectedPlan, setSelectedPlan] = React.useState<GiftPlan>('ESSENTIAL');
  const [months, setMonths] = React.useState(3);
  const [message, setMessage] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<{ activationCode: string; totalAmount: number } | null>(null);

  const selectedPlanInfo = PLAN_OPTIONS.find((p) => p.key === selectedPlan) || PLAN_OPTIONS[1];
  const totalPence = selectedPlanInfo.pricePerMonth * months;
  const totalDisplay = (totalPence / 100).toFixed(2);

  async function handlePurchase() {
    if (!recipientEmail) {
      setError('Please enter the recipient email address.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await api.post<any>('/trpc/gifts.purchaseGift', {
        json: {
          recipientEmail,
          plan: selectedPlan,
          months,
          message: message || undefined,
          successUrl: `${window.location.origin}/gift`,
          cancelUrl: `${window.location.origin}/gift`,
        },
      });
      const data = result.result?.data ?? result;
      setSuccess({
        activationCode: data.activationCode,
        totalAmount: data.totalAmount,
      });
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // Success state
  if (success) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 440 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'rgba(167,139,250,0.12)',
              border: '1px solid rgba(167,139,250,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}
          >
            <Gift size={28} style={{ color: '#A78BFA' }} />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#E8EDF5', fontFamily: 'var(--font-sans)', marginBottom: 8 }}>
            Gift purchased!
          </h1>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)', marginBottom: 20, lineHeight: 1.6 }}>
            An email has been sent to {recipientEmail} with their activation code. You can also share
            the code below directly.
          </p>

          <Card style={{ padding: 20, marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 6, fontFamily: 'var(--font-sans)' }}>
              Activation Code
            </div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: '#A78BFA',
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.05em',
                marginBottom: 8,
              }}
            >
              {success.activationCode}
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(success.activationCode);
              }}
            >
              Copy code
            </Button>
          </Card>

          <div style={{ display: 'flex', gap: 12 }}>
            <Button variant="secondary" size="md" onClick={() => navigate('/')} style={{ flex: 1 }}>
              Go to dashboard
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                setSuccess(null);
                setRecipientEmail('');
                setMessage('');
              }}
              style={{ flex: 1 }}
            >
              Send another gift
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
      {/* Back */}
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
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <Gift size={28} style={{ color: '#A78BFA', marginBottom: 12 }} />
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#E8EDF5', fontFamily: 'var(--font-sans)', marginBottom: 8 }}>
          Gift a subscription
        </h1>
        <p style={{ fontSize: 14, color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)', maxWidth: 400, margin: '0 auto' }}>
          Give someone an expert who knows them. The perfect gift for learners, students, and anyone
          who deserves guidance.
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
          }}
        >
          {error}
        </div>
      )}

      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        {/* Recipient email */}
        <div style={{ marginBottom: 16 }}>
          <Input
            label="Recipient email"
            type="email"
            placeholder="friend@example.com"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            icon={<Mail size={14} />}
          />
        </div>

        {/* Plan selection */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: 6 }}>
            Plan
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {PLAN_OPTIONS.map((p) => (
              <Card
                key={p.key}
                onClick={() => setSelectedPlan(p.key)}
                style={{
                  padding: 12,
                  cursor: 'pointer',
                  textAlign: 'center',
                  border: selectedPlan === p.key
                    ? `2px solid ${p.color}`
                    : '1px solid var(--color-border)',
                }}
              >
                <Crown size={14} style={{ color: p.color, marginBottom: 4 }} />
                <div style={{ fontSize: 13, fontWeight: 600, color: '#E8EDF5', fontFamily: 'var(--font-sans)' }}>
                  {p.name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                  {'\u00A3'}{(p.pricePerMonth / 100).toFixed(2)}/mo
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: 6 }}>
            Duration
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            {MONTH_OPTIONS.map((m) => (
              <button
                key={m}
                onClick={() => setMonths(m)}
                style={{
                  flex: 1,
                  padding: '10px 8px',
                  borderRadius: 'var(--radius-md)',
                  border: months === m
                    ? '2px solid var(--color-electric-blue)'
                    : '1px solid var(--color-border)',
                  background: months === m ? 'rgba(30,111,255,0.08)' : 'transparent',
                  color: '#E8EDF5',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                {m} {m === 1 ? 'month' : 'months'}
              </button>
            ))}
          </div>
        </div>

        {/* Personal message */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>
            Personal message (optional)
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="Write a personal message for the recipient..."
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
          />
        </div>

        {/* Total and CTA */}
        <Card style={{ padding: 16, marginBottom: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)', marginBottom: 4 }}>
            Total
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: selectedPlanInfo.color, fontFamily: 'var(--font-sans)' }}>
            {'\u00A3'}{totalDisplay}
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)' }}>
            {selectedPlanInfo.name} plan for {months} {months === 1 ? 'month' : 'months'}
          </div>
        </Card>

        <Button
          variant="primary"
          size="lg"
          onClick={handlePurchase}
          loading={loading}
          disabled={loading || !recipientEmail}
          style={{ width: '100%', fontSize: 15, fontWeight: 700, padding: '14px 24px' }}
        >
          Purchase gift
        </Button>
      </div>
    </div>
  );
}
