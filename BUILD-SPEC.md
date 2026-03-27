# TRUST AGENT DESKTOP — MASTER CODEX BUILD PROMPT
## Version 1.0 | AgentCore LTD | Confidential

---

## CONTEXT & PRODUCT IDENTITY

You are building **TrustAgent Desktop** — the local agent runtime client for Trust Agent (trust-agent.ai), operated by AgentCore LTD (Company No. 17114811, 20 Wenlock Road, London, England, N1 7GU).

Trust Agent is an audited AI role agent marketplace. Companies hire AI role agents (CMO, CFO, Full Stack Developer, Design Engineer, etc.) via the marketplace. TrustAgent Desktop is the software that runs on the client's machine after hiring — it is where they interact with their hired agent daily.

**Core architecture principle:** Trust Agent is a SaaS config gateway, NOT a compute provider. The LLM runs on the client's own infrastructure using their own API keys. Trust Agent provides: role configuration, audit pipeline, permission management, the marketplace, and billing. No mock data. No seeded data. Everything connects to production databases, real S3 buckets, and live APIs.

---

## BRAND SYSTEM — EMBED IN ALL GENERATED CODE

### Colours
```
--color-dark-navy:     #0A1628   /* Primary background, dark surfaces */
--color-navy-2:        #0D1F3C   /* Cards, table headers, section bg dark mode */
--color-electric-blue: #1E6FFF   /* Primary brand — CTAs, links, borders, buttons */
--color-ion-cyan:      #00D4FF   /* Accent — table header text, badges, LED reference */
--color-mid-blue:      #1A3A6B   /* Subheadings, secondary elements, gradient midpoint */
--color-light-blue-bg: #EBF2FF   /* Callout fills, alert backgrounds */
--color-row-alt:       #F0F5FF   /* Alternating table rows */
--color-text-mid:      #2D4A7A   /* Secondary body text, metadata */
--color-text-muted:    #8899BB   /* Captions, timestamps, placeholders */
--color-white:         #FFFFFF
--color-success:       #00AA78
--color-border-blue:   #C5D5F0
--color-error:         #CC3333
```

### Typography
```
Primary:   Manrope (Google Fonts)
  ExtraBold 800 — all headlines, hero text, device names
  Bold 700      — subheadings, button labels, table headers
  SemiBold 600  — nav labels, UI elements, card titles
  Regular 400   — all body copy

Monospace: JetBrains Mono — code blocks, API keys, hashes, terminal output
```

### Type Scale
```
Display:    52-64px ExtraBold 800 — Electric Blue on dark
H1:         40-48px ExtraBold 800 — White on dark / Dark Navy on light
H2:         28-34px ExtraBold 800 — bottom border Electric Blue
H3:         22-26px Bold 700      — Mid Blue
Body Large: 22px Regular 400
Body:       18-20px Regular 400
Caption:    15-16px Regular 400   — Text Muted colour
Code:       17-18px JetBrains Mono on #F8F9FC bg with Electric Blue left border
```

### Components
```
Cards dark:     bg #0D1F3C, border 1px #1E6FFF, radius 8px, padding 24px
Cards light:    bg #FFFFFF, border 1px #C5D5F0, radius 8px, padding 24px
Table headers:  fill #0D1F3C, text #00D4FF Manrope Bold 700 17px, border 1px #1E6FFF
Table rows:     alternating #FFFFFF / #F0F5FF, border 1px #C5D5F0
Buttons primary: fill #1E6FFF, text white Manrope SemiBold 600, radius 6px
Buttons secondary: transparent, border 1.5px #1E6FFF, text #1E6FFF
Input fields:   border 1px #C5D5F0, radius 6px, focus 2px #1E6FFF
Code blocks:    fill #F8F9FC, left border 8px solid #1E6FFF, JetBrains Mono 17px
```

### $TAGNT Token Display
```
"$" character in Ion Cyan #00D4FF
"TAGNT" in Electric Blue #1E6FFF
Always Manrope ExtraBold 800
```

### Brand Rules (never violate)
- Always "Trust Agent" — never TRUST AGENT, never trustagent, never Trust-Agent
- Always "AgentCore LTD" in legal contexts
- Token ticker always $TAGNT — never $TRUST, never $TA
- No warm tones anywhere (no orange, amber, yellow, purple, warm red)
- No generic cybersecurity aesthetics: no padlocks, no checkmarks, no cartoon robots

---

## REPOSITORY STRUCTURE

