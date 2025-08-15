"use client";

import { useRef, useEffect, useCallback, useReducer } from 'react';
import Hls, { Events as HlsEvents, ErrorTypes, ErrorData } from 'hls.js';
import { StreamInfoType } from '@relay-app/shared';

// --- State Management with useReducer ---

type PlayerState = {
  isPlaying: boolean;
  isMuted: boolean;
  isLoading: boolean;
  error: string | null;
  streamInfo: StreamInfoType | null;
};

type PlayerAction =
  | { type: 'ATTEMPT_PLAY' }
  | { type: 'PLAYBACK_SUCCESS' }
  | { type: 'PLAYBACK_FAILED' }
  | { type: 'SET_MUTED'; payload: boolean }
  | { type: 'SET_STREAM_INFO'; payload: StreamInfoType }
  | { type: 'ERROR'; payload: string }
  | { type: 'RESET' };

const initialState: PlayerState = {
  isPlaying: false,
  isMuted: false,
  isLoading: true,
  error: null,
  streamInfo: null,
};

/**
 * Reducer to manage the complex state of the HLS player.
 */
const playerReducer = (state: PlayerState, action: PlayerAction): PlayerState => {
  switch (action.type) {
    case 'ATTEMPT_PLAY':
      return { ...state, isLoading: true, error: null };
    case 'PLAYBACK_SUCCESS':
      return { ...state, isLoading: false, isPlaying: true, error: null };
    case 'PLAYBACK_FAILED':
      return { ...state, isLoading: false, isPlaying: false };
    case 'SET_MUTED':
      return { ...state, isMuted: action.payload };
    case 'SET_STREAM_INFO':
      return { ...state, streamInfo: action.payload };
    case 'ERROR':
      return { ...state, isLoading: false, isPlaying: false, error: action.payload };
    case 'RESET':
      return { ...initialState, isMuted: state.isMuted }; // Persist mute state on reset
    default:
      return state;
  }
};

/**
 * A custom React hook to manage an HLS video player. It provides robust state
 * management, error handling, and playback controls.
 * @param url The HLS playlist URL (.m3u8) to play.
 * @returns An object containing the video ref, player state, and control actions.
 */
