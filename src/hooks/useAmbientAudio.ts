/**
 * Phase 10.1 - Ambient Audio Integration
 * Plays looped ambient audio from environment config on session start.
 * Supports volume control and mute toggle.
 * Reads ambientAudioUrl from environment JSON config.
 */
import { useEffect, useRef, useCallback, useState } from 'react';
import { localStore } from '@/lib/tauri-compat';

const VOLUME_STORAGE_KEY = 'ta_ambient_volume';
const MUTE_STORAGE_KEY = 'ta_ambient_muted';
const DEFAULT_VOLUME = 0.15; // Low volume by default

interface AmbientAudioState {
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  play: () => void;
  pause: () => void;
}

export function useAmbientAudio(ambientAudioUrl?: string): AmbientAudioState {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(() => {
    return localStore.get<boolean>(MUTE_STORAGE_KEY) ?? false;
  });
  const [volume, setVolumeState] = useState(() => {
    return localStore.get<number>(VOLUME_STORAGE_KEY) ?? DEFAULT_VOLUME;
  });

  // Create or update audio element when URL changes
  useEffect(() => {
    if (!ambientAudioUrl) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
        setIsPlaying(false);
      }
      return;
    }

    // Resolve S3 URLs to real CDN URLs
    const resolvedUrl = resolveAudioUrl(ambientAudioUrl);

    const audio = new Audio(resolvedUrl);
    audio.loop = true;
    audio.volume = isMuted ? 0 : volume;
    audio.preload = 'auto';
    audioRef.current = audio;

    // Auto-play on session start (browser may block - handle gracefully)
    audio.play()
      .then(() => setIsPlaying(true))
      .catch(() => {
        // Browser blocked autoplay - user must interact first
        setIsPlaying(false);
      });

    return () => {
      audio.pause();
      audio.src = '';
      audioRef.current = null;
      setIsPlaying(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ambientAudioUrl]);

  // Sync volume changes to audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const setVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    setVolumeState(clamped);
    localStore.set(VOLUME_STORAGE_KEY, clamped);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      localStore.set(MUTE_STORAGE_KEY, next);
      return next;
    });
  }, []);

  const play = useCallback(() => {
    if (audioRef.current && !isPlaying) {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(() => {/* blocked */});
    }
  }, [isPlaying]);

  const pause = useCallback(() => {
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, [isPlaying]);

  return { isPlaying, isMuted, volume, setVolume, toggleMute, play, pause };
}

/**
 * Resolves s3:// URIs to real CDN URLs.
 * s3://trust-agent-assets/environments/library-oak/ambient.mp3
 * -> https://cdn.trust-agent.ai/environments/library-oak/ambient.mp3
 */
function resolveAudioUrl(url: string): string {
  if (url.startsWith('s3://trust-agent-assets/')) {
    return url.replace('s3://trust-agent-assets/', 'https://cdn.trust-agent.ai/');
  }
  return url;
}
