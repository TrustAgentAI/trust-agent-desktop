"""Configuration models for the Trust Agent runtime sidecar."""

from __future__ import annotations

from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class LLMProvider(str, Enum):
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    LOCAL = "local"


class AccessLevel(str, Enum):
    READ = "read"
    WRITE = "write"
    EXECUTE = "execute"


class LLMConfig(BaseModel):
    """Configuration for an LLM provider."""

    provider: LLMProvider = LLMProvider.OPENAI
    api_key: str = ""
    model: str = "gpt-4o"
    base_url: Optional[str] = None
    max_tokens: int = 4096
    temperature: float = 0.7


class VoiceConfig(BaseModel):
    """Configuration for voice pipeline (STT + TTS)."""

    enabled: bool = False
    deepgram_api_key: str = ""
    elevenlabs_api_key: str = ""
    voice_id: str = "EXAVITQu4vr4xnSDxMaL"  # Default ElevenLabs voice
    stt_language: str = "en"
    stt_model: str = "nova-2"


class PermissionConfig(BaseModel):
    """Defines what the agent is allowed to access."""

    granted_paths: list[str] = Field(default_factory=list)
    access_levels: dict[str, list[AccessLevel]] = Field(default_factory=dict)
    allow_command_execution: bool = False
    allow_web_search: bool = True
    blocked_paths: list[str] = Field(default_factory=list)


class TrustAgentConfig(BaseModel):
    """Configuration for connecting to the Trust Agent platform."""

    api_url: str = "https://api.trustagent.ai"
    ws_url: str = "wss://ws.trustagent.ai"
    session_token: str = ""
    role_hire_id: str = ""


class RoleConfig(BaseModel):
    """Configuration for the agent's role/persona."""

    role_id: str = ""
    role_name: str = "Assistant"
    system_prompt: str = "You are a helpful assistant."
    capabilities: list[str] = Field(default_factory=list)
    voice_id: Optional[str] = None


class RuntimeConfig(BaseModel):
    """Top-level configuration passed from Tauri to the sidecar via stdin."""

    llm: LLMConfig = Field(default_factory=LLMConfig)
    voice: VoiceConfig = Field(default_factory=VoiceConfig)
    permissions: PermissionConfig = Field(default_factory=PermissionConfig)
    trust_agent: TrustAgentConfig = Field(default_factory=TrustAgentConfig)
    role: RoleConfig = Field(default_factory=RoleConfig)
    session_id: str = ""
    debug: bool = False
    user_language: str = "en"
    user_language_name: str = "English"


# ---------------------------------------------------------------------------
# Language code to human-readable name mapping (33 supported languages)
# ---------------------------------------------------------------------------

LANGUAGE_MAP: dict[str, str] = {
    "en": "English",
    "es": "Spanish",
    "fr": "French",
    "de": "German",
    "it": "Italian",
    "pt": "Portuguese",
    "nl": "Dutch",
    "ru": "Russian",
    "zh": "Chinese",
    "ja": "Japanese",
    "ko": "Korean",
    "ar": "Arabic",
    "hi": "Hindi",
    "bn": "Bengali",
    "tr": "Turkish",
    "pl": "Polish",
    "uk": "Ukrainian",
    "sv": "Swedish",
    "da": "Danish",
    "no": "Norwegian",
    "fi": "Finnish",
    "el": "Greek",
    "cs": "Czech",
    "ro": "Romanian",
    "hu": "Hungarian",
    "th": "Thai",
    "vi": "Vietnamese",
    "id": "Indonesian",
    "ms": "Malay",
    "tl": "Filipino",
    "sw": "Swahili",
    "he": "Hebrew",
    "fa": "Persian",
}


def get_language_name(code: str) -> str:
    """Return the human-readable name for a language code, defaulting to English."""
    return LANGUAGE_MAP.get(code, "English")