```
trust-agent-desktop/
├── src-tauri/                    # Rust/Tauri backend shell
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   ├── capabilities/
│   │   ├── default.json          # Base permissions (minimal)
│   │   ├── agent-fs.json         # File system scopes (user-granted)
│   │   └── enterprise.json       # Enterprise admin permissions
│   └── src/
│       ├── main.rs
│       ├── commands/
│       │   ├── fs.rs             # File system commands with path validation
│       │   ├── agent.rs          # Agent invocation commands
│       │   ├── permissions.rs    # Permission grant/revoke commands
│       │   └── system.rs         # System info, OS integration
│       └── sidecar/
│           └── mod.rs            # Python sidecar spawn/management
├── src/                          # React frontend
│   ├── main.tsx
│   ├── App.tsx
│   ├── styles/
│   │   ├── globals.css           # CSS variables (brand system above)
│   │   └── components.css
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Shell.tsx         # App shell with sidebar nav
│   │   │   ├── Sidebar.tsx       # Role list, nav, marketplace link
│   │   │   └── TitleBar.tsx      # Custom title bar (Tauri)
│   │   ├── agent/
│   │   │   ├── ChatWindow.tsx    # Main agent conversation UI
│   │   │   ├── VoiceBar.tsx      # Voice input/output controls
│   │   │   ├── TaskThread.tsx    # Individual task thread
│   │   │   └── AgentCard.tsx     # Role identity display
│   │   ├── permissions/
│   │   │   ├── PermissionManager.tsx  # Grant/revoke folder access
│   │   │   └── DriveSelector.tsx      # Drive/folder picker
│   │   ├── marketplace/
│   │   │   └── MarketplacePanel.tsx   # Embedded marketplace webview
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── Input.tsx
│   │       ├── Badge.tsx         # Trust Score badges
│   │       └── CodeBlock.tsx
│   ├── hooks/
│   │   ├── useAgent.ts           # Agent session management
│   │   ├── useWebSocket.ts       # Real-time gateway connection
│   │   ├── usePermissions.ts     # FS permission state
│   │   └── useVoice.ts           # Voice STT/TTS pipeline
│   ├── store/
│   │   ├── agentStore.ts         # Zustand agent state
│   │   ├── sessionStore.ts       # Session/thread state
│   │   └── permissionStore.ts    # Permission scope state
│   └── lib/
│       ├── gateway.ts            # Trust Agent API client (tRPC)
│       ├── ws.ts                 # WebSocket client
│       └── roleConfig.ts         # Role configuration types
├── agent-runtime/                # Python sidecar
│   ├── main.py                   # Entry point (spawned by Tauri)
│   ├── runtime/
│   │   ├── orchestrator.py       # LLM orchestration
│   │   ├── memory.py             # SQLite session memory
│   │   ├── tools.py              # FS tools, OS tools
│   │   └── audit.py             # Action logging → WS stream
│   ├── voice/
│   │   ├── pipeline.py           # Pipecat STT→LLM→TTS
│   │   ├── stt.py                # Deepgram integration
│   │   └── tts.py                # ElevenLabs integration
│   └── requirements.txt
├── package.json
├── vite.config.ts
└── tsconfig.json
```

---

## TASK LIST — IMPLEMENT IN ORDER

### PHASE 1: FOUNDATION

---

### TASK 1 — Tauri Project Scaffold

Initialize Tauri 2.x project with React + TypeScript + Vite.

```bash
npm create tauri-app@latest trust-agent-desktop -- --template react-ts
cd trust-agent-desktop
npm install
```

**tauri.conf.json** — configure:
```json
{
  "productName": "Trust Agent",
  "identifier": "ai.trust-agent.desktop",
  "version": "1.0.0",
  "app": {
    "windows": [{
      "title": "Trust Agent",
      "width": 1280,
      "height": 800,
      "minWidth": 960,
      "minHeight": 600,
      "decorations": false,
      "transparent": true
    }],
    "security": {
      "csp": {
        "default-src": "'self'",
        "script-src": "'self'",
        "style-src": "'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src": "'self' https://fonts.gstatic.com",
        "connect-src": "'self' https://api.trust-agent.ai wss://api.trust-agent.ai https://app.trust-agent.ai",
        "img-src": "'self' data: https://assets.trust-agent.ai",
        "frame-src": "https://app.trust-agent.ai"
      }
    }
  }
}
```

**Cargo.toml** dependencies:
```toml
[dependencies]
tauri = { version = "2", features = ["protocol-asset"] }
tauri-plugin-fs = "2"
tauri-plugin-shell = "2"
tauri-plugin-store = "2"
tauri-plugin-notification = "2"
tauri-plugin-updater = "2"
tauri-plugin-dialog = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
tokio = { version = "1", features = ["full"] }
```

---

### TASK 2 — Capabilities (Permission System)

**src-tauri/capabilities/default.json**
```json
{
  "identifier": "default",
  "windows": ["main"],
  "permissions": [
    "core:event:default",
    "core:window:default",
    "core:app:default",
    { "identifier": "fs:read-files", "allow": ["$APPDATA/trust-agent/*", "$RESOURCE/*"] },
    { "identifier": "fs:write-files", "allow": ["$APPDATA/trust-agent/*"] },
    "shell:allow-execute",
    "store:allow-load",
    "store:allow-set",
    "store:allow-get",
    "notification:allow-notify"
  ]
}
```

**src-tauri/capabilities/agent-fs.json**
This capability is dynamically enabled per user grant. Paths are populated at runtime from the user's permission grants stored in the Tauri store.
```json
{
  "identifier": "agent-fs",
  "windows": ["main"],
  "permissions": [
    { "identifier": "fs:read-files", "allow": [] },
    { "identifier": "fs:write-files", "allow": [] }
  ]
}
```

**src-tauri/src/commands/permissions.rs**
```rust
use tauri::{command, AppHandle};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone)]
pub struct PermissionGrant {
    pub path: String,
    pub access: String, // "read" | "read-write"
    pub agent_role_id: String,
}

#[command]
pub async fn grant_folder_permission(
    app: AppHandle,
    grant: PermissionGrant,
) -> Result<bool, String> {
    // Validate path is not traversal attack
    if grant.path.contains("..") || grant.path.contains("~") {
        return Err("Invalid path".to_string());
    }
    // Store in Tauri store for persistence
    // Emit event to Python sidecar with updated scopes
    Ok(true)
}

#[command]
pub async fn revoke_folder_permission(
    app: AppHandle,
    path: String,
    agent_role_id: String,
) -> Result<bool, String> {
    Ok(true)
}

#[command]
pub async fn list_permissions(
    agent_role_id: String,
) -> Result<Vec<PermissionGrant>, String> {
    Ok(vec![])
}
```

---

### TASK 3 — Python Sidecar Spawn

**src-tauri/src/sidecar/mod.rs**
```rust
use tauri::{AppHandle, Manager};
use tauri_plugin_shell::ShellExt;

pub fn spawn_agent_runtime(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let sidecar_command = app.shell().sidecar("agent-runtime")?;
    let (mut rx, _child) = sidecar_command.spawn()?;

    let app_handle = app.clone();
    tauri::async_runtime::spawn(async move {
        while let Some(event) = rx.recv().await {
            match event {
                tauri_plugin_shell::process::CommandEvent::Stdout(line) => {
                    // Parse JSON events from Python runtime
                    if let Ok(text) = String::from_utf8(line) {
                        app_handle.emit("agent-event", text).ok();
                    }
                }
                tauri_plugin_shell::process::CommandEvent::Stderr(line) => {
                    if let Ok(text) = String::from_utf8(line) {
                        app_handle.emit("agent-error", text).ok();
                    }
                }
                _ => {}
            }
        }
    });
    Ok(())
}
```

