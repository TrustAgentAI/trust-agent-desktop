import React from 'react';
import { Send, Mic, MicOff, Clock, Brain, AlertTriangle, Upload, FileText, Timer, Paperclip, X, MessageSquare, Volume2, VolumeX } from 'lucide-react';
import { EnvironmentRenderer, type EnvironmentConfig } from './EnvironmentRenderer';
import { ChatMessage, type ChatMessageData } from './ChatMessage';
import { ExamTimerBar, ExamMode, ExamReportView, type ExamDuration, type ExamStatus, type ExamReport } from './ExamMode';
import { useSession } from '@/store/sessionStore';
import { useAgentStore } from '@/store/agentStore';
import { shouldUseMockAgent, getMockResponse } from '@/lib/mockAgent';
import { wsClient } from '@/lib/ws';
import api from '@/lib/api';
import { getRoleAvatarUrl } from '@/lib/roleAvatar';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  evaluateSession,
  shouldForceEndSession,
  recordSessionUsage,
  type BreakSuggestion,
} from '@/lib/anti-dependency';
import { useAmbientAudio } from '@/hooks/useAmbientAudio';
import { useStreamingResponse, setupTokenStreaming } from '@/hooks/useStreamingResponse';

// Phase 10.3: Role categories that default to voice input
const VOICE_DEFAULT_CATEGORIES = ['daily-companion', 'elderly-companion', 'childrens-companion', 'mental-health'];

interface SessionViewProps {
  environmentConfig?: EnvironmentConfig;
  brainConnected?: boolean;
  brainLastSync?: string;
  onEndSession?: () => void;
  isChildAccount?: boolean;
  /** Phase 10.1: Ambient audio URL from environment JSON config */
  ambientAudioUrl?: string;
  /** Phase 10.3: Role category for voice-default detection */
  roleCategory?: string;
}

const ANTI_DEPENDENCY_MINS = 45;

// File types accepted for upload
const ACCEPTED_FILE_TYPES = '.pdf,.doc,.docx,.txt,.md,.png,.jpg,.jpeg,.csv';
const MAX_FILE_SIZE_MB = 10;

