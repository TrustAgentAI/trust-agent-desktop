"""Trust Agent runtime sidecar - entry point.

Reads JSON line commands from stdin, handles agent:init, agent:message,
agent:shutdown, voice:start, voice:stop. Emits JSON lines to stdout.
Never crashes on malformed input.
"""

from __future__ import annotations

import asyncio
import json
import os
import sys
import signal
import time
from typing import Any, Optional

# ---------------------------------------------------------------------------
# Stdout helpers
# ---------------------------------------------------------------------------

def _emit(event: dict[str, Any]) -> None:
    """Write a JSON-line event to stdout."""
    try:
        sys.stdout.write(json.dumps(event) + "\n")
        sys.stdout.flush()
    except Exception:
        pass


def _emit_event(event_type: str, payload: dict[str, Any]) -> None:
    _emit({"type": event_type, "payload": payload})


def _emit_error(message: str) -> None:
    _emit({"type": "agent:error", "payload": {"message": message}})


# ---------------------------------------------------------------------------
# Default offline config
# ---------------------------------------------------------------------------

DEFAULT_CONFIG = {
    "systemPrompt": (
        "You are a Trust Agent role assistant running in development mode. "
        "The Trust Agent gateway is not connected. Inform the user they need "
        "to connect their API key to activate the full role."
    ),
    "tools": [],
    "voiceId": None,
}


# ---------------------------------------------------------------------------
# Simple memory (SQLite)
# ---------------------------------------------------------------------------

class SimpleMemory:
    """Minimal SQLite-backed message history."""

    def __init__(self, hire_id: str) -> None:
        import sqlite3
        base = os.path.join(os.path.expanduser("~"), ".trust-agent", "memory")
        os.makedirs(base, exist_ok=True)
        db_path = os.path.join(base, f"{hire_id}.db")
        self._conn = sqlite3.connect(db_path)
        self._conn.execute(
            "CREATE TABLE IF NOT EXISTS messages "
            "(id INTEGER PRIMARY KEY AUTOINCREMENT, role TEXT, content TEXT, timestamp TEXT)"
        )
        self._conn.commit()

    def add_message(self, role: str, content: str) -> None:
        try:
            self._conn.execute(
                "INSERT INTO messages (role, content, timestamp) VALUES (?, ?, ?)",
                (role, content, time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())),
            )
            self._conn.commit()
        except Exception:
            pass

    def get_history(self, limit: int = 50) -> list[dict[str, str]]:
        try:
            rows = self._conn.execute(
                "SELECT role, content, timestamp FROM messages ORDER BY id DESC LIMIT ?",
                (limit,),
            ).fetchall()
            rows.reverse()
            return [{"role": r[0], "content": r[1], "timestamp": r[2]} for r in rows]
        except Exception:
            return []

    def clear_history(self) -> None:
        try:
            self._conn.execute("DELETE FROM messages")
            self._conn.commit()
        except Exception:
            pass


# ---------------------------------------------------------------------------
# LLM calling
# ---------------------------------------------------------------------------

async def _call_llm(
    messages: list[dict[str, str]],
    system_prompt: str,
) -> str:
    """Call the customer's LLM. Falls back to offline response if keys not set."""
    base_url = os.environ.get("CUSTOMER_LLM_BASE_URL", "")
    api_key = os.environ.get("CUSTOMER_LLM_API_KEY", "")
    model = os.environ.get("CUSTOMER_LLM_MODEL", "gpt-4o")

    if not api_key:
        return (
            "I'm running in offline development mode. To activate the full role, "
            "connect your API key in the Trust Agent Desktop settings."
        )

    try:
        import httpx

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        url = f"{base_url}/chat/completions" if base_url else "https://api.openai.com/v1/chat/completions"

        api_messages = [{"role": "system", "content": system_prompt}] + messages

        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                url,
                headers=headers,
                json={
                    "model": model,
                    "messages": api_messages,
                    "stream": True,
                },
            )
            resp.raise_for_status()

            full_text = ""
            async for line in resp.aiter_lines():
                if not line.startswith("data: "):
                    continue
                data_str = line[6:]
                if data_str.strip() == "[DONE]":
                    break
                try:
                    chunk = json.loads(data_str)
                    delta = chunk.get("choices", [{}])[0].get("delta", {})
                    token = delta.get("content", "")
                    if token:
                        full_text += token
                        _emit_event("agent:token", {"token": token})
                except json.JSONDecodeError:
                    continue

            return full_text

    except Exception as exc:
        _emit_error(f"LLM API error: {exc}")
        return f"Error communicating with LLM: {exc}"


