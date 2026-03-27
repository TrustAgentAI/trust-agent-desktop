"""Action audit logging for the Trust Agent runtime.

Logs every tool invocation and LLM call. Streams events to Tauri via stdout
and persists a local copy in SQLite. Optionally sends events to the Trust Agent
platform API for the platform-level audit trail.
"""

from __future__ import annotations

import json
import sys
import time
from datetime import datetime, timezone
from typing import Any, Optional

import httpx
import sqlite_utils

from config import RuntimeConfig


class AuditLogger:
    """Centralised audit logger for all agent actions."""

    def __init__(self, config: RuntimeConfig, db: sqlite_utils.Database) -> None:
        self._config = config
        self._db = db
        self._ensure_tables()

    # ------------------------------------------------------------------
    # Schema
    # ------------------------------------------------------------------

    def _ensure_tables(self) -> None:
        if "audit_events" not in self._db.table_names():
            self._db["audit_events"].create(
                {
                    "id": int,
                    "session_id": str,
                    "timestamp": str,
                    "event_type": str,
                    "tool_name": str,
                    "arguments": str,
                    "result_summary": str,
                    "success": int,
                    "error_message": str,
                    "token_count_prompt": int,
                    "token_count_completion": int,
                    "duration_ms": float,
                },
                pk="id",
            )

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def log_tool_invocation(
        self,
        tool_name: str,
        arguments: dict[str, Any],
        result_summary: str,
        success: bool,
        error_message: str = "",
        duration_ms: float = 0.0,
    ) -> None:
        """Log a tool invocation to SQLite, stdout, and remote API."""

        event = self._build_event(
            event_type="tool_invocation",
            tool_name=tool_name,
            arguments=arguments,
            result_summary=result_summary,
            success=success,
            error_message=error_message,
            duration_ms=duration_ms,
        )
        self._persist(event)
        self._emit_stdout(event)

    def log_llm_call(
        self,
        provider: str,
        model: str,
        prompt_tokens: int,
        completion_tokens: int,
        duration_ms: float,
        success: bool,
        error_message: str = "",
    ) -> None:
        """Log an LLM API call."""

        event = self._build_event(
            event_type="llm_call",
            tool_name=f"{provider}/{model}",
            arguments={"provider": provider, "model": model},
            result_summary=f"prompt={prompt_tokens} completion={completion_tokens}",
            success=success,
            error_message=error_message,
            duration_ms=duration_ms,
            token_count_prompt=prompt_tokens,
            token_count_completion=completion_tokens,
        )
        self._persist(event)
        self._emit_stdout(event)

    async def flush_to_remote(self) -> None:
        """Send any un-synced audit events to the Trust Agent platform API."""

        if not self._config.trust_agent.session_token:
            return

        url = f"{self._config.trust_agent.api_url}/v1/audit/events"
        headers = {
            "Authorization": f"Bearer {self._config.trust_agent.session_token}",
            "Content-Type": "application/json",
        }

        rows = list(self._db.execute("SELECT * FROM audit_events ORDER BY id").fetchall())
        if not rows:
            return

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.post(url, headers=headers, json={"events": rows})
                resp.raise_for_status()
                # Clear synced rows on success
                ids = [r[0] for r in rows]
                placeholders = ",".join("?" for _ in ids)
                self._db.execute(f"DELETE FROM audit_events WHERE id IN ({placeholders})", ids)
        except Exception:
            # Silently keep events for next flush attempt
            pass

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _build_event(
        self,
        *,
        event_type: str,
        tool_name: str,
        arguments: dict[str, Any],
        result_summary: str,
        success: bool,
        error_message: str = "",
        duration_ms: float = 0.0,
        token_count_prompt: int = 0,
        token_count_completion: int = 0,
    ) -> dict[str, Any]:
        return {
            "session_id": self._config.session_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "event_type": event_type,
            "tool_name": tool_name,
            "arguments": json.dumps(arguments),
            "result_summary": result_summary[:500],
            "success": 1 if success else 0,
            "error_message": error_message[:1000],
            "token_count_prompt": token_count_prompt,
            "token_count_completion": token_count_completion,
            "duration_ms": duration_ms,
        }

    def _persist(self, event: dict[str, Any]) -> None:
        try:
            self._db["audit_events"].insert(event)
        except Exception:
            pass  # Never crash the agent because of audit persistence

    @staticmethod
    def _emit_stdout(event: dict[str, Any]) -> None:
        """Emit an audit event as a JSON line to stdout for Tauri to read."""
        payload = {
            "type": "audit",
            "data": event,
        }
        sys.stdout.write(json.dumps(payload) + "\n")
        sys.stdout.flush()
