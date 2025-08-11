"use client";

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

// Store & Hooks
import { useAppStore } from '@/store/app-store';
import { useWebRTCStream } from '@/hooks/useWebRTCStream';

// UI Components
import { AppLayout } from '@/components/layout/AppLayout';
import { StreamHeader } from '@/components/stream/StreamHeader';
import { VideoStage } from '@/components/stream/VideoStage';
import { StreamControls } from '@/components/stream/StreamControls';
import { StreamSidebar } from '@/components/stream/StreamSidebar';
import { Card } from '@/components/ui/card';
import { AlertCircle, Loader2 } from 'lucide-react';

/**
 * @description A loading component displayed while the stream session is being initialized.
 * @returns {JSX.Element} The loading spinner and text.
 */
const StreamLoading = () => (
  <AppLayout>
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <Loader2 className="animate-spin h-8 w-8 text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Initializing session...</p>
      </div>
    </div>
  </AppLayout>
);

/**
 * @description An error component displayed when the WebRTC connection fails.
 * @param {StreamErrorProps} props - The component props.
 * @returns {JSX.Element} The error card UI.
 */
// FIX 1: Added explicit types for props to resolve 'implicitly has an any type' errors.
const StreamError = ({ error, onGoHome }: { error: string; onGoHome: () => void; }) => (
  <AppLayout>
    <div className="flex items-center justify-center h-screen p-4">
      <Card className="p-6 max-w-md w-full">
        <div className="flex items-center gap-3 text-destructive mb-3">
          <AlertCircle className="h-5 w-5" />
          <h3 className="font-semibold">Connection Failed</h3>
        </div>
        <p className="text-muted-foreground mb-4 text-sm">{error}</p>
        <button
          onClick={onGoHome}
          className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Go Back to Home
        </button>
      </Card>
    </div>
  </AppLayout>
);


/**
 * @description The main page for a WebRTC streaming session.
 * It handles session initialization, user roles, and the core streaming interface.
 * @returns {JSX.Element | null} The rendered component or null if redirecting.
 */
export default function StreamPage() {
  const router = useRouter();
  const params = useParams();
  const routeRoomId = params?.roomId as string;

  const { roomCode, userName, userRole, leaveRoom, joinRoom } = useAppStore();

  // FIX 2: Provided fallback values ('') for state variables that can be `null` on the
  // initial render. This satisfies the `useWebRTCStream` hook's expectation of `string`
  // arguments. The component's logic prevents this hook from being used meaningfully
  // until the state is properly populated.
  const streamHook = useWebRTCStream(
    roomCode || '', 
    userName || '', 
    userRole || 'guest'
  );

  /**
   * Effect to handle session initialization and role-based redirects.
   * - If the user lands here without being in a room, it creates a guest session.
   * - If the user's role is 'viewer', it redirects them to the dedicated watch page.
   */
  useEffect(() => {
    if (routeRoomId && (!roomCode || !userName || !userRole)) {
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const defaultName = `Guest-${randomSuffix}`;
      joinRoom({ roomCode: routeRoomId, userName: defaultName, role: 'guest' });
      return;
    }
    
    if (userRole === 'viewer') {
      router.replace(`/watch/${roomCode}`);
    }
  }, [routeRoomId, roomCode, userName, userRole, joinRoom, router]);

  /**
   * @description Handles the logic for leaving the room, cleaning up both
   * WebRTC connections and application state before navigating home.
   */
  const handleLeaveRoom = () => {
    streamHook.actions.leaveRoom();
    leaveRoom();
    router.push('/');
  };

  if (!routeRoomId) {
    if (typeof window !== 'undefined') {
      router.replace('/');
    }
    return null;
  }

  if (!roomCode || !userName || !userRole) {
    return <StreamLoading />;
  }
  
  if (streamHook.error) {
    return <StreamError error={streamHook.error} onGoHome={handleLeaveRoom} />;
  }

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
              // FIX 3: Coalesced `null` to `undefined` to match the expected prop type `string | undefined`.
              selfId={streamHook.selfId ?? undefined}
              getRemoteVideoRef={streamHook.getRemoteVideoRef}
              userRole={userRole}
              isStreaming={streamHook.isStreaming}
              onStartStream={streamHook.actions.startStreaming}
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
            // FIX 3 (repeated): Coalesced `null` to `undefined` here as well.
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