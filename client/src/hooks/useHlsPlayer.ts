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
 * A custom React hook to manage an HLS video player using a reducer for robust state management.
 * @param url The HLS playlist URL (.m3u8) to play.
 * @returns An object containing the video ref, player state, and control actions.
 */
export const useHlsPlayer = (url: string | null) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsInstanceRef = useRef<Hls | null>(null);
  const [state, dispatch] = useReducer(playerReducer, initialState);

  /**
   * Sets up an Hls.js instance for browsers that support it.
   */
  const setupHlsJsPlayer = useCallback((video: HTMLVideoElement, streamUrl: string) => {
    const hls = new Hls({ lowLatencyMode: true, enableWorker: true });
    hlsInstanceRef.current = hls;

    hls.on(HlsEvents.MANIFEST_PARSED, (_, data) => {
      const level = data.levels?.[0];
      if (level) {
        dispatch({
          type: 'SET_STREAM_INFO',
          payload: {
            resolution: { width: level.width, height: level.height },
            bitrate: level.bitrate,
          },
        });
      }
      video.play().then(() => dispatch({ type: 'PLAYBACK_SUCCESS' })).catch(() => dispatch({ type: 'PLAYBACK_FAILED' }));
    });

    hls.on(HlsEvents.ERROR, (_, data: ErrorData) => {
      if (data.fatal) {
        let errorMessage = 'An unknown stream error occurred.';
        switch (data.type) {
          case ErrorTypes.NETWORK_ERROR:
            errorMessage = 'Network error: The stream may be offline or starting up.';
            break;
          case ErrorTypes.MEDIA_ERROR:
            errorMessage = 'Media error: There is a problem with the stream\'s format.';
            break;
        }
        dispatch({ type: 'ERROR', payload: errorMessage });
      }
    });

    hls.loadSource(streamUrl);
    hls.attachMedia(video);
  }, []);

  /**
   * Sets up the native video player for browsers like Safari.
   */
  const setupNativePlayer = useCallback((video: HTMLVideoElement, streamUrl: string) => {
    video.src = streamUrl;
    video.play().then(() => dispatch({ type: 'PLAYBACK_SUCCESS' })).catch(() => dispatch({ type: 'PLAYBACK_FAILED' }));
  }, []);

  // --- Main Effect for Initializing the Player ---
  useEffect(() => {
    if (!url || !videoRef.current) {
        if (!url) dispatch({ type: 'ERROR', payload: 'No stream URL provided.' });
        return;
    }

    const video = videoRef.current;
    dispatch({ type: 'ATTEMPT_PLAY' });

    // Destroy any previous instance
    hlsInstanceRef.current?.destroy();

    if (Hls.isSupported()) {
        setupHlsJsPlayer(video, url);
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        setupNativePlayer(video, url);
    } else {
        dispatch({ type: 'ERROR', payload: 'HLS playback is not supported in this browser.' });
    }

    // --- State Sync Event Listeners ---
    const handlePlay = () => dispatch({ type: 'PLAYBACK_SUCCESS' });
    const handlePause = () => dispatch({ type: 'PLAYBACK_FAILED' });
    const handleVolumeChange = () => dispatch({ type: 'SET_MUTED', payload: video.muted });

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('volumechange', handleVolumeChange);

    // Cleanup function
    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause',handlePause);
      video.removeEventListener('volumechange', handleVolumeChange);
      hlsInstanceRef.current?.destroy();
      dispatch({ type: 'RESET' });
    };
  }, [url, setupHlsJsPlayer, setupNativePlayer]);

  // --- Player Actions ---
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