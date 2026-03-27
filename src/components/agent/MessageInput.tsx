import React from 'react';
import { Send, Paperclip, Mic } from 'lucide-react';

interface MessageInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  onAttach?: () => void;
  onVoiceToggle?: () => void;
}

const MAX_CHARS = 4000;

export function MessageInput({ onSend, disabled, onAttach, onVoiceToggle }: MessageInputProps) {
  const [value, setValue] = React.useState('');
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const charCount = value.length;
  const canSend = value.trim().length > 0 && !disabled;

  const handleSend = () => {
    if (!canSend) return;
    onSend(value.trim());
    setValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = '40px';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (newValue.length <= MAX_CHARS) {
      setValue(newValue);
    }
    // Auto-resize
    if (textareaRef.current) {
      textareaRef.current.style.height = '40px';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + 'px';
    }
  };

  const handleAttach = async () => {
    if (onAttach) {
      onAttach();
      return;
    }
    try {
      const { openFileDialog } = await import('@/lib/tauri-compat');
      const selected = await openFileDialog();
      if (selected) {
        setValue((v) => v + `\n[Attached: ${selected}]`);
      }
    } catch {
      // Dialog cancelled or not available
    }
  };

  return (
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
          transition: 'border-color 150ms ease',
        }}
      >
        {/* Attach */}
        <IconButton
          onClick={handleAttach}
          disabled={disabled}
          title="Attach file"
        >
          <Paperclip size={16} />
        </IconButton>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={disabled ? 'Select an agent to start chatting' : 'Type a message...'}
          rows={1}
          style={{
            flex: 1,
            resize: 'none',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#E8EDF5',
            fontFamily: 'var(--font-sans)',
            fontSize: '13px',
            lineHeight: '20px',
            minHeight: 40,
            maxHeight: 160,
            padding: '8px 0',
            opacity: disabled ? 0.5 : 1,
          }}
        />

        {/* Voice */}
        <IconButton
          onClick={onVoiceToggle}
          disabled={disabled}
          title="Voice input"
        >
          <Mic size={16} />
        </IconButton>

        {/* Send */}
        <button
          onClick={handleSend}
          disabled={!canSend}
          title="Send message"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 32,
            height: 32,
            borderRadius: 'var(--radius-md)',
            background: canSend ? 'var(--color-electric-blue)' : 'transparent',
            border: 'none',
            color: canSend ? '#fff' : 'var(--color-text-mid)',
            cursor: canSend ? 'pointer' : 'not-allowed',
            transition: 'all 150ms ease',
            flexShrink: 0,
          }}
        >
          <Send size={16} />
        </button>
      </div>

      {/* Character count */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginTop: 4,
          fontSize: '10px',
          color: charCount > MAX_CHARS * 0.9 ? 'var(--color-error)' : 'var(--color-text-mid)',
          fontFamily: 'var(--font-mono)',
        }}
      >
        {charCount}/{MAX_CHARS}
      </div>
    </div>
  );
}

function IconButton({
  children,
  onClick,
  disabled,
  title,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
}) {
  const [hovered, setHovered] = React.useState(false);

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 32,
        height: 32,
        borderRadius: 'var(--radius-md)',
        background: hovered && !disabled ? 'rgba(255,255,255,0.05)' : 'transparent',
        border: 'none',
        color: disabled ? 'var(--color-text-mid)' : 'var(--color-text-muted)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 150ms ease',
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  );
}