---

### TASK 4 — React Frontend Shell

**src/styles/globals.css**
```css
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');

:root {
  --color-dark-navy:     #0A1628;
  --color-navy-2:        #0D1F3C;
  --color-electric-blue: #1E6FFF;
  --color-ion-cyan:      #00D4FF;
  --color-mid-blue:      #1A3A6B;
  --color-light-blue-bg: #EBF2FF;
  --color-row-alt:       #F0F5FF;
  --color-text-mid:      #2D4A7A;
  --color-text-muted:    #8899BB;
  --color-white:         #FFFFFF;
  --color-success:       #00AA78;
  --color-border-blue:   #C5D5F0;
  --color-error:         #CC3333;

  --font-primary: 'Manrope', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
  --radius-xl: 12px;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body, #root {
  height: 100%;
  width: 100%;
  overflow: hidden;
  background: var(--color-dark-navy);
  color: var(--color-white);
  font-family: var(--font-primary);
  font-size: 18px;
  -webkit-font-smoothing: antialiased;
}

/* Scrollbars */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: var(--color-dark-navy); }
::-webkit-scrollbar-thumb { background: var(--color-mid-blue); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: var(--color-electric-blue); }
```

**src/components/layout/Shell.tsx**
Complete three-panel layout:
- Left sidebar (240px): app logo, hired role list, nav links, marketplace button
- Centre panel (flex): agent chat/task view
- Right panel (320px, collapsible): context, permissions, audit log

```tsx
import React, { useState } from 'react';
import Sidebar from './Sidebar';
import TitleBar from './TitleBar';

interface ShellProps {
  children: React.ReactNode;
}

export default function Shell({ children }: ShellProps) {
  const [rightPanelOpen, setRightPanelOpen] = useState(false);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: 'var(--color-dark-navy)',
    }}>
      <TitleBar onToggleRightPanel={() => setRightPanelOpen(p => !p)} />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar />
        <main style={{
          flex: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          borderLeft: '1px solid rgba(30, 111, 255, 0.2)',
          borderRight: rightPanelOpen ? '1px solid rgba(30, 111, 255, 0.2)' : 'none',
        }}>
          {children}
        </main>
        {rightPanelOpen && (
          <aside style={{
            width: '320px',
            background: 'var(--color-navy-2)',
            borderLeft: '1px solid rgba(30, 111, 255, 0.2)',
            overflow: 'auto',
            padding: '24px',
          }}>
            {/* Permissions / Audit log panel */}
          </aside>
        )}
      </div>
    </div>
  );
}
```

**src/components/layout/TitleBar.tsx**
Custom Tauri title bar (decorations: false):
```tsx
import { getCurrentWindow } from '@tauri-apps/api/window';

export default function TitleBar({ onToggleRightPanel }: { onToggleRightPanel: () => void }) {
  const win = getCurrentWindow();

  return (
    <div
      data-tauri-drag-region
      style={{
        height: '44px',
        background: 'var(--color-navy-2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        borderBottom: '1px solid rgba(30, 111, 255, 0.3)',
        userSelect: 'none',
      }}
    >
      {/* Trust Agent wordmark left */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{
          fontFamily: 'var(--font-primary)',
          fontWeight: 800,
          fontSize: '16px',
          color: 'var(--color-white)',
          letterSpacing: '-0.3px',
        }}>
          Trust Agent
        </span>
        <span style={{
          fontSize: '11px',
          fontFamily: 'var(--font-mono)',
          color: 'var(--color-text-muted)',
          background: 'rgba(0,0,0,0.3)',
          padding: '2px 8px',
          borderRadius: '4px',
          border: '1px solid rgba(0, 212, 255, 0.2)',
        }}>
          Desktop v1.0
        </span>
      </div>

      {/* Window controls right */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button onClick={onToggleRightPanel}
          style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '14px' }}>
          ⊞
        </button>
        <button onClick={() => win.minimize()}
          style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '14px' }}>
          −
        </button>
        <button onClick={() => win.close()}
          style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '14px',
            borderRadius: '50%', padding: '2px 6px' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-error)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
          ×
        </button>
      </div>
    </div>
  );
}
```

---

### TASK 5 — WebSocket Client (Real-time Gateway)

**src/lib/ws.ts**

```typescript
const WS_URL = import.meta.env.VITE_WS_URL || 'wss://api.trust-agent.ai/ws';

type MessageHandler = (data: unknown) => void;

class TrustAgentWS {
  private ws: WebSocket | null = null;
  private handlers: Map<string, MessageHandler[]> = new Map();
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private sessionToken: string | null = null;

  connect(sessionToken: string) {
    this.sessionToken = sessionToken;
    this._connect();
  }

  private _connect() {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    this.ws = new WebSocket(`${WS_URL}?token=${this.sessionToken}`);

    this.ws.onopen = () => {
      console.log('[TrustAgent WS] Connected');
      this._emit('connected', {});
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        this._emit(msg.type, msg.payload);
      } catch {
        console.error('[TrustAgent WS] Malformed message', event.data);
      }
    };

    this.ws.onclose = () => {
      console.log('[TrustAgent WS] Disconnected — reconnecting in 3s');
      this._emit('disconnected', {});
      this.reconnectTimeout = setTimeout(() => this._connect(), 3000);
    };

    this.ws.onerror = (err) => {
      console.error('[TrustAgent WS] Error', err);
    };
  }

  send(type: string, payload: unknown) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    }
  }

  on(event: string, handler: MessageHandler) {
    if (!this.handlers.has(event)) this.handlers.set(event, []);
    this.handlers.get(event)!.push(handler);
  }

  off(event: string, handler: MessageHandler) {
    const handlers = this.handlers.get(event) ?? [];
    this.handlers.set(event, handlers.filter(h => h !== handler));
  }

  private _emit(event: string, data: unknown) {
    (this.handlers.get(event) ?? []).forEach(h => h(data));
  }

  disconnect() {
    this.ws?.close();
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
  }
}

export const wsClient = new TrustAgentWS();
```