# ---------------------------------------------------------------------------
# Command handlers
# ---------------------------------------------------------------------------

_memories: dict[str, SimpleMemory] = {}
_configs: dict[str, dict[str, Any]] = {}


async def _handle_init(payload: dict[str, Any]) -> None:
    hire_id = payload.get("hireId", "unknown")
    session_token = payload.get("sessionToken", "")
    api_url = os.environ.get("TA_API_URL", "https://api.trust-agent.ai")

    config = dict(DEFAULT_CONFIG)

    if session_token:
        try:
            import httpx
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(
                    f"{api_url}/api/role-config/{hire_id}",
                    headers={"Authorization": f"Bearer {session_token}"},
                )
                if resp.status_code == 200:
                    data = resp.json()
                    if isinstance(data, dict):
                        config = data
        except Exception:
            pass  # Fall back to default config

    _configs[hire_id] = config
    _memories[hire_id] = SimpleMemory(hire_id)
    _emit_event("agent:ready", {"hireId": hire_id})


async def _handle_message(payload: dict[str, Any]) -> None:
    hire_id = payload.get("hireId", "unknown")
    content = payload.get("content", "")

    if not content:
        return

    memory = _memories.get(hire_id)
    if not memory:
        memory = SimpleMemory(hire_id)
        _memories[hire_id] = memory

    config = _configs.get(hire_id, DEFAULT_CONFIG)
    system_prompt = config.get("systemPrompt", DEFAULT_CONFIG["systemPrompt"])

    memory.add_message("user", content)
    history = memory.get_history()
    messages = [{"role": m["role"], "content": m["content"]} for m in history]

    full_response = await _call_llm(messages, system_prompt)
    memory.add_message("assistant", full_response)

    _emit_event("agent:done", {
        "hireId": hire_id,
        "messageId": f"msg_{int(time.time() * 1000)}",
        "fullContent": full_response,
    })


async def _handle_shutdown(_payload: dict[str, Any]) -> None:
    _emit_event("agent:shutdown", {"status": "stopped"})


# ---------------------------------------------------------------------------
# Main loop
# ---------------------------------------------------------------------------

async def _main_loop() -> None:
    loop = asyncio.get_event_loop()

    while True:
        try:
            line = await loop.run_in_executor(None, sys.stdin.readline)
        except Exception:
            break

        if not line:
            break

        line = line.strip()
        if not line:
            continue

        try:
            data = json.loads(line)
        except json.JSONDecodeError:
            _emit_error(f"Invalid JSON input")
            continue

        msg_type = data.get("type", "")
        payload = data.get("payload", {})

        try:
            if msg_type == "agent:init":
                await _handle_init(payload)
            elif msg_type == "agent:message":
                await _handle_message(payload)
            elif msg_type == "agent:shutdown":
                await _handle_shutdown(payload)
                break
            elif msg_type == "voice:start":
                _emit_event("voice:status", {"status": "not_available_in_dev"})
            elif msg_type == "voice:stop":
                _emit_event("voice:status", {"status": "stopped"})
            else:
                _emit_error(f"Unknown command type: {msg_type}")
        except Exception as exc:
            _emit_error(f"Handler error: {exc}")


def main() -> None:
    try:
        asyncio.run(_main_loop())
    except KeyboardInterrupt:
        _emit_event("agent:shutdown", {"status": "interrupted"})
    except Exception as exc:
        _emit_error(f"Fatal error: {exc}")
        sys.exit(1)


if __name__ == "__main__":
    main()
