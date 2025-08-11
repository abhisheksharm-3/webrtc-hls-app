"use client";

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

// Store & Hooks
import { useAppStore } from '@/store/app-store';
import { useHlsPlayer } from '@/hooks/useHlsPlayer';

// UI Components
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  ArrowLeft,
  Clapperboard,
  Loader2,
  Signal,
  Users,
  Wifi,
} from 'lucide-react';
import { StreamInfoType } from '@relay-app/shared';

// --- Helper Functions & Constants ---

/**
 * @description Generates the HLS playlist URL from a room ID.
 * @param {string | null} roomId The room ID.
 * @returns {string | null} The full HLS URL or null if no room ID is provided.
 */
const getHlsUrl = (roomId: string | null): string | null => {
  if (!roomId) return null;
  const hlsBase = (
    process.env.NEXT_PUBLIC_HLS_BASE_URL || 
    `${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001'}/hls`
  ).replace(/\/$/, '');
  return `${hlsBase}/${roomId}/playlist.m3u8`;
};


// --- Child Components for WatchPage ---

/**
 * @description A loading component for the initial session setup.
 */
const PageLoader = () => (
  <AppLayout>
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <Loader2 className="animate-spin h-8 w-8 text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Joining stream...</p>
      </div>
    </div>
  </AppLayout>
);

/**
 * @description Overlay for the video player to show loading or error states.
 */
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

/**
 * @description Displays detailed information about the stream below the player.
 */
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
          {info.resolution && (
            <span>{`${info.resolution.width}x${info.resolution.height}`}</span>
          )}
          {info.bitrate && (
            <span>{`${Math.round(info.bitrate / 1000)} kbps`}</span>
          )}
        </div>
      </div>
    </Card>
  );
};

/**
 * @description The main video player component, including its overlay and details.
 */
const Player = ({ hlsUrl }: { hlsUrl: string | null }) => {
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

/**
 * @description Sidebar panel with viewer guidelines and room info.
 */
const ViewerInfoPanel = ({ roomCode, onLeave }: { roomCode: string; onLeave: () => void }) => (
  <div className="lg:col-span-1 space-y-6">
    <Card className="p-4">
      <h3 className="font-semibold mb-3 flex items-center gap-2">
        <Signal className="h-4 w-4" />
        Stream Info
      </h3>
      <div className="space-y-3 text-sm">
        <div>
          <div className="font-medium text-muted-foreground mb-1">Room Code</div>
          <div className="font-mono bg-secondary px-2 py-1 rounded w-full">
            {roomCode}
          </div>
        </div>
      </div>
    </Card>
    <Card className="p-4 bg-secondary/30">
      <h3 className="font-semibold mb-2 flex items-center gap-2">
        <Users className="h-4 w-4" />
        Viewer Mode
      </h3>
      <div className="text-sm text-muted-foreground space-y-2">
        <p>You are watching as a viewer. Your mic and camera are off.</p>
        <p>Enjoy the show!</p>
      </div>
      <Button variant="outline" size="sm" onClick={onLeave} className="w-full mt-4">
        Leave Stream
      </Button>
    </Card>
  </div>
);


// --- Main Page Component ---

/**
 * @description The main page for watching an HLS stream. It handles session setup
 * for viewers and displays the player and stream information.
 * @returns {JSX.Element | null}
 */
export default function WatchPage() {
  const router = useRouter();
  const params = useParams();
  const routeRoomId = params?.roomId as string;

  const { roomCode, userRole, isInRoom, leaveRoom, joinRoom } = useAppStore();

  // Effect to ensure a valid "viewer" session exists.
  useEffect(() => {
    if (routeRoomId && (!isInRoom || roomCode !== routeRoomId)) {
      const suffix = Math.random().toString(36).slice(2, 8);
      joinRoom({ roomCode: routeRoomId, userName: `Viewer-${suffix}`, role: 'viewer' });
    }
  }, [routeRoomId, isInRoom, roomCode, joinRoom]);

  const handleLeaveRoom = () => {
    leaveRoom();
    router.push('/');
  };
  
  // Guard clause: Redirect if no room ID in URL.
  if (!routeRoomId) {
    if (typeof window !== "undefined") router.replace('/');
    return null;
  }

  // Show a loader until the session is properly configured.
  if (!isInRoom || !roomCode || userRole !== 'viewer') {
    return <PageLoader />;
  }
  
  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
          <div className="container mx-auto flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={handleLeaveRoom}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Wifi className="h-5 w-5 text-primary" />
                <span>Live Stream</span>
              </div>
            </div>
            <Badge variant="secondary" className="font-mono">
              {roomCode}
            </Badge>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8 animate-fade-in">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              <Player hlsUrl={getHlsUrl(roomCode)} />
              <ViewerInfoPanel roomCode={roomCode} onLeave={handleLeaveRoom} />
            </div>
          </div>
        </main>
      </div>
    </AppLayout>
  );
}