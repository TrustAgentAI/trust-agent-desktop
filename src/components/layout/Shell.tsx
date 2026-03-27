import React from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TitleBar } from '@/components/layout/TitleBar';
import { ChatWindow } from '@/components/agent/ChatWindow';
import { MessageInput } from '@/components/agent/MessageInput';
import { AgentCard } from '@/components/agent/AgentCard';
import { TaskThread } from '@/components/agent/TaskThread';
import { VoiceBar } from '@/components/agent/VoiceBar';
import { MarketplacePanel } from '@/components/marketplace/MarketplacePanel';
import { PermissionManager } from '@/components/permissions/PermissionManager';
import { useAgentStore } from '@/store/agentStore';
import { useSessionStore } from '@/store/sessionStore';
import { usePermissionStore } from '@/store/permissionStore';
import { gateway } from '@/lib/gateway';
import type { Message } from '@/lib/roleConfig';

type NavItem = 'chat' | 'tasks' | 'marketplace' | 'permissions' | 'settings';

export function Shell() {
  const {
    hiredRoles,
    activeRoleId,
    activeSession,
    setActiveRole,
    loadHiredRoles,
    startSession,
  } = useAgentStore();

  const {
    messages,
    isAgentThinking,
    addMessage,
    setThinking,
    setCurrentSession,
    registerSession,
  } = useSessionStore();

  const { loadGrants } = usePermissionStore();

  const [activeNav, setActiveNav] = React.useState<NavItem>('chat');
  const [rightPanelOpen, setRightPanelOpen] = React.useState(true);

  // Load hired roles and permissions on mount
  React.useEffect(() => {
    loadHiredRoles().catch(() => {});
    loadGrants().catch(() => {});
  }, [loadHiredRoles, loadGrants]);

  // Handle role selection
  const handleSelectRole = async (roleId: string) => {
    setActiveRole(roleId);
    setActiveNav('chat');

    // Start a session for this role if not already active
    try {
      const session = await startSession(roleId);
      registerSession(session);
      setCurrentSession(session.sessionId);
    } catch {
      // Session start may fail if not authenticated
    }
  };

  // Handle sending a message
  const handleSendMessage = async (content: string) => {
    if (!activeSession) return;

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content,
      timestamp: Date.now(),
    };
    addMessage(userMessage);
    setThinking(true);

    try {
      const response = await gateway.sessions.sendMessage(
        activeSession.sessionId,
        content,
      );

      const agentMessage: Message = {
        id: response.messageId,
        role: 'agent',
        content: response.content,
        timestamp: response.timestamp,
        metadata: response.metadata,
      };
      addMessage(agentMessage);
    } catch {
      const errorMessage: Message = {
        id: `err_${Date.now()}`,
        role: 'agent',
        content: 'Failed to get a response. Please check your connection and try again.',
        timestamp: Date.now(),
      };
      addMessage(errorMessage);
    } finally {
      setThinking(false);
    }
  };

  // Find the active role object
  const activeRole = hiredRoles.find((r) => r.id === activeRoleId) || null;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        overflow: 'hidden',
      }}
    >
      <TitleBar
        rightPanelOpen={rightPanelOpen}
        onToggleRightPanel={() => setRightPanelOpen((p) => !p)}
      />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Sidebar */}
        <Sidebar
          hiredRoles={hiredRoles}
          activeRoleId={activeRoleId}
          activeNav={activeNav}
          onSelectRole={handleSelectRole}
          onNavigate={setActiveNav}
        />

        {/* Centre Content */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            background: 'var(--color-navy-2)',
          }}
        >
          {activeNav === 'chat' && (
            <>
              {activeRole && <VoiceBar sessionActive={!!activeSession} />}
              <ChatWindow
                messages={messages}
                isAgentThinking={isAgentThinking}
                activeRole={activeRole}
              />
              <MessageInput
                onSend={handleSendMessage}
                disabled={!activeSession}
              />
            </>
          )}

          {activeNav === 'tasks' && activeSession && (
            <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
              <TaskThread
                task={{
                  id: 'current',
                  title: 'Active task execution',
                  agentId: activeRoleId || '',
                  status: 'running',
                  steps: activeSession.taskSteps || [],
                  createdAt: activeSession.startedAt,
                }}
                onCancel={() => {}}
              />
            </div>
          )}

          {activeNav === 'tasks' && !activeSession && (
            <EmptyState message="Select an agent to view active tasks." />
          )}

          {activeNav === 'marketplace' && <MarketplacePanel />}

          {activeNav === 'permissions' && (
            <PermissionManager activeRoleId={activeRoleId} />
          )}

          {activeNav === 'settings' && (
            <EmptyState message="Settings will be available in a future update." />
          )}
        </div>

        {/* Right Panel */}
        {rightPanelOpen && (
          <RightPanel activeRole={activeRole} />
        )}
      </div>
    </div>
  );
}

function RightPanel({ activeRole }: { activeRole: ReturnType<typeof Object> | null }) {
  return (
    <div
      style={{
        width: 320,
        minWidth: 320,
        height: '100%',
        background: 'var(--color-dark-navy)',
        borderLeft: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Agent context */}
      <div style={{ padding: 16, borderBottom: '1px solid var(--color-border)' }}>
        <div
          style={{
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--color-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: 12,
          }}
        >
          Context
        </div>
        {activeRole ? (
          <AgentCard role={activeRole as any} />
        ) : (
          <div style={{ fontSize: '12px', color: 'var(--color-text-mid)' }}>
            No agent selected
          </div>
        )}
      </div>

      {/* Permissions summary */}
      <div style={{ padding: 16, borderBottom: '1px solid var(--color-border)' }}>
        <div
          style={{
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--color-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: 8,
          }}
        >
          Permissions
        </div>
        <div style={{ fontSize: '12px', color: 'var(--color-text-mid)' }}>
          {activeRole
            ? 'Manage folder access in the Permissions tab.'
            : 'Select an agent to manage permissions.'}
        </div>
      </div>

      {/* Audit log placeholder */}
      <div style={{ flex: 1, padding: 16, overflowY: 'auto' }}>
        <div
          style={{
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--color-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: 8,
          }}
        >
          Audit Log
        </div>
        <div style={{ fontSize: '12px', color: 'var(--color-text-mid)' }}>
          Agent activity will appear here as actions are performed.
        </div>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
      }}
    >
      <div
        style={{
          textAlign: 'center',
          maxWidth: 320,
          color: 'var(--color-text-muted)',
          fontSize: '14px',
          lineHeight: 1.6,
        }}
      >
        {message}
      </div>
    </div>
  );
}
