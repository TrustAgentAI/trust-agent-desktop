# TRUST AGENT DESKTOP — COMPLETE FINISH & SHIP PROMPT
# DO NOT STOP until every item in this document is marked DONE and verified working.
# This is a zero-remaining-tasks run. Commit nothing until all checks pass.

---

## IDENTITY & CONTEXT

You are completing **Trust Agent Desktop** — the local agent runtime client for Trust Agent (trust-agent.ai), operated by AgentCore LTD (Company No. 17114811).

Repo: https://github.com/TrustAgentAI/trust-agent-desktop
Dev server: http://localhost:1420 (Vite, already running)
Stack: Tauri 2.x + React 18 + TypeScript + Python sidecar

The React frontend is live in browser. Python deps are installed. npm packages are installed.
Rust is NOT installed — all Tauri-native features must be implemented with browser-compatible fallbacks that activate automatically when `window.__TAURI__` is undefined.

**No mock data. No placeholder text. No TODO comments. No disabled buttons. No console errors.**
**Every feature must work end-to-end or have a clear, tested fallback.**

---

## BRAND SYSTEM — APPLY EVERYWHERE

```css
--color-dark-navy:     #0A1628;
--color-navy-2:        #0D1F3C;
--color-electric-blue: #1E6FFF;
--color-ion-cyan:      #00D4FF;
--color-mid-blue:      #1A3A6B;
--color-text-mid:      #2D4A7A;
--color-text-muted:    #8899BB;
--color-border-blue:   #C5D5F0;
--color-light-blue-bg: #EBF2FF;
--color-success:       #00AA78;
--color-error:         #CC3333;
--color-white:         #FFFFFF;

--font-primary: 'Manrope', sans-serif;
--font-mono:    'JetBrains Mono', monospace;
```

Import Manrope and JetBrains Mono from Google Fonts in index.html if not already present:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
```

Brand rules:
- Always "Trust Agent" — never TRUST AGENT, never trustagent
- Token always "$TAGNT" — $ in Ion Cyan, TAGNT in Electric Blue, Manrope ExtraBold 800
- No warm tones anywhere
- No placeholder shield — use text "TA" in a styled hex/circle if no SVG available

---

## ENVIRONMENT VARIABLES

Read from `.env` file. Do not hardcode any values.

```
VITE_API_URL=https://api.trust-agent.ai
VITE_WS_URL=wss://api.trust-agent.ai/ws
VITE_APP_VERSION=1.0.0
```

In all API/WS calls: if the server is unreachable, show a clear connection status indicator in the UI (not a crash, not a blank screen).

---

## PHASE 1 — AUDIT CURRENT STATE

Before writing any new code, do ALL of the following:

1. Run `npm run build` and capture ALL TypeScript errors. Fix every one. Zero TS errors required.
2. Open http://localhost:1420 in a headless browser check (use `curl -s http://localhost:1420 | head -50` to verify it loads).
3. Read every file in `src/` and list:
   - Files that are empty or have only stub content
   - Files that import things that don't exist
   - Files that use `any` types
   - Files that have hardcoded placeholder text (lorem ipsum, "TODO", "COMING SOON", dummy names)
   - Files missing error handling
4. Read every file in `agent-runtime/` and list:
   - Missing imports
   - Unimplemented functions
   - Hardcoded values that should be env vars
5. Read `src-tauri/src/` and list:
   - Commands that are declared but not registered in `main.rs`
   - Commands that have no browser fallback path

Document your full audit findings before proceeding. Fix all issues found.

---

## PHASE 2 — COMPLETE ALL MISSING IMPLEMENTATIONS

Work through every item below. Do not skip any. Mark each DONE only when you have verified it works.

---

### 2.1 — TAURI/BROWSER COMPATIBILITY LAYER

Create `src/lib/tauri-compat.ts`:

