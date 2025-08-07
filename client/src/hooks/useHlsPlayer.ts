// /hooks/useHlsPlayer.ts

import { useState, useRef, useEffect, useCallback } from 'react';
import Hls from 'hls.js';

interface StreamInfo {
  resolution?: { width: number; height: number };
  bitrate?: number;
  fps?: number;
}

export const useHlsPlayer = (url: string | null) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hlsInstance, setHlsInstance] = useState<Hls | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewerCount] = useState<number | undefined>(undefined);
  const [streamInfo, setStreamInfo] = useState<StreamInfo | null>(null);

  const loadSource = useCallback((sourceUrl: string) => {
    if (!videoRef.current) return;

    setIsLoading(true);
    setError(null);

    // Clean up previous instance
    hlsInstance?.destroy();

    if (Hls.isSupported()) {
      const hls = new Hls({ 
        lowLatencyMode: true, 
        enableWorker: true,
        maxBufferLength: 10,
        maxMaxBufferLength: 20,
        liveSyncDurationCount: 2,
        liveMaxLatencyDurationCount: 5
      });
      
      hls.loadSource(sourceUrl);
      hls.attachMedia(videoRef.current);
      
      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        setIsLoading(false);
        
        // Extract stream info
        if (data.levels && data.levels.length > 0) {
          const level = data.levels[0];
          setStreamInfo({
            resolution: { width: level.width, height: level.height },
            bitrate: level.bitrate,
            fps: level.frameRate
          });
        }
        
        videoRef.current?.play().catch((playError) => {
          console.warn("Autoplay was prevented by the browser:", playError);
          setIsPlaying(false);
        });
      });
      
      hls.on(Hls.Events.ERROR, (_, data) => {
        setIsLoading(false);
        if (data.fatal) {
          console.error('HLS Fatal Error:', data);
          let errorMessage = 'Stream playback failed.';
          
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              errorMessage = 'Network error: Unable to load the stream. The stream may not be available yet.';
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              errorMessage = 'Media error: Problem with the stream format or playback.';
              break;
            default:
              errorMessage = 'Stream is not available. Please check if streaming has started.';
          }
          
          setError(errorMessage);
          hls.destroy();
        }
      });
      
      setHlsInstance(hls);
    } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      videoRef.current.src = sourceUrl;
      videoRef.current.addEventListener('loadedmetadata', () => {
        setIsLoading(false);
        videoRef.current?.play().catch(() => setIsPlaying(false));
      });
      videoRef.current.addEventListener('error', () => {
        setIsLoading(false);
        setError('Stream is not available. Please check if streaming has started.');
      });
    } else {
      setIsLoading(false);
      setError('HLS is not supported in this browser.');
    }
  }, [hlsInstance]);

  const togglePlayPause = useCallback(() => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  }, [isPlaying]);

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    const nextMuted = !videoRef.current.muted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
  }, []);

  const goFullscreen = useCallback(() => {
    videoRef.current?.requestFullscreen().catch(err => {
      console.error("Error attempting to enable full-screen mode:", err);
    });
  }, []);

  // Effect to sync state with video element events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleVolumeChange = () => setIsMuted(video.muted);
    const handleLoadStart = () => setIsLoading(true);
    const handleLoadedData = () => setIsLoading(false);

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('volumechange', handleVolumeChange);
    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('loadeddata', handleLoadedData);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('volumechange', handleVolumeChange);
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('loadeddata', handleLoadedData);
    };
  }, []);

  // Auto-load source when URL changes
  useEffect(() => {
    if (url) {
      loadSource(url);
    } else {
      setError('No stream URL provided');
    }
  }, [url, loadSource]);
  
  // Cleanup on unmount
  useEffect(() => () => hlsInstance?.destroy(), [hlsInstance]);

  return {
    videoRef,
    isPlaying,
    isMuted,
    isLoading,
    error,
    viewerCount,
    streamInfo,
    actions: {
      loadSource,
      togglePlayPause,
      toggleMute,
      goFullscreen
    },
  };
};