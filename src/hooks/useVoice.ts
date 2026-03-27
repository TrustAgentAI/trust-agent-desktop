// Voice input/output hook - Deepgram STT + ElevenLabs TTS
import { useState, useRef, useCallback } from 'react';

const DEEPGRAM_API_URL = import.meta.env.VITE_DEEPGRAM_API_URL || 'https://api.deepgram.com/v1/listen';
const DEEPGRAM_API_KEY = import.meta.env.VITE_DEEPGRAM_API_KEY || '';
const ELEVENLABS_API_URL = import.meta.env.VITE_ELEVENLABS_API_URL || 'https://api.elevenlabs.io/v1/text-to-speech';
const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY || '';
const ELEVENLABS_VOICE_ID = import.meta.env.VITE_ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL';

interface UseVoiceReturn {
  isListening: boolean;
  isSpeaking: boolean;
  isProcessing: boolean;
  transcript: string | null;
  error: string | null;
  startListening: () => Promise<void>;
  stopListening: () => Promise<string | null>;
  speak: (text: string) => Promise<void>;
  cancelSpeech: () => void;
}

export function useVoice(): UseVoiceReturn {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const startListening = useCallback(async () => {
    setError(null);
    setTranscript(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onerror = () => {
        setError('Recording failed');
        setIsListening(false);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(250); // Collect chunks every 250ms
      setIsListening(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to access microphone';
      setError(message);
      throw err;
    }
  }, []);

  const stopListening = useCallback(async (): Promise<string | null> => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
      setIsListening(false);
      return null;
    }

    return new Promise<string | null>((resolve) => {
      const mediaRecorder = mediaRecorderRef.current!;

      mediaRecorder.onstop = async () => {
        setIsListening(false);
        setIsProcessing(true);

        // Stop all tracks
        mediaRecorder.stream.getTracks().forEach((track) => track.stop());

        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

          if (audioBlob.size === 0) {
            setIsProcessing(false);
            setError('No audio recorded');
            resolve(null);
            return;
          }

          // Send to Deepgram for STT
          const response = await fetch(
            `${DEEPGRAM_API_URL}?model=nova-2&smart_format=true`,
            {
              method: 'POST',
              headers: {
                Authorization: `Token ${DEEPGRAM_API_KEY}`,
                'Content-Type': 'audio/webm',
              },
              body: audioBlob,
            }
          );

          if (!response.ok) {
            throw new Error(`Deepgram API error: ${response.status}`);
          }

          const result = await response.json();
          const text =
            result?.results?.channels?.[0]?.alternatives?.[0]?.transcript || null;

          setTranscript(text);
          setIsProcessing(false);
          resolve(text);
        } catch (err) {
          const message =
            err instanceof Error ? err.message : 'Speech-to-text failed';
          setError(message);
          setIsProcessing(false);
          resolve(null);
        }
      };

      mediaRecorder.stop();
    });
  }, []);

  const speak = useCallback(async (text: string) => {
    setError(null);

    try {
      setIsSpeaking(true);

      const response = await fetch(`${ELEVENLABS_API_URL}/${ELEVENLABS_VOICE_ID}`, {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }

      const audioContext = audioContextRef.current;
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);

      audioSourceRef.current = source;

      source.onended = () => {
        setIsSpeaking(false);
        audioSourceRef.current = null;
      };

      source.start();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Text-to-speech failed';
      setError(message);
      setIsSpeaking(false);
      throw err;
    }
  }, []);

  const cancelSpeech = useCallback(() => {
    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.stop();
      } catch {
        // May already be stopped
      }
      audioSourceRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  return {
    isListening,
    isSpeaking,
    isProcessing,
    transcript,
    error,
    startListening,
    stopListening,
    speak,
    cancelSpeech,
  };
}

export default useVoice;
