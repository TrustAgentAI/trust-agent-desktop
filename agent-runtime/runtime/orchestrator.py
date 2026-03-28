"""LLM orchestration engine for the Trust Agent runtime.

Routes to OpenAI, Anthropic, or local LLM providers based on client config.
Maintains conversation context with the role-specific system prompt, handles
tool calls, and streams responses back via stdout JSON events.
"""

from __future__ import annotations

import json
import sys
import time
from typing import Any, AsyncIterator, Optional

import anthropic
import openai

from config import LLMProvider, RuntimeConfig, get_language_name
from runtime.audit import AuditLogger
from runtime.memory import SessionMemory
from runtime.tools import ToolRegistry

# ---------------------------------------------------------------------------
# Language instruction templates injected at runtime (never stored in role JSON)
# ---------------------------------------------------------------------------

_LANGUAGE_INSTRUCTION = (
    "\n\nIMPORTANT: The user's preferred language is {language}. "
    "Always respond in {language} unless the conversation specifically involves "
    "teaching another language. If teaching a language, use {language} for "
    "explanations and instructions while using the target language for examples "
    "and exercises."
)

_LANGUAGE_TUTOR_INSTRUCTION = (
    "\n\nYou are teaching {target_language}. Use {user_language} for explanations, "
    "instructions, and feedback. Use {target_language} for examples, exercises, "
    "and immersion content. Adjust the ratio based on the learner's level "
    "(more {user_language} at beginner, more {target_language} at advanced)."
)

# Role names / keywords that indicate a language tutor role
_LANGUAGE_TUTOR_KEYWORDS = [
    "language tutor", "language teacher", "language coach",
    "spanish tutor", "french tutor", "german tutor", "italian tutor",
    "japanese tutor", "chinese tutor", "korean tutor", "arabic tutor",
    "portuguese tutor", "russian tutor", "hindi tutor", "english tutor",
    "language instructor", "language learning",
]


def _emit(event: dict[str, Any]) -> None:
    """Write a JSON-line event to stdout for Tauri."""
    sys.stdout.write(json.dumps(event) + "\n")
    sys.stdout.flush()