```typescript
// Detects whether we're running inside Tauri or in a browser.
// All Tauri-dependent code must use these wrappers.

export const isTauri = (): boolean => {
  return typeof window !== 'undefined' && '__TAURI__' in window;
};

// File system: browser fallback uses IndexedDB simulation
export async function readFile(path: string): Promise<string> {
  if (isTauri()) {
    const { readTextFile } = await import('@tauri-apps/plugin-fs');
    return readTextFile(path);
  }
  // Browser fallback: return mock for dev
  console.warn('[TauriCompat] readFile called in browser mode, path:', path);
  return `[Browser mode: file ${path} would be read here]`;
}

export async function invoke<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  if (isTauri()) {
    const { invoke: tauriInvoke } = await import('@tauri-apps/api/core');
    return tauriInvoke<T>(command, args);
  }
  // Browser fallback: mock responses for development
  console.warn('[TauriCompat] invoke called in browser mode:', command, args);
  return handleBrowserInvoke<T>(command, args);
}

async function handleBrowserInvoke<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  switch (command) {
    case 'list_permissions':
      return [] as unknown as T;
    case 'grant_folder_permission':
      return true as unknown as T;
    case 'revoke_folder_permission':
      return true as unknown as T;
    case 'start_voice_session':
      return { status: 'browser_mode_no_voice' } as unknown as T;
    case 'stop_voice_session':
      return { status: 'stopped' } as unknown as T;
    default:
      throw new Error(`Unknown command in browser mode: ${command}`);
  }
}

export async function openDirectoryDialog(): Promise<string | null> {
  if (isTauri()) {
    const { open } = await import('@tauri-apps/plugin-dialog');
    const result = await open({ directory: true, multiple: false });
    return typeof result === 'string' ? result : null;
  }
  // Browser fallback: prompt for path
  return window.prompt('Enter folder path (browser mode):');
}
```

Replace ALL direct `@tauri-apps/api` imports throughout the codebase with calls through `tauri-compat.ts`. Verify: app loads with zero console errors in browser mode.

---

### 2.2 — WEBSOCKET CLIENT

File: `src/lib/ws.ts`

Requirements:
- Connects to `VITE_WS_URL` from env
- Auto-reconnects with exponential backoff (1s, 2s, 4s, 8s, max 30s)
- Emits `connected`, `disconnected`, `reconnecting` status events
- TypeScript strict — no `any`
- Handles JSON parse errors gracefully (logs, does not crash)
- Exports a singleton `wsClient`
- Has a `getStatus()` method returning `'connected' | 'connecting' | 'disconnected'`

**TEST:** After implementing, verify that:
- `wsClient.getStatus()` returns `'disconnected'` when server is unreachable (expected in dev)
- No unhandled promise rejections appear in console
- The ConnectionStatus component (see 2.5) accurately reflects the state

---

### 2.3 — AUTH & SESSION STORE

File: `src/store/sessionStore.ts`

Requirements:
- Zustand store
- State: `{ token: string | null, userId: string | null, hireId: string | null, roleName: string | null, isAuthenticated: boolean }`
- Actions: `login(token, userId)`, `setActiveRole(hireId, roleName)`, `logout()`
- Persists token to localStorage (with try/catch — some browsers block this)
- `useSession()` hook exported

File: `src/lib/auth.ts`

Requirements:
- `login(apiKey: string): Promise<{ token: string, userId: string }>` — POSTs to `${VITE_API_URL}/auth/desktop-login`
- On network failure: throws with message `'Cannot connect to Trust Agent servers. Check your connection.'`
- On 401: throws with message `'Invalid API key.'`
- On any other error: throws with message `'Login failed. Please try again.'`

---

### 2.4 — LOGIN SCREEN

File: `src/pages/LoginPage.tsx`

Full login screen shown when `!isAuthenticated`. Requirements:
- Dark Navy background, full viewport
- Trust Agent wordmark centred (Manrope ExtraBold 800, white, with Electric Blue "Agent")
- Subtitle: "Desktop v1.0" in Ion Cyan JetBrains Mono
- Single input: API Key (placeholder: `ta_live_...`, monospace font)
- Primary button: "Connect" — Electric Blue, Manrope SemiBold
- Loading state: button shows "Connecting..." with animated dots, disabled
- Error state: error message in --color-error, below the button
- On success: transitions to Shell with slide-up animation
- Bottom footer: "AgentCore LTD · 17114811 · trust-agent.ai" in Text Muted

**TEST:** 
- Entering an invalid key shows the error message
- Entering a valid key (mock in browser mode: any string starting with `ta_`) proceeds to the app
- Tab order is correct: input → button
- Enter key submits the form

---

### 2.5 — APP SHELL

File: `src/components/layout/Shell.tsx`

Three-panel layout:
```
[Sidebar 240px] | [Main content flex] | [Right panel 320px, collapsible]
```

