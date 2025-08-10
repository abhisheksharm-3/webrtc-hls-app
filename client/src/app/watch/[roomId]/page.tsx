"use client";

import { useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppStore } from '@/store/app-store';
import { AppLayout } from '@/components/layout/AppLayout';
import { useHlsPlayer } from '@/hooks/useHlsPlayer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, ArrowLeft, Users, Wifi } from 'lucide-react';

export default function WatchPage() {
  const router = useRouter();
  const params = useParams<{ roomId: string }>();
  const routeRoomId = useMemo(() => (typeof params?.roomId === 'string' ? params.roomId : Array.isArray(params?.roomId) ? params?.roomId?.[0] : ''), [params]);
  const { roomCode, userRole, isInRoom, leaveRoom, joinRoom } = useAppStore();

  // Ensure session for direct visits: default to viewer
  useEffect(() => {
    if (!routeRoomId) return;
    if (!isInRoom || !roomCode || userRole !== 'viewer') {
      const suffix = Math.random().toString(36).slice(2, 6);
      joinRoom({ roomCode: routeRoomId, userName: `Viewer-${suffix}`, role: 'viewer' });
    }
  }, [routeRoomId, isInRoom, roomCode, userRole, joinRoom]);

  const handleLeaveRoom = () => {
    leaveRoom();
    router.push('/');
  };

  // Generate HLS URL (allow overriding base URL via NEXT_PUBLIC_HLS_BASE_URL)
  const hlsBase = (process.env.NEXT_PUBLIC_HLS_BASE_URL || `${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001'}/hls`).replace(/\/$/, '');
  const hlsUrl = (roomCode || routeRoomId) ? `${hlsBase}/${roomCode || routeRoomId}/playlist.m3u8` : null;
  
  const { 
    videoRef, 
    isLoading, 
    isPlaying, 
    error, 
    streamInfo
  } = useHlsPlayer(hlsUrl);

  // Show loading state if not ready
  if (!isInRoom || !roomCode || userRole !== 'viewer') {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Redirecting...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5">
        {/* Header */}
        <div className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLeaveRoom}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="font-mono">
                  Room: {roomCode}
                </Badge>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Wifi className="h-4 w-4" />
                  <span>Live Stream</span>
                </div>
              </div>
            </div>
            
            {/* Viewer count could be wired later via Socket.IO if needed */}
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Video Player */}
              <div className="lg:col-span-3">
                <Card className="overflow-hidden">
                  <div className="relative aspect-video bg-black">
                    {error ? (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center text-white">
                          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
                          <h3 className="text-lg font-semibold mb-2">Stream Not Available</h3>
                          <p className="text-sm text-gray-300 mb-4">
                            {error}
                          </p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => window.location.reload()}
                            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                          >
                            Retry
                          </Button>
                        </div>
                      </div>
                    ) : isLoading ? (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center text-white">
                          <div className="animate-spin h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                          <p className="text-sm">Loading stream...</p>
                        </div>
                      </div>
                    ) : (
                      <video
                        ref={videoRef}
                        className="w-full h-full object-contain"
                        controls
                        autoPlay
                        muted={false}
                        playsInline
                      />
                    )}
                  </div>
                </Card>

                {/* Stream Info */}
                {streamInfo && (
                  <Card className="mt-4 p-4">
                    <h2 className="text-lg font-semibold mb-2">Live Podcast Stream</h2>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        <span>LIVE</span>
                      </div>
                      {streamInfo.resolution && (
                        <span>{streamInfo.resolution.width}x{streamInfo.resolution.height}</span>
                      )}
                      {streamInfo.bitrate && (
                        <span>{Math.round(streamInfo.bitrate / 1000)}kbps</span>
                      )}
                    </div>
                  </Card>
                )}
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1">
                <Card className="p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Stream Info
                  </h3>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">Room Code</div>
                      <div className="font-mono text-sm bg-secondary/50 px-2 py-1 rounded">
                        {roomCode}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">Status</div>
                      <Badge variant={isPlaying ? "default" : "secondary"}>
                        {isPlaying ? "Playing" : "Stopped"}
                      </Badge>
                    </div>

                    {/* Reserved for viewer metrics */}
                  </div>

                  <div className="mt-6 pt-4 border-t">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleLeaveRoom}
                      className="w-full"
                    >
                      Leave Stream
                    </Button>
                  </div>
                </Card>

                {/* Viewer Guidelines */}
                <Card className="p-4 mt-4">
                  <h3 className="font-semibold mb-2">Viewer Mode</h3>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>You are watching this stream as a viewer.</p>
                    <p>Only the host and guest can participate in the conversation.</p>
                    <p>Enjoy the live podcast!</p>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
