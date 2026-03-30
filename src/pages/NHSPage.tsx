/**
 * Phase 9 - NHS Partner Page
 * Patient activation, GP portal info, compliance badges, partner stats.
 * Calls nhs.verifyPracticePartner and nhs.getNHSPartnerStats via tRPC.
 */
import React from 'react';
import { Stethoscope, Shield, CheckCircle, Building2, Users, Activity, Search } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.trust-agent.ai';

interface NHSPartnerStats {
  partnerPractices: number;
  patientsSupported: number;
  igCompliantPractices: number;
}

interface PracticeResult {
  isPartner: boolean;
  practice: {
    name: string;
    igCompliant: boolean;
    inPilot: boolean;
    codesAvailable: boolean;
  } | null;
}

const COMPLIANCE_ITEMS = [
  { label: 'NHS Data Security and Protection Toolkit (DSPT)', status: 'Compliant', icon: Shield },
  { label: 'GDPR Article 6(1)(a) - Explicit Consent', status: 'Implemented', icon: CheckCircle },
  { label: 'ICO Registration', status: 'Registered', icon: Shield },
  { label: 'NHS Clinical Safety (DCB0129)', status: 'In Progress', icon: Activity },
  { label: 'Cyber Essentials Plus', status: 'Certified', icon: Shield },
];