Sidebar contents (top to bottom):
1. Trust Agent logo mark + wordmark (top, 60px height)
2. "Active Roles" section header (Ion Cyan, uppercase, 11px JetBrains Mono)
3. List of hired role cards (from roleStore — see 2.6)
4. "Hire a Role" button at bottom of role list — Electric Blue border, opens MarketplacePanel
5. Divider
6. Nav items: Dashboard, Permissions, Audit Log, Settings — each with an icon and label
7. Connection status indicator at very bottom (dot + text: green/Connected, amber/Connecting, red/Disconnected)

File: `src/components/layout/ConnectionStatus.tsx`

- Uses `wsClient.getStatus()` 
- Polls every 3 seconds with `useEffect`
- Green dot + "Connected" / Amber dot + "Connecting..." / Red dot + "Disconnected"
- Dot is 8px circle with matching colour + subtle pulse animation on Connecting state

File: `src/components/layout/TitleBar.tsx`

Custom title bar (shown in Tauri mode, hidden in browser mode via `isTauri()`):
- Height 44px, Navy 2 background
- Left: "Trust Agent" wordmark + version badge
- Right: minimise, maximise, close buttons
- `data-tauri-drag-region` attribute on the bar
- Window controls call `getCurrentWindow().minimize()` etc. via tauri-compat

**TEST:** App renders without crashing at http://localhost:1420. All three panels visible. Sidebar shows "Hire a Role" button. Connection status shows "Disconnected" (expected in dev without WS server).

---

### 2.6 — ROLE STORE

File: `src/store/agentStore.ts`

```typescript
interface HiredRole {
  hireId: string;
  roleName: string;
  roleCategory: string; // 'C-Suite' | 'Management' | 'Specialist'
  trustScore: number;
  trustBadge: 'PLATINUM' | 'GOLD' | 'SILVER' | 'BASIC';
  isActive: boolean;
  sessionToken: string | null;
}

interface AgentStore {
  roles: HiredRole[];
  activeRoleId: string | null;
  addRole: (role: HiredRole) => void;
  setActiveRole: (hireId: string) => void;
  updateSessionToken: (hireId: string, token: string) => void;
  removeRole: (hireId: string) => void;
}
```

- Zustand store
- Persists to localStorage (try/catch)
- `useAgentStore()` hook exported

File: `src/components/agent/AgentCard.tsx`

Role card shown in sidebar:
- Role name in Manrope SemiBold 600, white
- Category label in Text Muted, 12px
- Trust badge pill: Platinum = Ion Cyan bg+text, Gold = #FFB740, Silver = #C0C8D8, Basic = Text Muted
- Active indicator: left border 3px Electric Blue when this role is selected
- Click to set as active role
- Hover: slight Navy 2 background

---

### 2.7 — CHAT WINDOW

File: `src/components/agent/ChatWindow.tsx`

Complete implementation. Requirements:
- Shows empty state when no messages: centred hex icon, role name, "Send a message or use voice to begin"
- Messages render with correct alignment (user right, agent left)
- User message bubble: Electric Blue background
- Agent message bubble: Navy 2 background with Electric Blue border
- Streaming: renders token-by-token as WS `agent:token` events arrive
- Streaming cursor: blinking Ion Cyan vertical bar at end of streaming text
- Tool use indicator: monospace code block with Ion Cyan left border, shows tool name
- Timestamps: shown on hover, Text Muted, 11px JetBrains Mono
- Auto-scroll to bottom on new messages
- Textarea input: expands up to 5 lines, resets after send
- Send on Enter (not Shift+Enter), Shift+Enter for newline
- Disabled state during streaming: input has reduced opacity, button not clickable
- Error state: if WS disconnected, shows banner "Reconnecting to Trust Agent..." above input

File: `src/store/sessionStore.ts` (extend):
- Add `messages: Message[]` per hireId
- `addMessage(hireId, message)` action
- `clearMessages(hireId)` action
- Messages persist to localStorage (100 message cap per role — trim oldest)

**TEST:**
- Renders at http://localhost:1420 with no errors
- Empty state shows correctly
- Typing in input and pressing Enter adds a user message to the UI
- In browser mode (no WS), the user message appears, then after 1.5s a mock agent response appears: "I'm operating in browser preview mode. Connect to the Trust Agent gateway to activate your role." styled correctly as an agent message.

