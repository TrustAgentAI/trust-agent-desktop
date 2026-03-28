import React from 'react';
import { Users, User, Baby, Building2, ChevronRight, ChevronLeft, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CloudDriveSetup } from './CloudDriveSetup';

type AccountType = 'INDIVIDUAL' | 'CHILD' | 'FAMILY' | 'ENTERPRISE';
type CloudDriveType = 'GOOGLE_DRIVE' | 'ICLOUD' | 'ONEDRIVE';

interface FeaturedRole {
  id: string;
  name: string;
  tagline: string;
  category: string;
  accentColor: string;
}

interface OnboardingWizardProps {
  featuredRoles?: FeaturedRole[];
  onComplete: (data: {
    accountType: AccountType;
    cloudDriveType?: CloudDriveType;
    firstRoleId?: string;
  }) => void;
  onSkip?: () => void;
  onConnectDrive?: (driveType: CloudDriveType) => Promise<boolean>;
}

const STEPS = ['Account Type', 'Cloud Drive', 'Connect', 'First Role'];

const ACCOUNT_OPTIONS: {
  type: AccountType;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    type: 'INDIVIDUAL',
    label: 'Individual',
    description: 'For personal learning, career, health, and wellbeing.',
    icon: <User size={20} />,
  },
  {
    type: 'CHILD',
    label: 'Child',
    description: 'For children - requires a guardian link for safety.',
    icon: <Baby size={20} />,
  },
  {
    type: 'FAMILY',
    label: 'Family',
    description: 'For families - manage child profiles with guardian controls.',
    icon: <Users size={20} />,
  },
  {
    type: 'ENTERPRISE',
    label: 'Enterprise',
    description: 'For teams and organisations with custom role requirements.',
    icon: <Building2 size={20} />,
  },
];

