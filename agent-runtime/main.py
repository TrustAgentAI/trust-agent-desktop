"""Trust Agent runtime sidecar - entry point.

Spawned as a subprocess by the Tauri desktop app. Reads configuration from
stdin (a single JSON line), initialises the orchestrator, connects to the
Trust Agent gateway via WebSocket, and enters the main event loop.

All output is JSON lines on stdout, consumed by Tauri.
"""

from __future__ import annotations

import asyncio
import json
import signal
import sys
from typing import Any, Optional

import websockets
import websockets.asyncio.client as ws_client

from config import RuntimeConfig
from runtime.audit import AuditLogger
from runtime.memory import SessionMemory
from runtime.orchestrator import Orchestrator
from runtime.tools import ToolRegistry
from voice.pipeline import VoicePipeline


# ------------------------------------------------------------------
# Stdout helpers
# ------------------------------------------------------------------

def _emit(event: dict[str, Any]) -> None:
    """Write a JSON-line event to stdout."""
    sys.stdout.write(json.dumps(event) + "\n")
    sys.stdout.flush()


def _emit_status(status: str, detail: str = "") -> None:
    _emit({"type": "status", "data": {"status": status, "detail": detail}})


def _emit_error(message: str) -> None:
    _emit({"type": "error", "data": {"message": message}})


# ------------------------------------------------------------------
# Config loading
# ------------------------------------------------------------------

def _read_config_from_stdin() -> RuntimeConfig:
    """Read a single JSON line from stdin and parse it into RuntimeConfig."""
    _emit_status("initialising", "Reading configuration from stdin")
    raw = sys.stdin.readline().strip()
    if not raw:
        raise RuntimeError("No configuration received on stdin")
    try:
        data = json.loads(raw)
        return RuntimeConfig(**data)
    except Exception as exc:
        raise RuntimeError(f"Invalid configuration JSON: {exc}") from exc


# ------------------------------------------------------------------
# WebSocket connection to Trust Agent gateway
# ------------------------------------------------------------------

async def _handle_ws_message(
    msg: str,
    orchestrator: Orchestrator,
    voice: VoicePipeline,
) -> None:
    """Process a single message received from the Trust Agent WebSocket gateway."""
    try:
        data = json.loads(msg)
    except json.JSONDecodeError:
        _emit_error(f"Invalid JSON from gateway: {msg[:200]}")
        return

    msg_type = data.get("type", "")

    if msg_type == "chat_message":
        user_text = data.get("data", {}).get("text", "")
        if user_text:
            response = await orchestrator.handle_message(user_text)
            _emit({"type": "response", "data": {"text": response}})

    elif msg_type == "audio_data":
        import base64

        audio_b64 = data.get("data", {}).get("audio", "")
        if audio_b64:
            audio_bytes = base64.b64decode(audio_b64)
            await voice.handle_audio_input(audio_bytes)

    elif msg_type == "task_update":
        # Forward task updates directly
        _emit({"type": "task_update", "data": data.get("data", {})})

    elif msg_type == "ping":
        # Respond to keepalive
        pass

    else:
        _emit({"type": "gateway_event", "data": data})


async def _ws_loop(
    config: RuntimeConfig,
    orchestrator: Orchestrator,
    voice: VoicePipeline,
    shutdown_event: asyncio.Event,
) -> None:
    """Maintain a WebSocket connection to the Trust Agent gateway with reconnection."""
    if not config.trust_agent.ws_url or not config.trust_agent.session_token:
        _emit_status("running", "No gateway URL configured - running in local-only mode")
        # In local-only mode, just read from stdin
        await _stdin_loop(orchestrator, voice, shutdown_event)
        return

    ws_url = f"{config.trust_agent.ws_url}/v1/session/{config.trust_agent.role_hire_id}"
    headers = {"Authorization": f"Bearer {config.trust_agent.session_token}"}

    backoff = 1.0
    max_backoff = 30.0

    while not shutdown_event.is_set():
        try:
            _emit_status("connecting", f"Connecting to gateway")
            async with ws_client.connect(
                ws_url,
                additional_headers=headers,
                ping_interval=20,
                ping_timeout=10,
                close_timeout=5,
            ) as ws:
                _emit_status("connected", "Connected to Trust Agent gateway")
                backoff = 1.0  # Reset backoff on success

                async for message in ws:
                    if shutdown_event.is_set():
                        break
                    if isinstance(message, str):
                        await _handle_ws_message(message, orchestrator, voice)

        except websockets.exceptions.ConnectionClosed as exc:
            _emit_status("disconnected", f"Gateway connection closed: {exc}")
        except Exception as exc:
            _emit_error(f"Gateway connection error: {exc}")

        if not shutdown_event.is_set():
            _emit_status("reconnecting", f"Retrying in {backoff:.0f}s")
            await asyncio.sleep(backoff)
            backoff = min(backoff * 2, max_backoff)