---

### 2.8 — MOCK AGENT RESPONSE (BROWSER MODE)

File: `src/lib/mockAgent.ts`

When `wsClient.getStatus() !== 'connected'`, intercept outbound `agent:message` events and after 1200ms emit a mock `agent:done` event with:

```typescript
{
  messageId: `mock-${Date.now()}`,
  fullContent: "I'm running in browser preview mode. To activate your role, connect to the Trust Agent gateway with a valid API key.",
}
```

This means the UI always shows a complete request→response cycle in dev. No blank states, no dead ends.

---

### 2.9 — VOICE BAR

File: `src/components/agent/VoiceBar.tsx`

Requirements:
- Microphone button (44px circle)
- Inactive state: Text Muted border, Text Muted mic icon
- Active/listening state: Ion Cyan border + glow (box-shadow: 0 0 16px rgba(0,212,255,0.35)), Ion Cyan mic icon
- Animated wave bars (5 bars) visible only when listening — CSS keyframe animation, bars vary in height
- In browser mode: clicking mic shows a toast notification "Voice requires the full Tauri desktop app. Download at trust-agent.ai/desktop"
- In Tauri mode: invokes `start_voice_session` / `stop_voice_session` Rust commands
- Speaking indicator: when `agent:speaking` WS event received, button shows waveform icon instead of mic

---

### 2.10 — PERMISSION MANAGER

File: `src/components/permissions/PermissionManager.tsx`

Requirements:
- Lists all current permission grants for the active role
- Each grant shows: path (monospace, truncated with ellipsis), access type badge (Read / Read & Write)
- Read badge: Text Muted border
- Read & Write badge: Ion Cyan border + text
- Revoke button (×) on each grant — confirmation not required, immediately removes
- "Add folder (read only)" button — secondary style
- "Add folder (read & write)" button — Ion Cyan border style
- In browser mode: `openDirectoryDialog()` shows a prompt, entered path is added to the list
- In Tauri mode: uses native dialog
- Empty state: "No folders granted. Add a folder to give this role access to local files."
- All grants persist in `permissionStore`

File: `src/store/permissionStore.ts`

```typescript
interface PermissionGrant {
  path: string;
  access: 'read' | 'read-write';
  agentRoleId: string;
  grantedAt: string; // ISO timestamp
}

interface PermissionStore {
  grants: PermissionGrant[];
  addGrant: (grant: PermissionGrant) => void;
  removeGrant: (path: string, agentRoleId: string) => void;
  getGrantsForRole: (agentRoleId: string) => PermissionGrant[];
}
```

Persists to localStorage.

**TEST:**
- Open the Permissions panel in the right sidebar
- Click "Add folder (read only)" — browser prompt appears, enter any path
- The path appears in the list with "Read Only" badge
- Click × — it disappears
- Reload the page — grants are still there (localStorage persistence)

---

### 2.11 — MARKETPLACE PANEL

File: `src/components/marketplace/MarketplacePanel.tsx`

Requirements:
- Renders inside the app (not in a new window)
- Shows a loading skeleton while initialising
- In browser mode: renders an `<iframe>` pointing to `https://app.trust-agent.ai/marketplace?embed=desktop`
- iframe has: `width: 100%`, `height: 100%`, `border: none`, `background: var(--color-dark-navy)`
- Shows a header bar above the iframe: "Marketplace" in Manrope ExtraBold, "trust-agent.ai" in Text Muted monospace, and an "Open in browser →" link
- If iframe fails to load (onerror): show fallback card with Trust Agent branding, a "Visit marketplace" button linking to `https://app.trust-agent.ai/marketplace`, and the message "Embedded marketplace requires an internet connection."

---

### 2.12 — AUDIT LOG PANEL

File: `src/components/audit/AuditLog.tsx`

Requirements:
- Displays a real-time stream of audit events
- Each event row: timestamp (JetBrains Mono, Text Muted), action type (colour-coded), description
- Action type colours: READ = Text Muted, WRITE = Electric Blue, API_CALL = Ion Cyan, TOOL_USE = #FFB740, ERROR = Error Red
- New events animate in from the right with a fade+slide transition
- "Clear log" button in header (ghost style)
- Empty state: "No actions logged yet. Activity will appear here in real time."
- Receives events from: (a) WS `audit:event` messages, (b) local mock events in browser mode

