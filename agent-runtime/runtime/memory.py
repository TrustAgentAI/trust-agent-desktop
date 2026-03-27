"""SQLite session memory for the Trust Agent runtime.

Stores conversation history, task state, step progress, role context, and user
preferences. The database lives at $APPDATA/trust-agent/sessions.db and tables
are auto-created on first run.
"""

from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

import sqlite_utils


def _default_db_path() -> Path:
    """Return the default database path under APPDATA (Windows) or XDG data home."""
    appdata = os.environ.get("APPDATA")
    if appdata:
        base = Path(appdata) / "trust-agent"
    else:
        base = Path.home() / ".local" / "share" / "trust-agent"
    base.mkdir(parents=True, exist_ok=True)
    return base / "sessions.db"


class SessionMemory:
    """Persistent session memory backed by SQLite."""

    def __init__(self, db_path: Optional[Path] = None) -> None:
        self._path = db_path or _default_db_path()
        self._db = sqlite_utils.Database(str(self._path))
        self._ensure_tables()

    @property
    def db(self) -> sqlite_utils.Database:
        """Expose the raw database for audit logger and other consumers."""
        return self._db

    # ------------------------------------------------------------------
    # Schema bootstrap
    # ------------------------------------------------------------------

    def _ensure_tables(self) -> None:
        if "conversations" not in self._db.table_names():
            self._db["conversations"].create(
                {
                    "id": int,
                    "session_id": str,
                    "role": str,
                    "content": str,
                    "tool_calls": str,
                    "timestamp": str,
                },
                pk="id",
            )
            self._db["conversations"].create_index(["session_id"])

        if "task_state" not in self._db.table_names():
            self._db["task_state"].create(
                {
                    "id": int,
                    "session_id": str,
                    "task_id": str,
                    "status": str,
                    "current_step": int,
                    "total_steps": int,
                    "metadata": str,
                    "updated_at": str,
                },
                pk="id",
            )
            self._db["task_state"].create_index(["session_id", "task_id"], unique=True)

        if "role_context" not in self._db.table_names():
            self._db["role_context"].create(
                {
                    "id": int,
                    "session_id": str,
                    "key": str,
                    "value": str,
                    "updated_at": str,
                },
                pk="id",
            )
            self._db["role_context"].create_index(["session_id", "key"], unique=True)

        if "user_preferences" not in self._db.table_names():
            self._db["user_preferences"].create(
                {
                    "id": int,
                    "key": str,
                    "value": str,
                    "updated_at": str,
                },
                pk="id",
            )
            self._db["user_preferences"].create_index(["key"], unique=True)

    # ------------------------------------------------------------------
    # Conversation history
    # ------------------------------------------------------------------

    def add_message(
        self,
        session_id: str,
        role: str,
        content: str,
        tool_calls: Optional[list[dict[str, Any]]] = None,
    ) -> None:
        self._db["conversations"].insert(
            {
                "session_id": session_id,
                "role": role,
                "content": content,
                "tool_calls": json.dumps(tool_calls or []),
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
        )

    def get_history(self, session_id: str, limit: int = 50) -> list[dict[str, Any]]:
        rows = list(
            self._db.execute(
                "SELECT role, content, tool_calls, timestamp FROM conversations "
                "WHERE session_id = ? ORDER BY id DESC LIMIT ?",
                [session_id, limit],
            ).fetchall()
        )
        rows.reverse()
        return [
            {
                "role": r[0],
                "content": r[1],
                "tool_calls": json.loads(r[2]) if r[2] else [],
                "timestamp": r[3],
            }
            for r in rows
        ]

    # ------------------------------------------------------------------
    # Task state
    # ------------------------------------------------------------------

    def upsert_task(
        self,
        session_id: str,
        task_id: str,
        status: str,
        current_step: int = 0,
        total_steps: int = 0,
        metadata: Optional[dict[str, Any]] = None,
    ) -> None:
        now = datetime.now(timezone.utc).isoformat()
        self._db["task_state"].upsert(
            {
                "session_id": session_id,
                "task_id": task_id,
                "status": status,
                "current_step": current_step,
                "total_steps": total_steps,
                "metadata": json.dumps(metadata or {}),
                "updated_at": now,
            },
            pk="id",
            alter=True,
        )

    def get_task(self, session_id: str, task_id: str) -> Optional[dict[str, Any]]:
        rows = list(
            self._db.execute(
                "SELECT status, current_step, total_steps, metadata, updated_at "
                "FROM task_state WHERE session_id = ? AND task_id = ?",
                [session_id, task_id],
            ).fetchall()
        )
        if not rows:
            return None
        r = rows[0]
        return {
            "status": r[0],
            "current_step": r[1],
            "total_steps": r[2],
            "metadata": json.loads(r[3]) if r[3] else {},
            "updated_at": r[4],
        }

    # ------------------------------------------------------------------
    # Role context
    # ------------------------------------------------------------------

    def set_context(self, session_id: str, key: str, value: Any) -> None:
        now = datetime.now(timezone.utc).isoformat()
        self._db["role_context"].upsert(
            {
                "session_id": session_id,
                "key": key,
                "value": json.dumps(value),
                "updated_at": now,
            },
            pk="id",
            alter=True,
        )

    def get_context(self, session_id: str, key: str) -> Optional[Any]:
        rows = list(
            self._db.execute(
                "SELECT value FROM role_context WHERE session_id = ? AND key = ?",
                [session_id, key],
            ).fetchall()
        )
        if not rows:
            return None
        return json.loads(rows[0][0])

    # ------------------------------------------------------------------
    # User preferences (global, not session-scoped)
    # ------------------------------------------------------------------

    def set_preference(self, key: str, value: Any) -> None:
        now = datetime.now(timezone.utc).isoformat()
        self._db["user_preferences"].upsert(
            {
                "key": key,
                "value": json.dumps(value),
                "updated_at": now,
            },
            pk="id",
            alter=True,
        )

    def get_preference(self, key: str) -> Optional[Any]:
        rows = list(
            self._db.execute(
                "SELECT value FROM user_preferences WHERE key = ?",
                [key],
            ).fetchall()
        )
        if not rows:
            return None
        return json.loads(rows[0][0])
