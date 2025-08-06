"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AlertCircle } from "lucide-react";
import { useWebRTCStream } from "@/hooks/useWebRTCStream";
import { StreamHeader } from "@/components/stream/StreamHeader";
import { VideoStage } from "@/components/stream/VideoStage";
import { StreamControls } from "@/components/stream/StreamControls";
import { StreamSidebar } from "@/components/stream/StreamSidebar";
import { Participant } from "@/lib/types/stream-types";

export default function StreamPage() {
  const searchParams = useSearchParams();
  const roomId = searchParams.get("room");
  const role = searchParams.get("role");

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // The hook provides all state and logic
  const {
    isConnected,
    isStreaming,
    error,
    participants,
    selfId,
    localVideoRef,
    getRemoteVideoRef,
    mediaDeviceStatus,
    hlsUrl,
    isHlsEnabled,
    actions,
  } = useWebRTCStream(roomId!, role);

  if (!roomId) {
    // Or render a proper "Room not found" component
    return (
      <div className="flex items-center justify-center min-h-screen">
        Invalid Room ID.
      </div>
    );
  }

  const remoteParticipants = participants.filter(
    (p: Participant) => p.id !== selfId
  );

  return (
    <TooltipProvider>
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
        <div className="min-h-screen bg-background text-foreground flex flex-col">
          <StreamHeader
            isConnected={isConnected}
            sidebarOpen={sidebarOpen}
            onLeave={actions.leaveRoom}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          />

          <div className="flex flex-1 h-[calc(100vh-3.5rem)] md:h-[calc(100vh-4rem)]">
            {/* Main Video Stage */}
            <main className="flex-1 flex flex-col overflow-hidden">
              {error && (
                <div className="mx-4 my-2 p-3 rounded-lg border-destructive/30 bg-destructive/10 text-destructive text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <div className="flex-1 p-2 md:p-4 xl:p-6 relative">
                <VideoStage
                  isStreaming={isStreaming}
                  localVideoRef={localVideoRef}
                  remoteParticipants={remoteParticipants}
                  getRemoteVideoRef={getRemoteVideoRef}
                  onStartStreaming={actions.startStreaming}
                  isReady={isConnected && !!localVideoRef}
                />
                {isStreaming && (
                  <StreamControls
                    mediaStatus={mediaDeviceStatus}
                    onToggleMedia={actions.toggleMedia}
                    onStopStreaming={actions.stopStreaming}
                  />
                )}
              </div>
            </main>

            {/* Sidebar */}
            <StreamSidebar
              isOpen={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
              participants={participants}
              selfId={selfId}
              roomId={roomId}
              isStreaming={isStreaming}
              isHlsEnabled={isHlsEnabled}
              hlsUrl={hlsUrl}
              onToggleHLS={actions.toggleHLS}
              onCopy={actions.copyToClipboard}
            />
          </div>
        </div>
      </Suspense>
    </TooltipProvider>
  );
}