File: `src/store/auditStore.ts`

```typescript
interface AuditEvent {
  id: string;
  hireId: string;
  action: 'READ' | 'WRITE' | 'API_CALL' | 'TOOL_USE' | 'MESSAGE' | 'ERROR';
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}
```

- Keeps last 500 events in memory (not persisted — audit log is session-only for privacy)
- `addEvent`, `clearEvents`, `getEventsForRole` actions

In browser mode: inject 3 mock audit events on first load:
```
[timestamp] MESSAGE  User session initialised
[timestamp] READ     Role configuration loaded from Trust Agent gateway
[timestamp] MESSAGE  Agent ready — browser preview mode active
```

**TEST:**
- Audit log panel shows 3 mock events in browser mode
- Events render with correct colour coding
- "Clear log" button empties the list

---

### 2.13 — SETTINGS PAGE

File: `src/pages/SettingsPage.tsx`

Requirements:
- Navigation item in sidebar triggers this view
- Sections:

**API Configuration**
- API Key display: shows first 12 chars + `...` (never full key), with "Disconnect" button
- Gateway URL: read-only display of `VITE_API_URL`
- Connection test button: "Test Connection" — sends a ping to `${VITE_API_URL}/health`, shows result

**LLM Provider**
- Dropdown: OpenAI / Anthropic / Custom
- API Key input (stored in localStorage, marked sensitive)
- Model input (default: `gpt-4o` for OpenAI, `claude-sonnet-4-20250514` for Anthropic)
- Base URL input (shown only when Custom selected)
- "Save" button — primary style

**Voice Settings**
- Deepgram API Key input
- ElevenLabs API Key input
- Voice test button: "Test Voice" — in browser mode shows the toast about Tauri requirement
- Note: "Voice keys are stored locally and never sent to Trust Agent servers."

**About**
- Trust Agent Desktop version badge
- GitHub link: `https://github.com/TrustAgentAI/trust-agent-desktop`
- "AgentCore LTD · Company No. 17114811 · 20 Wenlock Road, London, England, N1 7GU"

All settings persist to localStorage via a `settingsStore`.

---

### 2.14 — AGENT RUNTIME (PYTHON)

File: `agent-runtime/main.py`

Complete implementation. Requirements:
- Reads commands from stdin as JSON lines
- Handles: `agent:init`, `agent:message`, `agent:shutdown`, `voice:start`, `voice:stop`
- Emits to stdout as JSON lines
- Never crashes on malformed input — catches and logs all exceptions
- `agent:init` flow:
  1. Loads role config from `${TA_API_URL}/api/role-config/{hireId}` with Bearer token
  2. Falls back to a default config if server unreachable (for dev mode)
  3. Emits `agent:ready` on success, `agent:error` on failure
- `agent:message` flow:
  1. Loads conversation history from SQLite memory
  2. Calls customer LLM API (from `CUSTOMER_LLM_BASE_URL` / `CUSTOMER_LLM_API_KEY` / `CUSTOMER_LLM_MODEL`)
  3. Streams tokens to stdout as `agent:token` events
  4. On stream complete: saves to SQLite, emits `agent:done`
  5. On LLM API error: emits `agent:error` with message
- All env vars read from environment, never hardcoded
- Default config when offline:
  ```json
  {
    "systemPrompt": "You are a Trust Agent role assistant running in development mode. The Trust Agent gateway is not connected. Inform the user they need to connect their API key to activate the full role.",
    "tools": [],
    "voiceId": null
  }
  ```

File: `agent-runtime/runtime/memory.py`

SQLite memory store. Complete implementation:
- Database file at `~/.trust-agent/memory/{hireId}.db`
- Creates directory and file if not exist
- Table: `messages (id, role, content, timestamp)`
- `get_history(limit=50)`: returns last N messages as list of dicts
- `add_message(role, content)`: inserts row
- `clear_history()`: deletes all rows
- All operations wrapped in try/except — never crash the sidecar

File: `agent-runtime/runtime/audit.py`

Audit event emitter:
- `log_action(hire_id, action, metadata)`: emits `audit:event` JSON to stdout
- Actions: `READ`, `WRITE`, `API_CALL`, `TOOL_USE`, `MESSAGE`, `ERROR`
- Timestamp: ISO format UTC
- Never blocks — all I/O is async-compatible

