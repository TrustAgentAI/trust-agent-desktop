"""Deepgram streaming speech-to-text for the Trust Agent voice pipeline.

Streams audio to Deepgram Nova-2 and emits real-time transcript events.
Handles language detection and utterance-end detection.
"""

from __future__ import annotations

import asyncio
import json
import sys
from typing import Any, Callable, Coroutine, Optional

from deepgram import (
    DeepgramClient,
    DeepgramClientOptions,
    LiveOptions,
    LiveTranscriptionEvents,
)

from config import VoiceConfig


def _emit(event: dict[str, Any]) -> None:
    sys.stdout.write(json.dumps(event) + "\n")
    sys.stdout.flush()


class DeepgramSTT:
    """Streaming STT using Deepgram Nova-2."""

    def __init__(
        self,
        config: VoiceConfig,
        on_transcript: Optional[Callable[[str, bool], Coroutine[Any, Any, None]]] = None,
    ) -> None:
        """
        Args:
            config: Voice configuration with Deepgram API key.
            on_transcript: Async callback invoked with (text, is_final).
        """
        self._config = config
        self._on_transcript = on_transcript
        self._client: Optional[DeepgramClient] = None
        self._connection: Any = None
        self._running = False

    async def start(self) -> None:
        """Open a live transcription connection to Deepgram."""
        if self._running:
            return

        client_options = DeepgramClientOptions(api_key=self._config.deepgram_api_key)
        self._client = DeepgramClient("", client_options)
        self._connection = self._client.listen.asynclive.v("1")

        # Register event handlers
        self._connection.on(LiveTranscriptionEvents.Transcript, self._handle_transcript)
        self._connection.on(LiveTranscriptionEvents.UtteranceEnd, self._handle_utterance_end)
        self._connection.on(LiveTranscriptionEvents.Error, self._handle_error)

        options = LiveOptions(
            model=self._config.stt_model,
            language=self._config.stt_language,
            smart_format=True,
            interim_results=True,
            utterance_end_ms=1000,
            vad_events=True,
            encoding="linear16",
            sample_rate=16000,
            channels=1,
        )

        started = await self._connection.start(options)
        if started:
            self._running = True
            _emit({"type": "voice_status", "data": {"stt": "connected"}})
        else:
            _emit({"type": "error", "data": {"message": "Failed to start Deepgram STT connection"}})

    async def send_audio(self, audio_data: bytes) -> None:
        """Send raw audio bytes to Deepgram for transcription."""
        if self._connection and self._running:
            try:
                await self._connection.send(audio_data)
            except Exception as exc:
                _emit({"type": "error", "data": {"message": f"STT send error: {exc}"}})

    async def stop(self) -> None:
        """Close the Deepgram connection gracefully."""
        self._running = False
        if self._connection:
            try:
                await self._connection.finish()
            except Exception:
                pass
            self._connection = None
        _emit({"type": "voice_status", "data": {"stt": "disconnected"}})

    @property
    def is_running(self) -> bool:
        return self._running

    # ------------------------------------------------------------------
    # Event handlers
    # ------------------------------------------------------------------

    async def _handle_transcript(self, _connection: Any, result: Any, **kwargs: Any) -> None:
        """Handle a transcript event from Deepgram."""
        try:
            transcript = result.channel.alternatives[0].transcript
            if not transcript:
                return

            is_final = result.is_final
            speech_final = getattr(result, "speech_final", False)

            _emit(
                {
                    "type": "transcript",
                    "data": {
                        "text": transcript,
                        "is_final": is_final,
                        "speech_final": speech_final,
                    },
                }
            )

            if self._on_transcript and is_final:
                await self._on_transcript(transcript, speech_final)
        except Exception as exc:
            _emit({"type": "error", "data": {"message": f"Transcript handler error: {exc}"}})

    async def _handle_utterance_end(self, _connection: Any, result: Any, **kwargs: Any) -> None:
        """Handle utterance-end (silence detected after speech)."""
        _emit({"type": "utterance_end", "data": {}})

    async def _handle_error(self, _connection: Any, error: Any, **kwargs: Any) -> None:
        """Handle a Deepgram error event."""
        _emit({"type": "error", "data": {"message": f"Deepgram STT error: {error}"}})