export function OnboardingWizard({
  featuredRoles = [],
  onComplete,
  onSkip,
  onConnectDrive,
}: OnboardingWizardProps) {
  const [step, setStep] = React.useState(0);
  const [accountType, setAccountType] = React.useState<AccountType | null>(null);
  const [selectedDrive, setSelectedDrive] = React.useState<CloudDriveType | null>(null);
  const [driveConnected, setDriveConnected] = React.useState(false);
  const [driveConnecting, setDriveConnecting] = React.useState(false);
  const [driveError, setDriveError] = React.useState<string | null>(null);
  const [selectedRoleId, setSelectedRoleId] = React.useState<string | null>(null);

  const canNext =
    (step === 0 && accountType !== null) ||
    (step === 1 && selectedDrive !== null) ||
    (step === 2 && driveConnected) ||
    step === 3;

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      // Skip connect step if already connected
      if (step === 1 && driveConnected) {
        setStep(3);
      } else {
        setStep(step + 1);
      }
    } else {
      // Complete
      onComplete({
        accountType: accountType!,
        cloudDriveType: selectedDrive || undefined,
        firstRoleId: selectedRoleId || undefined,
      });
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleConnectDrive = async (driveType: CloudDriveType) => {
    setDriveConnecting(true);
    setDriveError(null);
    try {
      if (onConnectDrive) {
        const success = await onConnectDrive(driveType);
        if (success) {
          setDriveConnected(true);
        } else {
          setDriveError('Connection failed. Please try again.');
        }
      } else {
        // Simulate connection for development
        await new Promise((r) => setTimeout(r, 1500));
        setDriveConnected(true);
      }
    } catch {
      setDriveError('Connection failed. Please try again.');
    }
    setDriveConnecting(false);
  };

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--color-dark-navy)',
      }}
    >
      {/* Progress indicator */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: '16px 24px 0',
        }}
      >
        {STEPS.map((_s, i) => (
          <React.Fragment key={i}>
            <div
              style={{
                flex: 1,
                height: 3,
                borderRadius: 2,
                background: i <= step ? 'var(--color-electric-blue)' : 'var(--color-surface-2)',
                transition: 'background 300ms ease',
              }}
            />
          </React.Fragment>
        ))}
      </div>

      {/* Step label */}
      <div
        style={{
          padding: '8px 24px',
          fontSize: 11,
          color: 'var(--color-text-muted)',
          fontFamily: 'var(--font-mono)',
        }}
      >
        Step {step + 1} of {STEPS.length} - {STEPS[step]}
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: step === 3 ? 'flex-start' : 'center',
        }}
      >
        {/* Step 1: Account type */}
        {step === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 480, width: '100%' }}>
            <div
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: '#E8EDF5',
                fontFamily: 'var(--font-sans)',
                textAlign: 'center',
              }}
            >
              Who is this for?
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ACCOUNT_OPTIONS.map((opt) => {
                const isSelected = accountType === opt.type;
                return (
                  <Card
                    key={opt.type}
                    onClick={() => setAccountType(opt.type)}
                    glow={isSelected}
                    style={{
                      border: isSelected
                        ? '1px solid var(--color-electric-blue)'
                        : '1px solid var(--color-border)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 'var(--radius-md)',
                          background: isSelected
                            ? 'rgba(30,111,255,0.15)'
                            : 'var(--color-surface-2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: isSelected
                            ? 'var(--color-electric-blue)'
                            : 'var(--color-text-muted)',
                          flexShrink: 0,
                        }}
                      >
                        {opt.icon}
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: '#E8EDF5',
                            fontFamily: 'var(--font-sans)',
                          }}
                        >
                          {opt.label}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: 'var(--color-text-muted)',
                            fontFamily: 'var(--font-sans)',
                          }}
                        >
                          {opt.description}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Choose cloud drive */}
        {step === 1 && (
          <CloudDriveSetup
            selected={selectedDrive}
            onSelect={setSelectedDrive}
            onConnect={() => {}}
            isConnected={false}
          />
        )}

        {/* Step 3: OAuth connect */}
        {step === 2 && selectedDrive && (
          <CloudDriveSetup
            selected={selectedDrive}
            onSelect={setSelectedDrive}
            onConnect={handleConnectDrive}
            isConnecting={driveConnecting}
            isConnected={driveConnected}
            error={driveError}
          />
        )}

        {/* Step 4: Choose first role */}
        {step === 3 && (
          <div style={{ width: '100%', maxWidth: 600 }}>
            <div
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: '#E8EDF5',
                fontFamily: 'var(--font-sans)',
                textAlign: 'center',
                marginBottom: 4,
              }}
            >
              Choose your first role
            </div>
            <div
              style={{
                fontSize: 13,
                color: 'var(--color-text-muted)',
                textAlign: 'center',
                marginBottom: 20,
                fontFamily: 'var(--font-sans)',
              }}
            >
              You can always hire more roles from the Marketplace later.
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                gap: 10,
              }}
            >
              {featuredRoles.map((role) => {
                const isSelected = selectedRoleId === role.id;
                return (
                  <Card
                    key={role.id}
                    onClick={() => setSelectedRoleId(isSelected ? null : role.id)}
                    glow={isSelected}
                    padding="14px"
                    style={{
                      border: isSelected
                        ? `1px solid ${role.accentColor}`
                        : '1px solid var(--color-border)',
                      textAlign: 'center',
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: `${role.accentColor}20`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 8px',
                        fontSize: 14,
                        fontWeight: 800,
                        color: role.accentColor,
                        fontFamily: 'var(--font-sans)',
                      }}
                    >
                      {role.name.charAt(0)}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: '#E8EDF5',
                        marginBottom: 2,
                        fontFamily: 'var(--font-sans)',
                      }}
                    >
                      {role.name}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: 'var(--color-text-muted)',
                        fontFamily: 'var(--font-sans)',
                        lineHeight: 1.4,
                      }}
                    >
                      {role.tagline}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 24px 16px',
          borderTop: '1px solid var(--color-border)',
        }}
      >
        <div>
          {step > 0 && (
            <Button variant="ghost" size="md" onClick={handleBack} icon={<ChevronLeft size={14} />}>
              Back
            </Button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {onSkip && (
            <Button variant="ghost" size="md" onClick={onSkip}>
              Skip
            </Button>
          )}
          <Button
            variant="primary"
            size="md"
            onClick={handleNext}
            disabled={!canNext}
          >
            {step === STEPS.length - 1 ? 'Get Started' : 'Next'}
            {step < STEPS.length - 1 && <ChevronRight size={14} />}
          </Button>
        </div>
      </div>

      {/* Skip warning */}
      {onSkip && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '0 24px 12px',
            fontSize: 10,
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-sans)',
          }}
        >
          <AlertTriangle size={10} />
          Skipping limits functionality. You can complete setup later in Settings.
        </div>
      )}
    </div>
  );
}

export default OnboardingWizard;
