import React from 'react';
import { CheckCircle, AlertCircle, Cloud, Zap, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';

type HireStep = 'plan-check' | 'drive-check' | 'customise' | 'confirm' | 'loading' | 'success' | 'error';

interface HireFlowProps {
  roleName: string;
  roleId: string;
  companionName: string;
  priceMonthly: number; // pence
  accentColor?: string;
  userPlan?: string;
  userHireCount?: number;
  planLimit?: number;
  hasCloudDrive?: boolean;
  onHire: (data: { roleId: string; customCompanionName?: string }) => Promise<void>;
  onUpgradePlan?: () => void;
  onConnectDrive?: () => void;
  onClose: () => void;
}

function formatPrice(pence: number): string {
  if (pence === 0) return 'Free';
  const pounds = (pence / 100).toFixed(2);
  return `\u00A3${pounds}/mo`;
}

export function HireFlow({
  roleName,
  roleId,
  companionName,
  priceMonthly,
  accentColor,
  userPlan = 'FREE',
  userHireCount = 0,
  planLimit = 1,
  hasCloudDrive = false,
  onHire,
  onUpgradePlan,
  onConnectDrive,
  onClose,
}: HireFlowProps) {
  const accent = accentColor || 'var(--color-electric-blue)';
  const needsUpgrade = userPlan === 'FREE' && priceMonthly > 0;
  const atRoleLimit = userHireCount >= planLimit;

  // Determine initial step
  const getInitialStep = (): HireStep => {
    if (needsUpgrade || atRoleLimit) return 'plan-check';
    if (!hasCloudDrive) return 'drive-check';
    return 'customise';
  };

  const [step, setStep] = React.useState<HireStep>(getInitialStep);
  const [customName, setCustomName] = React.useState(companionName);
  const [error, setError] = React.useState<string | null>(null);

  const handleConfirm = async () => {
    setStep('loading');
    setError(null);
    try {
      await onHire({
        roleId,
        customCompanionName: customName !== companionName ? customName : undefined,
      });
      setStep('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setStep('error');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        animation: 'fadeIn 200ms ease',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && step !== 'loading') onClose();
      }}
    >
      <div
        style={{
          background: 'var(--color-dark-navy)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          width: '100%',
          maxWidth: 440,
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-md)',
              background: `${accent}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              fontWeight: 800,
              color: accent,
              fontFamily: 'var(--font-sans)',
            }}
          >
            {companionName.charAt(0)}
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
              Hire {roleName}
            </div>
            <div
              style={{
                fontSize: 12,
                color: 'var(--color-text-muted)',
                fontFamily: 'var(--font-sans)',
              }}
            >
              {formatPrice(priceMonthly)}
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '16px 20px' }}>
          {/* Plan check */}
          {step === 'plan-check' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  padding: '12px 14px',
                  background: 'rgba(245,158,11,0.06)',
                  border: '1px solid rgba(245,158,11,0.15)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <AlertCircle size={16} color="#F59E0B" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#F59E0B', marginBottom: 4, fontFamily: 'var(--font-sans)' }}>
                    {needsUpgrade ? 'Plan upgrade required' : 'Role limit reached'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.5, fontFamily: 'var(--font-sans)' }}>
                    {needsUpgrade
                      ? 'This role requires a paid plan. Upgrade to access premium roles.'
                      : `Your current plan allows ${planLimit} role${planLimit === 1 ? '' : 's'}. Upgrade to hire more.`}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Badge variant="info">Current: {userPlan}</Badge>
                <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)' }}>
                  {userHireCount}/{planLimit} roles hired
                </span>
              </div>
              {onUpgradePlan && (
                <Button variant="primary" size="md" onClick={onUpgradePlan} style={{ width: '100%' }}>
                  Upgrade Plan
                </Button>
              )}
            </div>
          )}

          {/* Drive check */}
          {step === 'drive-check' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  padding: '12px 14px',
                  background: 'rgba(30,111,255,0.06)',
                  border: '1px solid rgba(30,111,255,0.15)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <Cloud size={16} color="var(--color-electric-blue)" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-electric-blue)', marginBottom: 4, fontFamily: 'var(--font-sans)' }}>
                    Cloud drive required
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.5, fontFamily: 'var(--font-sans)' }}>
                    Connect a cloud drive to store your Brain file. Your data stays in YOUR drive - Trust Agent never accesses it.
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {onConnectDrive && (
                  <Button variant="primary" size="md" onClick={onConnectDrive} style={{ flex: 1 }}>
                    Connect Drive
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="md"
                  onClick={() => setStep('customise')}
                >
                  Skip for now
                </Button>
              </div>
            </div>
          )}

          {/* Customise */}
          {step === 'customise' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.6, fontFamily: 'var(--font-sans)' }}>
                Personalise your companion. You can always change this later.
              </div>
              <Input
                label="Companion Name"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder={companionName}
              />
              <Button
                variant="primary"
                size="lg"
                onClick={() => setStep('confirm')}
                style={{ width: '100%' }}
                icon={<ArrowRight size={14} />}
              >
                Continue
              </Button>
            </div>
          )}

          {/* Confirm */}
          {step === 'confirm' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div
                style={{
                  padding: '12px 14px',
                  background: 'var(--color-surface-2)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)' }}>Role</span>
                  <span style={{ fontSize: 12, color: '#E8EDF5', fontWeight: 600, fontFamily: 'var(--font-sans)' }}>{roleName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)' }}>Companion</span>
                  <span style={{ fontSize: 12, color: accent, fontWeight: 600, fontFamily: 'var(--font-sans)' }}>{customName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)' }}>Monthly</span>
                  <span style={{ fontSize: 12, color: '#E8EDF5', fontWeight: 700, fontFamily: 'var(--font-sans)' }}>
                    {formatPrice(priceMonthly)}
                  </span>
                </div>
              </div>
              <Button
                variant="primary"
                size="lg"
                onClick={handleConfirm}
                style={{ width: '100%' }}
                icon={<Zap size={14} />}
              >
                Confirm Hire
              </Button>
            </div>
          )}

          {/* Loading */}
          {step === 'loading' && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
                padding: '24px 0',
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  border: `2px solid ${accent}`,
                  borderTopColor: 'transparent',
                  animation: 'spin 1s linear infinite',
                }}
              />
              <div style={{ fontSize: 13, color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)' }}>
                Setting up {customName}...
              </div>
            </div>
          )}

          {/* Success */}
          {step === 'success' && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
                padding: '16px 0',
              }}
            >
              <CheckCircle size={40} color="var(--color-success)" />
              <div style={{ fontSize: 16, fontWeight: 700, color: '#E8EDF5', fontFamily: 'var(--font-sans)' }}>
                {customName} is ready
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: 'var(--color-text-muted)',
                  textAlign: 'center',
                  lineHeight: 1.6,
                  fontFamily: 'var(--font-sans)',
                }}
              >
                You can now start a session with {customName} from your dashboard.
              </div>
              <Button variant="primary" size="md" onClick={onClose} style={{ marginTop: 4 }}>
                Start Chatting
              </Button>
            </div>
          )}

          {/* Error */}
          {step === 'error' && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
                padding: '16px 0',
              }}
            >
              <AlertCircle size={40} color="var(--color-error)" />
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-error)', fontFamily: 'var(--font-sans)' }}>
                Hire failed
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--color-text-muted)',
                  textAlign: 'center',
                  lineHeight: 1.6,
                  fontFamily: 'var(--font-sans)',
                }}
              >
                {error}
              </div>
              <Button variant="secondary" size="md" onClick={() => setStep('confirm')}>
                Try Again
              </Button>
            </div>
          )}
        </div>

        {/* Footer - close */}
        {step !== 'loading' && step !== 'success' && (
          <div
            style={{
              padding: '0 20px 16px',
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--color-text-muted)',
                cursor: 'pointer',
                fontSize: 12,
                fontFamily: 'var(--font-sans)',
              }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default HireFlow;