**TEST:**
```bash
cd agent-runtime
echo '{"type":"agent:init","payload":{"hireId":"test-hire-001","sessionToken":"test-token"}}' | python main.py
```
Expected output: a JSON line with `{"type":"agent:ready","payload":{"hireId":"test-hire-001"}}`

```bash
echo '{"type":"agent:message","payload":{"hireId":"test-hire-001","content":"Hello"}}' | python main.py
```
Expected output: one or more `agent:token` events followed by `agent:done`

If LLM keys are not set: the default offline response must still emit properly.

---

### 2.15 — DASHBOARD VIEW

File: `src/pages/DashboardPage.tsx`

Default view shown after login when no role is selected. Requirements:

**Top row — 3 stat cards:**
- Active Roles: count from roleStore
- Sessions Today: count from auditStore (MESSAGE events today)
- Connection: WS status from wsClient

**Middle — Role cards grid:**
- One card per hired role in roleStore
- Card: role name (ExtraBold), category, trust badge pill, "Open Session" button
- Empty state if no roles: "No roles hired yet. Browse the marketplace to hire your first AI role." with "Browse Marketplace" button (opens MarketplacePanel)

**Bottom — Recent audit activity:**
- Last 5 audit events from auditStore
- Same styling as AuditLog component but read-only summary

In browser mode with no roles: show the empty state with the Browse Marketplace CTA.

---

### 2.16 — ROUTING

File: `src/App.tsx`

Complete routing logic:
```
/ (unauthenticated) → LoginPage
/ (authenticated)   → Shell wrapping DashboardPage
/permissions        → Shell wrapping PermissionManager (full page)
/audit              → Shell wrapping AuditLog (full page)
/settings           → Shell wrapping SettingsPage
/marketplace        → Shell wrapping MarketplacePanel (full page)
```

Use React Router v6 (`BrowserRouter`). Handle unknown routes with redirect to `/`.

Add React Router to package.json if not present: `npm install react-router-dom`.

---

### 2.17 — GLOBAL STYLES

File: `src/styles/globals.css`

Must include:
- CSS custom properties for all brand colours (listed above)
- Font imports (Manrope + JetBrains Mono)
- Reset: `*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }`
- `html, body, #root { height: 100%; width: 100%; overflow: hidden; }`
- Background: `var(--color-dark-navy)`
- Default text: `var(--color-white)`
- Custom scrollbar styles (6px, Navy 2 track, Mid Blue thumb, Electric Blue on hover)
- Focus ring: `outline: 2px solid var(--color-electric-blue); outline-offset: 2px;`
- Transition defaults: `transition: all 0.15s ease;` on interactive elements
- `@keyframes blink` for cursor
- `@keyframes pulse` for connection status dot
- `@keyframes voiceWave` for voice bars
- `@keyframes fadeSlideIn` for audit log entries

---

### 2.18 — UI PRIMITIVE COMPONENTS

Ensure these exist and are complete — create any that are missing:

`src/components/ui/Button.tsx`
Props: `variant: 'primary' | 'secondary' | 'ghost' | 'danger'`, `size: 'sm' | 'md' | 'lg'`, `loading?: boolean`, `disabled?: boolean`, `onClick`, `children`

`src/components/ui/Input.tsx`
Props: `value`, `onChange`, `placeholder`, `type`, `disabled`, `error?: string`, `label?: string`, `monospace?: boolean`

`src/components/ui/Badge.tsx`
Props: `variant: 'platinum' | 'gold' | 'silver' | 'basic' | 'success' | 'error' | 'info'`, `children`

`src/components/ui/Card.tsx`
Props: `variant: 'dark' | 'light'`, `children`, `className?`

`src/components/ui/Toast.tsx`
Simple toast notification system — `showToast(message, type: 'info' | 'success' | 'error')` exported as a singleton. Toasts appear bottom-right, auto-dismiss after 4s, slide in from right.

`src/components/ui/Skeleton.tsx`
Loading skeleton with pulse animation — Navy 2 base, slightly lighter shimmer.

---

## PHASE 3 — INTEGRATION TESTS

Run all of these. Fix any failures before proceeding.

### 3.1 — Build Test
```bash
npm run build
```
Expected: build completes with zero errors. Zero TypeScript errors. No missing module warnings.