export function NHSPage() {
  const [stats, setStats] = React.useState<NHSPartnerStats | null>(null);
  const [statsLoading, setStatsLoading] = React.useState(true);
  const [odsCode, setOdsCode] = React.useState('');
  const [practiceResult, setPracticeResult] = React.useState<PracticeResult | null>(null);
  const [verifying, setVerifying] = React.useState(false);
  const [verifyError, setVerifyError] = React.useState<string | null>(null);

  // Fetch partner stats on mount
  React.useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch(`${API_BASE}/trpc/nhs.getNHSPartnerStats`);
        const data = await res.json();
        setStats(data.result?.data ?? null);
      } catch {
        // Stats unavailable - not critical
      } finally {
        setStatsLoading(false);
      }
    }
    loadStats();
  }, []);

  // Verify practice partner
  async function handleVerify() {
    if (!odsCode.trim()) return;
    setVerifying(true);
    setVerifyError(null);
    setPracticeResult(null);
    try {
      const params = new URLSearchParams({
        input: JSON.stringify({ odsCode: odsCode.trim() }),
      });
      const res = await fetch(`${API_BASE}/trpc/nhs.verifyPracticePartner?${params}`);
      const data = await res.json();
      setPracticeResult(data.result?.data ?? null);
    } catch {
      setVerifyError('Unable to verify practice. Please try again.');
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
      {/* Hero */}
      <div
        style={{
          textAlign: 'center',
          marginBottom: 40,
          padding: '48px 24px',
          background: 'linear-gradient(135deg, rgba(0,170,120,0.08), rgba(30,111,255,0.05))',
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <Stethoscope size={36} style={{ color: '#00AA78', marginBottom: 12 }} />
        <h1
          style={{
            fontSize: 28,
            fontWeight: 800,
            fontFamily: 'var(--font-sans)',
            color: '#E8EDF5',
            margin: '0 0 8px',
          }}
        >
          NHS Partner Network
        </h1>
        <p
          style={{
            fontSize: 15,
            color: 'rgba(255,255,255,0.6)',
            margin: 0,
            maxWidth: 540,
            marginLeft: 'auto',
            marginRight: 'auto',
            fontFamily: 'var(--font-sans)',
            lineHeight: 1.6,
          }}
        >
          Trust Agent works alongside the NHS to provide AI-powered companion support for patients.
          Referred by your GP, powered by trust.
        </p>
      </div>

      {/* Partner Stats */}
      {!statsLoading && stats && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 16,
            marginBottom: 40,
          }}
        >
          <StatCard icon={<Building2 size={20} />} label="Partner Practices" value={stats.partnerPractices} color="#00AA78" />
          <StatCard icon={<Users size={20} />} label="Patients Supported" value={stats.patientsSupported} color="#6C8EFF" />
          <StatCard icon={<Shield size={20} />} label="IG Compliant" value={stats.igCompliantPractices} color="#FFB740" />
        </div>
      )}

      {/* Patient Activation Form */}
      <Card style={{ marginBottom: 32, padding: 24 }}>
        <h2
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: '#E8EDF5',
            marginBottom: 8,
            fontFamily: 'var(--font-sans)',
            marginTop: 0,
          }}
        >
          Patient Activation
        </h2>
        <p
          style={{
            fontSize: 13,
            color: 'rgba(255,255,255,0.5)',
            marginBottom: 16,
            fontFamily: 'var(--font-sans)',
            lineHeight: 1.5,
          }}
        >
          If your GP practice is part of the Trust Agent network, enter their ODS code below to
          verify and activate your companion.
        </p>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', maxWidth: 420 }}>
          <div style={{ flex: 1 }}>
            <Input
              label="ODS Practice Code"
              placeholder="e.g. A12345"
              value={odsCode}
              onChange={(e) => setOdsCode(e.target.value)}
              icon={<Search size={14} />}
            />
          </div>
          <Button onClick={handleVerify} loading={verifying} disabled={!odsCode.trim()}>
            Verify
          </Button>
        </div>

        {verifyError && (
          <div
            style={{
              marginTop: 12,
              padding: '8px 12px',
              background: 'rgba(255,0,64,0.1)',
              borderRadius: 8,
              color: '#FF6B6B',
              fontSize: 13,
              fontFamily: 'var(--font-sans)',
            }}
          >
            {verifyError}
          </div>
        )}

        {practiceResult && (
          <div
            style={{
              marginTop: 16,
              padding: 16,
              background: practiceResult.isPartner
                ? 'rgba(0,170,120,0.08)'
                : 'rgba(255,183,64,0.08)',
              border: `1px solid ${practiceResult.isPartner ? 'rgba(0,170,120,0.2)' : 'rgba(255,183,64,0.2)'}`,
              borderRadius: 12,
            }}
          >
            {practiceResult.isPartner && practiceResult.practice ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <CheckCircle size={16} style={{ color: '#00AA78' }} />
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: '#00AA78',
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    Verified Partner Practice
                  </span>
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-sans)' }}>
                  {practiceResult.practice.name}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  {practiceResult.practice.igCompliant && <Badge variant="success">IG Compliant</Badge>}
                  {practiceResult.practice.inPilot && <Badge variant="info">Active Pilot</Badge>}
                  {practiceResult.practice.codesAvailable && <Badge variant="gold">Codes Available</Badge>}
                </div>
              </>
            ) : (
              <div style={{ fontSize: 13, color: '#FFB740', fontFamily: 'var(--font-sans)' }}>
                This practice is not currently in the Trust Agent partner network. Ask your GP to
                contact us at nhs@trust-agent.ai.
              </div>
            )}
          </div>
        )}
      </Card>

      {/* GP Portal Section */}
      <Card style={{ marginBottom: 32, padding: 24 }}>
        <h2
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: '#E8EDF5',
            marginBottom: 8,
            fontFamily: 'var(--font-sans)',
            marginTop: 0,
          }}
        >
          GP Portal
        </h2>
        <p
          style={{
            fontSize: 13,
            color: 'rgba(255,255,255,0.5)',
            marginBottom: 16,
            fontFamily: 'var(--font-sans)',
            lineHeight: 1.5,
          }}
        >
          For healthcare professionals - manage patient referrals, monitor activation rates, and
          access anonymised wellbeing insights from your practice cohort.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          {[
            { title: 'Referral Management', desc: 'Issue and track patient activation codes' },
            { title: 'Wellbeing Insights', desc: 'Anonymised engagement and wellbeing data' },
            { title: 'Safeguarding Alerts', desc: 'Real-time flags for at-risk patients' },
            { title: 'Usage Analytics', desc: 'Practice-level activation and retention stats' },
          ].map((item) => (
            <div
              key={item.title}
              style={{
                padding: 16,
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 10,
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#E8EDF5',
                  marginBottom: 4,
                  fontFamily: 'var(--font-sans)',
                }}
              >
                {item.title}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.45)',
                  fontFamily: 'var(--font-sans)',
                  lineHeight: 1.4,
                }}
              >
                {item.desc}
              </div>
            </div>
          ))}
        </div>
        <Button variant="secondary" style={{ marginTop: 16 }}>
          Access GP Portal
        </Button>
      </Card>

      {/* Compliance Section */}
      <Card style={{ marginBottom: 32, padding: 24 }}>
        <h2
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: '#E8EDF5',
            marginBottom: 16,
            fontFamily: 'var(--font-sans)',
            marginTop: 0,
          }}
        >
          Compliance and Data Governance
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {COMPLIANCE_ITEMS.map((item) => (
            <div
              key={item.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <item.icon size={14} style={{ color: '#00AA78' }} />
                <span
                  style={{
                    fontSize: 13,
                    color: 'rgba(255,255,255,0.7)',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  {item.label}
                </span>
              </div>
              <Badge variant={item.status === 'In Progress' ? 'info' : 'success'}>
                {item.status}
              </Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <Card style={{ textAlign: 'center', padding: 20 }}>
      <div style={{ color, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color, fontFamily: 'var(--font-sans)' }}>
        {value.toLocaleString()}
      </div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-sans)' }}>
        {label}
      </div>
    </Card>
  );
}
