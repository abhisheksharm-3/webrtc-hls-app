"use client";

import { useEffect, useCallback, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";

// Store
import { useAppStore } from "@/store/app-store";

// UI Components
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WatchLoader } from "@/components/watch/WatchLoader";
import { Player } from "@/components/watch/Player";
import { ViewerInfoPanel } from "@/components/watch/ViewerInfoPanel";

// Icons
import { ArrowLeft, Wifi } from "lucide-react";

// Utils
import { getHlsUrl } from "@/lib/hls-utils/url";

// Types
import { ServerToClientEvents, ClientToServerEvents } from "@relay-app/shared";

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

/**
 * The main page for watching an HLS stream. It handles session setup for viewers,
 * orchestrates the layout, and renders the player and info panels.
 */
export default function WatchPage() {
  const router = useRouter();
  const params = useParams();
  const routeRoomId = params?.roomId as string;

  const { roomCode, userRole, isInRoom, leaveRoom, joinRoom } = useAppStore();

  // --- Effects ---
  useEffect(() => {
    // Redirect if no room ID is in the URL.
    if (!routeRoomId) {
      router.replace("/");
      return;
    }

    // Ensure a valid "viewer" session exists for the current room.
    if (!isInRoom || roomCode !== routeRoomId) {
      const suffix = Math.random().toString(36).slice(2, 8);
      joinRoom({
        roomCode: routeRoomId,
        userName: `Viewer-${suffix}`,
        role: "viewer",
      });
    }
  }, [routeRoomId, isInRoom, roomCode, joinRoom, router]);

  // --- Handlers ---
  const handleLeaveRoom = useCallback(() => {
    leaveRoom();
    router.push("/");
  }, [leaveRoom, router]);
  const [hlsUrl, setHlsUrl] = useState<string | null>(null);

  // Socket connection for HLS events
  useEffect(() => {
    if (!isInRoom || roomCode !== routeRoomId) return;

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "https://06afbf738244.ngrok-free.app";
    const socket: TypedSocket = io(socketUrl, {
      transports: ["websocket"],
      path: "/socket.io",
    });

    // Listen for HLS events
    socket.on("hls-started", ({ hlsUrl: newHlsUrl }) => {
      console.log("🎬 HLS started:", newHlsUrl);
      setHlsUrl(newHlsUrl);
    });

    socket.on("hls-restarted", ({ playlistUrl }) => {
      console.log("🔄 HLS restarted with new URL:", playlistUrl);
      setHlsUrl(playlistUrl);
    });

    socket.on("hls-stopped", () => {
      console.log("⏹️ HLS stopped");
      setHlsUrl(null);
    });

    return () => {
      socket.disconnect();
    };
  }, [isInRoom, roomCode, routeRoomId]);

  useEffect(() => {
    if (!roomCode) return;
    
    let isMounted = true;
    async function fetchUrl() {
      const url = await getHlsUrl(roomCode);
      if (isMounted) setHlsUrl(url);
    }
    fetchUrl();
    return () => {
      isMounted = false;
    };
  }, [roomCode]);

  // Show a loader until the session is properly configured for the correct room or until hlsUrl is loaded.
  if (!isInRoom || roomCode !== routeRoomId || userRole !== "viewer" || hlsUrl === null) {
    return <WatchLoader />;
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
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

        <main className="container mx-auto px-4 py-8 animate-fade-in">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              <Player hlsUrl={hlsUrl} />
              <ViewerInfoPanel roomCode={roomCode} onLeave={handleLeaveRoom} />
            </div>
          </div>
        </main>
      </div>
    </AppLayout>
  );
}