### 3.2 — Dev Server Test
```bash
curl -s http://localhost:1420 | grep -c "Trust Agent"
```
Expected: returns a number > 0 (Trust Agent appears in the HTML).

### 3.3 — Python Sidecar Tests

```bash
cd agent-runtime

# Test 1: Init (offline mode — no real API)
echo '{"type":"agent:init","payload":{"hireId":"test-001","sessionToken":"test"}}' | timeout 5 python main.py 2>/dev/null | head -5
# Expected: line containing "agent:ready"

# Test 2: Message (offline mode)
python -c "
import subprocess, json
proc = subprocess.Popen(['python', 'main.py'], stdin=subprocess.PIPE, stdout=subprocess.PIPE, text=True)
proc.stdin.write(json.dumps({'type':'agent:init','payload':{'hireId':'t1','sessionToken':'s1'}}) + '\n')
proc.stdin.write(json.dumps({'type':'agent:message','payload':{'hireId':'t1','content':'Hello'}}) + '\n')
proc.stdin.flush()
import time; time.sleep(3)
proc.terminate()
out, _ = proc.communicate()
lines = [l for l in out.strip().split('\n') if l]
for l in lines: print(l)
"
# Expected: agent:ready, then agent:token lines or agent:done

# Test 3: Memory persistence
python -c "
import asyncio, sys
sys.path.insert(0, '.')
from runtime.memory import AgentMemory
async def test():
    m = AgentMemory('test-memory-check')
    await m.add_message('user', 'test message')
    h = await m.get_history()
    assert len(h) > 0, 'Memory not persisting'
    print('MEMORY TEST: PASS')
asyncio.run(test())
"
# Expected: MEMORY TEST: PASS

# Test 4: Audit emitter
python -c "
from runtime.audit import AuditLogger
import json, io, sys
logger = AuditLogger()
logger.log_action('hire-001', 'READ', {'path': '/test/file.txt'})
print('AUDIT TEST: PASS')
"
# Expected: AUDIT TEST: PASS + JSON audit event on stdout
```

### 3.4 — TypeScript Type Check
```bash
npx tsc --noEmit
```
Expected: zero errors.

### 3.5 — Import Check
```bash
# Check for any remaining TODOs or placeholder text
grep -r "TODO\|FIXME\|placeholder\|lorem ipsum\|coming soon\|COMING SOON\|stub\|not implemented" src/ --include="*.tsx" --include="*.ts" -i
```
Expected: zero results (all stubs removed).

### 3.6 — Console Error Check
```bash
# Start the dev server and check for errors
node -e "
const http = require('http');
http.get('http://localhost:1420', res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const hasError = data.includes('Error') && !data.includes('error boundary');
    console.log('HTTP Status:', res.statusCode);
    console.log('Response size:', data.length, 'bytes');
    console.log('Contains Trust Agent:', data.includes('Trust Agent'));
    process.exit(0);
  });
}).on('error', err => { console.error('Server not responding:', err.message); process.exit(1); });
"
```
Expected: HTTP 200, response > 0 bytes, contains Trust Agent.

---

## PHASE 4 — FINAL POLISH & BRAND AUDIT

Run these checks and fix every violation:

### 4.1 — Brand Compliance Check
```bash
# Check for any non-brand colour values
grep -r "#FF\|#ff\|orange\|amber\|yellow\|purple\|#FFA\|#FA\|rgb(255" src/ --include="*.tsx" --include="*.ts" --include="*.css" -i | grep -v "//\|error\|success\|#FFB740"
```
Expected: zero results (no warm tones in non-approved contexts).

```bash
# Check token name consistency
grep -r "TRUST\b\|\$TA\b\|trustagent\|TrustAgent\|TRUST AGENT\|Trust-Agent" src/ --include="*.tsx" --include="*.ts" -i | grep -v "TrustAgentAI\|trust-agent.ai\|trust-agent-desktop\|tauri\|TrustAgent Desktop"
```
Expected: zero violations.

### 4.2 — Typography Check
All headings must use Manrope. All code/mono content must use JetBrains Mono.
```bash
grep -r "Arial\|Helvetica\|Inter\|Roboto\|system-ui" src/ --include="*.tsx" --include="*.ts" --include="*.css"
```
Expected: zero results.

