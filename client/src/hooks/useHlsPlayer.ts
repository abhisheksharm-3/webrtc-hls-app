import { useState, useRef, useEffect, useCallback } from 'react';
import Hls, { Events as HlsEvents, ErrorTypes, ErrorData } from 'hls.js';

interface StreamInfo {
  resolution?: { width: number; height: number };
  bitrate?: number;
}

/**
 * A custom React hook to manage an HLS video player.
 * It handles both Hls.js for standard browsers and native HLS for Safari.
 *
 * @param url The HLS playlist URL (.m3u8) to play.
 * @returns An object containing the video ref, player state, and control actions.
 */
export const useHlsPlayer = (url: string | null) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  // Use useRef for the Hls.js instance to prevent re-renders on change.
  const hlsInstanceRef = useRef<Hls | null>(null);

  // --- Player State ---
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [streamInfo, setStreamInfo] = useState<StreamInfo | null>(null);

  // --- Player Actions ---

  const togglePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => setError("Playback was prevented by the browser."));
    } else {
      video.pause();
    }
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
  }, []);

  const goFullscreen = useCallback(() => {
    videoRef.current?.requestFullscreen().catch(err => {
      console.error("Error attempting to enable full-screen mode:", err);
    });
  }, []);

  // --- Main Effect for Initializing the Player ---

  useEffect(() => {
    if (!url || !videoRef.current) {
        setIsLoading(false);
        if(!url) setError("No stream URL provided.");
        return;
    }

    const video = videoRef.current;
    setIsLoading(true);
    setError(null);

    // Destroy any previous HLS instance.
    hlsInstanceRef.current?.destroy();

    const tryPlay = async () => {
      try {
        await new Promise(res => setTimeout(res, 300));
        await video.play();
        setIsPlaying(true);
      } catch {
        setIsPlaying(false);
      }
    };

    if (Hls.isSupported()) {
      const hls = new Hls({ lowLatencyMode: true, enableWorker: true });
      hlsInstanceRef.current = hls;

      hls.loadSource(url);
      hls.attachMedia(video);

      hls.on(HlsEvents.MANIFEST_PARSED, async (_, data) => {
        setIsLoading(false);
        const level = data.levels?.[0];
        if (level) {
          setStreamInfo({
            resolution: { width: level.width, height: level.height },
            bitrate: level.bitrate,
          });
        }
        await tryPlay();
      });

      hls.on(HlsEvents.ERROR, (_, data: ErrorData) => {
        if (data.fatal) {
          let errorMessage = 'An unknown error occurred.';
          switch (data.type) {
            case ErrorTypes.NETWORK_ERROR:
              errorMessage = 'Network error: The stream may be offline or starting up.';
              break;
            case ErrorTypes.MEDIA_ERROR:
              errorMessage = 'Media error: There is a problem with the stream\'s format.';
              break;
            default:
              errorMessage = 'Stream is not available.';
          }
          setError(errorMessage);
          setIsLoading(false);
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (e.g., Safari)
      video.src = url;
      tryPlay();
    } else {
        setError('HLS playback is not supported in this browser.');
    }

    // --- State Sync Event Listeners ---
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleVolumeChange = () => setIsMuted(video.muted);

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('volumechange', handleVolumeChange);

    // Cleanup function
    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('volumechange', handleVolumeChange);
      hlsInstanceRef.current?.destroy();
    };
  }, [url]); // This effect runs only when the stream URL changes.

  return {
    videoRef,
    isPlaying,
    isMuted,
    isLoading,
    error,
    streamInfo,
    actions: {
      togglePlayPause,
      toggleMute,
      goFullscreen,
    },
  };
};