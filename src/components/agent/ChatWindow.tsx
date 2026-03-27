import React from 'react';
import { Send } from 'lucide-react';
import { CodeBlock } from '@/components/ui/CodeBlock';
import { useAgentStore } from '@/store/agentStore';
import { useSession } from '@/store/sessionStore';
import { shouldUseMockAgent, getMockResponse } from '@/lib/mockAgent';
import { wsClient } from '@/lib/ws';

interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: number;
}

export function ChatWindow() {
  const { activeRoleId, roles } = useAgentStore();
  const { addMessage, getMessages } = useSession();
  const [isStreaming, setIsStreaming] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const activeRole = roles.find((r) => r.hireId === activeRoleId);
  const messages: ChatMessage[] = activeRoleId ? getMessages(activeRoleId) : [];

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  const handleSend = async () => {
    if (!inputValue.trim() || !activeRoleId || isStreaming) return;

    const content = inputValue.trim();
    setInputValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = '40px';
    }

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: Date.now(),
    };
    addMessage(activeRoleId, userMsg);

    setIsStreaming(true);

    // If WS not connected, use mock agent
    if (shouldUseMockAgent()) {
      const mock = await getMockResponse();
      const agentMsg: ChatMessage = {
        id: mock.messageId,
        role: 'agent',
        content: mock.fullContent,
        timestamp: Date.now(),
      };
      addMessage(activeRoleId, agentMsg);
      setIsStreaming(false);
      return;
    }

    // Connected mode: send through WebSocket
    try {
      wsClient.emit('agent:message', {
        hireId: activeRoleId,
        content,
      });
    } catch {
      const errorMsg: ChatMessage = {
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

  // Empty state: no role selected
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
            Welcome to Trust Agent
          </div>
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)', maxWidth: 360 }}>
            Select a role from the sidebar to begin a conversation, or visit the Marketplace to hire your first role.
          </div>
        </div>
      </div>
    );
  }

  const wsDisconnected = wsClient.getStatus() !== 'connected';

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Messages area */}
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
        {/* Empty state with messages */}
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
                background: 'var(--color-mid-blue)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                fontWeight: 800,
                color: 'var(--color-ion-cyan)',
                fontFamily: 'var(--font-sans)',
              }}
            >
              {activeRole.roleName.charAt(0)}
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#E8EDF5' }}>
              {activeRole.roleName}
            </div>
            <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
              Send a message or use voice to begin
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} agentName={activeRole.roleName} />
        ))}

        {isStreaming && (
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
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--color-electric-blue)',
                flexShrink: 0,
              }}
            >
              {activeRole.roleName.charAt(0)}
            </div>
            <div
              style={{
                background: 'var(--color-navy-2)',
                border: '1px solid var(--color-electric-blue)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span
                style={{
                  width: 2,
                  height: 16,
                  background: 'var(--color-ion-cyan)',
                  borderRadius: 1,
                  animation: 'blink 1s step-end infinite',
                }}
              />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Reconnecting banner */}
      {wsDisconnected && (
        <div
          style={{
            padding: '6px 24px',
            background: 'rgba(204,51,51,0.08)',
            borderTop: '1px solid rgba(204,51,51,0.2)',
            fontSize: 12,
            color: 'var(--color-error)',
            textAlign: 'center',
          }}
        >
          Reconnecting to Trust Agent...
        </div>
      )}

      {/* Input area */}
      <div
        style={{
          padding: '12px 24px 16px',
          borderTop: '1px solid var(--color-border)',
          background: 'var(--color-navy-2)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 8,
            background: 'var(--color-surface-1)',
            border: '1px solid var(--color-border)',
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
              background:
                inputValue.trim() && !isStreaming
                  ? 'var(--color-electric-blue)'
                  : 'transparent',
              border: 'none',
              color:
                inputValue.trim() && !isStreaming
                  ? '#fff'
                  : 'var(--color-text-mid)',
              cursor:
                inputValue.trim() && !isStreaming
                  ? 'pointer'
                  : 'not-allowed',
              transition: 'all 150ms ease',
              flexShrink: 0,
            }}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message, agentName }: { message: ChatMessage; agentName: string }) {
  const isUser = message.role === 'user';
  const [showTime, setShowTime] = React.useState(false);
  const time = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

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
            fontSize: 12,
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
            background: isUser ? 'var(--color-electric-blue)' : 'var(--color-navy-2)',
            border: isUser ? 'none' : '1px solid var(--color-electric-blue)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 14px',
          }}
        >
          <RenderedContent content={message.content} />
        </div>
        {showTime && (
          <div
            style={{
              fontSize: 11,
              color: 'var(--color-text-muted)',
              marginTop: 4,
              textAlign: isUser ? 'right' : 'left',
              padding: '0 4px',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {time}
          </div>
        )}
      </div>
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

export default ChatWindow;
