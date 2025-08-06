// /hooks/useHlsPlayer.ts

import { useState, useRef, useEffect, useCallback } from 'react';
import Hls from 'hls.js';

export const useHlsPlayer = (
  playerContainerRef: React.RefObject<HTMLDivElement>,
  onPlaybackError: (message: string) => void
) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hlsInstance, setHlsInstance] = useState<Hls | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true); // Start muted for autoplay

  const loadSource = useCallback((url: string) => {
    if (!videoRef.current) return;

    // Clean up previous instance
    hlsInstance?.destroy();

    if (Hls.isSupported()) {
      const hls = new Hls({ lowLatencyMode: true, enableWorker: true });
      hls.loadSource(url);
      hls.attachMedia(videoRef.current);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        videoRef.current?.play().catch(() => {
          console.warn("Autoplay was prevented by the browser.");
          setIsPlaying(false);
        });
      });
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          console.error('HLS Fatal Error:', data);
          onPlaybackError('Stream playback failed. The stream may have ended or is unavailable.');
          hls.destroy();
        }
      });
      setHlsInstance(hls);
    } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      videoRef.current.src = url;
      videoRef.current.addEventListener('loadedmetadata', () => {
        videoRef.current?.play().catch(() => setIsPlaying(false));
      });
    } else {
      onPlaybackError('HLS is not supported in this browser.');
    }
  }, [hlsInstance, onPlaybackError]);

  const togglePlayPause = useCallback(() => {
    if (!videoRef.current) return;
    isPlaying ? videoRef.current.pause() : videoRef.current.play();
  }, [isPlaying]);

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    const nextMuted = !videoRef.current.muted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
  }, []);

  const goFullscreen = useCallback(() => {
    playerContainerRef.current?.requestFullscreen().catch(err => {
      console.error("Error attempting to enable full-screen mode:", err);
    });
  }, [playerContainerRef]);

  // Effect to sync state with video element events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, []);
  
  // Cleanup on unmount
  useEffect(() => () => hlsInstance?.destroy(), [hlsInstance]);

  return {
    videoRef,
    isPlaying,
    isMuted,
    actions: {
      loadSource,
      togglePlayPause,
      toggleMute,
      goFullscreen
    },
  };
};