class Orchestrator:
    """Central LLM orchestrator that handles chat turns and tool-use loops."""

    def __init__(
        self,
        config: RuntimeConfig,
        memory: SessionMemory,
        tools: ToolRegistry,
        audit: AuditLogger,
    ) -> None:
        self._config = config
        self._memory = memory
        self._tools = tools
        self._audit = audit

        # Build provider clients lazily
        self._openai_client: Optional[openai.AsyncOpenAI] = None
        self._anthropic_client: Optional[anthropic.AsyncAnthropic] = None

    # ------------------------------------------------------------------
    # Provider client factories
    # ------------------------------------------------------------------

    def _get_openai(self) -> openai.AsyncOpenAI:
        if self._openai_client is None:
            kwargs: dict[str, Any] = {"api_key": self._config.llm.api_key}
            if self._config.llm.base_url:
                kwargs["base_url"] = self._config.llm.base_url
            self._openai_client = openai.AsyncOpenAI(**kwargs)
        return self._openai_client

    def _get_anthropic(self) -> anthropic.AsyncAnthropic:
        if self._anthropic_client is None:
            self._anthropic_client = anthropic.AsyncAnthropic(
                api_key=self._config.llm.api_key,
            )
        return self._anthropic_client

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def handle_message(self, user_message: str) -> str:
        """Process a user message through the LLM, execute any tool calls, and
        return the final assistant response text."""

        # Store user message
        self._memory.add_message(self._config.session_id, "user", user_message)

        # Build conversation messages
        history = self._memory.get_history(self._config.session_id, limit=40)
        messages = self._build_messages(history)

        # Route to provider
        provider = self._config.llm.provider
        if provider == LLMProvider.ANTHROPIC:
            response_text = await self._run_anthropic(messages)
        else:
            # OpenAI and local (OpenAI-compatible) share the same client
            response_text = await self._run_openai(messages)

        # Store assistant response
        self._memory.add_message(self._config.session_id, "assistant", response_text)

        return response_text

    # ------------------------------------------------------------------
    # Language-aware system prompt
    # ------------------------------------------------------------------

    def _build_system_prompt(self) -> str:
        """Return the role system prompt with language instruction appended at runtime.

        The language instruction is injected per-session and never persisted in the
        role JSON.  Language tutor roles get special bilingual handling so the tutor
        explains in the user's language while demonstrating in the target language.
        """
        base_prompt = self._config.role.system_prompt
        lang_code = self._config.user_language
        lang_name = self._config.user_language_name or get_language_name(lang_code)

        # Skip injection when the user language is English and the role prompt is
        # already in English (the default case) to avoid unnecessary tokens.
        if lang_code == "en":
            return base_prompt

        # Detect language tutor roles by checking role name and system prompt
        role_name_lower = self._config.role.role_name.lower()
        prompt_lower = base_prompt.lower()
        is_tutor = any(kw in role_name_lower or kw in prompt_lower for kw in _LANGUAGE_TUTOR_KEYWORDS)

        if is_tutor:
            # Try to extract the target language from the role name / prompt
            target_language = self._detect_target_language(role_name_lower, prompt_lower)
            return base_prompt + _LANGUAGE_TUTOR_INSTRUCTION.format(
                target_language=target_language,
                user_language=lang_name,
            )

        return base_prompt + _LANGUAGE_INSTRUCTION.format(language=lang_name)

    @staticmethod
    def _detect_target_language(role_name: str, prompt: str) -> str:
        """Best-effort extraction of the language a tutor role teaches."""
        from config import LANGUAGE_MAP

        combined = role_name + " " + prompt
        for _code, name in LANGUAGE_MAP.items():
            if name.lower() in combined:
                return name
        # Fallback - could not determine the target language
        return "the target language"

    # ------------------------------------------------------------------
    # Message construction
    # ------------------------------------------------------------------

    def _build_messages(self, history: list[dict[str, Any]]) -> list[dict[str, str]]:
        messages: list[dict[str, str]] = []
        for entry in history:
            messages.append({"role": entry["role"], "content": entry["content"]})
        return messages

    # ------------------------------------------------------------------
    # OpenAI / local provider
    # ------------------------------------------------------------------

    async def _run_openai(self, messages: list[dict[str, str]]) -> str:
        """Execute a chat-completion turn with tool-call loop using OpenAI API."""
        client = self._get_openai()
        system_prompt = self._build_system_prompt()
        tool_defs = self._tools.get_tool_definitions()

        api_messages: list[dict[str, Any]] = [
            {"role": "system", "content": system_prompt},
            *messages,
        ]

        max_iterations = 10
        for _ in range(max_iterations):
            start = time.monotonic()
            try:
                response = await client.chat.completions.create(
                    model=self._config.llm.model,
                    messages=api_messages,
                    tools=tool_defs if tool_defs else openai.NOT_GIVEN,
                    max_tokens=self._config.llm.max_tokens,
                    temperature=self._config.llm.temperature,
                    stream=True,
                )

                # Accumulate streamed response
                full_content = ""
                tool_calls_acc: dict[int, dict[str, Any]] = {}
                finish_reason: Optional[str] = None

                async for chunk in response:
                    delta = chunk.choices[0].delta if chunk.choices else None
                    if delta is None:
                        continue

                    if chunk.choices[0].finish_reason:
                        finish_reason = chunk.choices[0].finish_reason

                    # Text content
                    if delta.content:
                        full_content += delta.content
                        _emit({"type": "stream", "data": {"text": delta.content}})

                    # Tool call deltas
                    if delta.tool_calls:
                        for tc in delta.tool_calls:
                            idx = tc.index
                            if idx not in tool_calls_acc:
                                tool_calls_acc[idx] = {
                                    "id": tc.id or "",
                                    "name": "",
                                    "arguments": "",
                                }
                            if tc.id:
                                tool_calls_acc[idx]["id"] = tc.id
                            if tc.function:
                                if tc.function.name:
                                    tool_calls_acc[idx]["name"] = tc.function.name
                                if tc.function.arguments:
                                    tool_calls_acc[idx]["arguments"] += tc.function.arguments

                duration = (time.monotonic() - start) * 1000
                self._audit.log_llm_call(
                    provider="openai",
                    model=self._config.llm.model,
                    prompt_tokens=0,  # Not available in streaming
                    completion_tokens=0,
                    duration_ms=duration,
                    success=True,
                )

            except Exception as exc:
                duration = (time.monotonic() - start) * 1000
                self._audit.log_llm_call(
                    provider="openai",
                    model=self._config.llm.model,
                    prompt_tokens=0,
                    completion_tokens=0,
                    duration_ms=duration,
                    success=False,
                    error_message=str(exc),
                )
                _emit({"type": "error", "data": {"message": f"LLM error: {exc}"}})
                return f"Error communicating with LLM: {exc}"

            # If no tool calls, we are done
            if not tool_calls_acc:
                return full_content

            # Process tool calls
            api_messages.append(
                {
                    "role": "assistant",
                    "content": full_content or None,
                    "tool_calls": [
                        {
                            "id": tc["id"],
                            "type": "function",
                            "function": {
                                "name": tc["name"],
                                "arguments": tc["arguments"],
                            },
                        }
                        for tc in tool_calls_acc.values()
                    ],
                }
            )

            for tc in tool_calls_acc.values():
                _emit(
                    {
                        "type": "tool_call",
                        "data": {"name": tc["name"], "arguments": tc["arguments"]},
                    }
                )
                try:
                    args = json.loads(tc["arguments"])
                except json.JSONDecodeError:
                    args = {}

                result = await self._tools.execute(tc["name"], args)
                _emit(
                    {
                        "type": "tool_result",
                        "data": {"name": tc["name"], "result": result[:1000]},
                    }
                )
                api_messages.append(
                    {
                        "role": "tool",
                        "tool_call_id": tc["id"],
                        "content": result,
                    }
                )

        return full_content if full_content else "Reached maximum tool iterations."

    # ------------------------------------------------------------------
    # Anthropic provider
    # ------------------------------------------------------------------

    async def _run_anthropic(self, messages: list[dict[str, str]]) -> str:
        """Execute a chat turn using the Anthropic Messages API with tool use."""
        client = self._get_anthropic()
        system_prompt = self._build_system_prompt()

        # Convert tool defs to Anthropic format
        anthropic_tools = self._convert_tools_to_anthropic(self._tools.get_tool_definitions())

        # Convert messages to Anthropic format (no system role in messages)
        api_messages: list[dict[str, Any]] = []
        for msg in messages:
            if msg["role"] in ("user", "assistant"):
                api_messages.append({"role": msg["role"], "content": msg["content"]})

        max_iterations = 10
        final_text = ""

        for _ in range(max_iterations):
            start = time.monotonic()
            try:
                response = await client.messages.create(
                    model=self._config.llm.model,
                    system=system_prompt,
                    messages=api_messages,
                    tools=anthropic_tools if anthropic_tools else [],
                    max_tokens=self._config.llm.max_tokens,
                    temperature=self._config.llm.temperature,
                )

                duration = (time.monotonic() - start) * 1000
                self._audit.log_llm_call(
                    provider="anthropic",
                    model=self._config.llm.model,
                    prompt_tokens=response.usage.input_tokens,
                    completion_tokens=response.usage.output_tokens,
                    duration_ms=duration,
                    success=True,
                )
            except Exception as exc:
                duration = (time.monotonic() - start) * 1000
                self._audit.log_llm_call(
                    provider="anthropic",
                    model=self._config.llm.model,
                    prompt_tokens=0,
                    completion_tokens=0,
                    duration_ms=duration,
                    success=False,
                    error_message=str(exc),
                )
                _emit({"type": "error", "data": {"message": f"LLM error: {exc}"}})
                return f"Error communicating with LLM: {exc}"

            # Process response content blocks
            text_parts: list[str] = []
            tool_uses: list[dict[str, Any]] = []

            for block in response.content:
                if block.type == "text":
                    text_parts.append(block.text)
                    _emit({"type": "stream", "data": {"text": block.text}})
                elif block.type == "tool_use":
                    tool_uses.append(
                        {
                            "id": block.id,
                            "name": block.name,
                            "input": block.input,
                        }
                    )

            final_text = "".join(text_parts)

            if response.stop_reason != "tool_use" or not tool_uses:
                return final_text

            # Execute tool calls and continue conversation
            api_messages.append({"role": "assistant", "content": response.content})

            tool_results: list[dict[str, Any]] = []
            for tu in tool_uses:
                _emit(
                    {
                        "type": "tool_call",
                        "data": {"name": tu["name"], "arguments": json.dumps(tu["input"])},
                    }
                )
                result = await self._tools.execute(tu["name"], tu["input"])
                _emit(
                    {
                        "type": "tool_result",
                        "data": {"name": tu["name"], "result": result[:1000]},
                    }
                )
                tool_results.append(
                    {
                        "type": "tool_result",
                        "tool_use_id": tu["id"],
                        "content": result,
                    }
                )

            api_messages.append({"role": "user", "content": tool_results})

        return final_text if final_text else "Reached maximum tool iterations."

    @staticmethod
    def _convert_tools_to_anthropic(
        openai_tools: list[dict[str, Any]],
    ) -> list[dict[str, Any]]:
        """Convert OpenAI function-calling tool defs to Anthropic format."""
        result: list[dict[str, Any]] = []
        for tool in openai_tools:
            fn = tool.get("function", {})
            result.append(
                {
                    "name": fn.get("name", ""),
                    "description": fn.get("description", ""),
                    "input_schema": fn.get("parameters", {"type": "object", "properties": {}}),
                }
            )
        return result