export const useHlsPlayer = (url: string | null) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsInstanceRef = useRef<Hls | null>(null);
  const [state, dispatch] = useReducer(playerReducer, initialState);

  // --- Player Setup and Teardown ---

  const setupHlsJsPlayer = useCallback((video: HTMLVideoElement, streamUrl: string) => {
    console.log('🎬 [HLS.js] Setting up HLS.js player with URL:', streamUrl);
    
    // Test URL accessibility first
    fetch(streamUrl)
      .then(response => {
        console.log('🌐 [HLS.js] URL test response:', response.status, response.statusText);
        if (!response.ok) {
          console.error('❌ [HLS.js] HLS URL not accessible:', response.status);
        }
        return response.text();
      })
      .then(data => {
        console.log('📄 [HLS.js] M3U8 content preview:', data.substring(0, 200) + '...');
      })
      .catch(err => {
        console.error('❌ [HLS.js] Failed to fetch M3U8:', err);
      });
    
    const hls = new Hls({
      // Optimized configuration for ultra-low latency
      maxBufferLength: 3,              // Reduced from 30 - minimum buffer (3 seconds)
      maxMaxBufferLength: 6,           // Reduced from 600 - max buffer (6 seconds)
      lowLatencyMode: true,            // Enable LL-HLS features
      enableWorker: true,
      debug: true,
      
      // Additional low-latency optimizations
      liveSyncDurationCount: 1,        // Number of segments to sync (1 = most aggressive)
      liveMaxLatencyDurationCount: 2,  // Max latency in segments (2 segments)
      liveDurationInfinity: false,     // Don't allow infinite buffering
      
      // Faster segment loading
      manifestLoadingTimeOut: 2000,    // 2 seconds timeout for manifest
      manifestLoadingMaxRetry: 2,      // Fewer retries for faster failover
      levelLoadingTimeOut: 2000,       // 2 seconds timeout for segments
      levelLoadingMaxRetry: 2,         // Fewer retries
      
      // Immediate playback
      startPosition: -1,               // Start at live edge
      backBufferLength: 3,             // Keep minimal back buffer (3 seconds)
      
      // Aggressive fragment loading
      fragLoadingTimeOut: 2000,        // 2 seconds timeout for fragments
      fragLoadingMaxRetry: 2,          // Fewer retries
      
      // Optimize for live streaming
      maxLiveSyncPlaybackRate: 1.1,    // Slightly faster playback to catch up
    });
    hlsInstanceRef.current = hls;

    hls.on(HlsEvents.MANIFEST_PARSED, (_, data) => {
      console.log('✅ [HLS.js] Manifest parsed successfully:', data);
      const level = data.levels?.[0];
      if (level) {
        console.log('📊 [HLS.js] Stream info:', {
          resolution: { width: level.width, height: level.height },
          bitrate: level.bitrate
        });
        dispatch({
          type: 'SET_STREAM_INFO',
          payload: {
            resolution: { width: level.width, height: level.height },
            bitrate: level.bitrate,
          },
        });
      }
      
      console.log('▶️ [HLS.js] Attempting to start playback...');
      video.play()
        .then(() => {
          console.log('✅ [HLS.js] Playback started successfully');
          dispatch({ type: 'PLAYBACK_SUCCESS' });
        })
        .catch(err => {
          console.error('❌ [HLS.js] Playback failed:', err);
          dispatch({ type: 'PLAYBACK_FAILED' });
        });
    });

    hls.on(HlsEvents.ERROR, (_, data: ErrorData) => {
      console.error('🚨 [HLS.js] Error occurred:', data);
      
      if (data.fatal) {
        let errorMessage = 'An unknown stream error occurred.';
        switch (data.type) {
          case ErrorTypes.NETWORK_ERROR:
            errorMessage = 'Network error: The stream may be offline or starting up.';
            console.error('🌐 [HLS.js] Network error details:', data);
            // HLS.js has built-in retry logic, so we just inform the user.
            break;
          case ErrorTypes.MEDIA_ERROR:
            errorMessage = 'Media error: There is a problem with the stream\'s format.';
            console.error('🎬 [HLS.js] Media error details:', data);
            console.log('🔄 [HLS.js] Attempting to recover from media error...');
            hls.recoverMediaError(); // Attempt to recover from media errors
            break;
          default:
            console.error('💥 [HLS.js] Fatal error, destroying player:', data);
            hls.destroy(); // Destroy on other fatal errors
            break;
        }
        dispatch({ type: 'ERROR', payload: errorMessage });
      } else {
        console.warn('⚠️ [HLS.js] Non-fatal error:', data);
      }
    });

    console.log('🔗 [HLS.js] Loading source and attaching to video...');
    hls.loadSource(streamUrl);
    hls.attachMedia(video);
    
    console.log('🔗 [HLS.js] HLS source loaded and attached to video element');
  }, []);

  const setupNativePlayer = useCallback((video: HTMLVideoElement, streamUrl: string) => {
    video.src = streamUrl;
    video.play().then(() => dispatch({ type: 'PLAYBACK_SUCCESS' })).catch(() => dispatch({ type: 'PLAYBACK_FAILED' }));
  }, []);

  // --- Main Effect for Player Lifecycle ---
  useEffect(() => {
    const video = videoRef.current;
    console.log('🎬 [HLS HOOK] Effect triggered. URL:', url, 'Video element:', !!video);
    
    if (!url || !video) {
      if (!url) {
        console.warn('⚠️ [HLS HOOK] No stream URL provided');
        dispatch({ type: 'ERROR', payload: 'No stream URL provided.' });
      }
      return;
    }

    console.log('🎬 [HLS HOOK] Initializing player with URL:', url);

    const initializePlayer = () => {
      console.log('🎬 [HLS HOOK] Starting player initialization...');
      dispatch({ type: 'ATTEMPT_PLAY' });
      
      if (Hls.isSupported()) {
        console.log('✅ [HLS HOOK] HLS.js is supported, using HLS.js player');
        setupHlsJsPlayer(video, url);
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        console.log('✅ [HLS HOOK] Native HLS supported, using native player');
        setupNativePlayer(video, url);
      } else {
        console.error('❌ [HLS HOOK] HLS playback not supported');
        dispatch({ type: 'ERROR', payload: 'HLS playback is not supported in this browser.' });
      }
    };

    const addEventListeners = () => {
      video.addEventListener('play', handlePlay);
      video.addEventListener('pause', handlePause);
      video.addEventListener('volumechange', handleVolumeChange);
    };

    const removeEventListeners = () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('volumechange', handleVolumeChange);
    };
    
    const cleanupPlayer = () => {
      console.log('🧹 [HLS HOOK] Cleaning up player');
      removeEventListeners();
      hlsInstanceRef.current?.destroy();
      dispatch({ type: 'RESET' });
    };

    // Event handlers to sync React state with video element state
    const handlePlay = () => {
      console.log('▶️ [HLS HOOK] Video started playing');
      dispatch({ type: 'PLAYBACK_SUCCESS' });
    };
    const handlePause = () => {
      console.log('⏸️ [HLS HOOK] Video paused');
      dispatch({ type: 'PLAYBACK_FAILED' });
    };
    const handleVolumeChange = () => {
      console.log('🔊 [HLS HOOK] Volume changed, muted:', video.muted);
      dispatch({ type: 'SET_MUTED', payload: video.muted });
    };

    initializePlayer();
    addEventListeners();

    return cleanupPlayer;
  }, [url, setupHlsJsPlayer, setupNativePlayer]);

  // --- Exposed Player Actions ---
  const togglePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => dispatch({ type: 'ERROR', payload: 'Playback was prevented by the browser.' }));
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

  return {
    videoRef,
    ...state,
    actions: {
      togglePlayPause,
      toggleMute,
      goFullscreen,
    },
  };
};
