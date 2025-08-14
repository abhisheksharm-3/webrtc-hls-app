/**
 * @file This file defines the main stream page for a WebRTC session.
 */
"use client";

import { useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";

// Store & Hooks
import { useAppStore } from "@/store/app-store";
import { useWebRTCStream } from "@/hooks/useWebRTCStream";

// UI Components
import AppLayout from "@/components/layout/AppLayout";
import { StreamHeader } from "@/components/stream/StreamHeader";
import { VideoStage } from "@/components/stream/VideoStage";
import { StreamControls } from "@/components/stream/StreamControls";
import { StreamSidebar } from "@/components/stream/StreamSidebar";
import { StreamLoading } from "@/components/stream/StreamLoading";
import { StreamError } from "@/components/stream/StreamError";

/**
 * Renders the main streaming interface page.
 * This component manages the application state for the stream, handles user
 * sessions, and orchestrates the various UI components that make up the page.
 * It handles loading, error, and connected states.
 *
 * @returns {JSX.Element | null} The stream page UI, a loading screen, an error screen, or null during redirection.
 */
const StreamPage = () => {
  const router = useRouter();
  const params = useParams();
  const routeRoomId = params?.roomId as string;

  // --- State Management ---
  const { roomCode, userName, userRole, leaveRoom, joinRoom } = useAppStore();
  const isSessionReady = !!(roomCode && userName && userRole);

  const streamHook = useWebRTCStream(
    roomCode ?? "",
    userName ?? "",
    userRole ?? "guest"
  );

  // --- Side Effects ---

  useEffect(() => {
    if (routeRoomId && !isSessionReady) {
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const guestName = `Guest-${randomSuffix}`;
      console.log(
        `👤 No user session found. Creating a temporary guest session for room ${routeRoomId} with name ${guestName}`
      );
      joinRoom({ roomCode: routeRoomId, userName: guestName, role: "guest" });
    }
  }, [routeRoomId, isSessionReady, joinRoom]);

  useEffect(() => {
    if (!routeRoomId) {
      router.replace("/");
      return;
    }
    if (userRole === "viewer") {
      console.log(`User role is 'viewer', redirecting to /watch/${roomCode}`);
      router.replace(`/watch/${roomCode}`);
    }
  }, [routeRoomId, userRole, roomCode, router]);

  const handleLeaveRoom = useCallback(() => {
    streamHook.actions.leaveRoom();
    leaveRoom();
    router.push("/");
  }, [streamHook.actions, leaveRoom, router]);

  if (!routeRoomId) {
    return null;
  }

  if (!isSessionReady) {
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
            selfId={streamHook.selfId ?? undefined}
            hlsUrl={streamHook.hlsUrl}
            roomCode={roomCode}
            userRole={userRole}
          />
        </div>
      </div>
    </AppLayout>
  );
};

export default StreamPage;
