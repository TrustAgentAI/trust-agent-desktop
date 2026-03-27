import React from 'react';
import { CodeBlock } from '@/components/ui/CodeBlock';
import type { Message, HiredRole } from '@/lib/roleConfig';

interface ChatWindowProps {
  messages: Message[];
  isAgentThinking: boolean;
  activeRole: HiredRole | null;
}

export function ChatWindow({ messages, isAgentThinking, activeRole }: ChatWindowProps) {
  const bottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAgentThinking]);

  if (!activeRole) {
    return (
      <div
        style={{
          flex: 1,
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
            borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(135deg, var(--color-electric-blue), var(--color-ion-cyan))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            fontWeight: 800,
            color: '#fff',
          }}
        >
          T
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#E8EDF5', marginBottom: 4 }}>
            Welcome to Trust Agent
          </div>
          <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', maxWidth: 360 }}>
            Select an agent from the sidebar to begin a conversation, or visit the Marketplace to hire your first agent.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      {messages.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: 'var(--color-text-muted)',
            fontSize: '13px',
          }}
        >
          Start a conversation with {activeRole.name}. Type a message below.
        </div>
      )}

      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} agentName={activeRole.name} />
      ))}

      {isAgentThinking && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0' }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 'var(--radius-sm)',
              background: 'var(--color-surface-2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 700,
              color: 'var(--color-electric-blue)',
              flexShrink: 0,
            }}
          >
            {activeRole.name.charAt(0)}
          </div>
          <div
            style={{
              background: 'var(--color-surface-1)',
              borderLeft: '3px solid var(--color-electric-blue)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <ThinkingDots />
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
              Thinking...
            </span>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}

function MessageBubble({ message, agentName }: { message: Message; agentName: string }) {
  const isUser = message.role === 'user';
  const time = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        alignItems: 'flex-start',
        gap: 10,
        padding: '6px 0',
        animation: 'fadeIn 200ms ease',
      }}
    >
      {!isUser && (
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 'var(--radius-sm)',
            background: 'var(--color-surface-2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 700,
            color: 'var(--color-electric-blue)',
            flexShrink: 0,
          }}
        >
          {agentName.charAt(0)}
        </div>
      )}

      <div style={{ maxWidth: '70%', minWidth: 0 }}>
        <div
          style={{
            background: isUser ? 'var(--color-dark-navy)' : 'var(--color-surface-1)',
            borderLeft: isUser ? 'none' : '3px solid var(--color-electric-blue)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 14px',
          }}
        >
          <RenderedContent content={message.content} />
        </div>
        <div
          style={{
            fontSize: '10px',
            color: 'var(--color-text-mid)',
            marginTop: 4,
            textAlign: isUser ? 'right' : 'left',
            padding: '0 4px',
          }}
        >
          {time}
        </div>
      </div>
    </div>
  );
}

/**
 * Simple markdown-ish renderer: detects code blocks and renders paragraphs.
 */
function RenderedContent({ content }: { content: string }) {
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div style={{ fontSize: '13px', lineHeight: 1.6, color: '#E8EDF5', wordBreak: 'break-word' }}>
      {parts.map((part, i) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const lines = part.slice(3, -3).split('\n');
          const lang = lines[0]?.trim() || undefined;
          const code = (lang ? lines.slice(1) : lines).join('\n').trim();
          return <CodeBlock key={i} code={code} language={lang} />;
        }

        // Render inline code and bold
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
                      fontSize: '12px',
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
              // Convert newlines to <br>
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

function ThinkingDots() {
  return (
    <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 5,
            height: 5,
            borderRadius: '50%',
            background: 'var(--color-electric-blue)',
            animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
