# Security Verification Report

**Date:** 2026-03-28
**Verified by:** Claude Opus 4.6 (automated audit)
**Scope:** V5 (systemPrompt never in tRPC response), V6 (session messages not stored in DB)

---

## V5 - systemPrompt NEVER in any tRPC response

### 5.1 SafeRole type (server/src/lib/safe-role.ts)

**PASS.** `SafeRole` is defined as:
```
Omit<Role, 'systemPrompt' | 'systemPromptHash' | 'hardLimits' | 'escalationTriggers'>
```
The `toSafeRole()` function destructures and discards `systemPrompt`, `systemPromptHash`, `hardLimits`, and `escalationTriggers` before returning. The `safeRoleSelect` Prisma select object explicitly excludes `systemPrompt` and `systemPromptHash` (lines 55-56 with comments confirming exclusion).

### 5.2 Roles router (server/src/routers/roles.ts)

**PASS.** All four endpoints checked:
- `listPublished` - uses `safeRoleSelect` (line 36)
- `getBySlug` - uses `toSafeRole()` (line 65), with explicit comment "NEVER include systemPrompt"
- `getCategories` - only returns category name and count, no role data
- `getFeatured` - uses `safeRoleSelect` (line 84)
- `search` - uses `safeRoleSelect` (line 102)

### 5.3 Admin router (server/src/routers/admin.ts)

**PASS.** All role-querying endpoints use `safeRoleSelect`:
- `listRoles` - `select: { ...safeRoleSelect, _count: ... }` (line 78)
- `updateRole` - `select: safeRoleSelect` (line 121)
- `toggleRoleActive` - `select: safeRoleSelect` (line 141)
- `systemHealth` - only returns aggregate counts, no role data

### 5.4 Marketplace router (server/src/routers/marketplace.ts)

**PASS.** All four endpoints use `safeRoleSelect`:
- `listRoles` (line 51)
- `filterByCategory` (line 76)
- `sortByTrustScore` (line 97)
- `getFeatured` (line 112)

### 5.5 Hires router (server/src/routers/hires.ts)

**PASS.** All role includes use `safeRoleSelect`:
- `listMyHires` - `role: { select: safeRoleSelect }` (line 99)
- `getHire` - `role: { select: safeRoleSelect }` (line 121)
- `hire` mutation - queries role internally for validation but only returns the Hire record (line 92), not the role object
- `cancelHire` - returns `{ cancelled: true }`, no role data
- `updateNickname` - returns updated hire record, no role data

### 5.6 Sessions router (server/src/routers/sessions.ts)

**PASS.** No systemPrompt exposure:
- `startSession` - returns session metadata only (sessionId, environmentSlug, inputMode, companionName, roleName, maxSessionMinutes). Comment on line 73: "NEVER return systemPrompt"
- `endSession` - returns session metadata only (sessionId, durationSeconds, messageCount, status, endedAt)
- `listSessions` - explicit select with metadata fields only. Comment on line 158: "NO message content - metadata only"
- `getSessionMeta` - explicit select with metadata fields only. Comment on line 196: "NO message content"

### 5.7 Gateway (server/src/gateway/index.ts)

**PASS.** systemPrompt is loaded from the database at line 112 (via `include: { role: { include: { audit: true, skills: true } } }`) and used only for:
1. SHA-256 hash verification (line 125)
2. Assembly into LLM messages (line 225) - passed to the LLM provider in-memory only
3. The response object at line 315 contains only: `content`, `sessionId`, `tokenCounts`, `latencyMs`, `hitlTriggered` - no systemPrompt

Comment on line 314: "NEVER include systemPrompt in response"

### 5.8 Audit queue (server/src/queues/audit-queue.ts)

**PASS.** systemPrompt is loaded for audit analysis (regex checks against prompt content) but never included in responses:
- The audit report object (line 713) includes only `artefactHash` (SHA-256 of systemPrompt), not the prompt itself. Comment: "NEVER include systemPrompt in the report"
- The worker's `job.returnvalue` logged on completion (line 361) contains `{ badge, totalScore, reportKey }` - no systemPrompt

### 5.9 Seed script (prisma/seed.ts)

**PASS.** The seed script stores `systemPrompt` in the database (lines 572, 609) as expected. Console output logs only:
- Slug and truncated hash: `[Role] slug -> env: envSlug (prompt hash: abc123...)` (line 638)
- No systemPrompt text is logged

### 5.10 Generate-manifest script (scripts/generate-manifest.ts)

**PASS.** Only records `systemPromptChars` (character count at line 156), never the actual prompt text.

### 5.11 ROLES-CLAUDE.md validation snippet

