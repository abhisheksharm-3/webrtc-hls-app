"use client";

import { useHlsPlayer } from '@/hooks/useHlsPlayer';
import { Card } from '@/components/ui/card';
import { AlertCircle, Clapperboard, Loader2 } from 'lucide-react';
import { StreamInfoType } from '@relay-app/shared';

// --- Sub-components specific to the Player ---

const PlayerOverlay = ({ isLoading, error }: { isLoading: boolean; error: string | null }) => {
  if (!isLoading && !error) return null;

  const Icon = error ? AlertCircle : Loader2;
  const message = error ? "Stream Not Available" : "Loading Stream...";

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="text-center text-white">
        <Icon className={`h-12 w-12 mx-auto mb-4 ${isLoading ? 'animate-spin' : 'text-red-500'}`} />
        <h3 className="text-lg font-semibold">{message}</h3>
        {error && <p className="text-sm text-gray-300 mt-1">{error}</p>}
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
  const { videoRef, isLoading, isPlaying, error, streamInfo } = useHlsPlayer(hlsUrl);

  return (
    <div className="lg:col-span-3">
      <Card className="overflow-hidden shadow-2xl shadow-primary/10">
        <div className="relative aspect-video bg-black">
          <PlayerOverlay isLoading={isLoading && !isPlaying} error={error} />
          <video
            ref={videoRef}
            className="w-full h-full object-contain"
            controls
            autoPlay
            playsInline
          />
        </div>
      </Card>
      <StreamDetails info={streamInfo} />
    </div>
  );
};