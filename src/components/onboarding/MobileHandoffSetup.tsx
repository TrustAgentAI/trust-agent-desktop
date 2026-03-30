import React from 'react';
import { QrCode, Smartphone, CheckCircle, Clock, RefreshCw, Copy, ArrowRight } from 'lucide-react';
import { buildSetupPayload, buildSetupUrl, isTokenExpired, type SetupToken } from '@/lib/setup-token';
import { useAuthStore } from '@/store/authStore';
import { showToast } from '@/components/ui/Toast';

// ---------------------------------------------------------------------------
// MobileHandoffSetup - "Set up for a family member" flow
// Generates a QR code with a setup token for mobile onboarding
// ---------------------------------------------------------------------------

type SetupStep = 'generate' | 'scanning' | 'connected';

export function MobileHandoffSetup({ onClose }: { onClose: () => void }) {
  const auth = useAuthStore();
  const [step, setStep] = React.useState<SetupStep>('generate');
  const [token, setToken] = React.useState<SetupToken | null>(null);
  const [qrUrl, setQrUrl] = React.useState('');
  const [familyName, setFamilyName] = React.useState('');
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const userName = auth.user?.name || 'You';

  const handleGenerate = () => {
    const payload = buildSetupPayload({ userName });
    const url = buildSetupUrl(payload);
    setToken(payload);
    setQrUrl(url);
    setStep('scanning');

    // Poll for connection (simulated - in production this would poll the API)
    timerRef.current = setInterval(() => {
      if (token && isTokenExpired(token)) {
        if (timerRef.current) clearInterval(timerRef.current);
      }
    }, 5000);
  };

  const handleRegenerate = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    handleGenerate();
  };

  const handleCopyCode = () => {
    if (token) {
      navigator.clipboard.writeText(token.token);
      showToast('Setup code copied to clipboard', 'success');
    }
  };

  const handleSimulateConnect = () => {
    setStep('connected');
    if (timerRef.current) clearInterval(timerRef.current);
    showToast('Mobile device connected successfully', 'success');
  };

  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div style={overlayStyle}>
      <div style={panelStyle}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={iconCircleStyle}>
              <Smartphone size={20} style={{ color: '#1E6FFF' }} />
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#E8EDF5', fontFamily: 'var(--font-sans)' }}>
                Set up for a family member
              </h2>
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                90-second mobile setup for elderly relatives
              </p>
            </div>
          </div>
          <button onClick={onClose} style={closeBtnStyle}>&times;</button>
        </div>

        {/* Step: Generate */}
        {step === 'generate' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <QrCode size={64} style={{ color: 'var(--color-electric-blue)', margin: '0 auto 16px' }} />
            <h3 style={headingStyle}>Generate a setup code</h3>
            <p style={descStyle}>
              This creates a one-time QR code your family member can scan with their phone.
              The code expires after 15 minutes for security.
            </p>
            <button onClick={handleGenerate} style={primaryBtnStyle}>
              Generate QR Code <ArrowRight size={14} />
            </button>
          </div>
        )}

        {/* Step: Scanning */}
        {step === 'scanning' && token && (
          <div style={{ textAlign: 'center' }}>
            {/* QR Code placeholder - in production would use a QR library */}
            <div style={qrPlaceholderStyle}>
              <QrCode size={120} style={{ color: '#1E6FFF' }} />
              <p style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 8 }}>
                Scan with phone camera
              </p>
            </div>

            {/* Manual code entry fallback */}
            <div style={codeBoxStyle}>
              <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 6 }}>
                Or enter this code manually:
              </p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <span style={codeTextStyle}>{token.token}</span>
                <button onClick={handleCopyCode} style={ghostBtnStyle} title="Copy code">
                  <Copy size={14} />
                </button>
              </div>
            </div>

            {/* Timer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16 }}>
              <Clock size={12} style={{ color: 'var(--color-text-muted)' }} />
              <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                Expires in 15 minutes
              </span>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}>
              <button onClick={handleRegenerate} style={ghostBtnStyle}>
                <RefreshCw size={12} /> New code
              </button>
              <button onClick={handleSimulateConnect} style={primaryBtnStyle}>
                <CheckCircle size={14} /> Confirm connected
              </button>
            </div>

            {/* Instructions */}
            <div style={instructionsBoxStyle}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#E8EDF5', marginBottom: 8 }}>
                On their phone:
              </p>
              <ol style={{ fontSize: 12, color: 'var(--color-text-muted)', paddingLeft: 20, textAlign: 'left', lineHeight: 2 }}>
                <li>Open the camera app and point at the QR code</li>
                <li>Tap the link that appears</li>
                <li>Enter their name when asked</li>
              </ol>
            </div>
          </div>
        )}

        {/* Step: Connected */}
        {step === 'connected' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <CheckCircle size={64} style={{ color: 'var(--color-success)', margin: '0 auto 16px' }} />
            <h3 style={headingStyle}>Connected successfully</h3>
            <p style={descStyle}>
              {familyName ? `${familyName}'s` : "Your family member's"} phone is now set up.
              They will see a simplified interface designed for easy use.
            </p>
            <div style={connectedInfoStyle}>
              <div style={infoRowStyle}>
                <span style={{ color: 'var(--color-text-muted)' }}>Set up by</span>
                <span style={{ color: '#E8EDF5', fontWeight: 600 }}>{userName}</span>
              </div>
              <div style={infoRowStyle}>
                <span style={{ color: 'var(--color-text-muted)' }}>Device</span>
                <span style={{ color: '#E8EDF5', fontWeight: 600 }}>Mobile</span>
              </div>
              <div style={infoRowStyle}>
                <span style={{ color: 'var(--color-text-muted)' }}>Status</span>
                <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>Active</span>
              </div>
            </div>
            <button onClick={onClose} style={{ ...primaryBtnStyle, marginTop: 16 }}>
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ElderlyOnboarding - simplified 3-step onboarding for the mobile side
// Large text, high contrast, voice-guided option
// ---------------------------------------------------------------------------

type OnboardingStep = 1 | 2 | 3;

interface ElderlyOnboardingProps {
  setupByName: string;
  onComplete: (data: { name: string; voicePreference: string; companionId: string }) => void;
}

const VOICE_OPTIONS = [
  { id: 'warm-female', label: 'Warm female voice', desc: 'Friendly and calm' },
  { id: 'warm-male', label: 'Warm male voice', desc: 'Reassuring and steady' },
  { id: 'neutral', label: 'Neutral voice', desc: 'Clear and professional' },
];

const COMPANION_OPTIONS = [
  { id: 'daily-check-in', label: 'Daily Check-in', desc: 'A friendly companion who checks in with you each day' },
  { id: 'health-companion', label: 'Health Companion', desc: 'Helps you track medications and appointments' },
  { id: 'memory-companion', label: 'Memory Companion', desc: 'Helps you remember important things and people' },
];

export function ElderlyOnboarding({ setupByName, onComplete }: ElderlyOnboardingProps) {
  const [currentStep, setCurrentStep] = React.useState<OnboardingStep>(1);
  const [name, setName] = React.useState('');
  const [voicePref, setVoicePref] = React.useState('warm-female');
  const [companionId, setCompanionId] = React.useState('daily-check-in');

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep((currentStep + 1) as OnboardingStep);
    } else {
      onComplete({ name, voicePreference: voicePref, companionId });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as OnboardingStep);
    }
  };

  return (
    <div style={elderlyContainerStyle}>
      {/* Trust banner */}
      <div style={trustBannerStyle}>
        <CheckCircle size={20} style={{ color: '#00C896', flexShrink: 0 }} />
        <span style={{ fontSize: 16, color: '#E8EDF5' }}>
          {setupByName} has set this up for you
        </span>
      </div>

      {/* Progress */}
      <div style={progressBarContainerStyle}>
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            style={{
              flex: 1,
              height: 6,
              borderRadius: 3,
              background: s <= currentStep ? '#1E6FFF' : 'rgba(255,255,255,0.1)',
              transition: 'background 0.3s ease',
            }}
          />
        ))}
      </div>

      {/* Step 1: Name */}
      {currentStep === 1 && (
        <div style={elderlyStepStyle}>
          <h2 style={elderlyHeadingStyle}>What is your name?</h2>
          <p style={elderlyDescStyle}>
            This helps your companion greet you personally.
          </p>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your first name"
            style={elderlyInputStyle}
            autoFocus
          />
        </div>
      )}

      {/* Step 2: Voice */}
      {currentStep === 2 && (
        <div style={elderlyStepStyle}>
          <h2 style={elderlyHeadingStyle}>Choose a voice</h2>
          <p style={elderlyDescStyle}>
            Your companion will speak to you in this voice.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {VOICE_OPTIONS.map((v) => (
              <button
                key={v.id}
                onClick={() => setVoicePref(v.id)}
                style={{
                  ...elderlyOptionStyle,
                  borderColor: voicePref === v.id ? '#1E6FFF' : 'rgba(255,255,255,0.1)',
                  background: voicePref === v.id ? 'rgba(30,111,255,0.1)' : 'rgba(255,255,255,0.03)',
                }}
              >
                <span style={{ fontSize: 18, fontWeight: 700, color: '#E8EDF5' }}>{v.label}</span>
                <span style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>{v.desc}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Companion */}
      {currentStep === 3 && (
        <div style={elderlyStepStyle}>
          <h2 style={elderlyHeadingStyle}>Pick your first companion</h2>
          <p style={elderlyDescStyle}>
            You can always add more later. Pick the one that sounds most helpful.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {COMPANION_OPTIONS.map((c) => (
              <button
                key={c.id}
                onClick={() => setCompanionId(c.id)}
                style={{
                  ...elderlyOptionStyle,
                  borderColor: companionId === c.id ? '#1E6FFF' : 'rgba(255,255,255,0.1)',
                  background: companionId === c.id ? 'rgba(30,111,255,0.1)' : 'rgba(255,255,255,0.03)',
                }}
              >
                <span style={{ fontSize: 18, fontWeight: 700, color: '#E8EDF5' }}>{c.label}</span>
                <span style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>{c.desc}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
        {currentStep > 1 && (
          <button onClick={handleBack} style={elderlySecondaryBtnStyle}>
            Back
          </button>
        )}
        <button
          onClick={handleNext}
          disabled={currentStep === 1 && !name.trim()}
          style={{
            ...elderlyPrimaryBtnStyle,
            opacity: currentStep === 1 && !name.trim() ? 0.4 : 1,
          }}
        >
          {currentStep === 3 ? 'Start using Trust Agent' : 'Next'}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

const panelStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 480,
  maxHeight: '90vh',
  overflowY: 'auto',
  background: 'var(--color-surface-1)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  padding: 28,
};

const iconCircleStyle: React.CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: '50%',
  background: 'rgba(30,111,255,0.12)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const closeBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--color-text-muted)',
  fontSize: 24,
  cursor: 'pointer',
  padding: 4,
};

const headingStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 800,
  color: '#E8EDF5',
  fontFamily: 'var(--font-sans)',
  marginBottom: 8,
};

const descStyle: React.CSSProperties = {
  fontSize: 13,
  color: 'var(--color-text-muted)',
  lineHeight: 1.6,
  marginBottom: 20,
  maxWidth: 380,
  margin: '0 auto 20px',
};

const primaryBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '10px 20px',
  background: 'var(--color-electric-blue)',
  color: '#fff',
  fontFamily: 'var(--font-sans)',
  fontSize: 13,
  fontWeight: 600,
  border: 'none',
  borderRadius: 'var(--radius-md)',
  cursor: 'pointer',
};

const ghostBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '8px 14px',
  background: 'transparent',
  color: 'var(--color-text-muted)',
  fontFamily: 'var(--font-sans)',
  fontSize: 12,
  fontWeight: 600,
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-sm)',
  cursor: 'pointer',
};

const qrPlaceholderStyle: React.CSSProperties = {
  width: 200,
  height: 200,
  margin: '0 auto 16px',
  background: '#fff',
  borderRadius: 12,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
};

const codeBoxStyle: React.CSSProperties = {
  padding: '12px 16px',
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
};

const codeTextStyle: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 800,
  fontFamily: 'var(--font-mono)',
  color: 'var(--color-ion-cyan)',
  letterSpacing: '0.05em',
};

const instructionsBoxStyle: React.CSSProperties = {
  marginTop: 20,
  padding: 16,
  background: 'rgba(30,111,255,0.06)',
  border: '1px solid rgba(30,111,255,0.15)',
  borderRadius: 'var(--radius-md)',
};

const connectedInfoStyle: React.CSSProperties = {
  padding: 16,
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  marginTop: 16,
};

const infoRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: 13,
  padding: '6px 0',
};

// Elderly onboarding styles - large text, high contrast
const elderlyContainerStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 500,
  margin: '0 auto',
  padding: 32,
};

const trustBannerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '14px 18px',
  background: 'rgba(0,200,150,0.08)',
  border: '1px solid rgba(0,200,150,0.2)',
  borderRadius: 'var(--radius-md)',
  marginBottom: 24,
};

const progressBarContainerStyle: React.CSSProperties = {
  display: 'flex',
  gap: 6,
  marginBottom: 28,
};

const elderlyStepStyle: React.CSSProperties = {
  textAlign: 'center',
};

const elderlyHeadingStyle: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 800,
  color: '#E8EDF5',
  fontFamily: 'var(--font-sans)',
  marginBottom: 8,
};

const elderlyDescStyle: React.CSSProperties = {
  fontSize: 16,
  color: 'var(--color-text-muted)',
  lineHeight: 1.6,
  marginBottom: 24,
};

const elderlyInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '16px 20px',
  background: 'var(--color-surface-2)',
  border: '2px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  color: '#E8EDF5',
  fontFamily: 'var(--font-sans)',
  fontSize: 20,
  fontWeight: 600,
  outline: 'none',
};

const elderlyOptionStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  padding: '16px 20px',
  border: '2px solid rgba(255,255,255,0.1)',
  borderRadius: 'var(--radius-md)',
  cursor: 'pointer',
  textAlign: 'left',
  background: 'rgba(255,255,255,0.03)',
  transition: 'all 0.15s ease',
};

const elderlyPrimaryBtnStyle: React.CSSProperties = {
  flex: 1,
  padding: '16px 24px',
  background: 'var(--color-electric-blue)',
  color: '#fff',
  fontFamily: 'var(--font-sans)',
  fontSize: 18,
  fontWeight: 700,
  border: 'none',
  borderRadius: 'var(--radius-md)',
  cursor: 'pointer',
};

const elderlySecondaryBtnStyle: React.CSSProperties = {
  padding: '16px 24px',
  background: 'transparent',
  color: 'var(--color-text-muted)',
  fontFamily: 'var(--font-sans)',
  fontSize: 16,
  fontWeight: 600,
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  cursor: 'pointer',
};
