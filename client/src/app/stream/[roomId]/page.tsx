"use client";

import { useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppStore } from '@/store/app-store';
import { useWebRTCStream } from '@/hooks/useWebRTCStream';

import { AppLayout } from '@/components/layout/AppLayout';
import { StreamHeader } from '@/components/stream/StreamHeader';
import { VideoStage } from '@/components/stream/VideoStage';
import { StreamControls } from '@/components/stream/StreamControls';
import { StreamSidebar } from '@/components/stream/StreamSidebar';
import { Card } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export default function StreamPage() {
  const router = useRouter();
  const params = useParams<{ roomId: string }>();
  const routeRoomId = useMemo(() => (typeof params?.roomId === 'string' ? params.roomId : Array.isArray(params?.roomId) ? params?.roomId?.[0] : ''), [params]);
  const { roomCode, userName, userRole, leaveRoom, joinRoom } = useAppStore();

  useEffect(() => {
    if (!routeRoomId) return;

    if (!roomCode || !userName || !userRole) {
      const randomSuffix = Math.random().toString(36).slice(2, 6);
      const defaultName = `Guest-${randomSuffix}`;
      joinRoom({ roomCode: routeRoomId, userName: defaultName, role: 'guest' });
      return;
    }
    
    if (userRole === 'viewer') {
      router.replace(`/watch/${roomCode || routeRoomId}`);
    }
  }, [routeRoomId, roomCode, userName, userRole, joinRoom, router]);

  useEffect(() => {
    if (!routeRoomId) router.replace('/');
  }, [routeRoomId, router]);

  const streamHook = useWebRTCStream((roomCode || routeRoomId || ''), userName || 'Guest', userRole);

  const handleLeaveRoom = () => {
    streamHook.actions.leaveRoom();
    leaveRoom();
    router.push('/');
  };

  // 1. Initial loading/redirecting state.
  if (!routeRoomId || !roomCode || !userName || !userRole) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-b-2 border-primary mx-auto mb-4 rounded-full"></div>
            <p className="text-muted-foreground">Loading session…</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  // 2. Error state if the connection fails.
  if (streamHook.error) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-screen p-4">
          <Card className="p-6 max-w-md w-full">
            <div className="flex items-center gap-3 text-red-500 mb-3">
              <AlertCircle className="h-5 w-5" />
              <h3 className="font-semibold">Connection Failed</h3>
            </div>
            <p className="text-muted-foreground mb-4 text-sm">{streamHook.error}</p>
            <button 
              onClick={handleLeaveRoom}
              className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Go Back to Home
            </button>
          </Card>
        </div>
      </AppLayout>
    );
  }

  // 3. The main, unified streaming interface.
  return (
    <AppLayout>
      <div className="h-screen flex flex-col bg-background">
        <StreamHeader
          roomCode={roomCode}
          userRole={userRole}
          participantCount={streamHook.participants.length}
          isStreaming={streamHook.isStreaming}
          onLeaveRoom={handleLeaveRoom}
          onToggleHLS={streamHook.actions.toggleHLS}
          isHlsEnabled={streamHook.isHlsEnabled}
        />
        
        <div className="flex-1 flex overflow-hidden">
          <main className="flex-1 flex flex-col">
            <VideoStage
              localVideoRef={streamHook.localVideoRef}
              participants={streamHook.participants}
              selfId={streamHook.selfId ?? undefined}
              getRemoteVideoRef={streamHook.getRemoteVideoRef}
              userRole={userRole}
              isStreaming={streamHook.isStreaming}
              onStartStream={streamHook.actions.startStreaming} // Pass the action here
            />
            
            <StreamControls
              mediaDeviceStatus={streamHook.mediaDeviceStatus}
              onToggleMedia={streamHook.actions.toggleMedia}
              onLeaveRoom={handleLeaveRoom}
              userRole={userRole}
              isStreaming={streamHook.isStreaming}
            />
          </main>
          
          <StreamSidebar
            participants={streamHook.participants}
            selfId={streamHook.selfId ?? undefined}
            hlsUrl={streamHook.hlsUrl}
            onCopyToClipboard={streamHook.actions.copyToClipboard}
            roomCode={roomCode}
            userRole={userRole}
          />
        </div>
      </div>
    </AppLayout>
  );
}
