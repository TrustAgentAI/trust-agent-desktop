import React from 'react';
import { Mic, AudioLines } from 'lucide-react';
import { isTauri, invoke } from '@/lib/tauri-compat';
import { showToast } from '@/components/ui/Toast';

type VoiceState = 'idle' | 'listening' | 'speaking';

interface VoiceBarProps {
  sessionActive: boolean;
  onTranscript?: (text: string) => void;
}

export function VoiceBar({ sessionActive, onTranscript }: VoiceBarProps) {
  const [voiceState, setVoiceState] = React.useState<VoiceState>('idle');

  const isListening = voiceState === 'listening';
  const isSpeaking = voiceState === 'speaking';

  const toggleMic = async () => {
    if (!sessionActive) return;

    if (!isTauri()) {
      showToast(
        'Voice requires the full Tauri desktop app. Download at trust-agent.ai/desktop',
        'info',
      );
      return;
    }

    if (isListening) {
      try {
        await invoke('stop_voice_session');
      } catch {
        // Handled
      }
      setVoiceState('idle');
    } else {
      try {
        await invoke('start_voice_session');
        setVoiceState('listening');
      } catch {
        showToast('Failed to start voice session', 'error');
      }
    }
  };

  // Listen for agent:speaking WS events (future integration)
  React.useEffect(() => {
    void onTranscript;
    void isSpeaking;
  }, [onTranscript, isSpeaking]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '8px 16px',
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-surface-1)',
        minHeight: 44,
      }}
    >
      <button
        onClick={toggleMic}
        disabled={!sessionActive}
        aria-label={isListening ? 'Stop listening' : 'Start voice'}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: isListening
            ? 'rgba(0,212,255,0.08)'
            : 'transparent',
          border: `2px solid ${
            isListening ? 'var(--color-ion-cyan)' : 'var(--color-text-muted)'
          }`,
          color: isListening ? 'var(--color-ion-cyan)' : 'var(--color-text-muted)',
          cursor: sessionActive ? 'pointer' : 'not-allowed',
          transition: 'all 200ms ease',
          boxShadow: isListening
            ? '0 0 16px rgba(0,212,255,0.35)'
            : 'none',
          flexShrink: 0,
          opacity: sessionActive ? 1 : 0.4,
        }}
      >
        {isSpeaking ? <AudioLines size={18} /> : <Mic size={18} />}
      </button>

      {isListening && <WaveBars />}

      <span
        style={{
          fontSize: '12px',
          fontWeight: 500,
          fontFamily: 'var(--font-mono)',
          color: isListening
            ? 'var(--color-ion-cyan)'
            : isSpeaking
              ? 'var(--color-electric-blue)'
              : 'var(--color-text-muted)',
          transition: 'color 150ms ease',
        }}
      >
        {isListening
          ? 'Listening...'
          : isSpeaking
            ? 'Agent speaking...'
            : 'Press mic to speak'}
      </span>
    </div>
  );
}

function WaveBars() {
  const barCount = 5;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3, height: 24 }}>
      {Array.from({ length: barCount }).map((_, i) => (
        <span
          key={i}
          style={{
            width: 3,
            height: 6,
            borderRadius: 2,
            background: 'var(--color-ion-cyan)',
            animation: `voiceWave 0.8s ease-in-out ${i * 0.12}s infinite alternate`,
          }}
        />
      ))}
    </div>
  );
}
