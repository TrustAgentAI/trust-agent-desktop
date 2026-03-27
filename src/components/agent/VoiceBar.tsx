import React from 'react';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';

type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking';

interface VoiceBarProps {
  sessionActive: boolean;
  onTranscript?: (text: string) => void;
}

const stateLabels: Record<VoiceState, string> = {
  idle: 'Press mic to speak',
  listening: 'Listening...',
  processing: 'Processing...',
  speaking: 'Speaking...',
};

const stateColors: Record<VoiceState, string> = {
  idle: 'var(--color-text-mid)',
  listening: 'var(--color-error)',
  processing: 'var(--color-ion-cyan)',
  speaking: 'var(--color-electric-blue)',
};

export function VoiceBar({ sessionActive, onTranscript }: VoiceBarProps) {
  const [voiceState, setVoiceState] = React.useState<VoiceState>('idle');
  const [ttsEnabled, setTtsEnabled] = React.useState(true);

  const toggleMic = () => {
    if (!sessionActive) return;

    if (voiceState === 'idle') {
      setVoiceState('listening');
      // In production, this would start MediaRecorder and stream to API
    } else if (voiceState === 'listening') {
      setVoiceState('processing');
      // Simulate processing delay then return to idle
      setTimeout(() => {
        setVoiceState('idle');
        onTranscript?.('Voice input captured');
      }, 1500);
    } else {
      setVoiceState('idle');
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '8px 24px',
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-surface-1)',
        minHeight: 44,
      }}
    >
      {/* Mic button */}
      <button
        onClick={toggleMic}
        disabled={!sessionActive}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: voiceState === 'listening' ? 'rgba(204,51,51,0.15)' : 'var(--color-surface-2)',
          border: voiceState === 'listening' ? '2px solid var(--color-error)' : '1px solid var(--color-border)',
          color: voiceState === 'listening' ? 'var(--color-error)' : 'var(--color-text-muted)',
          cursor: sessionActive ? 'pointer' : 'not-allowed',
          transition: 'all 200ms ease',
          animation: voiceState === 'listening' ? 'pulse 1.5s ease-in-out infinite' : 'none',
          flexShrink: 0,
          opacity: sessionActive ? 1 : 0.4,
        }}
      >
        {voiceState === 'listening' ? <MicOff size={14} /> : <Mic size={14} />}
      </button>

      {/* Waveform / status */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
        {voiceState === 'listening' && <Waveform />}
        {voiceState === 'processing' && (
          <div
            style={{
              display: 'flex',
              gap: 4,
              alignItems: 'center',
            }}
          >
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  background: 'var(--color-ion-cyan)',
                  animation: `pulse 1.2s ease-in-out ${i * 0.15}s infinite`,
                }}
              />
            ))}
          </div>
        )}
        <span
          style={{
            fontSize: '12px',
            fontWeight: 500,
            color: stateColors[voiceState],
            transition: 'color 150ms ease',
          }}
        >
          {stateLabels[voiceState]}
        </span>
      </div>

      {/* TTS toggle */}
      <button
        onClick={() => setTtsEnabled(!ttsEnabled)}
        title={ttsEnabled ? 'Mute agent voice' : 'Enable agent voice'}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 28,
          height: 28,
          borderRadius: 'var(--radius-sm)',
          background: 'transparent',
          border: 'none',
          color: ttsEnabled ? 'var(--color-electric-blue)' : 'var(--color-text-mid)',
          cursor: 'pointer',
          transition: 'color 150ms ease',
          flexShrink: 0,
        }}
      >
        {ttsEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
      </button>
    </div>
  );
}

function Waveform() {
  const barCount = 12;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 20 }}>
      {Array.from({ length: barCount }).map((_, i) => (
        <span
          key={i}
          style={{
            width: 2,
            height: 4,
            borderRadius: 1,
            background: 'var(--color-error)',
            animation: `waveform 0.6s ease-in-out ${i * 0.05}s infinite alternate`,
          }}
        />
      ))}
    </div>
  );
}