async def _stdin_loop(
    orchestrator: Orchestrator,
    voice: VoicePipeline,
    shutdown_event: asyncio.Event,
) -> None:
    """In local-only mode, read JSON commands from stdin."""
    loop = asyncio.get_event_loop()
    reader = asyncio.StreamReader()
    protocol = asyncio.StreamReaderProtocol(reader)

    try:
        transport, _ = await loop.connect_read_pipe(lambda: protocol, sys.stdin)
    except Exception:
        # Fallback: poll stdin in a thread
        while not shutdown_event.is_set():
            line = await loop.run_in_executor(None, sys.stdin.readline)
            if not line:
                break
            line = line.strip()
            if not line:
                continue
            try:
                data = json.loads(line)
                msg_type = data.get("type", "")
                if msg_type == "chat_message":
                    user_text = data.get("data", {}).get("text", "")
                    if user_text:
                        response = await orchestrator.handle_message(user_text)
                        _emit({"type": "response", "data": {"text": response}})
                elif msg_type == "shutdown":
                    shutdown_event.set()
                    break
            except json.JSONDecodeError:
                pass
        return

    while not shutdown_event.is_set():
        line_bytes = await reader.readline()
        if not line_bytes:
            break
        line = line_bytes.decode("utf-8", errors="replace").strip()
        if not line:
            continue
        try:
            data = json.loads(line)
            await _handle_ws_message(json.dumps(data), orchestrator, voice)
        except json.JSONDecodeError:
            pass


# ------------------------------------------------------------------
# Periodic tasks
# ------------------------------------------------------------------

async def _audit_flush_loop(
    audit: AuditLogger,
    shutdown_event: asyncio.Event,
    interval: float = 60.0,
) -> None:
    """Periodically flush audit events to the remote platform."""
    while not shutdown_event.is_set():
        await asyncio.sleep(interval)
        try:
            await audit.flush_to_remote()
        except Exception:
            pass


# ------------------------------------------------------------------
# Main
# ------------------------------------------------------------------

async def _async_main() -> None:
    """Async entry point."""
    shutdown_event = asyncio.Event()

    # Handle termination signals
    def _signal_handler() -> None:
        _emit_status("shutting_down", "Received shutdown signal")
        shutdown_event.set()

    loop = asyncio.get_event_loop()
    for sig in (signal.SIGINT, signal.SIGTERM):
        try:
            loop.add_signal_handler(sig, _signal_handler)
        except NotImplementedError:
            # Windows does not support add_signal_handler for all signals
            pass

    # 1. Read config
    try:
        config = _read_config_from_stdin()
    except RuntimeError as exc:
        _emit_error(str(exc))
        sys.exit(1)

    _emit_status("initialising", "Configuration loaded")

    # 2. Initialise memory
    memory = SessionMemory()
    _emit_status("initialising", "Session memory ready")

    # 3. Initialise audit logger
    audit = AuditLogger(config, memory.db)

    # 4. Initialise tools
    tools = ToolRegistry(config.permissions, audit)

    # 5. Initialise orchestrator
    orchestrator = Orchestrator(config, memory, tools, audit)
    _emit_status("initialising", "Orchestrator ready")

    # 6. Initialise voice pipeline
    voice = VoicePipeline(config, orchestrator)
    if config.voice.enabled:
        await voice.start()
        _emit_status("initialising", "Voice pipeline ready")

    # 7. Emit ready
    _emit_status("ready", "Trust Agent runtime is ready")

    # 8. Run main loops
    tasks = [
        asyncio.create_task(_ws_loop(config, orchestrator, voice, shutdown_event)),
        asyncio.create_task(_audit_flush_loop(audit, shutdown_event)),
    ]

    # Wait for shutdown
    await shutdown_event.wait()

    # 9. Graceful shutdown
    _emit_status("shutting_down", "Cleaning up")
    await voice.stop()
    await audit.flush_to_remote()

    for task in tasks:
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass

    _emit_status("stopped", "Runtime stopped")


def main() -> None:
    """Synchronous entry point."""
    try:
        asyncio.run(_async_main())
    except KeyboardInterrupt:
        _emit({"type": "status", "data": {"status": "stopped", "detail": "Interrupted"}})
    except Exception as exc:
        _emit({"type": "error", "data": {"message": f"Fatal error: {exc}"}})
        sys.exit(1)


if __name__ == "__main__":
    main()