**src/hooks/useWebSocket.ts**
```typescript
import { useEffect, useCallback } from 'react';
import { wsClient } from '../lib/ws';

export function useWebSocket(sessionToken: string | null) {
  useEffect(() => {
    if (!sessionToken) return;
    wsClient.connect(sessionToken);
    return () => wsClient.disconnect();
  }, [sessionToken]);

  const on = useCallback((event: string, handler: (data: unknown) => void) => {
    wsClient.on(event, handler);
    return () => wsClient.off(event, handler);
  }, []);

  const send = useCallback((type: string, payload: unknown) => {
    wsClient.send(type, payload);
  }, []);

  return { on, send };
}
```

---

### TASK 6 — tRPC Gateway Client

**src/lib/gateway.ts**
```typescript
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../../../server/src/router'; // shared types

const API_URL = import.meta.env.VITE_API_URL || 'https://api.trust-agent.ai';

let authToken: string | null = null;

export function setAuthToken(token: string) {
  authToken = token;
}

export const gateway = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${API_URL}/trpc`,
      headers() {
        return authToken
          ? { Authorization: `Bearer ${authToken}` }
          : {};
      },
    }),
  ],
});

// Role configuration fetch
export async function fetchRoleConfig(roleId: string) {
  return gateway.role.getConfig.query({ roleId });
}

// Session token for WS auth
export async function createAgentSession(hireId: string) {
  return gateway.session.create.mutate({ hireId });
}

// Audit event submission
export async function submitAuditEvent(event: {
  hireId: string;
  action: string;
  metadata: Record<string, unknown>;
}) {
  return gateway.audit.submit.mutate(event);
}
```

---

### TASK 7 — Agent Chat UI

**src/components/agent/ChatWindow.tsx**

Full chat interface connected to real WebSocket stream. No mock messages.

```tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useAgentStore } from '../../store/agentStore';
import VoiceBar from './VoiceBar';

interface Message {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: string;
  toolUse?: { tool: string; result: string };
}

interface ChatWindowProps {
  hireId: string;
  sessionToken: string;
  roleName: string;
}

