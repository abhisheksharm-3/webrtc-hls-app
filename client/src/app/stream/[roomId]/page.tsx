"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/app-store';
import { PreStreamOverlay } from '@/components/stream/PreStreamOverlay';
import { StreamHeader } from '@/components/stream/StreamHeader';
import { VideoStage } from '@/components/stream/VideoStage';
import { StreamControls } from '@/components/stream/StreamControls';
import { StreamSidebar } from '@/components/stream/StreamSidebar';
import { AppLayout } from '@/components/layout/AppLayout';
import { useWebRTCStream } from '@/hooks/useWebRTCStream';
import { Card } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export default function StreamPage() {
  const router = useRouter();
  const { roomCode, userRole, isInRoom, leaveRoom } = useAppStore();

  // Redirect if not properly authenticated
  useEffect(() => {
    if (!isInRoom || !roomCode || !userRole || userRole === 'viewer') {
      router.push('/');
      return;
    }
  }, [isInRoom, roomCode, userRole, router]);

  const streamHook = useWebRTCStream(roomCode || '', userRole);

  const handleLeaveRoom = () => {
    streamHook.actions.leaveRoom();
    leaveRoom();
    router.push('/');
  };

  // Show loading state if not ready
  if (!isInRoom || !roomCode || !userRole || userRole === 'viewer') {
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

  // Show error state if connection failed
  if (streamHook.error && streamHook.connectionState === 'failed') {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Card className="p-6 max-w-md">
            <div className="flex items-center gap-3 text-red-500 mb-3">
              <AlertCircle className="h-5 w-5" />
              <h3 className="font-semibold">Connection Failed</h3>
            </div>
            <p className="text-muted-foreground mb-4">{streamHook.error}</p>
            <button 
              onClick={handleLeaveRoom}
              className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Go Back
            </button>
          </Card>
        </div>
      </AppLayout>
    );
  }

  // Pre-stream overlay for non-streaming participants  
  if (!streamHook.isStreaming) {
    return (
      <AppLayout>
        <PreStreamOverlay
          roomCode={roomCode}
          userRole={userRole}
          isConnected={streamHook.isConnected}
          onStartStream={streamHook.actions.startStreaming}
          onLeaveRoom={handleLeaveRoom}
          participants={streamHook.participants}
          error={streamHook.error}
        />
      </AppLayout>
    );
  }

  // Main streaming interface
  return (
    <AppLayout>
      <div className="h-screen flex flex-col">
        <StreamHeader
          roomCode={roomCode}
          userRole={userRole}
          participantCount={streamHook.participants.length}
          isStreaming={streamHook.isStreaming}
          onLeaveRoom={handleLeaveRoom}
          onToggleHLS={streamHook.actions.toggleHLS}
          isHlsEnabled={streamHook.isHlsEnabled}
        />
        
        <div className="flex-1 flex">
          <div className="flex-1 flex flex-col">
            <VideoStage
              localVideoRef={streamHook.localVideoRef}
              participants={streamHook.participants}
              selfId={streamHook.selfId}
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
          </div>
          
          <StreamSidebar
            roomCode={roomCode}
            participants={streamHook.participants}
            selfId={streamHook.selfId}
            userRole={userRole}
            hlsUrl={streamHook.hlsUrl}
            onCopyToClipboard={streamHook.actions.copyToClipboard}
          />
        </div>
      </div>
    </AppLayout>
  );
}
