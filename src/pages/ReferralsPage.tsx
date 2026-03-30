import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Copy, Check, Gift, TrendingUp, ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.trust-agent.ai';

interface ReferralCodeData {
  referralCode: string;
  currentBalance: number;
  totalReferrals: number;
  totalCreditsEarned: number;
  referralLink: string;
}

interface Referral {
  id: string;
  referredUser: {
    name: string | null;
    email: string;
    plan: string;
    joinedAt: string;
  };
  rewardType: string;
  rewardAmount: number;
  createdAt: string;
}

export function ReferralsPage() {
  const navigate = useNavigate();
  const [codeData, setCodeData] = React.useState<ReferralCodeData | null>(null);
  const [referrals, setReferrals] = React.useState<Referral[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('ta_access_token');
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

      const [codeRes, referralsRes] = await Promise.all([
        fetch(`${API_BASE}/trpc/referrals.getMyReferralCode`, { headers }),
        fetch(`${API_BASE}/trpc/referrals.getMyReferrals`, { headers }),
      ]);

      const codeJson = await codeRes.json();
      const referralsJson = await referralsRes.json();

      setCodeData(codeJson.result?.data ?? null);
      setReferrals(referralsJson.result?.data ?? []);
    } catch {
      setError('Unable to load your referral information. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  // Loading
  if (loading) {
    return (
      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        <Skeleton width={180} height={24} style={{ marginBottom: 24 }} />
        <Skeleton height={120} borderRadius="var(--radius-lg)" style={{ marginBottom: 16 }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 24 }}>
          <Skeleton height={80} borderRadius="var(--radius-lg)" />
          <Skeleton height={80} borderRadius="var(--radius-lg)" />
          <Skeleton height={80} borderRadius="var(--radius-lg)" />
        </div>
        <Skeleton height={160} borderRadius="var(--radius-lg)" />
      </div>
    );
  }

  // Error
  if (error && !codeData) {
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
        <Button variant="ghost" size="md" onClick={fetchData} style={{ marginTop: 12 }}>
          Try again
        </Button>
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

      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#E8EDF5', fontFamily: 'var(--font-sans)', marginBottom: 8 }}>
        Referrals
      </h1>
      <p style={{ fontSize: 14, color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)', marginBottom: 24 }}>
        Give a friend one free month, get one free month.
      </p>

      {/* Referral code card */}
      {codeData && (
        <Card
          style={{
            padding: 24,
            marginBottom: 20,
            textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(30,111,255,0.06), rgba(167,139,250,0.04))',
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 8, fontFamily: 'var(--font-sans)' }}>
            Your referral code
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: 'var(--color-electric-blue)',
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.05em',
              marginBottom: 12,
            }}
          >
            {codeData.referralCode}
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 12 }}>
            <Button
              variant="primary"
              size="sm"
              icon={copied ? <Check size={14} /> : <Copy size={14} />}
              onClick={() => handleCopy(codeData.referralCode)}
            >
              {copied ? 'Copied!' : 'Copy code'}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleCopy(codeData.referralLink)}
            >
              Copy link
            </Button>
          </div>

          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)' }}>
            Share this code or link with friends
          </div>
        </Card>
      )}

      {/* Stats */}
      {codeData && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
          <Card style={{ padding: 16, textAlign: 'center' }}>
            <Users size={16} style={{ color: 'var(--color-electric-blue)', marginBottom: 6 }} />
            <div style={{ fontSize: 22, fontWeight: 800, color: '#E8EDF5', fontFamily: 'var(--font-sans)' }}>
              {codeData.totalReferrals}
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)' }}>
              Referrals
            </div>
          </Card>
          <Card style={{ padding: 16, textAlign: 'center' }}>
            <Gift size={16} style={{ color: '#A78BFA', marginBottom: 6 }} />
            <div style={{ fontSize: 22, fontWeight: 800, color: '#E8EDF5', fontFamily: 'var(--font-sans)' }}>
              {codeData.totalCreditsEarned}
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)' }}>
              Credits earned
            </div>
          </Card>
          <Card style={{ padding: 16, textAlign: 'center' }}>
            <TrendingUp size={16} style={{ color: '#4ADE80', marginBottom: 6 }} />
            <div style={{ fontSize: 22, fontWeight: 800, color: '#E8EDF5', fontFamily: 'var(--font-sans)' }}>
              {codeData.currentBalance}
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)' }}>
              Current balance
            </div>
          </Card>
        </div>
      )}

      {/* Referral history */}
      <h2 style={{ fontSize: 16, fontWeight: 700, color: '#E8EDF5', fontFamily: 'var(--font-sans)', marginBottom: 12 }}>
        Referral history
      </h2>

      {referrals.length === 0 ? (
        <EmptyState
          icon={<Users size={24} />}
          title="No referrals yet"
          description="Share your code with friends and family. When they sign up, you both earn 500 credits."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {referrals.map((r) => (
            <Card key={r.id} style={{ padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#E8EDF5', fontFamily: 'var(--font-sans)' }}>
                    {r.referredUser.name || r.referredUser.email}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)', marginTop: 2 }}>
                    Joined {new Date(r.referredUser.joinedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {r.referredUser.plan !== 'FREE' && ` - ${r.referredUser.plan} plan`}
                  </div>
                </div>
                <div
                  style={{
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(74,222,128,0.1)',
                    color: '#4ADE80',
                    fontSize: 12,
                    fontWeight: 600,
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  +{r.rewardAmount} credits
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
