"use client";

import { useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppStore } from '@/store/app-store';
import { useWebRTCStream } from '@/hooks/useWebRTCStream';

import { AppLayout } from '@/components/layout/AppLayout';
import { PreStreamOverlay } from '@/components/stream/PreStreamOverlay';
import { StreamHeader } from '@/components/stream/StreamHeader';
import { VideoStage } from '@/components/stream/VideoStage';
import { StreamControls } from '@/components/stream/StreamControls';
import { StreamSidebar } from '@/components/stream/StreamSidebar';
import { Card } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

/**
 * The main page component for a live stream.
 * It orchestrates the entire WebRTC session for hosts and guests and
 * handles rendering different UI states: loading, error, pre-stream, and live.
 */
export default function StreamPage() {
  const router = useRouter();
  const params = useParams<{ roomId: string }>();
  const routeRoomId = useMemo(() => (typeof params?.roomId === 'string' ? params.roomId : Array.isArray(params?.roomId) ? params?.roomId?.[0] : ''), [params]);
  const { roomCode, userName, userRole, leaveRoom, joinRoom } = useAppStore();

  // Ensure session is initialized for direct URL visits
useEffect(() => {
  if (!routeRoomId) return;

  // This logic runs if a user lands on the URL directly without a session.
  if (!roomCode || !userName || !userRole) {
    const randomSuffix = Math.random().toString(36).slice(2, 6);
    const defaultName = `Guest-${randomSuffix}`;
    joinRoom({ roomCode: routeRoomId, userName: defaultName, role: 'guest' });
    
    // ✅ The fetch call that was here has been removed. It's no longer needed.
    // The socket connection will handle creating the live room instance.
    
    return; // Exit effect to allow re-render with new session state
  }
  
  // Redirect viewers away from the interactive stream page
  if (userRole === 'viewer') {
    router.replace(`/watch/${roomCode || routeRoomId}`);
  }
}, [routeRoomId, roomCode, userName, userRole, joinRoom, router]);

  // If params missing, go home
  useEffect(() => {
    if (!routeRoomId) router.replace('/');
  }, [routeRoomId, router]);

  const streamHook = useWebRTCStream((roomCode || routeRoomId || ''), userName || undefined as unknown as string, userRole);

  // If we still aren't connected after a short delay, keep the session stable.
  // This helps ensure the hook has all fields ready before attempting to connect.
  useEffect(() => {
    const timer = setTimeout(() => {
      // No forced action; this timeout merely sequences state so the hook's effect will fire with non-empty deps
    }, 500);
    return () => clearTimeout(timer);
  }, [streamHook.isConnected, roomCode, userName, userRole, routeRoomId]);

  /**
   * A comprehensive leave action that cleans up both the WebRTC state
   * and the global session state before navigating home.
   */
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
            <div className="mt-4 text-xs text-muted-foreground">
              <p>If this never proceeds:</p>
              <ul className="mt-1 space-y-1">
                <li>• Reached this page via refresh? Go back Home and use Create/Join buttons.</li>
                <li>• Or append ?host=1 to claim host for a new room.</li>
              </ul>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  // 2. Error state if the connection fails.
  if (streamHook.error) {
    const isRoomFull = /room is full/i.test(streamHook.error);
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-screen p-4">
          <Card className="p-6 max-w-md w-full">
            <div className="flex items-center gap-3 text-red-500 mb-3">
              <AlertCircle className="h-5 w-5" />
              <h3 className="font-semibold">Connection Failed</h3>
            </div>
            <p className="text-muted-foreground mb-4 text-sm">{streamHook.error}</p>
            {isRoomFull ? (
              <div className="space-y-3">
                <button
                  onClick={() => {
                    // Switch to viewer and go to watch page
                    const suffix = Math.random().toString(36).slice(2, 6);
                    joinRoom({ roomCode: routeRoomId, userName: userName ?? `Viewer-${suffix}`, role: 'viewer' });
                    router.replace(`/watch/${roomCode || routeRoomId}`);
                  }}
                  className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                >
                  Watch Stream Instead
                </button>
                <button 
                  onClick={handleLeaveRoom}
                  className="w-full px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
                >
                  Back to Home
                </button>
              </div>
            ) : (
              <button 
                onClick={handleLeaveRoom}
                className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Go Back to Home
              </button>
            )}
          </Card>
        </div>
      </AppLayout>
    );
  }

  // 3. Pre-stream "lobby" where the user can see others before going live.
  if (!streamHook.isStreaming) {
    return (
      <AppLayout>
        <PreStreamOverlay
          roomCode={roomCode}
          userRole={userRole} // CORRECTED: Added missing prop
          isConnected={streamHook.isConnected}
          onStartStream={streamHook.actions.startStreaming}
          onLeaveRoom={handleLeaveRoom}
          participants={streamHook.participants}
          error={streamHook.error} // CORRECTED: Added missing prop
        />
      </AppLayout>
    );
  }

  // 4. The main, live streaming interface.
  // CORRECTED: Removed the duplicated and incomplete return statement.
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