"use client";

import React from 'react';
import { useHlsPlayer } from '@/hooks/useHlsPlayer';
import { Card } from '@/components/ui/card';
import { AlertCircle, Clapperboard, Loader2, Volume2 } from 'lucide-react';
import { StreamInfoType } from '@relay-app/shared';

// --- Sub-components specific to the Player ---

const PlayerOverlay = ({ isLoading, error }: { isLoading: boolean; error: string | null }) => {
  if (!isLoading && !error) return null;

  const Icon = error ? AlertCircle : Loader2;
  const message = error ? "Stream Issue Detected" : "Loading Stream...";
  const subtitle = error ? 
    "The stream may be audio-only or temporarily unavailable. Try refreshing the page." : 
    "Connecting to live stream...";

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="text-center text-white max-w-md px-6">
        <Icon className={`h-16 w-16 mx-auto mb-6 ${isLoading ? 'animate-spin text-primary' : 'text-red-500'}`} />
        <h3 className="text-xl font-semibold mb-3">{message}</h3>
        <p className="text-sm text-gray-300 leading-relaxed">{subtitle}</p>
        {error && (
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Refresh Stream
          </button>
        )}
      </div>
    </div>
  );
};

const StreamDetails = ({ info }: { info: StreamInfoType | null }) => {
  if (!info) return null;

  return (
    <Card className="mt-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Clapperboard className="h-5 w-5 text-primary" />
          <span>Live Podcast Stream</span>
        </h2>
        <div className="flex items-center gap-x-4 gap-y-2 text-sm text-muted-foreground flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></div>
            <span className="font-medium text-red-500">LIVE</span>
          </div>
          {info.resolution && <span>{`${info.resolution.width}x${info.resolution.height}`}</span>}
          {info.bitrate && <span>{`${Math.round(info.bitrate / 1000)} kbps`}</span>}
        </div>
      </div>
    </Card>
  );
};

// --- Main Player Component ---

/**
 * The main video player component, including its overlay and details.
 * It encapsulates the HLS player logic and its related UI states.
 */
export const Player = ({ hlsUrl }: { hlsUrl: string | null }) => {
  console.log('🎬 [HLS PLAYER] HLS URL:', hlsUrl);
  
  const { videoRef, isLoading, isPlaying, error, streamInfo } = useHlsPlayer(hlsUrl);
  
  console.log('🎬 [HLS PLAYER] State:', { isLoading, isPlaying, error, streamInfo });

  // Enhanced error detection for video issues
  const hasVideoError = React.useMemo(() => {
    const video = videoRef.current;
    if (!video || isLoading) return false;
    
    // Check if video element exists but has issues
    const hasNoVideoTrack = video.videoWidth === 0 && video.videoHeight === 0;
    const isAudioOnly = video.duration > 0 && hasNoVideoTrack;
    
    return isAudioOnly || Boolean(error);
  }, [isLoading, error, videoRef]);

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      console.log('🎬 Video metadata loaded:', {
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        duration: video.duration,
        hasAudioTracks: 'audioTracks' in video
      });
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    return () => video.removeEventListener('loadedmetadata', handleLoadedMetadata);
  }, [videoRef]);

  return (
    <div className="lg:col-span-3">
      <Card className="overflow-hidden shadow-2xl shadow-primary/10">
        <div className="relative aspect-video bg-black">
          <PlayerOverlay isLoading={isLoading && !isPlaying} error={hasVideoError ? (error || "Video track unavailable") : null} />
          <video
            ref={videoRef}
            className="w-full h-full object-contain"
            controls
            autoPlay
            playsInline
          />
          
          {/* Stream Status Badge */}
          {!isLoading && !hasVideoError && (
            <div className="absolute top-4 left-4 z-20">
              <div className="flex items-center gap-2 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-white text-sm font-medium">LIVE</span>
              </div>
            </div>
          )}
          
          {/* Audio-Only Indicator */}
          {!isLoading && !hasVideoError && videoRef.current?.videoWidth === 0 && (
            <div className="absolute bottom-4 right-4 z-20">
              <div className="flex items-center gap-2 bg-yellow-500/20 backdrop-blur-sm px-3 py-1.5 rounded-full border border-yellow-500/50">
                <Volume2 className="w-4 h-4 text-yellow-400" />
                <span className="text-yellow-400 text-sm font-medium">Audio Only</span>
              </div>
            </div>
          )}
        </div>
      </Card>
      <StreamDetails info={streamInfo} />
    </div>
  );
};