import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Gift, ArrowRight, PartyPopper, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import api from '@/lib/api';

const PLAN_NAMES: Record<string, string> = {
  STARTER: 'Starter',
  ESSENTIAL: 'Essential',
  FAMILY: 'Family',
  PROFESSIONAL: 'Professional',
};

interface ActivationResult {
  plan: string;
  durationMonths: number;
  periodEnd: string;
  message: string | null;
}

export function GiftActivatePage() {
  const { code: urlCode } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [code, setCode] = React.useState(urlCode || '');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<ActivationResult | null>(null);

  async function handleActivate() {
    const trimmedCode = code.trim().toUpperCase();
    if (!trimmedCode) {
      setError('Please enter your activation code.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await api.post<any>('/trpc/gifts.activateGift', {
        json: { activationCode: trimmedCode },
      });
      const data = res.result?.data ?? res;
      setResult(data);
    } catch (err: any) {
      const msg = err?.message || 'Unable to activate this code.';
      if (msg.includes('already been activated')) {
        setError('This gift has already been activated.');
      } else if (msg.includes('expired')) {
        setError('This gift code has expired.');
      } else if (msg.includes('Invalid')) {
        setError('This activation code is not valid. Please check and try again.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  // Auto-activate if code came from URL
  React.useEffect(() => {
    if (urlCode && urlCode.length >= 10) {
      handleActivate();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Success state
  if (result) {
    const planName = PLAN_NAMES[result.plan] || result.plan;
    const accessUntil = new Date(result.periodEnd).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 440 }}>
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

          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#E8EDF5', fontFamily: 'var(--font-sans)', marginBottom: 8 }}>
            Gift activated!
          </h1>

          <Card style={{ padding: 20, marginBottom: 20, textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)' }}>Plan</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#E8EDF5', fontFamily: 'var(--font-sans)' }}>{planName}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)' }}>Duration</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#E8EDF5', fontFamily: 'var(--font-sans)' }}>
                {result.durationMonths} {result.durationMonths === 1 ? 'month' : 'months'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)' }}>Access until</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#E8EDF5', fontFamily: 'var(--font-sans)' }}>{accessUntil}</span>
            </div>
          </Card>

          {/* Personal message from sender */}
          {result.message && (
            <Card style={{ padding: 16, marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)', marginBottom: 6 }}>
                Message from the sender
              </div>
              <div style={{ fontSize: 14, color: '#E8EDF5', fontFamily: 'var(--font-sans)', fontStyle: 'italic', lineHeight: 1.5 }}>
                "{result.message}"
              </div>
            </Card>
          )}

          <Button
            variant="primary"
            size="lg"
            icon={<ArrowRight size={16} />}
            onClick={() => navigate('/')}
            style={{ width: '100%', fontSize: 15, fontWeight: 700, padding: '14px 24px' }}
          >
            Start exploring
          </Button>
        </div>
      </div>
    );
  }

  // Activation form
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'rgba(167,139,250,0.1)',
            border: '1px solid rgba(167,139,250,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
          }}
        >
          <Gift size={24} style={{ color: '#A78BFA' }} />
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#E8EDF5', fontFamily: 'var(--font-sans)', marginBottom: 8 }}>
          Activate your gift
        </h1>
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)', marginBottom: 24, lineHeight: 1.5 }}>
          Enter the activation code from your gift email to unlock your subscription.
        </p>

        {/* Error */}
        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: 12,
              background: 'rgba(255,0,64,0.08)',
              border: '1px solid rgba(255,0,64,0.2)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-error)',
              fontSize: 13,
              fontFamily: 'var(--font-sans)',
              marginBottom: 16,
              textAlign: 'left',
            }}
          >
            <AlertTriangle size={14} style={{ flexShrink: 0 }} />
            {error}
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <Input
            placeholder="GIFT-XXXX-XXXX"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            monospace
            icon={<Gift size={14} />}
            style={{ textAlign: 'center', fontSize: 16, letterSpacing: '0.1em' }}
          />
        </div>

        <Button
          variant="primary"
          size="lg"
          onClick={handleActivate}
          loading={loading}
          disabled={loading || !code.trim()}
          style={{ width: '100%', fontSize: 15, fontWeight: 700, padding: '14px 24px' }}
        >
          Activate gift
        </Button>

        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-text-muted)',
            fontSize: 12,
            fontFamily: 'var(--font-sans)',
            cursor: 'pointer',
            marginTop: 16,
          }}
        >
          Go back
        </button>
      </div>
    </div>
  );
}