export default function ChatWindow({ hireId, sessionToken, roleName }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamBuffer, setStreamBuffer] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const { on, send } = useWebSocket(sessionToken);

  useEffect(() => {
    // Listen for streaming agent response tokens
    const offToken = on('agent:token', (data: unknown) => {
      const { token } = data as { token: string };
      setStreamBuffer(prev => prev + token);
      setIsStreaming(true);
    });

    // Listen for stream complete
    const offDone = on('agent:done', (data: unknown) => {
      const { messageId, fullContent, toolUse } = data as {
        messageId: string;
        fullContent: string;
        toolUse?: { tool: string; result: string };
      };
      setMessages(prev => [...prev, {
        id: messageId,
        role: 'agent',
        content: fullContent,
        timestamp: new Date().toISOString(),
        toolUse,
      }]);
      setStreamBuffer('');
      setIsStreaming(false);
    });

    // Listen for tool execution events
    const offTool = on('agent:tool', (data: unknown) => {
      // Show tool use indicator in UI
      console.log('[Tool use]', data);
    });

    return () => { offToken(); offDone(); offTool(); };
  }, [on]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamBuffer]);

  const handleSend = useCallback(() => {
    if (!input.trim() || isStreaming) return;
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    send('agent:message', {
      hireId,
      content: input.trim(),
      sessionToken,
    });
    setInput('');
  }, [input, isStreaming, send, hireId, sessionToken]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'var(--color-dark-navy)',
    }}>
      {/* Messages area */}
      <div style={{ flex: 1, overflow: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {messages.length === 0 && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            opacity: 0.5,
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⬡</div>
            <div style={{ fontWeight: 800, fontSize: '20px', color: 'var(--color-electric-blue)' }}>
              {roleName} is ready
            </div>
            <div style={{ color: 'var(--color-text-muted)', marginTop: '8px', fontSize: '16px' }}>
              Send a message or use voice to begin
            </div>
          </div>
        )}

        {messages.map(msg => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              gap: '12px',
              alignItems: 'flex-start',
            }}
          >
            {msg.role === 'agent' && (
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'var(--color-navy-2)',
                border: '1.5px solid var(--color-electric-blue)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                flexShrink: 0,
                color: 'var(--color-ion-cyan)',
                fontWeight: 700,
              }}>
                TA
              </div>
            )}

            <div style={{
              maxWidth: '72%',
              padding: '12px 16px',
              borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
              background: msg.role === 'user'
                ? 'var(--color-electric-blue)'
                : 'var(--color-navy-2)',
              border: msg.role === 'agent' ? '1px solid rgba(30,111,255,0.3)' : 'none',
              color: 'var(--color-white)',
              lineHeight: 1.6,
              fontSize: '17px',
            }}>
              {msg.content}
              {msg.toolUse && (
                <div style={{
                  marginTop: '8px',
                  padding: '8px 12px',
                  background: 'rgba(0,0,0,0.3)',
                  borderRadius: '4px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '13px',
                  color: 'var(--color-ion-cyan)',
                  borderLeft: '3px solid var(--color-ion-cyan)',
                }}>
                  ⟢ {msg.toolUse.tool}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Streaming indicator */}
        {isStreaming && streamBuffer && (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: 'var(--color-navy-2)', border: '1.5px solid var(--color-electric-blue)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '14px', flexShrink: 0, color: 'var(--color-ion-cyan)', fontWeight: 700,
            }}>TA</div>
            <div style={{
              maxWidth: '72%', padding: '12px 16px',
              borderRadius: '12px 12px 12px 2px',
              background: 'var(--color-navy-2)',
              border: '1px solid rgba(30,111,255,0.3)',
              color: 'var(--color-white)', lineHeight: 1.6, fontSize: '17px',
            }}>
              {streamBuffer}
              <span style={{
                display: 'inline-block', width: '2px', height: '16px',
                background: 'var(--color-ion-cyan)', marginLeft: '2px',
                animation: 'blink 1s infinite',
                verticalAlign: 'text-bottom',
              }} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Voice bar */}
      <VoiceBar sessionToken={sessionToken} hireId={hireId} />

      {/* Text input */}
      <div style={{
        padding: '16px 24px 24px',
        borderTop: '1px solid rgba(30,111,255,0.2)',
        display: 'flex',
        gap: '12px',
        alignItems: 'flex-end',
      }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Message ${roleName}...`}
          disabled={isStreaming}
          rows={1}
          style={{
            flex: 1,
            background: 'var(--color-navy-2)',
            border: '1px solid var(--color-border-blue)',
            borderRadius: '8px',
            padding: '12px 16px',
            color: 'var(--color-white)',
            fontFamily: 'var(--font-primary)',
            fontSize: '17px',
            resize: 'none',
            outline: 'none',
            lineHeight: 1.5,
            maxHeight: '120px',
            overflow: 'auto',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--color-electric-blue)'}
          onBlur={e => e.target.style.borderColor = 'var(--color-border-blue)'}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isStreaming}
          style={{
            padding: '12px 20px',
            background: input.trim() && !isStreaming ? 'var(--color-electric-blue)' : 'rgba(30,111,255,0.3)',
            border: 'none',
            borderRadius: '8px',
            color: 'var(--color-white)',
            fontFamily: 'var(--font-primary)',
            fontWeight: 600,
            fontSize: '15px',
            cursor: input.trim() && !isStreaming ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s',
          }}
        >
          Send
        </button>
      </div>

      <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>
    </div>
  );
}
```

---

### TASK 8 — Voice Pipeline (Pipecat)

**agent-runtime/voice/pipeline.py**
```python
import asyncio
import os
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.task import PipelineTask
from pipecat.pipeline.runner import PipelineRunner
from pipecat.transports.local.audio import LocalAudioTransport, LocalAudioParams
from pipecat.services.deepgram import DeepgramSTTService
from pipecat.services.elevenlabs import ElevenLabsTTSService
from pipecat.processors.aggregators.openai_llm_context import OpenAILLMContextAggregator
from pipecat.frames.frames import LLMMessagesFrame

class TrustAgentVoicePipeline:
    def __init__(self, role_config: dict, session_token: str):
        self.role_config = role_config
        self.session_token = session_token
        self.pipeline = None

    async def build(self):
        transport = LocalAudioTransport(LocalAudioParams(
            audio_in_enabled=True,
            audio_out_enabled=True,
            vad_enabled=True,
        ))

        stt = DeepgramSTTService(
            api_key=os.environ["DEEPGRAM_API_KEY"],
            model="nova-2",
        )

        tts = ElevenLabsTTSService(
            api_key=os.environ["ELEVENLABS_API_KEY"],
            voice_id=self.role_config.get("voice_id", "21m00Tcm4TlvDq8ikWAM"),
        )

        self.pipeline = Pipeline([
            transport.input(),
            stt,
            # LLM handled by orchestrator.py
            tts,
            transport.output(),
        ])

    async def start(self):
        if not self.pipeline:
            await self.build()
        runner = PipelineRunner()
        task = PipelineTask(self.pipeline)
        await runner.run(task)

    def stop(self):
        if self.pipeline:
            self.pipeline.stop()
```

**src/components/agent/VoiceBar.tsx**
```tsx
import React, { useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface VoiceBarProps {
  sessionToken: string;
  hireId: string;
}

export default function VoiceBar({ sessionToken, hireId }: VoiceBarProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const toggleVoice = useCallback(async () => {
    if (isListening) {
      await invoke('stop_voice_session', { hireId });
      setIsListening(false);
    } else {
      await invoke('start_voice_session', { hireId, sessionToken });
      setIsListening(true);
    }
  }, [isListening, hireId, sessionToken]);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '12px 24px',
      gap: '12px',
    }}>
      <button
        onClick={toggleVoice}
        style={{
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          border: `2px solid ${isListening ? 'var(--color-ion-cyan)' : 'var(--color-border-blue)'}`,
          background: isListening ? 'rgba(0, 212, 255, 0.15)' : 'transparent',
          color: isListening ? 'var(--color-ion-cyan)' : 'var(--color-text-muted)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          transition: 'all 0.2s',
          boxShadow: isListening ? '0 0 16px rgba(0, 212, 255, 0.3)' : 'none',
        }}
      >
        {isListening ? '⏹' : '🎙'}
      </button>
      {isListening && (
        <div style={{
          display: 'flex',
          gap: '3px',
          alignItems: 'center',
        }}>
          {[1, 2, 3, 4, 5].map(i => (
            <div
              key={i}
              style={{
                width: '3px',
                borderRadius: '2px',
                background: 'var(--color-ion-cyan)',
                animation: `voiceWave 0.8s ease-in-out ${i * 0.1}s infinite alternate`,
                height: `${8 + Math.random() * 16}px`,
              }}
            />
          ))}
        </div>
      )}
      <style>{`
        @keyframes voiceWave {
          from { transform: scaleY(0.4); opacity: 0.6; }
          to { transform: scaleY(1.2); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
```

---

### TASK 9 — Permission Manager UI

**src/components/permissions/PermissionManager.tsx**
```tsx
import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';

interface PermissionGrant {
  path: string;
  access: 'read' | 'read-write';
  agentRoleId: string;
}

interface PermissionManagerProps {
  agentRoleId: string;
  roleName: string;
}

export default function PermissionManager({ agentRoleId, roleName }: PermissionManagerProps) {
  const [grants, setGrants] = useState<PermissionGrant[]>([]);

  useEffect(() => {
    invoke<PermissionGrant[]>('list_permissions', { agentRoleId })
      .then(setGrants)
      .catch(console.error);
  }, [agentRoleId]);

  const addFolder = async (access: 'read' | 'read-write') => {
    const selected = await open({ directory: true, multiple: false });
    if (!selected || Array.isArray(selected)) return;

    await invoke('grant_folder_permission', {
      grant: { path: selected, access, agentRoleId },
    });
    setGrants(prev => [...prev, { path: selected, access, agentRoleId }]);
  };

  const revokeGrant = async (path: string) => {
    await invoke('revoke_folder_permission', { path, agentRoleId });
    setGrants(prev => prev.filter(g => g.path !== path));
  };

  return (
    <div>
      <h3 style={{
        fontFamily: 'var(--font-primary)',
        fontWeight: 700,
        fontSize: '16px',
        color: 'var(--color-ion-cyan)',
        marginBottom: '16px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        fontSize: '12px',
      }}>
        {roleName} — File Access
      </h3>

      {grants.length === 0 ? (
        <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', marginBottom: '16px' }}>
          No folders granted. Add a folder to give this agent access to local files.
        </p>
      ) : (
        <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {grants.map(g => (
            <div key={g.path} style={{
              padding: '10px 12px',
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '6px',
              border: '1px solid rgba(197, 213, 240, 0.2)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px',
            }}>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  color: 'var(--color-white)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {g.path}
                </div>
                <div style={{
                  fontSize: '11px',
                  color: g.access === 'read-write' ? 'var(--color-ion-cyan)' : 'var(--color-text-muted)',
                  marginTop: '2px',
                }}>
                  {g.access === 'read-write' ? 'Read & Write' : 'Read Only'}
                </div>
              </div>
              <button
                onClick={() => revokeGrant(g.path)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-error)',
                  cursor: 'pointer',
                  fontSize: '14px',
                  padding: '4px',
                  flexShrink: 0,
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
        <button
          onClick={() => addFolder('read')}
          style={{
            padding: '8px 14px',
            background: 'transparent',
            border: '1.5px solid var(--color-electric-blue)',
            borderRadius: '6px',
            color: 'var(--color-electric-blue)',
            fontFamily: 'var(--font-primary)',
            fontWeight: 600,
            fontSize: '13px',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          + Add folder (read only)
        </button>
        <button
          onClick={() => addFolder('read-write')}
          style={{
            padding: '8px 14px',
            background: 'transparent',
            border: '1.5px solid var(--color-ion-cyan)',
            borderRadius: '6px',
            color: 'var(--color-ion-cyan)',
            fontFamily: 'var(--font-primary)',
            fontWeight: 600,
            fontSize: '13px',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          + Add folder (read & write)
        </button>
      </div>
    </div>
  );
}
```

---

### TASK 10 — Marketplace Embedded Panel

**src/components/marketplace/MarketplacePanel.tsx**
```tsx
import React, { useRef } from 'react';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';

const MARKETPLACE_URL = 'https://app.trust-agent.ai/marketplace';

interface MarketplacePanelProps {
  sessionToken: string;
  onRoleHired?: (hireId: string) => void;
}

export default function MarketplacePanel({ sessionToken, onRoleHired }: MarketplacePanelProps) {
  // Embedded webview pointing at live marketplace
  // Auth token injected via URL param or postMessage
  const embedUrl = `${MARKETPLACE_URL}?embed=desktop&token=${encodeURIComponent(sessionToken)}`;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'var(--color-dark-navy)',
    }}>
      <div style={{
        padding: '16px 24px',
        borderBottom: '1px solid rgba(30,111,255,0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <span style={{
            fontFamily: 'var(--font-primary)',
            fontWeight: 800,
            fontSize: '18px',
            color: 'var(--color-white)',
          }}>
            Marketplace
          </span>
          <span style={{
            marginLeft: '10px',
            fontSize: '12px',
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-mono)',
          }}>
            trust-agent.ai
          </span>
        </div>
      </div>

      <webview
        src={embedUrl}
        style={{
          flex: 1,
          border: 'none',
          background: 'var(--color-dark-navy)',
        }}
        // Tauri webview — communicates with app via postMessage
        // marketplace emits: { type: 'role:hired', hireId: string }
      />
    </div>
  );
}
```

---

### TASK 11 — Python Agent Runtime

**agent-runtime/runtime/orchestrator.py**
```python
import asyncio
import json
import os
import sys
from typing import AsyncGenerator
import httpx

class AgentOrchestrator:
    """
    LLM orchestration for a hired role agent.
    Trust Agent is config-only — LLM runs on customer infrastructure.
    Role config fetched from Trust Agent gateway.
    """

    def __init__(self, hire_id: str, session_token: str):
        self.hire_id = hire_id
        self.session_token = session_token
        self.role_config = None
        self.memory = None
        self.api_key = os.environ.get("CUSTOMER_LLM_API_KEY")
        self.llm_base_url = os.environ.get("CUSTOMER_LLM_BASE_URL", "https://api.openai.com/v1")
        self.model = os.environ.get("CUSTOMER_LLM_MODEL", "gpt-4o")

    async def load_config(self):
        """Fetch role config from Trust Agent gateway."""
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{os.environ['TA_API_URL']}/api/role-config/{self.hire_id}",
                headers={"Authorization": f"Bearer {self.session_token}"}
            )
            resp.raise_for_status()
            self.role_config = resp.json()

    async def stream_response(self, messages: list[dict]) -> AsyncGenerator[str, None]:
        """Stream LLM response tokens to Tauri frontend via stdout."""
        if not self.role_config:
            await self.load_config()

        system_prompt = self.role_config["systemPrompt"]
        all_messages = [{"role": "system", "content": system_prompt}] + messages

        async with httpx.AsyncClient() as client:
            async with client.stream(
                "POST",
                f"{self.llm_base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": self.model,
                    "messages": all_messages,
                    "stream": True,
                    "max_tokens": 4096,
                },
                timeout=60.0,
            ) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data = line[6:]
                        if data == "[DONE]":
                            break
                        try:
                            chunk = json.loads(data)
                            delta = chunk["choices"][0]["delta"]
                            if "content" in delta and delta["content"]:
                                token = delta["content"]
                                # Emit to Tauri via stdout JSON
                                print(json.dumps({"type": "agent:token", "payload": {"token": token}}), flush=True)
                                yield token
                        except (json.JSONDecodeError, KeyError):
                            continue

    def log_action(self, action: str, metadata: dict):
        """Emit audit event via stdout for Tauri to forward to WS."""
        print(json.dumps({
            "type": "audit:event",
            "payload": {
                "hireId": self.hire_id,
                "action": action,
                "metadata": metadata,
                "timestamp": asyncio.get_event_loop().time(),
            }
        }), flush=True)
```

**agent-runtime/main.py**
```python
"""
TrustAgent Desktop — Python Sidecar Runtime
Spawned by Tauri, communicates via stdin/stdout JSON events.
"""
import asyncio
import json
import sys
import os
from runtime.orchestrator import AgentOrchestrator
from runtime.memory import AgentMemory

async def main():
    orchestrators: dict[str, AgentOrchestrator] = {}
    memories: dict[str, AgentMemory] = {}

    # Read commands from Tauri via stdin
    loop = asyncio.get_event_loop()

    while True:
        try:
            line = await loop.run_in_executor(None, sys.stdin.readline)
            if not line:
                break

            cmd = json.loads(line.strip())
            cmd_type = cmd.get("type")
            payload = cmd.get("payload", {})

            if cmd_type == "agent:init":
                hire_id = payload["hireId"]
                session_token = payload["sessionToken"]
                orchestrators[hire_id] = AgentOrchestrator(hire_id, session_token)
                memories[hire_id] = AgentMemory(hire_id)
                await orchestrators[hire_id].load_config()
                print(json.dumps({"type": "agent:ready", "payload": {"hireId": hire_id}}), flush=True)

            elif cmd_type == "agent:message":
                hire_id = payload["hireId"]
                content = payload["content"]
                if hire_id not in orchestrators:
                    continue

                orch = orchestrators[hire_id]
                mem = memories[hire_id]

                messages = await mem.get_history()
                messages.append({"role": "user", "content": content})

                full_response = ""
                async for token in orch.stream_response(messages):
                    full_response += token

                await mem.add_message("user", content)
                await mem.add_message("assistant", full_response)

                message_id = f"agent-{asyncio.get_event_loop().time()}"
                print(json.dumps({
                    "type": "agent:done",
                    "payload": {"messageId": message_id, "fullContent": full_response}
                }), flush=True)

            elif cmd_type == "agent:shutdown":
                hire_id = payload.get("hireId")
                if hire_id and hire_id in orchestrators:
                    del orchestrators[hire_id]
                    del memories[hire_id]

        except json.JSONDecodeError:
            continue
        except Exception as e:
            print(json.dumps({"type": "runtime:error", "payload": {"error": str(e)}}), flush=True)

if __name__ == "__main__":
    asyncio.run(main())
```

---

### TASK 12 — Environment Variables

**Required env vars — production only, no defaults for secrets:**

```
# Trust Agent Gateway
VITE_API_URL=https://api.trust-agent.ai
VITE_WS_URL=wss://api.trust-agent.ai/ws
TA_API_URL=https://api.trust-agent.ai

# AWS
AWS_REGION=eu-west-2
AWS_ACCESS_KEY_ID=[YOUR_AWS_ACCESS_KEY]
AWS_SECRET_ACCESS_KEY=[YOUR_AWS_SECRET]
S3_ASSETS_BUCKET=trust-agent-assets
S3_PRIVATE_BUCKET=trust-agent-private
S3_PUBLIC_BUCKET=trust-agent-public

# Database
DATABASE_URL=[YOUR_NEON_POSTGRESQL_URL]

# Voice (customer-configured)
DEEPGRAM_API_KEY=[CUSTOMER_DEEPGRAM_KEY]
ELEVENLABS_API_KEY=[CUSTOMER_ELEVENLABS_KEY]

# Customer LLM (customer brings their own)
CUSTOMER_LLM_API_KEY=[CUSTOMER_LLM_KEY]
CUSTOMER_LLM_BASE_URL=https://api.openai.com/v1
CUSTOMER_LLM_MODEL=gpt-4o
```

---

### TASK 13 — Build & Package Scripts

**package.json scripts:**
```json
{
  "scripts": {
    "dev": "tauri dev",
    "build": "tauri build",
    "build:mac": "tauri build --target aarch64-apple-darwin",
    "build:win": "tauri build --target x86_64-pc-windows-msvc",
    "build:linux": "tauri build --target x86_64-unknown-linux-gnu",
    "runtime:dev": "cd agent-runtime && python main.py",
    "runtime:install": "cd agent-runtime && pip install -r requirements.txt"
  }
}
```

**agent-runtime/requirements.txt:**
```
pipecat-ai[deepgram,elevenlabs,silero]>=0.0.47
httpx>=0.27.0
aiosqlite>=0.20.0
```

---

## BACKEND SPECIALIST TRACK — Run in parallel

The following backend tasks should be handled by a dedicated backend specialist simultaneously.

### BACKEND TASK B1 — WebSocket Server (ws.trust-agent.ai)

Build a standalone WebSocket server on the existing Render/Node backend.

```typescript
// server/src/ws/server.ts
import { WebSocketServer, WebSocket } from 'ws';
import { verifySessionToken } from '../auth/jwt';
import { db } from '../db/prisma';
import { auditQueue } from '../queues/audit';

interface AuthenticatedWS extends WebSocket {
  sessionId: string;
  hireId: string;
  userId: string;
}

export function createWSServer(httpServer: any) {
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Connection map: hireId → WebSocket
  const sessions = new Map<string, AuthenticatedWS>();

  wss.on('connection', async (ws: WebSocket, req) => {
    const url = new URL(req.url!, `wss://${req.headers.host}`);
    const token = url.searchParams.get('token');

    if (!token) {
      ws.close(1008, 'Missing token');
      return;
    }

    let session;
    try {
      session = await verifySessionToken(token);
    } catch {
      ws.close(1008, 'Invalid token');
      return;
    }

    const authWs = ws as AuthenticatedWS;
    authWs.sessionId = session.sessionId;
    authWs.hireId = session.hireId;
    authWs.userId = session.userId;
    sessions.set(session.hireId, authWs);

    ws.on('message', async (raw) => {
      try {
        const msg = JSON.parse(raw.toString());

        if (msg.type === 'agent:message') {
          // Forward to BullMQ for processing
          await auditQueue.add('agent-message', {
            hireId: authWs.hireId,
            userId: authWs.userId,
            content: msg.payload.content,
            timestamp: new Date(),
          });
        }

        if (msg.type === 'audit:event') {
          // Write audit event to DB + run 47-check pipeline
          await db.auditLog.create({
            data: {
              hireId: authWs.hireId,
              userId: authWs.userId,
              action: msg.payload.action,
              metadata: msg.payload.metadata,
              timestamp: new Date(),
            }
          });
          await auditQueue.add('audit-check', msg.payload, { priority: 1 });
        }
      } catch (e) {
        console.error('[WS] Message error', e);
      }
    });

    ws.on('close', () => {
      sessions.delete(session.hireId);
    });

    // Send connection confirmation
    ws.send(JSON.stringify({
      type: 'connected',
      payload: {
        sessionId: session.sessionId,
        hireId: session.hireId,
        timestamp: new Date().toISOString(),
      }
    }));
  });

  // Broadcast to a specific session
  function sendToSession(hireId: string, type: string, payload: unknown) {
    const ws = sessions.get(hireId);
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type, payload }));
    }
  }

  return { wss, sendToSession };
}
```

### BACKEND TASK B2 — Session Router (tRPC)

```typescript
// server/src/routers/session.ts
import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';
import { db } from '../db/prisma';
import { signSessionToken } from '../auth/jwt';
import { s3 } from '../lib/s3';

export const sessionRouter = router({
  create: protectedProcedure
    .input(z.object({ hireId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify the hire belongs to this user
      const hire = await db.hire.findFirst({
        where: { id: input.hireId, userId: ctx.user.id },
        include: { role: true },
      });

      if (!hire) throw new Error('Hire not found');

      // Create session record
      const session = await db.agentSession.create({
        data: {
          hireId: input.hireId,
          userId: ctx.user.id,
          status: 'active',
        }
      });

      // Sign a short-lived WS token (24h)
      const wsToken = await signSessionToken({
        sessionId: session.id,
        hireId: input.hireId,
        userId: ctx.user.id,
      });

      return { sessionId: session.id, wsToken };
    }),
});
```

### BACKEND TASK B3 — Role Config Router

```typescript
// server/src/routers/role.ts
export const roleRouter = router({
  getConfig: protectedProcedure
    .input(z.object({ roleId: z.string() }))
    .query(async ({ ctx, input }) => {
      const role = await db.role.findUnique({
        where: { id: input.roleId },
        include: { auditReport: true },
      });
      if (!role) throw new Error('Role not found');

      // Fetch role config from S3 assets bucket
      const configKey = `roles/${input.roleId}/config.json`;
      const s3Response = await s3.getObject({
        Bucket: process.env.S3_ASSETS_BUCKET!,
        Key: configKey,
      });
      const config = JSON.parse(await s3Response.Body!.transformToString());

      return {
        roleId: role.id,
        name: role.name,
        category: role.category,
        systemPrompt: config.systemPrompt,
        tools: config.tools,
        voiceId: config.voiceId,
        trustScore: role.trustScore,
        auditStatus: role.auditStatus,
      };
    }),
});
```

### BACKEND TASK B4 — Prisma Schema Extensions

Add to existing `schema.prisma`:
```prisma
model AgentSession {
  id        String   @id @default(cuid())
  hireId    String
  userId    String
  status    String   @default("active")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  hire      Hire     @relation(fields: [hireId], references: [id])
  user      User     @relation(fields: [userId], references: [id])
  auditLogs AuditLog[]
}

model AuditLog {
  id        String   @id @default(cuid())
  hireId    String
  userId    String
  sessionId String?
  action    String
  metadata  Json
  checksPassed Int   @default(0)
  flagged   Boolean  @default(false)
  timestamp DateTime @default(now())
  session   AgentSession? @relation(fields: [sessionId], references: [id])
}
```

---

## QUALITY GATES — Before marking any task complete

1. No mock data, no placeholder responses, no `Math.random()` seeded content
2. All API calls point to `api.trust-agent.ai` or customer-provided LLM endpoint
3. All env vars read from `.env` — never hardcoded
4. All file system operations go through Tauri Rust commands — never direct in JS
5. All brand tokens match the spec above exactly
6. TypeScript strict mode — no `any` types
7. All errors handled and surfaced to user (not silently swallowed)
8. WebSocket reconnects automatically on disconnect
9. Audit events fire for every agent action before the action executes
10. Permission grants persist across app restarts (Tauri store plugin)

---

*Trust Agent Desktop — AgentCore LTD — Company No. 17114811*
*20 Wenlock Road, London, England, N1 7GU*
*Confidential — Not for Distribution*
