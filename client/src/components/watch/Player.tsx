"use client";

import React from 'react';
import { useHlsPlayer } from '@/hooks/useHlsPlayer';
import { Card } from '@/components/ui/card';
import { AlertCircle, Clapperboard, Loader2, Volume2, Users, Wifi, Clock, Monitor } from 'lucide-react';
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
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-gradient-to-br from-black/90 via-black/80 to-black/70 backdrop-blur-md">
      <div className="text-center text-white max-w-md px-8 py-6">
        <div className="relative mb-6">
          <div className={`h-20 w-20 mx-auto rounded-full ${isLoading ? 'bg-primary/20' : 'bg-red-500/20'} flex items-center justify-center`}>
            <Icon className={`h-10 w-10 ${isLoading ? 'animate-spin text-primary' : 'text-red-400'}`} />
          </div>
          {isLoading && (
            <div className="absolute inset-0 rounded-full border-2 border-primary/30 border-t-primary animate-spin"></div>
          )}
        </div>
        <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
          {message}
        </h3>
        <p className="text-sm text-gray-300 leading-relaxed mb-6">{subtitle}</p>
        {error && (
          <button 
            onClick={() => window.location.reload()} 
            className="px-6 py-3 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white rounded-xl text-sm font-medium transition-all duration-200 transform hover:scale-105 shadow-lg shadow-primary/25"
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

  const formatBitrate = (bitrate: number) => {
    if (bitrate > 1000000) {
      return `${(bitrate / 1000000).toFixed(1)} Mbps`;
    }
    return `${Math.round(bitrate / 1000)} kbps`;
  };

  const getQualityLabel = (resolution?: { width: number; height: number }) => {
    if (!resolution) return null;
    const { width, height } = resolution;
    if (height >= 1080) return "Full HD";
    if (height >= 720) return "HD";
    if (height >= 480) return "SD";
    return "Low";
  };

  return (
    <Card className="mt-6 p-6 bg-gradient-to-br from-card via-card to-card/80 border-border/50 shadow-xl shadow-black/5">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Clapperboard className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Live Podcast Stream</h2>
              <p className="text-sm text-muted-foreground">Real-time broadcast</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-full">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="font-semibold text-red-500 text-sm">LIVE</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
            <Monitor className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Quality</p>
              <p className="font-semibold text-sm">
                {info.resolution ? 
                  `${getQualityLabel(info.resolution)} (${info.resolution.width}×${info.resolution.height})` : 
                  "Auto"
                }
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
            <Wifi className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Bitrate</p>
              <p className="font-semibold text-sm">
                {info.bitrate ? formatBitrate(info.bitrate) : "Auto"}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
            <Users className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Participants</p>
              <p className="font-semibold text-sm">Multiple</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
            <Clock className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Latency</p>
              <p className="font-semibold text-sm">Low</p>
            </div>
          </div>
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
      <Card className="overflow-hidden shadow-2xl shadow-primary/10 border-border/50 bg-gradient-to-br from-card to-card/80">
        <div className="relative aspect-video bg-gradient-to-br from-black via-gray-900 to-black rounded-lg overflow-hidden">
          <PlayerOverlay isLoading={isLoading && !isPlaying} error={hasVideoError ? (error || "Video track unavailable") : null} />
          <video
            ref={videoRef}
            className="w-full h-full object-contain rounded-lg"
            controls
            autoPlay
            playsInline
          />
          
          {/* Enhanced Stream Status Badge */}
          {!isLoading && !hasVideoError && (
            <div className="absolute top-4 left-4 z-20">
              <div className="flex items-center gap-2 bg-gradient-to-r from-red-500/20 to-red-600/20 backdrop-blur-md border border-red-500/30 px-4 py-2 rounded-full shadow-lg">
                <div className="relative">
                  <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></div>
                  <div className="absolute inset-0 w-2.5 h-2.5 bg-red-400 rounded-full animate-ping"></div>
                </div>
                <span className="text-white text-sm font-semibold tracking-wide">LIVE</span>
              </div>
            </div>
          )}
          
          {/* Enhanced Audio-Only Indicator */}
          {!isLoading && !hasVideoError && videoRef.current?.videoWidth === 0 && (
            <div className="absolute bottom-4 right-4 z-20">
              <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-md border border-yellow-500/40 px-4 py-2 rounded-full shadow-lg">
                <Volume2 className="w-4 h-4 text-yellow-400 animate-pulse" />
                <span className="text-yellow-400 text-sm font-semibold">Audio Only</span>
              </div>
            </div>
          )}
          
          {/* Multi-participant indicator */}
          {!isLoading && !hasVideoError && (
            <div className="absolute top-4 right-4 z-20">
              <div className="flex items-center gap-2 bg-gradient-to-r from-primary/20 to-primary/30 backdrop-blur-md border border-primary/30 px-3 py-1.5 rounded-full shadow-lg">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-primary text-xs font-medium">Multi-Stream</span>
              </div>
            </div>
          )}
          
          {/* Subtle corner gradients for depth */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-primary/5 to-transparent rounded-full -translate-x-16 -translate-y-16"></div>
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-primary/5 to-transparent rounded-full translate-x-16 translate-y-16"></div>
          </div>
        </div>
      </Card>
      <StreamDetails info={streamInfo} />
    </div>
  );
};