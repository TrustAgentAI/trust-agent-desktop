import React from 'react';
import { CodeBlock } from '@/components/ui/CodeBlock';

export interface ChatMessageData {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

interface ChatMessageProps {
  message: ChatMessageData;
  agentName: string;
  accentColor?: string;
  isTyping?: boolean;
}

export function ChatMessage({ message, agentName, accentColor, isTyping }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const [showTime, setShowTime] = React.useState(false);
  const time = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const accent = accentColor || 'var(--color-electric-blue)';

  if (isTyping) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
          padding: '6px 0',
          animation: 'fadeIn 200ms ease',
        }}
      >
        <AgentAvatar name={agentName} accentColor={accent} />
        <div
          style={{
            background: 'var(--color-navy-2)',
            borderLeft: `2px solid ${accent}`,
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <TypingDots accentColor={accent} />
        </div>
      </div>
    );
  }

  return (
    <div
      onMouseEnter={() => setShowTime(true)}
      onMouseLeave={() => setShowTime(false)}
      style={{
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        alignItems: 'flex-start',
        gap: 10,
        padding: '6px 0',
        animation: 'fadeIn 200ms ease',
      }}
    >
      {!isUser && <AgentAvatar name={agentName} accentColor={accent} />}

      <div style={{ maxWidth: '72%', minWidth: 0 }}>
        <div
          style={{
            background: isUser ? 'var(--color-dark-navy)' : 'var(--color-navy-2)',
            borderLeft: isUser ? 'none' : `2px solid ${accent}`,
            border: isUser ? '1px solid var(--color-border)' : undefined,
            borderRadius: 'var(--radius-md)',
            padding: '10px 14px',
          }}
        >
          <RenderedContent content={message.content} />
        </div>

        {/* Timestamp on hover */}
        <div
          style={{
            fontSize: 11,
            color: 'var(--color-text-muted)',
            marginTop: 4,
            textAlign: isUser ? 'right' : 'left',
            padding: '0 4px',
            fontFamily: 'var(--font-mono)',
            opacity: showTime ? 1 : 0,
            transition: 'opacity 150ms ease',
            height: showTime ? 'auto' : 0,
            overflow: 'hidden',
          }}
        >
          {time}
        </div>
      </div>
    </div>
  );
}

function AgentAvatar({ name, accentColor }: { name: string; accentColor: string }) {
  return (
    <div
      style={{
        width: 28,
        height: 28,
        borderRadius: 'var(--radius-sm)',
        background: 'var(--color-surface-2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 12,
        fontWeight: 700,
        color: accentColor,
        flexShrink: 0,
        fontFamily: 'var(--font-sans)',
      }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function TypingDots({ accentColor }: { accentColor: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, height: 20 }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: accentColor,
            opacity: 0.6,
            animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

function RenderedContent({ content }: { content: string }) {
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div style={{ fontSize: 13, lineHeight: 1.6, color: '#E8EDF5', wordBreak: 'break-word' }}>
      {parts.map((part, i) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const lines = part.slice(3, -3).split('\n');
          const lang = lines[0]?.trim() || undefined;
          const code = (lang ? lines.slice(1) : lines).join('\n').trim();
          return <CodeBlock key={i} code={code} language={lang} />;
        }

        const segments = part.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
        return (
          <span key={i}>
            {segments.map((seg, j) => {
              if (seg.startsWith('`') && seg.endsWith('`')) {
                return (
                  <code
                    key={j}
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 12,
                      background: 'rgba(30,111,255,0.1)',
                      padding: '1px 5px',
                      borderRadius: 3,
                      color: 'var(--color-ion-cyan)',
                    }}
                  >
                    {seg.slice(1, -1)}
                  </code>
                );
              }
              if (seg.startsWith('**') && seg.endsWith('**')) {
                return <strong key={j}>{seg.slice(2, -2)}</strong>;
              }
              return seg.split('\n').map((line, k, arr) => (
                <React.Fragment key={`${j}-${k}`}>
                  {line}
                  {k < arr.length - 1 && <br />}
                </React.Fragment>
              ));
            })}
          </span>
        );
      })}
    </div>
  );
}

export default ChatMessage;
