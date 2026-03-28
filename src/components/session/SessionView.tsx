import React from 'react';
import { Send, Mic, MicOff, Clock, Brain, AlertTriangle } from 'lucide-react';
import { EnvironmentRenderer, type EnvironmentConfig } from './EnvironmentRenderer';
import { ChatMessage, type ChatMessageData } from './ChatMessage';
import { useSession } from '@/store/sessionStore';
import { useAgentStore } from '@/store/agentStore';
import { shouldUseMockAgent, getMockResponse } from '@/lib/mockAgent';
import { wsClient } from '@/lib/ws';

interface SessionViewProps {
  environmentConfig?: EnvironmentConfig;
  brainConnected?: boolean;
  brainLastSync?: string;
  onEndSession?: () => void;
}

const ANTI_DEPENDENCY_MINS = 45;

export function SessionView({
  environmentConfig,
  brainConnected,
  brainLastSync: _brainLastSync,
  onEndSession,
}: SessionViewProps) {
  const { activeRoleId, roles } = useAgentStore();
  const { addMessage, getMessages } = useSession();
  const [isStreaming, setIsStreaming] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');
  const [voiceActive, setVoiceActive] = React.useState(false);
  const [sessionStartedAt] = React.useState<number>(Date.now());
  const [sessionElapsed, setSessionElapsed] = React.useState(0);
  const [showDependencyReminder, setShowDependencyReminder] = React.useState(false);
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const activeRole = roles.find((r) => r.hireId === activeRoleId);
  const messages: ChatMessageData[] = activeRoleId
    ? getMessages(activeRoleId).map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: m.timestamp,
        metadata: m.metadata,
      }))
    : [];

  const envConfig: EnvironmentConfig = environmentConfig || {
    colorTemperature: 'cool',
    categoryAccentColor: '#1E6FFF',
    sessionMood: 'focused',
  };

  // Session timer
  React.useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - sessionStartedAt) / 1000);
      setSessionElapsed(elapsed);

      // Anti-dependency reminder at 45 minutes
      if (elapsed >= ANTI_DEPENDENCY_MINS * 60 && !showDependencyReminder) {
        setShowDependencyReminder(true);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionStartedAt, showDependencyReminder]);

  // Scroll to bottom on new messages
  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isStreaming]);

  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const handleSend = async () => {
    if (!inputValue.trim() || !activeRoleId || isStreaming) return;

    const content = inputValue.trim();
    setInputValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = '40px';
    }

    const userMsg: ChatMessageData = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: Date.now(),
    };
    addMessage(activeRoleId, userMsg);
    setIsStreaming(true);

    if (shouldUseMockAgent()) {
      const mock = await getMockResponse();
      const agentMsg: ChatMessageData = {
        id: mock.messageId,
        role: 'agent',
        content: mock.fullContent,
        timestamp: Date.now(),
      };
      addMessage(activeRoleId, agentMsg);
      setIsStreaming(false);
      return;
    }

    try {
      wsClient.emit('agent:message', { hireId: activeRoleId, content });
    } catch {
      const errorMsg: ChatMessageData = {
        id: `err-${Date.now()}`,
        role: 'agent',
        content: 'Failed to send message. Please check your connection.',
        timestamp: Date.now(),
      };
      addMessage(activeRoleId, errorMsg);
    }
    setIsStreaming(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = '40px';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  };

  if (!activeRole) {
    return (
      <EnvironmentRenderer config={envConfig}>
        <div
          style={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 16,
            padding: 40,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              background: 'var(--color-mid-blue)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              fontWeight: 800,
              color: 'var(--color-ion-cyan)',
              fontFamily: 'var(--font-sans)',
            }}
          >
            TA
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#E8EDF5', marginBottom: 4 }}>
              Select a role to begin
            </div>
            <div style={{ fontSize: 13, color: 'var(--color-text-muted)', maxWidth: 360 }}>
              Choose a role from the sidebar or hire one from the Marketplace.
            </div>
          </div>
        </div>
      </EnvironmentRenderer>
    );
  }

  const accent = envConfig.categoryAccentColor || 'var(--color-electric-blue)';

  return (
    <EnvironmentRenderer config={envConfig}>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Session header bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(0,0,0,0.2)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Session timer */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 11,
                fontFamily: 'var(--font-mono)',
                color: sessionElapsed >= ANTI_DEPENDENCY_MINS * 60
                  ? 'var(--color-error)'
                  : 'var(--color-text-muted)',
              }}
            >
              <Clock size={12} />
              {formatTime(sessionElapsed)}
            </div>

            {/* Brain status */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 11,
                color: brainConnected ? 'var(--color-success)' : 'var(--color-text-muted)',
              }}
            >
              <Brain size={12} />
              <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 500 }}>
                {brainConnected ? 'Brain synced' : 'Brain offline'}
              </span>
            </div>
          </div>

          {onEndSession && (
            <button
              onClick={onEndSession}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 'var(--radius-sm)',
                padding: '4px 10px',
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--color-text-muted)',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                transition: 'all 150ms ease',
              }}
            >
              End Session
            </button>
          )}
        </div>

        {/* Anti-dependency reminder */}
        {showDependencyReminder && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 20px',
              background: 'rgba(245,158,11,0.08)',
              borderBottom: '1px solid rgba(245,158,11,0.2)',
              fontSize: 12,
              color: '#F59E0B',
              fontFamily: 'var(--font-sans)',
            }}
          >
            <AlertTriangle size={14} />
            <span>
              You have been in this session for {Math.floor(sessionElapsed / 60)} minutes.
              Consider taking a break - real progress comes from applying what you learn.
            </span>
            <button
              onClick={() => setShowDependencyReminder(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#F59E0B',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 11,
                marginLeft: 'auto',
                flexShrink: 0,
                fontFamily: 'var(--font-sans)',
              }}
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Messages area */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {/* Empty state */}
          {messages.length === 0 && (
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: `${accent}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  fontWeight: 800,
                  color: accent,
                  fontFamily: 'var(--font-sans)',
                }}
              >
                {activeRole.roleName.charAt(0)}
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#E8EDF5', fontFamily: 'var(--font-sans)' }}>
                {activeRole.roleName}
              </div>
              <div style={{ fontSize: 13, color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)' }}>
                Send a message or use voice to begin
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              message={msg}
              agentName={activeRole.roleName}
              accentColor={accent}
            />
          ))}

          {isStreaming && (
            <ChatMessage
              message={{ id: 'typing', role: 'agent', content: '', timestamp: Date.now() }}
              agentName={activeRole.roleName}
              accentColor={accent}
              isTyping
            />
          )}

          <div ref={bottomRef} />
        </div>

        {/* Voice orb (when active) */}
        {voiceActive && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px 0',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${accent}60, ${accent}20)`,
                boxShadow: `0 0 40px ${accent}30`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'pulse 2s ease-in-out infinite',
              }}
            >
              <Mic size={24} color="#fff" />
            </div>
          </div>
        )}

        {/* Input area */}
        <div
          style={{
            padding: '12px 24px 16px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(0,0,0,0.15)',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: 8,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 'var(--radius-lg)',
              padding: '8px 12px',
            }}
          >
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              disabled={isStreaming}
              placeholder="Type a message..."
              rows={1}
              style={{
                flex: 1,
                resize: 'none',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#E8EDF5',
                fontFamily: 'var(--font-sans)',
                fontSize: 13,
                lineHeight: '20px',
                minHeight: 40,
                maxHeight: 120,
                padding: '8px 0',
                opacity: isStreaming ? 0.5 : 1,
              }}
            />

            {/* Voice toggle */}
            <button
              onClick={() => setVoiceActive(!voiceActive)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32,
                borderRadius: 'var(--radius-md)',
                background: voiceActive ? accent : 'transparent',
                border: 'none',
                color: voiceActive ? '#fff' : 'var(--color-text-muted)',
                cursor: 'pointer',
                transition: 'all 150ms ease',
                flexShrink: 0,
              }}
            >
              {voiceActive ? <MicOff size={16} /> : <Mic size={16} />}
            </button>

            {/* Send */}
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isStreaming}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32,
                borderRadius: 'var(--radius-md)',
                background: inputValue.trim() && !isStreaming ? accent : 'transparent',
                border: 'none',
                color: inputValue.trim() && !isStreaming ? '#fff' : 'var(--color-text-mid)',
                cursor: inputValue.trim() && !isStreaming ? 'pointer' : 'not-allowed',
                transition: 'all 150ms ease',
                flexShrink: 0,
              }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </EnvironmentRenderer>
  );
}

export default SessionView;