export function SessionView({
  environmentConfig,
  brainConnected,
  brainLastSync: _brainLastSync,
  onEndSession,
  isChildAccount = false,
  ambientAudioUrl,
  roleCategory,
}: SessionViewProps) {
  const { activeRoleId, roles } = useAgentStore();
  const { addMessage, getMessages } = useSession();
  const [isStreaming, setIsStreaming] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');

  // Phase 10.3: Default to voice mode for elderly/children roles
  const shouldDefaultVoice = roleCategory ? VOICE_DEFAULT_CATEGORIES.includes(roleCategory) : false;
  const [voiceActive, setVoiceActive] = React.useState(shouldDefaultVoice);

  // Phase 10.1: Ambient audio integration
  const ambientAudio = useAmbientAudio(ambientAudioUrl);

  // Phase 10.2: Streaming token support
  const streaming = useStreamingResponse();
  const [sessionStartedAt] = React.useState<number>(Date.now());
  const [sessionElapsed, setSessionElapsed] = React.useState(0);
  const [showDependencyReminder, setShowDependencyReminder] = React.useState(false);
  const [breakSuggestions, setBreakSuggestions] = React.useState<BreakSuggestion[]>([]);
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // tRPC session tracking
  const [sessionId, setSessionId] = React.useState<string | null>(null);

  // Upload state
  const [uploadedFile, setUploadedFile] = React.useState<{ name: string; size: number; type: string; dataUrl: string } | null>(null);
  const [showUploadPreview, setShowUploadPreview] = React.useState(false);

  // Exam mode state
  const [examStatus, setExamStatus] = React.useState<ExamStatus | null>(null);
  const [examDuration, setExamDuration] = React.useState<number>(0);
  const [examElapsed, setExamElapsed] = React.useState(0);
  const [examReport, setExamReport] = React.useState<ExamReport | null>(null);
  const examTimerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const activeRole = roles.find((r) => r.hireId === activeRoleId);
  const roleAvatarUrl = activeRole?.roleSlug ? getRoleAvatarUrl(activeRole.roleSlug) : undefined;
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

  // Session timer with anti-dependency checks
  React.useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - sessionStartedAt) / 1000);
      setSessionElapsed(elapsed);
      const elapsedMinutes = Math.floor(elapsed / 60);

      // Anti-dependency reminder at 45 minutes (legacy)
      if (elapsed >= ANTI_DEPENDENCY_MINS * 60 && !showDependencyReminder) {
        setShowDependencyReminder(true);
      }

      // Full anti-dependency evaluation every 60 seconds
      if (elapsed % 60 === 0 && elapsed > 0) {
        const suggestions = evaluateSession(elapsedMinutes, isChildAccount);
        if (suggestions.length > 0) {
          setBreakSuggestions(suggestions);
        }

        // B.10: Log dependency warnings to DB via tRPC
        if (suggestions.length > 0 && sessionId) {
          const warningType = suggestions.some((s) => s.isHardLimit) ? 'HARD_LIMIT' : 'WARNING_EMITTED';
          api.post('/trpc/sessions.logDependencyEvent', {
            json: {
              sessionId,
              eventType: warningType,
              elapsedMins: elapsedMinutes,
              details: suggestions.map((s) => s.message).join('; '),
            },
          }).catch((err: unknown) => console.error('Failed to log dependency event:', err));
        }

        // Force end for children hitting hard limit
        if (shouldForceEndSession(elapsedMinutes, isChildAccount)) {
          recordSessionUsage(elapsedMinutes);

          // B.10: Log force end to DB
          if (sessionId) {
            api.post('/trpc/sessions.logDependencyEvent', {
              json: {
                sessionId,
                eventType: 'FORCE_END',
                elapsedMins: elapsedMinutes,
                details: 'Child account daily limit reached - session force ended',
              },
            }).catch((err: unknown) => console.error('Failed to log force end:', err));
          }

          const forceMsg: ChatMessageData = {
            id: `sys-force-${Date.now()}`,
            role: 'agent',
            content: suggestions.find((s) => s.isHardLimit)?.companionMessage ||
              'Your session time is up for today. See you tomorrow!',
            timestamp: Date.now(),
          };
          if (activeRoleId) addMessage(activeRoleId, forceMsg);
          if (onEndSession) onEndSession();
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionStartedAt, showDependencyReminder, isChildAccount, activeRoleId, addMessage, onEndSession]);

  // Exam timer
  React.useEffect(() => {
    if (examStatus === 'in_progress') {
      examTimerRef.current = setInterval(() => {
        setExamElapsed((prev) => {
          const next = prev + 1;
          if (next >= examDuration) {
            // Timer ended - trigger marking
            if (examTimerRef.current) clearInterval(examTimerRef.current);
            setExamStatus('marking');
            // Generate mock exam report
            setTimeout(() => {
              setExamReport(generateMockExamReport(examDuration));
              setExamStatus('complete');
            }, 2000);
          }
          return next;
        });
      }, 1000);
    }
    return () => {
      if (examTimerRef.current) clearInterval(examTimerRef.current);
    };
  }, [examStatus, examDuration]);

  // File upload handler
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      const errMsg: ChatMessageData = {
        id: `err-${Date.now()}`,
        role: 'agent',
        content: `File is too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`,
        timestamp: Date.now(),
      };
      if (activeRoleId) addMessage(activeRoleId, errMsg);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setUploadedFile({
        name: file.name,
        size: file.size,
        type: file.type,
        dataUrl: reader.result as string,
      });
      setShowUploadPreview(true);
    };
    reader.readAsDataURL(file);

    // Reset input so same file can be selected again
    e.target.value = '';
  };

  // B.7: Upload document via tRPC S3 signed URL
  const handleUploadSubmit = async () => {
    if (!uploadedFile || !activeRoleId) return;

    // B.7: Get presigned upload URL from tRPC
    let documentId: string | null = null;
    try {
      const uploadResult = await api.post<{
        documentId: string;
        presignedUploadUrl: string;
        documentUrl: string;
        s3Key: string;
      }>('/trpc/sessions.uploadDocument', {
        json: {
          hireId: activeRoleId,
          fileName: uploadedFile.name,
          mimeType: uploadedFile.type,
          fileSizeBytes: uploadedFile.size,
        },
      });

      documentId = uploadResult.documentId;

      // Upload file to S3 via presigned URL
      const fileBlob = await fetch(uploadedFile.dataUrl).then((r) => r.blob());
      await fetch(uploadResult.presignedUploadUrl, {
        method: 'PUT',
        body: fileBlob,
        headers: { 'Content-Type': uploadedFile.type },
      });

      // Link document to active session if one exists
      if (sessionId && documentId) {
        await api.post('/trpc/sessions.linkDocumentToSession', {
          json: { documentId, sessionId },
        });
      }
    } catch (err) {
      console.error('Failed to upload document via tRPC:', err);
      // Fall through to still show the message in chat
    }

    // Add user message with file reference
    const ext = uploadedFile.name.split('.').pop()?.toLowerCase() || '';
    let uploadContext = 'Please review this document and provide feedback.';
    if (['pdf', 'doc', 'docx', 'txt', 'md'].includes(ext)) {
      uploadContext = 'I have uploaded a document for review. Please mark it against the appropriate mark scheme and provide inline feedback with marks awarded.';
    }
    if (uploadedFile.name.toLowerCase().includes('cv') || uploadedFile.name.toLowerCase().includes('resume')) {
      uploadContext = 'I have uploaded my CV/resume. Please provide a detailed critique with specific improvements.';
    }
    if (uploadedFile.name.toLowerCase().includes('pitch') || uploadedFile.name.toLowerCase().includes('deck')) {
      uploadContext = 'I have uploaded a pitch deck. Please provide investor-level analysis with specific feedback on each section.';
    }

    const userMsg: ChatMessageData = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: `[Uploaded: ${uploadedFile.name} (${formatFileSize(uploadedFile.size)})]\n\n${uploadContext}`,
      timestamp: Date.now(),
      metadata: { fileName: uploadedFile.name, fileSize: uploadedFile.size, fileType: uploadedFile.type, documentId },
    };
    addMessage(activeRoleId, userMsg);

    // Simulate companion marking response (will be replaced by real AI when gateway is connected)
    setIsStreaming(true);
    setTimeout(async () => {
      if (shouldUseMockAgent()) {
        const mock = await getMockResponse();
        const agentMsg: ChatMessageData = {
          id: mock.messageId,
          role: 'agent',
          content: getMarkingResponse(uploadedFile.name),
          timestamp: Date.now(),
          metadata: { isMarking: true },
        };
        addMessage(activeRoleId, agentMsg);
      }
      setIsStreaming(false);
    }, 1500);

    setUploadedFile(null);
    setShowUploadPreview(false);
  };

  // B.6: Exam mode handlers - wired to tRPC
  const handleStartExam = async (duration: ExamDuration) => {
    setExamDuration(duration * 60);
    setExamElapsed(0);
    setExamStatus('in_progress');
    setExamReport(null);

    // B.6: Start exam session via tRPC
    if (activeRoleId) {
      try {
        const result = await api.post<{ sessionId: string; examModeActive: boolean }>(
          '/trpc/sessions.startSession',
          { json: { hireId: activeRoleId, mode: 'exam', examMode: true, timeBudgetMins: duration } }
        );
        if (result.sessionId) {
          setSessionId(result.sessionId);
        }
      } catch (err) {
        console.error('Failed to start exam session via tRPC:', err);
      }

      const examMsg: ChatMessageData = {
        id: `sys-exam-${Date.now()}`,
        role: 'agent',
        content: `**Exam mode activated.** Duration: ${duration} minutes.\n\nConditions:\n- No hints or encouragement\n- Timed environment\n- All answers will be marked when time ends\n\nYou may begin. Good luck.`,
        timestamp: Date.now(),
        metadata: { isExamMode: true },
      };
      addMessage(activeRoleId, examMsg);
    }
  };

  const handleEndExam = async () => {
    if (examTimerRef.current) clearInterval(examTimerRef.current);
    setExamStatus('marking');

    // Generate exam report
    const report = generateMockExamReport(examElapsed);

    // B.6: Save exam results to DB via tRPC
    if (sessionId) {
      try {
        await api.post('/trpc/sessions.endSession', {
          json: {
            sessionId,
            examScore: report.marksAwarded,
            examTotal: report.totalMarks,
            examPercentage: report.percentage,
            examGrade: report.grade,
          },
        });
      } catch (err) {
        console.error('Failed to save exam results via tRPC:', err);
      }
    }

    setTimeout(() => {
      setExamReport(report);
      setExamStatus('complete');
    }, 1500);
  };

  // Phase 10.2: Setup WebSocket token streaming listener
  React.useEffect(() => {
    if (!activeRoleId) return;

    const cleanup = setupTokenStreaming(
      (token) => {
        streaming.appendToken(token);
      },
      (fullContent) => {
        const finalContent = streaming.finishStreaming();
        const agentMsg: ChatMessageData = {
          id: `agent-stream-${Date.now()}`,
          role: 'agent',
          content: finalContent || fullContent,
          timestamp: Date.now(),
        };
        addMessage(activeRoleId, agentMsg);
        setIsStreaming(false);
      },
    );

    return cleanup;
  }, [activeRoleId, addMessage]);

  // Scroll to bottom on new messages
  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isStreaming, streaming.streamedContent]);

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

    // Phase 10.2: Show typing indicator IMMEDIATELY on send
    setIsStreaming(true);
    streaming.startStreaming();

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
      streaming.resetStreaming();
      return;
    }

    try {
      // Phase 10.2: Emit message - tokens will stream back via WebSocket
      wsClient.emit('agent:message', { hireId: activeRoleId, content });
      // Note: isStreaming is set to false in the token streaming 'done' handler above
    } catch {
      const errorMsg: ChatMessageData = {
        id: `err-${Date.now()}`,
        role: 'agent',
        content: 'Failed to send message. Please check your connection.',
        timestamp: Date.now(),
      };
      addMessage(activeRoleId, errorMsg);
      setIsStreaming(false);
      streaming.resetStreaming();
    }
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
          }}
        >
          <EmptyState
            icon={<MessageSquare size={24} />}
            title="Choose a companion to start"
            description="Select a companion from the sidebar to begin a session, or take the onboarding quiz to find the perfect match for your needs."
            ctaText={roles.length === 0 ? 'Browse Marketplace' : undefined}
            ctaAction={roles.length === 0 ? () => { window.location.hash = '/marketplace'; } : undefined}
          />
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

            {/* Phase 10.1: Ambient audio controls */}
            {ambientAudioUrl && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  onClick={ambientAudio.toggleMute}
                  title={ambientAudio.isMuted ? 'Unmute ambient audio' : 'Mute ambient audio'}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: ambientAudio.isMuted ? 'var(--color-text-muted)' : accent,
                    cursor: 'pointer',
                    padding: 2,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {ambientAudio.isMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={ambientAudio.volume}
                  onChange={(e) => ambientAudio.setVolume(parseFloat(e.target.value))}
                  title={`Volume: ${Math.round(ambientAudio.volume * 100)}%`}
                  style={{
                    width: 60,
                    height: 3,
                    appearance: 'none',
                    background: `linear-gradient(to right, ${accent} ${ambientAudio.volume * 100}%, rgba(255,255,255,0.1) ${ambientAudio.volume * 100}%)`,
                    borderRadius: 2,
                    outline: 'none',
                    cursor: 'pointer',
                    opacity: ambientAudio.isMuted ? 0.3 : 1,
                  }}
                />
              </div>
            )}
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

        {/* Exam timer bar */}
        {examStatus === 'in_progress' && (
          <ExamTimerBar
            durationSeconds={examDuration}
            elapsedSeconds={examElapsed}
            onEndEarly={handleEndExam}
          />
        )}

        {/* Anti-dependency reminder */}
        {showDependencyReminder && !examStatus && (
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

        {/* Break suggestions from anti-dependency system */}
        {breakSuggestions.length > 0 && !examStatus && breakSuggestions.map((suggestion, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 20px',
              background: suggestion.level === 'critical' ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)',
              borderBottom: `1px solid ${suggestion.level === 'critical' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)'}`,
              fontSize: 12,
              color: suggestion.level === 'critical' ? 'var(--color-error)' : '#F59E0B',
              fontFamily: 'var(--font-sans)',
            }}
          >
            <AlertTriangle size={14} />
            <span>{suggestion.message}</span>
            {!suggestion.isHardLimit && (
              <button
                onClick={() => setBreakSuggestions([])}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: suggestion.level === 'critical' ? 'var(--color-error)' : '#F59E0B',
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
            )}
          </div>
        ))}

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
              {roleAvatarUrl ? (
                <img
                  src={roleAvatarUrl}
                  alt={activeRole.roleName}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    objectFit: 'cover',
                  }}
                />
              ) : (
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
              )}
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
              avatarUrl={roleAvatarUrl}
            />
          ))}

          {/* Phase 10.2: Show streaming content or typing indicator */}
          {isStreaming && streaming.streamedContent && (
            <ChatMessage
              message={{
                id: 'streaming',
                role: 'agent',
                content: streaming.streamedContent,
                timestamp: Date.now(),
              }}
              agentName={activeRole.roleName}
              accentColor={accent}
              avatarUrl={roleAvatarUrl}
            />
          )}
          {isStreaming && !streaming.streamedContent && (
            <ChatMessage
              message={{ id: 'typing', role: 'agent', content: '', timestamp: Date.now() }}
              agentName={activeRole.roleName}
              accentColor={accent}
              avatarUrl={roleAvatarUrl}
              isTyping
            />
          )}

          <div ref={bottomRef} />
        </div>

        {/* Phase 10.3: Voice orb - prominent for elderly/children roles, standard for others */}
        {voiceActive && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: shouldDefaultVoice ? '24px 0' : '16px 0',
              flexShrink: 0,
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <button
              onClick={() => setVoiceActive(!voiceActive)}
              style={{
                width: shouldDefaultVoice ? 88 : 64,
                height: shouldDefaultVoice ? 88 : 64,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${accent}60, ${accent}20)`,
                boxShadow: `0 0 ${shouldDefaultVoice ? '60' : '40'}px ${accent}30`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'pulse 2s ease-in-out infinite',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 200ms ease',
              }}
            >
              <Mic size={shouldDefaultVoice ? 32 : 24} color="#fff" />
            </button>
            {shouldDefaultVoice && (
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: accent,
                  fontFamily: 'var(--font-sans)',
                }}
              >
                Tap to talk
              </span>
            )}
          </div>
        )}

        {/* Upload preview bar */}
        {showUploadPreview && uploadedFile && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 24px',
              background: 'rgba(30,111,255,0.06)',
              borderTop: '1px solid rgba(30,111,255,0.15)',
              flexShrink: 0,
            }}
          >
            <FileText size={16} style={{ color: 'var(--color-electric-blue)', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#E8EDF5', fontFamily: 'var(--font-sans)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {uploadedFile.name}
              </div>
              <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
                {formatFileSize(uploadedFile.size)}
              </div>
            </div>
            <button
              onClick={handleUploadSubmit}
              style={{
                padding: '5px 14px',
                background: 'var(--color-electric-blue)',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                color: '#fff',
                fontSize: 12,
                fontWeight: 600,
                fontFamily: 'var(--font-sans)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Upload size={12} />
              Submit for Review
            </button>
            <button
              onClick={() => { setUploadedFile(null); setShowUploadPreview(false); }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--color-text-muted)',
                cursor: 'pointer',
                padding: 4,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Phase 10.3: Prominent voice input for elderly/children roles */}
        {shouldDefaultVoice && !voiceActive && !examStatus && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              padding: '12px 24px',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(0,0,0,0.1)',
              flexShrink: 0,
            }}
          >
            <button
              onClick={() => setVoiceActive(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '14px 32px',
                background: `${accent}20`,
                border: `2px solid ${accent}40`,
                borderRadius: 'var(--radius-xl)',
                color: accent,
                fontSize: 16,
                fontWeight: 700,
                fontFamily: 'var(--font-sans)',
                cursor: 'pointer',
                transition: 'all 200ms ease',
              }}
            >
              <Mic size={20} />
              Tap to talk
            </button>
          </div>
        )}

        {/* Input area */}
        <div
          style={{
            padding: '12px 24px 16px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(0,0,0,0.15)',
            flexShrink: 0,
            // Phase 10.3: Text input is secondary for voice-default roles
            ...(shouldDefaultVoice && !voiceActive ? { opacity: 0.6 } : {}),
          }}
        >
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_FILE_TYPES}
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />

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
            {/* File upload button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Upload file for review (essay, CV, pitch deck)"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32,
                borderRadius: 'var(--radius-md)',
                background: 'transparent',
                border: 'none',
                color: 'var(--color-text-muted)',
                cursor: 'pointer',
                transition: 'all 150ms ease',
                flexShrink: 0,
              }}
            >
              <Paperclip size={16} />
            </button>

            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              disabled={isStreaming || examStatus === 'marking'}
              placeholder={examStatus === 'in_progress' ? 'Type your answer...' : 'Type a message...'}
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

            {/* Exam mode button */}
            {!examStatus && (
              <button
                onClick={() => setExamStatus('setup')}
                title="Start exam mode"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 32,
                  height: 32,
                  borderRadius: 'var(--radius-md)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--color-text-muted)',
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                  flexShrink: 0,
                }}
              >
                <Timer size={16} />
              </button>
            )}

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

        {/* Exam mode overlays */}
        {examStatus === 'setup' && (
          <ExamMode
            examStatus="setup"
            onStartExam={handleStartExam}
            onEndExam={handleEndExam}
            onSubmitForMarking={() => {}}
            onDismiss={() => setExamStatus(null)}
          />
        )}
        {examStatus === 'complete' && examReport && (
          <ExamReportView
            report={examReport}
            onDismiss={() => {
              setExamStatus(null);
              setExamReport(null);
              setExamElapsed(0);
            }}
          />
        )}
      </div>
    </EnvironmentRenderer>
  );
}

// --- Helper functions ---

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getMarkingResponse(fileName: string): string {
  const isCV = fileName.toLowerCase().includes('cv') || fileName.toLowerCase().includes('resume');
  const isPitch = fileName.toLowerCase().includes('pitch') || fileName.toLowerCase().includes('deck');

  if (isCV) {
    return `**CV Review: ${fileName}**\n\nI have reviewed your CV in detail. Here is my feedback:\n\n**Structure (7/10)**\nYour layout is clear but could benefit from stronger section headers. Consider adding a professional summary at the top.\n\n**Content (6/10)**\nYour experience descriptions focus too much on duties rather than achievements. Use the STAR method: Situation, Task, Action, Result.\n\n**Impact (5/10)**\nAdd quantifiable metrics where possible. Instead of "managed a team", say "managed a team of 8, delivering 3 projects on time".\n\n**Key improvements:**\n1. Add a 2-3 line professional summary\n2. Quantify achievements with numbers\n3. Tailor keywords to your target role\n4. Remove outdated experience (10+ years old)\n5. Check for consistent formatting throughout`;
  }

  if (isPitch) {
    return `**Pitch Deck Analysis: ${fileName}**\n\nI have reviewed your pitch deck from an investor perspective.\n\n**Problem Statement (8/10)**\nClearly articulated. The market pain point is well defined.\n\n**Solution (6/10)**\nNeeds more specificity. Show the product, not just describe it. Add a demo screenshot or workflow diagram.\n\n**Market Size (5/10)**\nTAM/SAM/SOM breakdown is missing. Investors need to see the addressable market clearly.\n\n**Business Model (7/10)**\nRevenue model is clear. Add unit economics and customer acquisition cost.\n\n**Team (6/10)**\nHighlight relevant experience. Why is THIS team the right one to solve THIS problem?\n\n**The Ask (7/10)**\nClear funding amount. Add a use-of-funds breakdown.\n\n**Overall: Strong foundation, needs refinement on market sizing and solution demo.**`;
  }

  return `**Document Review: ${fileName}**\n\nI have reviewed your submission and marked it against the appropriate criteria.\n\n**Content & Knowledge (7/10)**\nGood understanding of core concepts demonstrated. Some areas need deeper analysis.\n\n**Structure & Organisation (6/10)**\nLogical flow but transitions between sections could be stronger.\n\n**Analysis & Critical Thinking (5/10)**\nMore evaluation needed. Move beyond description to analysis - ask "so what?" after each point.\n\n**Technical Accuracy (8/10)**\nFew factual errors. Key terminology used correctly.\n\n**Marks Awarded: 26/40 (65%)**\n\n**Where marks were dropped:**\n1. Insufficient evaluation in Section 2\n2. Missing counter-arguments\n3. Conclusion does not tie back to the question\n\n**Improvement plan:**\n- Practise writing analytical paragraphs using the PEE chain (Point, Evidence, Explain)\n- Review the mark scheme criteria before your next attempt\n- Aim for balanced arguments with both sides considered`;
}

function generateMockExamReport(timeUsedSeconds: number): ExamReport {
  const answers: ExamReport['answers'] = [
    { questionNumber: 1, studentAnswer: '', marksAwarded: 4, marksAvailable: 4, feedback: 'Correct application of the formula with clear working shown.', correct: true },
    { questionNumber: 2, studentAnswer: '', marksAwarded: 2, marksAvailable: 4, feedback: 'Partial credit. You identified the correct method but made an arithmetic error in step 3.', correct: false },
    { questionNumber: 3, studentAnswer: '', marksAwarded: 3, marksAvailable: 3, feedback: 'Excellent. All three points correctly identified with examples.', correct: true },
    { questionNumber: 4, studentAnswer: '', marksAwarded: 1, marksAvailable: 5, feedback: 'The approach was correct but the evaluation was too superficial. You needed to discuss at least two counter-arguments.', correct: false },
    { questionNumber: 5, studentAnswer: '', marksAwarded: 4, marksAvailable: 4, feedback: 'Well structured response with clear reasoning throughout.', correct: true },
  ];

  const totalMarks = answers.reduce((s, a) => s + a.marksAvailable, 0);
  const marksAwarded = answers.reduce((s, a) => s + a.marksAwarded, 0);
  const percentage = Math.round((marksAwarded / totalMarks) * 100);
  const grade = percentage >= 70 ? 'A' : percentage >= 60 ? 'B' : percentage >= 50 ? 'C' : percentage >= 40 ? 'D' : 'F';

  return {
    totalMarks,
    marksAwarded,
    percentage,
    grade,
    answers,
    improvementPlan: [
      'Practise evaluation questions using the PEE chain method',
      'Review arithmetic fundamentals to avoid calculation errors under pressure',
      'When asked to "evaluate", always include at least two perspectives',
      'Time management: allocate marks-per-minute and stick to it',
    ],
    timeUsed: timeUsedSeconds,
    timeDuration: timeUsedSeconds,
  };
}

export default SessionView;
