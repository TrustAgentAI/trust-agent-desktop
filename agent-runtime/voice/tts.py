"""ElevenLabs text-to-speech for the Trust Agent voice pipeline.

Streams synthesised audio chunks back for playback. Supports per-role voice
selection.
"""

from __future__ import annotations

import asyncio
import base64
import json
import sys
from typing import Any, Optional

from elevenlabs.client import AsyncElevenLabs

from config import VoiceConfig


def _emit(event: dict[str, Any]) -> None:
    sys.stdout.write(json.dumps(event) + "\n")
    sys.stdout.flush()


class ElevenLabsTTS:
    """Streaming TTS using ElevenLabs API."""

    def __init__(self, config: VoiceConfig) -> None:
        self._config = config
        self._client: Optional[AsyncElevenLabs] = None
        self._current_voice_id: str = config.voice_id
        self._is_speaking = False
        self._cancel_event = asyncio.Event()

    @property
    def is_speaking(self) -> bool:
        return self._is_speaking

    def set_voice(self, voice_id: str) -> None:
        """Change the active voice (e.g. when switching roles)."""
        self._current_voice_id = voice_id

    def cancel(self) -> None:
        """Cancel current speech (for interruption handling)."""
        self._cancel_event.set()

    async def speak(self, text: str) -> None:
        """Convert text to speech and stream audio chunks via stdout events."""
        if not text.strip():
            return

        self._cancel_event.clear()
        self._is_speaking = True

        try:
            client = self._get_client()

            _emit({"type": "tts_start", "data": {"text": text[:200]}})

            audio_stream = await client.text_to_speech.convert_as_stream(
                voice_id=self._current_voice_id,
                text=text,
                model_id="eleven_turbo_v2_5",
                output_format="mp3_22050_32",
            )

            async for chunk in audio_stream:
                if self._cancel_event.is_set():
                    _emit({"type": "tts_cancelled", "data": {}})
                    break

                if isinstance(chunk, bytes) and len(chunk) > 0:
                    encoded = base64.b64encode(chunk).decode("ascii")
                    _emit(
                        {
                            "type": "audio_chunk",
                            "data": {
                                "audio": encoded,
                                "format": "mp3",
                                "sample_rate": 22050,
                            },
                        }
                    )

            if not self._cancel_event.is_set():
                _emit({"type": "tts_end", "data": {}})

        except Exception as exc:
            _emit({"type": "error", "data": {"message": f"TTS error: {exc}"}})
        finally:
            self._is_speaking = False

    def _get_client(self) -> AsyncElevenLabs:
        if self._client is None:
            self._client = AsyncElevenLabs(api_key=self._config.elevenlabs_api_key)
        return self._client