### 4.3 — Accessibility Minimum
- All interactive elements have `aria-label` or visible text label
- No `onClick` on non-interactive elements without `role` and `tabIndex`
- All images (if any) have `alt` text
- Colour contrast: white text on Navy 2 and Dark Navy backgrounds passes WCAG AA

### 4.4 — Performance Check
```bash
npm run build 2>&1 | grep -E "chunk|kB|gzip"
```
No single chunk should exceed 500kB gzipped. If any does, apply dynamic imports to the largest components.

---

## PHASE 5 — FINAL COMMIT

Only run this phase after ALL tests in Phase 3 pass and ALL checks in Phase 4 pass.

```bash
# 1. Final type check
npx tsc --noEmit
# Must exit 0

# 2. Final build
npm run build
# Must exit 0

# 3. Python tests
cd agent-runtime && python -m pytest tests/ -v 2>/dev/null || echo "No pytest tests — manual tests passed above"
cd ..

# 4. Stage and commit
git add -A
git status

# 5. Write commit message listing EVERY component completed in this session
git commit -m "feat: complete Trust Agent Desktop v1.0

Components completed:
- tauri-compat.ts: browser/Tauri compatibility layer
- ws.ts: WebSocket client with auto-reconnect + status
- auth.ts + LoginPage: API key auth flow with error states
- Shell: three-panel layout with sidebar nav + connection status
- ConnectionStatus: live WS status indicator
- AgentCard: role cards with trust badges
- ChatWindow: full streaming chat with mock agent fallback
- VoiceBar: voice UI with browser mode graceful degradation
- PermissionManager + permissionStore: folder access grants
- MarketplacePanel: embedded iframe + fallback
- AuditLog + auditStore: real-time event stream
- DashboardPage: role overview + quick stats
- SettingsPage: LLM + voice + API key config
- agent-runtime/main.py: complete stdin/stdout orchestrator
- agent-runtime/runtime/memory.py: SQLite session memory
- agent-runtime/runtime/audit.py: audit event emitter
- All UI primitives: Button, Input, Badge, Card, Toast, Skeleton
- globals.css: full brand design system
- React Router routing: all pages connected
- Zero TypeScript errors
- Zero console errors in browser mode
- Python sidecar tests pass (offline mode)
- Build size within limits

All tasks complete. No remaining TODOs."

# 6. Push
git push origin master

# 7. Confirm
echo "TRUST AGENT DESKTOP v1.0 — COMPLETE AND SHIPPED"
echo "Dev server: http://localhost:1420"
echo "Repo: https://github.com/TrustAgentAI/trust-agent-desktop"
```

---

## COMPLETION CRITERIA

You are NOT done until ALL of the following are true:

- [ ] `npm run build` exits 0 with zero errors
- [ ] `npx tsc --noEmit` exits 0 with zero errors
- [ ] http://localhost:1420 loads and shows the Trust Agent Desktop login screen
- [ ] Login screen accepts `ta_` prefixed key in browser mode and navigates to Dashboard
- [ ] Dashboard shows empty roles state with marketplace CTA
- [ ] Chat window renders, accepts input, shows mock agent response
- [ ] Permission manager renders, allows adding/removing grants, persists on reload
- [ ] Audit log shows 3 mock events in browser mode
- [ ] Settings page renders all sections with no broken inputs
- [ ] Marketplace panel renders iframe + fallback
- [ ] Voice bar renders, shows toast in browser mode on click
- [ ] Connection status shows "Disconnected" in sidebar (correct for dev)
- [ ] Python sidecar init test passes (emits `agent:ready`)
- [ ] Python sidecar message test passes (emits tokens or offline response)
- [ ] Python memory test passes
- [ ] Zero console errors in browser
- [ ] Zero TODO/stub/placeholder text in codebase
- [ ] Zero warm-tone colour violations
- [ ] Zero non-Manrope/JetBrains font references
- [ ] All brand rules complied with (Trust Agent, $TAGNT, AgentCore LTD)
- [ ] Git commit made with full message
- [ ] Pushed to `https://github.com/TrustAgentAI/trust-agent-desktop`

If any item is not checked, continue working until it is. Do not stop early.

---

*Trust Agent Desktop — AgentCore LTD — Company No. 17114811*
*20 Wenlock Road, London, England, N1 7GU — trust-agent.ai*
*Confidential — Not for Distribution*
