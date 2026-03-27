"""Pipecat-based voice pipeline for the Trust Agent runtime.

Integrates Deepgram STT and ElevenLabs TTS into a unified audio pipeline.
Handles bidirectional audio streaming, transcription routing to the orchestrator,
and interruption detection (user speaks while agent is talking).
"""

from __future__ import annotations

import asyncio
import json
import sys
from typing import Any, Optional

from config import RuntimeConfig, VoiceConfig
from runtime.orchestrator import Orchestrator
from voice.stt import DeepgramSTT
from voice.tts import ElevenLabsTTS


def _emit(event: dict[str, Any]) -> None:
    sys.stdout.write(json.dumps(event) + "\n")
    sys.stdout.flush()


class VoicePipeline:
    """Manages the full voice pipeline: STT -> Orchestrator -> TTS.

    Audio flows:
    1. Microphone audio bytes arrive via handle_audio_input()
    2. Sent to DeepgramSTT for transcription
    3. Final transcripts are routed to the Orchestrator
    4. Orchestrator response text is sent to ElevenLabsTTS
    5. TTS audio chunks are emitted as stdout JSON events

    Interruption handling:
    - If user speaks while TTS is active, TTS is cancelled immediately
    - The new user utterance is then processed normally
    """

    def __init__(self, config: RuntimeConfig, orchestrator: Orchestrator) -> None:
        self._config = config
        self._orchestrator = orchestrator
        self._voice_config = config.voice

        # Utterance accumulator for combining interim finals into a complete turn
        self._utterance_buffer: str = ""
        self._utterance_lock = asyncio.Lock()
        self._utterance_timer: Optional[asyncio.Task[None]] = None

        self._stt: Optional[DeepgramSTT] = None
        self._tts: Optional[ElevenLabsTTS] = None
        self._running = False

    @property
    def is_running(self) -> bool:
        return self._running

    async def start(self) -> None:
        """Initialise and start the STT and TTS components."""
        if not self._voice_config.enabled:
            _emit({"type": "voice_status", "data": {"pipeline": "disabled"}})
            return

        # Create STT with transcript callback
        self._stt = DeepgramSTT(
            config=self._voice_config,
            on_transcript=self._on_transcript,
        )

        # Create TTS - use role-specific voice if configured
        self._tts = ElevenLabsTTS(config=self._voice_config)
        if self._config.role.voice_id:
            self._tts.set_voice(self._config.role.voice_id)

        await self._stt.start()
        self._running = True
        _emit({"type": "voice_status", "data": {"pipeline": "started"}})

    async def stop(self) -> None:
        """Shut down the voice pipeline."""
        self._running = False
        if self._stt:
            await self._stt.stop()
        if self._tts:
            self._tts.cancel()
        if self._utterance_timer and not self._utterance_timer.done():
            self._utterance_timer.cancel()
        _emit({"type": "voice_status", "data": {"pipeline": "stopped"}})

    async def handle_audio_input(self, audio_data: bytes) -> None:
        """Feed raw audio bytes into the STT pipeline."""
        if not self._running or not self._stt:
            return

        # Interruption detection: if TTS is speaking and we get audio input
        # that looks like speech, cancel the TTS
        if self._tts and self._tts.is_speaking:
            self._tts.cancel()
            _emit({"type": "interruption", "data": {}})

        await self._stt.send_audio(audio_data)

    async def _on_transcript(self, text: str, speech_final: bool) -> None:
        """Callback from STT when a final transcript segment is available."""
        async with self._utterance_lock:
            self._utterance_buffer += " " + text if self._utterance_buffer else text

            # Cancel any pending flush timer
            if self._utterance_timer and not self._utterance_timer.done():
                self._utterance_timer.cancel()

            if speech_final:
                # User finished speaking - process immediately
                await self._flush_utterance()
            else:
                # Start a timer to flush after a pause
                self._utterance_timer = asyncio.create_task(self._delayed_flush(1.5))

    async def _delayed_flush(self, delay: float) -> None:
        """Flush the utterance buffer after a delay (silence timeout)."""
        await asyncio.sleep(delay)
        async with self._utterance_lock:
            await self._flush_utterance()

    async def _flush_utterance(self) -> None:
        """Send the accumulated utterance to the orchestrator and speak the response."""
        if not self._utterance_buffer.strip():
            return

        user_text = self._utterance_buffer.strip()
        self._utterance_buffer = ""

        _emit({"type": "user_speech", "data": {"text": user_text}})

        try:
            response_text = await self._orchestrator.handle_message(user_text)

            if self._tts and response_text.strip():
                await self._tts.speak(response_text)
        except Exception as exc:
            _emit({"type": "error", "data": {"message": f"Voice pipeline error: {exc}"}})
