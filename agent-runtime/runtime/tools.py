"""Agent tools for the Trust Agent runtime.

Every tool validates file-path access against the granted permissions before
executing. All invocations are logged via the audit logger.
"""

from __future__ import annotations

import asyncio
import json
import os
import subprocess
import time
from pathlib import Path
from typing import Any, Optional

import httpx

from config import AccessLevel, PermissionConfig
from runtime.audit import AuditLogger


class PermissionError(Exception):
    """Raised when the agent tries to access a path outside granted permissions."""


class ToolRegistry:
    """Registry and executor for agent tools."""

    def __init__(self, permissions: PermissionConfig, audit: AuditLogger) -> None:
        self._permissions = permissions
        self._audit = audit
        self._tool_map: dict[str, Any] = {
            "read_file": self.read_file,
            "write_file": self.write_file,
            "list_directory": self.list_directory,
            "search_files": self.search_files,
            "execute_command": self.execute_command,
            "web_search": self.web_search,
        }

    # ------------------------------------------------------------------
    # Tool definitions (for LLM function-calling schema)
    # ------------------------------------------------------------------

    def get_tool_definitions(self) -> list[dict[str, Any]]:
        """Return OpenAI-compatible tool/function definitions."""
        tools: list[dict[str, Any]] = [
            {
                "type": "function",
                "function": {
                    "name": "read_file",
                    "description": "Read the contents of a file at the given path.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "path": {"type": "string", "description": "Absolute file path to read."},
                        },
                        "required": ["path"],
                    },
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "write_file",
                    "description": "Write content to a file at the given path.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "path": {"type": "string", "description": "Absolute file path to write."},
                            "content": {"type": "string", "description": "Content to write to the file."},
                        },
                        "required": ["path", "content"],
                    },
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "list_directory",
                    "description": "List the contents of a directory.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "path": {"type": "string", "description": "Absolute directory path to list."},
                        },
                        "required": ["path"],
                    },
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "search_files",
                    "description": "Search for files whose contents match a query string.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "path": {"type": "string", "description": "Directory to search within."},
                            "query": {"type": "string", "description": "Text to search for."},
                        },
                        "required": ["path", "query"],
                    },
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "execute_command",
                    "description": "Execute a shell command. Requires explicit permission.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "command": {"type": "string", "description": "Shell command to execute."},
                        },
                        "required": ["command"],
                    },
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "web_search",
                    "description": "Search the web for information.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "query": {"type": "string", "description": "Search query string."},
                        },
                        "required": ["query"],
                    },
                },
            },
        ]
        return tools

    # ------------------------------------------------------------------
    # Dispatcher
    # ------------------------------------------------------------------

    async def execute(self, tool_name: str, arguments: dict[str, Any]) -> str:
        """Execute a tool by name, with audit logging."""
        fn = self._tool_map.get(tool_name)
        if fn is None:
            return json.dumps({"error": f"Unknown tool: {tool_name}"})

        start = time.monotonic()
        try:
            result = await fn(**arguments)
            duration = (time.monotonic() - start) * 1000
            self._audit.log_tool_invocation(
                tool_name=tool_name,
                arguments=arguments,
                result_summary=result[:500] if isinstance(result, str) else str(result)[:500],
                success=True,
                duration_ms=duration,
            )
            return result
        except PermissionError as exc:
            duration = (time.monotonic() - start) * 1000
            error_msg = f"Permission denied: {exc}"
            self._audit.log_tool_invocation(
                tool_name=tool_name,
                arguments=arguments,
                result_summary="",
                success=False,
                error_message=error_msg,
                duration_ms=duration,
            )
            return json.dumps({"error": error_msg})
        except Exception as exc:
            duration = (time.monotonic() - start) * 1000
            error_msg = f"{type(exc).__name__}: {exc}"
            self._audit.log_tool_invocation(
                tool_name=tool_name,
                arguments=arguments,
                result_summary="",
                success=False,
                error_message=error_msg,
                duration_ms=duration,
            )
            return json.dumps({"error": error_msg})

    # ------------------------------------------------------------------
    # Permission helpers
    # ------------------------------------------------------------------

    def _resolve_path(self, raw_path: str) -> Path:
        """Resolve and normalise a path."""
        return Path(raw_path).resolve()

    def _check_path_permission(self, path: Path, required_level: AccessLevel) -> None:
        """Raise PermissionError if the path is not within granted paths."""
        path_str = str(path)

        # Check blocked paths first
        for blocked in self._permissions.blocked_paths:
            blocked_resolved = str(Path(blocked).resolve())
            if path_str.startswith(blocked_resolved):
                raise PermissionError(f"Path is explicitly blocked: {path}")

        # Check granted paths
        for granted in self._permissions.granted_paths:
            granted_resolved = str(Path(granted).resolve())
            if path_str.startswith(granted_resolved):
                # Check access level
                levels = self._permissions.access_levels.get(granted, [])
                if not levels or required_level in levels:
                    return
                # If access_levels not configured for this path, allow read by default
                if required_level == AccessLevel.READ:
                    return
                raise PermissionError(
                    f"Access level '{required_level.value}' not granted for path: {path}"
                )

        raise PermissionError(f"Path not in granted paths: {path}")

    # ------------------------------------------------------------------
    # Tool implementations
    # ------------------------------------------------------------------

    async def read_file(self, path: str) -> str:
        resolved = self._resolve_path(path)
        self._check_path_permission(resolved, AccessLevel.READ)

        if not resolved.is_file():
            return json.dumps({"error": f"Not a file: {resolved}"})

        try:
            content = resolved.read_text(encoding="utf-8", errors="replace")
            # Cap at 100KB to avoid blowing up context
            if len(content) > 102400:
                content = content[:102400] + "\n...[truncated at 100KB]"
            return content
        except Exception as exc:
            return json.dumps({"error": f"Failed to read file: {exc}"})

    async def write_file(self, path: str, content: str) -> str:
        resolved = self._resolve_path(path)
        self._check_path_permission(resolved, AccessLevel.WRITE)

        try:
            resolved.parent.mkdir(parents=True, exist_ok=True)
            resolved.write_text(content, encoding="utf-8")
            return json.dumps({"success": True, "path": str(resolved), "bytes_written": len(content)})
        except Exception as exc:
            return json.dumps({"error": f"Failed to write file: {exc}"})

    async def list_directory(self, path: str) -> str:
        resolved = self._resolve_path(path)
        self._check_path_permission(resolved, AccessLevel.READ)

        if not resolved.is_dir():
            return json.dumps({"error": f"Not a directory: {resolved}"})

        try:
            entries: list[dict[str, Any]] = []
            for item in sorted(resolved.iterdir()):
                entries.append(
                    {
                        "name": item.name,
                        "type": "directory" if item.is_dir() else "file",
                        "size": item.stat().st_size if item.is_file() else None,
                    }
                )
                if len(entries) >= 500:
                    break
            return json.dumps({"path": str(resolved), "entries": entries})
        except Exception as exc:
            return json.dumps({"error": f"Failed to list directory: {exc}"})

    async def search_files(self, path: str, query: str) -> str:
        resolved = self._resolve_path(path)
        self._check_path_permission(resolved, AccessLevel.READ)

        if not resolved.is_dir():
            return json.dumps({"error": f"Not a directory: {resolved}"})

        matches: list[dict[str, Any]] = []
        max_matches = 50
        max_file_size = 1_048_576  # 1MB

        try:
            for root, _dirs, files in os.walk(str(resolved)):
                for fname in files:
                    if len(matches) >= max_matches:
                        break
                    fpath = Path(root) / fname
                    if fpath.stat().st_size > max_file_size:
                        continue
                    try:
                        text = fpath.read_text(encoding="utf-8", errors="replace")
                        for line_no, line in enumerate(text.splitlines(), start=1):
                            if query.lower() in line.lower():
                                matches.append(
                                    {
                                        "file": str(fpath),
                                        "line": line_no,
                                        "content": line.strip()[:200],
                                    }
                                )
                                if len(matches) >= max_matches:
                                    break
                    except Exception:
                        continue
            return json.dumps({"query": query, "matches": matches})
        except Exception as exc:
            return json.dumps({"error": f"Search failed: {exc}"})

    async def execute_command(self, command: str) -> str:
        if not self._permissions.allow_command_execution:
            raise PermissionError("Command execution is not permitted")

        try:
            proc = await asyncio.create_subprocess_shell(
                command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=30.0)
            return json.dumps(
                {
                    "exit_code": proc.returncode,
                    "stdout": stdout.decode("utf-8", errors="replace")[:50000],
                    "stderr": stderr.decode("utf-8", errors="replace")[:10000],
                }
            )
        except asyncio.TimeoutError:
            return json.dumps({"error": "Command timed out after 30 seconds"})
        except Exception as exc:
            return json.dumps({"error": f"Command execution failed: {exc}"})

    async def web_search(self, query: str) -> str:
        if not self._permissions.allow_web_search:
            raise PermissionError("Web search is not permitted")

        # Uses a simple web search via DuckDuckGo HTML (no API key needed)
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.get(
                    "https://html.duckduckgo.com/html/",
                    params={"q": query},
                    headers={"User-Agent": "TrustAgent/1.0"},
                )
                resp.raise_for_status()
                # Return raw HTML snippet - the LLM will parse it
                body = resp.text[:20000]
                return json.dumps({"query": query, "results_html": body})
        except Exception as exc:
            return json.dumps({"error": f"Web search failed: {exc}"})
