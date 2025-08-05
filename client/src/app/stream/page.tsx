"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { Device } from "mediasoup-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Users,
  Copy,
  Play,
  Square,
  Radio,
  Settings,
  AlertCircle,
  Wifi,
  WifiOff,
  LogOut,
  Cast,
} from "lucide-react";
import Link from "next/link";

// NOTE: Interfaces remain the same
interface Participant {
  id: string;
  userId: string;
  roomId: string;
  isStreaming: boolean;
  joinedAt: Date;
}

interface MediaDevices {
  video: boolean;
  audio: boolean;
}

export default function StreamPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = searchParams.get("room"); // NOTE: All state and logic hooks remain the same
  const [socket, setSocket] = useState<Socket | null>(null);
  const [device, setDevice] = useState<Device | null>(null);
  const [sendTransport, setSendTransport] = useState<any>(null);
  const [recvTransport, setRecvTransport] = useState<any>(null);
  const [producers, setProducers] = useState<Map<string, any>>(new Map());
  const [consumers, setConsumers] = useState<Map<string, any>>(new Map());
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [mediaDevices, setMediaDevices] = useState<MediaDevices>({
    video: true,
    audio: true,
  });
  const [hlsUrl, setHlsUrl] = useState<string | null>(null);
  const [isHlsEnabled, setIsHlsEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null); // NOTE: All useEffect and handler functions remain the same

  useEffect(() => {
    if (!roomId) {
      router.push("/");
      return;
    }
    const newSocket = io(
      process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3001"
    );
    newSocket.on("connect", () => {
      setIsConnected(true);
      setSocket(newSocket);
      newSocket.emit("join-room", { roomId });
    });
    newSocket.on("disconnect", () => setIsConnected(false));
    newSocket.on("participants-list", (p) => setParticipants(p));
    newSocket.on("participant-joined", (p) =>
      setParticipants((prev) => [...prev, p])
    );
    newSocket.on("participant-left", (id) =>
      setParticipants((prev) => prev.filter((p) => p.id !== id))
    );
    newSocket.on("hls-stream-ready", (data) => setHlsUrl(data.hlsUrl));
    newSocket.on("error", (err) => setError(err.message));
    return () => {
      newSocket.disconnect();
      if (localVideoRef.current?.srcObject) {
        const stream = localVideoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [roomId, router]);

  const startStreaming = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true,
      });
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      setIsStreaming(true);
      socket?.emit("start-streaming", { roomId });
    } catch (err) {
      console.error(err);
      setError("Failed to access camera/microphone. Please check permissions.");
    }
  };
  const stopStreaming = () => {
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      localVideoRef.current.srcObject = null;
    }
    setIsStreaming(false);
    socket?.emit("stop-streaming", { roomId });
  };

  const toggleMedia = (type: "video" | "audio") => {
    const stream = localVideoRef.current?.srcObject as MediaStream;
    if (!stream) return;
    const track =
      type === "video"
        ? stream.getVideoTracks()[0]
        : stream.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setMediaDevices((prev) => ({ ...prev, [type]: track.enabled }));
    }
  };

  const toggleHLS = () => {
    const newHlsState = !isHlsEnabled;
    socket?.emit(newHlsState ? "start-hls" : "stop-hls", { roomId });
    setIsHlsEnabled(newHlsState);
    if (!newHlsState) setHlsUrl(null);
  };
  const copyToClipboard = (text: string) => navigator.clipboard.writeText(text);
  if (!roomId) return null;

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-40 w-full border-b border-border/20 bg-background/80 backdrop-blur-xl">
          <div className="container flex h-20 max-w-screen-2xl items-center justify-between px-4">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg transition-transform duration-300 group-hover:scale-105">
                  <Video className="h-6 w-6 text-primary-foreground" />
                </div>
                {isConnected && (
                  <div className="absolute -right-1 -top-1 flex h-4 w-4">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex h-4 w-4 rounded-full border-2 border-background bg-emerald-500"></span>
                  </div>
                )}
              </div>
              <div>
                <div className="font-serif text-2xl font-bold tracking-tight">
                  Streamify
                </div>
                <p className="text-xs text-muted-foreground">
                  Stream Dashboard
                </p>
              </div>
            </Link>

            <div className="flex items-center gap-2">
              <Badge
                variant={isConnected ? "default" : "destructive"}
                className={
                  isConnected
                    ? "bg-green-500/10 text-green-400 border-green-500/30"
                    : ""
                }
              >
                {isConnected ? (
                  <Wifi className="w-3 h-3 mr-1.5" />
                ) : (
                  <WifiOff className="w-3 h-3 mr-1.5" />
                )}
                {isConnected ? "Connected" : "Disconnected"}
              </Badge>
              <Button
                onClick={() => router.push("/")}
                variant="outline"
                size="sm"
                className="bg-white/5 border-white/10 hover:bg-white/10"
              >
                <LogOut className="w-4 h-4 mr-2" /> Leave Room
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 container max-w-screen-2xl px-4 py-6">
          {error && (
            <Card className="mb-4 border-destructive/30 bg-destructive/10">
              <CardContent className="flex items-center gap-3 p-4">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                <p className="text-sm font-medium text-destructive">{error}</p>
              </CardContent>
            </Card>
          )}

          <div className="flex flex-col lg:flex-row gap-6">
            {/* --- The Stage --- */}
            <main className="flex-1 w-full">
              <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black border border-white/10 shadow-2xl shadow-primary/10">
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />

                {/* Pre-Stream Overlay */}
                {!isStreaming && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/50 backdrop-blur-lg p-8">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto border-2 border-primary/20 mb-6">
                      <Video className="w-10 h-10 text-primary" />
                    </div>
                    <h2 className="font-serif text-4xl font-bold mb-2">
                      Ready to Go Live
                    </h2>
                    <p className="text-lg text-muted-foreground mb-8">
                      Your camera is ready. Start your broadcast to the world.
                    </p>
                    <Button
                      onClick={startStreaming}
                      disabled={!isConnected}
                      size="lg"
                      className="h-14 px-8 text-lg font-semibold group cursor-pointer transition-all duration-300 ease-in-out bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 shadow-[0_0_20px_theme(colors.primary/30%)] hover:shadow-[0_0_40px_theme(colors.primary/50%)]"
                    >
                      <Play className="w-6 h-6 mr-3 transition-transform duration-300 group-hover:scale-110" />{" "}
                      Go Live Now
                    </Button>
                  </div>
                )}

                {/* Live Indicator */}
                {isStreaming && (
                  <div className="absolute top-5 left-5">
                    <Badge className="bg-red-500/90 border border-red-400/50 text-white animate-pulse shadow-lg">
                      <Radio className="w-3 h-3 mr-1.5" />
                      LIVE
                    </Badge>
                  </div>
                )}

                {/* Floating Controls */}
                {isStreaming && (
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-auto">
                    <div className="flex items-center gap-3 rounded-2xl p-3 bg-black/40 border border-white/10 backdrop-blur-md shadow-2xl">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={() => toggleMedia("video")}
                            size="icon"
                            variant={
                              mediaDevices.video ? "secondary" : "destructive"
                            }
                            className="h-12 w-12 rounded-lg"
                          >
                            {mediaDevices.video ? (
                              <Video className="w-6 h-6" />
                            ) : (
                              <VideoOff className="w-6 h-6" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            {mediaDevices.video
                              ? "Turn off camera"
                              : "Turn on camera"}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={() => toggleMedia("audio")}
                            size="icon"
                            variant={
                              mediaDevices.audio ? "secondary" : "destructive"
                            }
                            className="h-12 w-12 rounded-lg"
                          >
                            {mediaDevices.audio ? (
                              <Mic className="w-6 h-6" />
                            ) : (
                              <MicOff className="w-6 h-6" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            {mediaDevices.audio
                              ? "Mute microphone"
                              : "Unmute microphone"}
                          </p>
                        </TooltipContent>
                      </Tooltip>

                      <div className="w-px h-8 bg-white/20 mx-2"></div>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={stopStreaming}
                            variant="destructive"
                            className="h-12 w-28 rounded-lg text-base"
                          >
                            <Square className="w-5 h-5 mr-2" /> End
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>End the stream for everyone</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                )}
              </div>
            </main>

            {/* --- The Control Panel --- */}
            <aside className="w-full lg:w-96 flex-shrink-0 space-y-6">
              <Card className="border border-white/10 bg-white/5 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="font-serif text-2xl flex items-center gap-2.5">
                    <Users className="w-5 h-5 text-primary" />
                    Participants
                  </CardTitle>
                </CardHeader>
                <CardContent className="max-h-[20rem] overflow-y-auto space-y-2">
                  {participants.length > 0 ? (
                    participants.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="w-9 h-9 border border-border/50">
                            <AvatarFallback>
                              {p.userId.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p
                              className="text-sm font-semibold text-foreground font-mono truncate max-w-32"
                              title={p.userId}
                            >
                              {p.userId}
                            </p>
                            <p className="text-xs text-muted-foreground font-mono">
                              Joined {new Date(p.joinedAt).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                        {p.isStreaming && (
                          <Badge className="bg-green-500/80 border border-green-400/50 text-white text-xs shadow">
                            <Radio className="w-3 h-3 mr-1" />
                            Live
                          </Badge>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm font-semibold">Just you in here</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border border-white/10 bg-white/5 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="font-serif text-2xl flex items-center gap-2.5">
                    <Cast className="w-5 h-5 text-primary" />
                    Broadcast Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-black/20 border border-white/10">
                    <div>
                      <Label className="font-semibold">HLS Streaming</Label>
                      <p className="text-xs text-muted-foreground">
                        Broadcast to unlimited viewers.
                      </p>
                    </div>
                    <Button
                      onClick={toggleHLS}
                      disabled={!isStreaming}
                      size="sm"
                      variant={isHlsEnabled ? "secondary" : "outline"}
                      className={
                        isHlsEnabled
                          ? "bg-green-500/10 text-green-400 border-green-500/30"
                          : "bg-white/5"
                      }
                    >
                      {isHlsEnabled ? "Active" : "Enable"}
                    </Button>
                  </div>
                  {hlsUrl && (
                    <div className="space-y-2">
                      <Label className="font-mono text-xs tracking-wider uppercase text-muted-foreground">
                        HLS Watch Link
                      </Label>
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-mono text-foreground/80 break-all p-2 bg-black/20 rounded-md border border-border/50 flex-1">{`${window.location.origin}/watch?stream=${hlsUrl}`}</code>
                        <Button
                          onClick={() =>
                            copyToClipboard(
                              `${window.location.origin}/watch?stream=${hlsUrl}`
                            )
                          }
                          size="icon"
                          variant="ghost"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border border-white/10 bg-white/5 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="font-serif text-2xl flex items-center gap-2.5">
                    <Settings className="w-5 h-5 text-primary" />
                    Session Info
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Label className="font-mono text-xs tracking-wider uppercase text-muted-foreground">
                    Room ID
                  </Label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-sm font-mono text-foreground/80 p-3 bg-black/20 rounded-md border border-border/50 flex-1">
                      {roomId}
                    </code>
                    <Button
                      onClick={() => copyToClipboard(roomId)}
                      size="icon"
                      variant="ghost"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </aside>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