**PASS.** The inline validation script at line 1588 logs only the filename and character count (`'SHORT PROMPT:', f, '(' + r.systemPrompt.length + ' chars)'`), never the prompt content itself.

### V5 VERDICT: PASS - No violations found

All tRPC routers use either `safeRoleSelect` or `toSafeRole()`. The gateway response excludes systemPrompt. The audit pipeline hashes it but never returns it. No console.log anywhere outputs the systemPrompt text.

---

## V6 - Session messages NOT stored in any database table

### 6.1 Prisma schema review (prisma/schema.prisma)

**PASS.** Complete review of all 34 models in the schema. No model contains a field designed to store user/assistant message content (chat text). Confirmed models checked:

- **AgentSession** (lines 472-506) - stores only metadata: userId, hireId, liveKitRoomId, status, inputMode, environmentSlug, examMode, redTeamMode, presenceMode, timeBudgetMins, collaborationId, startedAt, endedAt, durationSeconds, messageCount, deviceType, sessionMinsToday, dependencyFlag. Comment on line 488: "Metrics (no content)"
- **SessionMemory** (lines 552-565) - stores `memorySummary` as Json (structured Brain summary data), not raw messages. Comment on line 549: "Brain summaries - not raw messages"
- **SessionDocument** (lines 521-533) - stores uploaded document metadata (s3Key, fileName, mimeType) and `extractedText` for context injection, noted as "deleted after session" (line 529). This is document text, not chat messages.
- **SessionAuditEvent** (lines 535-546) - stores audit check outcomes (checkId, outcome, details), not message content.

### 6.2 HITLEvent model (lines 262-273)

**NOTE (not a violation).** The `HITLEvent` model stores `inputSample` described as "First 200 chars only - not full message" (line 266). The `createHITLEvent` function in hitl-checker.ts (line 86) enforces this with `inputText.slice(0, 200)`. This is a truncated sample for compliance audit trails, not full message storage.

### 6.3 SessionMemory stores Brain summaries, not raw messages

**PASS.** The `memorySummary` Json field is initialized in hires.ts (lines 79-88) with structured data:
```
{ userName, goals, lastSessionSummary, nextSessionFocus, motivationalContext, progressPercent, sentimentHistory, wellbeingNotes }
```
These are computed summaries, not raw chat messages.

### 6.4 Gateway invoke handler - messages in-memory only

**PASS.** In server/src/gateway/index.ts:
- Messages are received in the request body (line 84)
- Passed to the LLM as in-memory `llmMessages` array (line 231)
- After LLM response, only metadata is stored via `logInvocationMetadata()` (lines 276, 301)
- The `logInvocationMetadata` function (lines 381-401) creates an AgentSession with only: sessionId, userId, hireId, status, inputMode, environmentSlug, messageCount, durationSeconds, startedAt, endedAt
- Comment on line 275: "Log metadata ONLY after streaming completes - never message content"
- Comment on line 300: "Log metadata ONLY - never message content"
- Comment on line 365: "Helper: Log invocation metadata (NEVER message content)"
- Comment on line 383: "Store in AgentSession as metadata only - never message content"

### 6.5 Sessions router - no message content returned or stored

**PASS.** As verified in V5.6 above, all session endpoints return metadata only. The `select` objects in `listSessions` and `getSessionMeta` explicitly enumerate only metadata fields. No message content field exists on the model to select.

### 6.6 "content" grep in database-related code

**PASS.** Grepping for "content" across server/src/ shows:
- `content` in gateway/llm-router.ts refers to LLM message content in transit (in-memory), never persisted
- `content` in gateway/index.ts line 316 is the LLM response returned to the caller, not stored
- `content` in sessions.ts comments confirm "NO message content" in three places
- No `prisma.*.create()` or `prisma.*.update()` call anywhere stores message body text

### 6.7 BrainSyncLog model

**PASS.** Stores only sync metadata (cloudDriveType, fileId, fileSizeBytes, syncStatus, errorMessage). Brain data itself lives in the user's cloud drive, not in the database. Comment on line 172: "Brain data NEVER stored here - only sync metadata"

### V6 VERDICT: PASS - No violations found

Session messages exist only in-memory during gateway invocations. The database stores session metadata (counts, durations, modes) but never message content. SessionMemory stores structured Brain summaries (JSON), not raw chat text. The only partial text storage is HITLEvent.inputSample (first 200 chars for compliance), which is a deliberate, documented, truncated audit trail - not full message storage.

---

## Summary

| Invariant | Status | Violations |
|-----------|--------|------------|
| V5 - systemPrompt never in tRPC response | **PASS** | 0 |
| V6 - Session messages not stored in DB | **PASS** | 0 |

Both security invariants hold across all routers, the gateway, the audit pipeline, the seed script, and the Prisma schema.
