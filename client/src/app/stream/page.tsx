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
  Menu,
  X,
} from "lucide-react";
import Link from "next/link";

interface Participant {
  id: string;
  userId?: string;
  isHost: boolean;
  hasVideo: boolean;
  hasAudio: boolean;
  isStreaming: boolean;
}

interface MediaDevices {
  video: boolean;
  audio: boolean;
}

interface RemoteStream {
  participantId: string;
  videoTrack?: MediaStreamTrack;
  audioTrack?: MediaStreamTrack;
}

export default function StreamPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = searchParams.get("room");
  
  // WebRTC and Media State
  const [socket, setSocket] = useState<Socket | null>(null);
  const [device, setDevice] = useState<Device | null>(null);
  const [sendTransport, setSendTransport] = useState<any>(null);
  const [recvTransport, setRecvTransport] = useState<any>(null);
  const [producers, setProducers] = useState<Map<string, any>>(new Map());
  const [consumers, setConsumers] = useState<Map<string, any>>(new Map());
  const [routerRtpCapabilities, setRouterRtpCapabilities] = useState<any>(null);
  
  // UI State
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, RemoteStream>>(new Map());
  
  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

  // Initialize MediaSoup Device
  const initializeDevice = async (rtpCapabilities: any) => {
    try {
      const newDevice = new Device();
      await newDevice.load({ routerRtpCapabilities: rtpCapabilities });
      setDevice(newDevice);
      setRouterRtpCapabilities(rtpCapabilities);
      return newDevice;
    } catch (error) {
      console.error('Error initializing device:', error);
      setError('Failed to initialize WebRTC device');
      return null;
    }
  };

  // Create WebRTC Transport
  const createTransport = async (direction: 'send' | 'recv') => {
    if (!socket) return null;
    
    return new Promise<any>((resolve, reject) => {
      socket.emit('create-transport', { direction });
      
      socket.once('transport-created', async (params: any) => {
        try {
          let transport;
          if (direction === 'send') {
            transport = device!.createSendTransport(params);
          } else {
            transport = device!.createRecvTransport(params);
          }

          transport.on('connect', ({ dtlsParameters }: any, callback: any, errback: any) => {
            socket.emit('connect-transport', {
              transportId: params.id,
              dtlsParameters,
            });
            
            socket.once('transport-connected', () => callback());
            socket.once('error', (error: any) => errback(error));
          });

          if (direction === 'send') {
            transport.on('produce', ({ kind, rtpParameters }: any, callback: any, errback: any) => {
              socket.emit('produce', {
                transportId: params.id,
                kind,
                rtpParameters,
              });
              
              socket.once('produced', ({ producerId }: any) => callback({ id: producerId }));
              socket.once('error', (error: any) => errback(error));
            });
          }

          resolve(transport);
        } catch (error) {
          reject(error);
        }
      });

      socket.once('error', reject);
    });
  };

  // Start producing media
  const startProducing = async (track: MediaStreamTrack) => {
    if (!sendTransport) return;

    try {
      const producer = await sendTransport.produce({ track });
      setProducers(prev => new Map(prev.set(producer.id, producer)));
      return producer;
    } catch (error) {
      console.error('Error producing:', error);
      setError('Failed to start producing media');
    }
  };

  // Consume remote media
  const consumeMedia = async (producerId: string, participantId: string) => {
    if (!recvTransport || !routerRtpCapabilities) return;

    return new Promise<void>((resolve, reject) => {
      socket?.emit('consume', {
        transportId: recvTransport.id,
        producerId,
        rtpCapabilities: routerRtpCapabilities,
      });

      socket?.once('consumed', async ({ consumerId, kind, rtpParameters }: any) => {
        try {
          const consumer = await recvTransport.consume({
            id: consumerId,
            producerId,
            kind,
            rtpParameters,
          });

          setConsumers(prev => new Map(prev.set(consumerId, consumer)));

          // Add track to remote stream
          setRemoteStreams(prev => {
            const newMap = new Map(prev);
            const existing = newMap.get(participantId) || { participantId };
            
            if (kind === 'video') {
              existing.videoTrack = consumer.track;
            } else {
              existing.audioTrack = consumer.track;
            }
            
            newMap.set(participantId, existing);
            return newMap;
          });

          // Update video element
          updateRemoteVideoElement(participantId);
          
          await consumer.resume();
          resolve();
        } catch (error) {
          reject(error);
        }
      });

      socket?.once('error', reject);
    });
  };

  // Update remote video element with tracks
  const updateRemoteVideoElement = (participantId: string) => {
    const videoElement = remoteVideoRefs.current.get(participantId);
    const remoteStream = remoteStreams.get(participantId);
    
    if (videoElement && remoteStream) {
      const mediaStream = new MediaStream();
      
      if (remoteStream.videoTrack) {
        mediaStream.addTrack(remoteStream.videoTrack);
      }
      if (remoteStream.audioTrack) {
        mediaStream.addTrack(remoteStream.audioTrack);
      }
      
      videoElement.srcObject = mediaStream;
    }
  };

  // Socket event handlers
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

    newSocket.on("room-joined", async ({ participants: roomParticipants, routerRtpCapabilities, isHost }: any) => {
      console.log('Room joined:', { roomParticipants, isHost });
      setParticipants(roomParticipants || []);
      
      // Initialize MediaSoup device
      await initializeDevice(routerRtpCapabilities);
    });

    newSocket.on("participant-joined", ({ participant }: any) => {
      setParticipants((prev) => [...prev, participant]);
    });

    newSocket.on("participant-left", ({ participantId }: any) => {
      setParticipants((prev) => prev.filter((p) => p.id !== participantId));
      
      // Clean up remote streams
      setRemoteStreams(prev => {
        const newMap = new Map(prev);
        newMap.delete(participantId);
        return newMap;
      });
      
      remoteVideoRefs.current.delete(participantId);
    });

    newSocket.on("new-producer", async ({ producerId, participantId }: any) => {
      // Consume the new producer
      await consumeMedia(producerId, participantId);
    });

    newSocket.on("producer-closed", ({ producerId, participantId }: any) => {
      // Remove consumer
      const consumer = Array.from(consumers.values()).find(c => c.producerId === producerId);
      if (consumer) {
        consumer.close();
        setConsumers(prev => {
          const newMap = new Map(prev);
          newMap.delete(consumer.id);
          return newMap;
        });
      }
    });

    newSocket.on("hls-stream-ready", (data) => setHlsUrl(data.hlsUrl));
    newSocket.on("error", (err) => setError(err.message));

    return () => {
      newSocket.disconnect();
      const videoElement = localVideoRef.current;
      if (videoElement?.srcObject) {
        const stream = videoElement.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [roomId, router]);

  const startStreaming = async () => {
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true,
      });
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Create transports if device is ready
      if (device && socket) {
        const sendTransportInstance = await createTransport('send');
        const recvTransportInstance = await createTransport('recv');
        
        setSendTransport(sendTransportInstance);
        setRecvTransport(recvTransportInstance);

        // Start producing video and audio
        const videoTrack = stream.getVideoTracks()[0];
        const audioTrack = stream.getAudioTracks()[0];

        if (videoTrack) await startProducing(videoTrack);
        if (audioTrack) await startProducing(audioTrack);
      }

      setIsStreaming(true);
      socket?.emit("start-streaming", { roomId });
    } catch (err) {
      console.error(err);
      setError("Failed to access camera/microphone. Please check permissions.");
    }
  };

  const stopStreaming = () => {
    // Stop all producers
    producers.forEach(producer => producer.close());
    setProducers(new Map());

    // Stop all consumers
    consumers.forEach(consumer => consumer.close());
    setConsumers(new Map());

    // Close transports
    sendTransport?.close();
    recvTransport?.close();
    setSendTransport(null);
    setRecvTransport(null);

    // Stop local stream
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
    
    const track = type === "video" 
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
      <div className="min-h-screen bg-background text-foreground">
        {/* Header */}
        <header className="sticky top-0 z-50 w-full border-b border-border/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-14 md:h-16 items-center justify-between px-4 md:px-6">
            <Link href="/" className="flex items-center gap-2 md:gap-3 group">
              <div className="relative">
                <div className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-lg md:rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg transition-transform duration-300 group-hover:scale-105">
                  <Video className="h-4 w-4 md:h-5 md:w-5 text-primary-foreground" />
                </div>
                {isConnected && (
                  <div className="absolute -right-0.5 -top-0.5 md:-right-1 md:-top-1 flex h-3 w-3 md:h-4 md:w-4">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex h-3 w-3 md:h-4 md:w-4 rounded-full border-2 border-background bg-emerald-500"></span>
                  </div>
                )}
              </div>
              <div className="hidden sm:block">
                <div className="font-serif text-lg md:text-xl font-bold tracking-tight">
                  Streamify
                </div>
                <p className="text-xs text-muted-foreground hidden md:block">
                  Stream Dashboard
                </p>
              </div>
            </Link>

            <div className="flex items-center gap-2">
              <Badge
                variant={isConnected ? "default" : "destructive"}
                className={`text-xs ${
                  isConnected
                    ? "bg-green-500/10 text-green-400 border-green-500/30"
                    : ""
                }`}
              >
                {isConnected ? (
                  <Wifi className="w-3 h-3 mr-1" />
                ) : (
                  <WifiOff className="w-3 h-3 mr-1" />
                )}
                <span className="hidden sm:inline">
                  {isConnected ? "Connected" : "Disconnected"}
                </span>
              </Badge>
              <Button
                onClick={() => router.push("/")}
                variant="outline"
                size="sm"
                className="bg-white/5 border-white/10 hover:bg-white/10 text-xs"
              >
                <LogOut className="w-4 h-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Leave</span>
              </Button>
              <Button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                variant="ghost"
                size="sm"
                className="xl:hidden"
              >
                {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </header>

        {/* Main Layout */}
        <div className="flex h-[calc(100vh-3.5rem)] md:h-[calc(100vh-4rem)]">
          {/* Video Stage */}
          <main className="flex-1 flex flex-col overflow-hidden">
            {/* Error Display */}
            {error && (
              <div className="mx-4 my-2 p-3 rounded-lg border-destructive/30 bg-destructive/10 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                <p className="text-sm font-medium text-destructive">{error}</p>
              </div>
            )}

            {/* Video Container */}
            <div className="flex-1 p-2 md:p-4 xl:p-6">
              {/* If streaming, show grid layout (with placeholders if needed) */}
              {isStreaming ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                  {/* Local Video */}
                  <div className="relative w-full h-full overflow-hidden rounded-xl md:rounded-2xl bg-black border border-white/10 shadow-2xl shadow-primary/10">
                    <video
                      ref={localVideoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-blue-500/90 border border-blue-400/50 text-white text-xs">
                        You
                      </Badge>
                    </div>
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-red-500/90 border border-red-400/50 text-white animate-pulse shadow-lg text-xs">
                        <Radio className="w-3 h-3 mr-1" />
                        LIVE
                      </Badge>
                    </div>
                  </div>

                  {/* Remote Videos or Placeholder */}
                  {participants.length > 1 ? (
                    participants
                      .filter(p => p.id !== 'current-user')
                      .slice(0, 1) // Only show first guest in grid layout
                      .map((participant) => (
                        <div
                          key={participant.id}
                          className="relative w-full h-full overflow-hidden rounded-xl md:rounded-2xl bg-black border border-white/10 shadow-2xl shadow-primary/10"
                        >
                          <video
                            ref={(el) => {
                              if (el) {
                                remoteVideoRefs.current.set(participant.id, el);
                                updateRemoteVideoElement(participant.id);
                              }
                            }}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-3 left-3">
                            <Badge className="bg-green-500/90 border border-green-400/50 text-white text-xs">
                              {participant.isHost ? 'Host' : 'Guest'}
                            </Badge>
                          </div>
                          {participant.isStreaming && (
                            <div className="absolute top-3 right-3">
                              <Badge className="bg-red-500/90 border border-red-400/50 text-white animate-pulse shadow-lg text-xs">
                                <Radio className="w-3 h-3 mr-1" />
                                LIVE
                              </Badge>
                            </div>
                          )}
                        </div>
                      ))
                  ) : (
                    /* Guest Placeholder */
                    <div className="relative w-full h-full overflow-hidden rounded-xl md:rounded-2xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-white/10 shadow-2xl shadow-primary/10 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-gray-600/30 rounded-full flex items-center justify-center mb-4 mx-auto">
                          <Users className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-300 font-medium">Waiting for Guest</p>
                        <p className="text-xs text-gray-500 mt-1">Share the room code for them to join</p>
                      </div>
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-gray-500/90 border border-gray-400/50 text-white text-xs">
                          Guest Slot
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Single video layout */
                <div className="relative w-full h-full max-w-none mx-auto overflow-hidden rounded-xl md:rounded-2xl bg-black border border-white/10 shadow-2xl shadow-primary/10">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />

                  {/* Pre-Stream Overlay */}
                  {!isStreaming && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/50 backdrop-blur-lg p-4 md:p-8">
                      <div className="w-12 h-12 md:w-16 md:h-16 xl:w-20 xl:h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto border-2 border-primary/20 mb-4 md:mb-6">
                        <Video className="w-6 h-6 md:w-8 md:h-8 xl:w-10 xl:h-10 text-primary" />
                      </div>
                      <h2 className="font-serif text-xl md:text-2xl xl:text-4xl font-bold mb-1 md:mb-2 text-center">
                        Ready to Go Live
                      </h2>
                      <p className="text-sm md:text-base xl:text-lg text-muted-foreground mb-6 md:mb-8 text-center max-w-md">
                        {participants.length === 0
                          ? "Connecting to room..."
                          : participants.length === 1 
                            ? "Start your stream. Others can join using the room code."
                            : "Your camera is ready. Start your broadcast with your guest."}
                      </p>
                      <Button
                        onClick={startStreaming}
                        disabled={!isConnected || !device}
                        size="lg"
                        className="h-12 md:h-14 px-6 md:px-8 text-sm md:text-lg font-semibold group cursor-pointer transition-all duration-300 ease-in-out bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 shadow-[0_0_20px_theme(colors.primary/30%)] hover:shadow-[0_0_40px_theme(colors.primary/50%)]"
                      >
                        <Play className="w-5 h-5 md:w-6 md:h-6 mr-2 md:mr-3 transition-transform duration-300 group-hover:scale-110" />
                        {participants.length <= 1 ? "Start Stream" : "Go Live Together"}
                      </Button>
                    </div>
                  )}

                  {/* Live Indicator */}
                  {isStreaming && (
                    <div className="absolute top-3 md:top-5 left-3 md:left-5">
                      <Badge className="bg-red-500/90 border border-red-400/50 text-white animate-pulse shadow-lg text-xs">
                        <Radio className="w-3 h-3 mr-1" />
                        LIVE
                      </Badge>
                    </div>
                  )}
                </div>
              )}

              {/* Floating Controls */}
              {isStreaming && (
                <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 w-auto">
                  <div className="flex items-center gap-2 md:gap-3 rounded-xl md:rounded-2xl p-2 md:p-3 bg-black/40 border border-white/10 backdrop-blur-md shadow-2xl">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={() => toggleMedia("video")}
                          size="icon"
                          variant={
                            mediaDevices.video ? "secondary" : "destructive"
                          }
                          className="h-10 w-10 md:h-12 md:w-12 rounded-lg"
                        >
                          {mediaDevices.video ? (
                            <Video className="w-4 h-4 md:w-5 md:h-5" />
                          ) : (
                            <VideoOff className="w-4 h-4 md:w-5 md:h-5" />
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
                          className="h-10 w-10 md:h-12 md:w-12 rounded-lg"
                        >
                          {mediaDevices.audio ? (
                            <Mic className="w-4 h-4 md:w-5 md:h-5" />
                          ) : (
                            <MicOff className="w-4 h-4 md:w-5 md:h-5" />
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

                    <div className="w-px h-6 md:h-8 bg-white/20 mx-1 md:mx-2"></div>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={stopStreaming}
                          variant="destructive"
                          className="h-10 w-20 md:h-12 md:w-28 rounded-lg text-sm md:text-base"
                        >
                          <Square className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" />
                          End
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

          {/* Sidebar */}
          <aside
            className={`${
              sidebarOpen ? "translate-x-0" : "translate-x-full"
            } xl:translate-x-0 fixed xl:relative inset-y-0 right-0 z-40 w-80 xl:w-96 bg-background/95 xl:bg-transparent backdrop-blur-xl xl:backdrop-blur-none border-l xl:border-l-0 border-border/20 transition-transform duration-300 ease-in-out flex flex-col`}
          >
            {/* Mobile overlay */}
            {sidebarOpen && (
              <div
                className="xl:hidden fixed inset-0 bg-black/50 z-30"
                onClick={() => setSidebarOpen(false)}
              />
            )}

            <div className="flex-1 overflow-y-auto p-4 xl:p-6 space-y-4 xl:space-y-6">
              {/* Participants Card */}
              <Card className="border border-white/10 bg-white/5 backdrop-blur-md">
                <CardHeader className="pb-3">
                  <CardTitle className="font-serif text-lg xl:text-xl flex items-center gap-2">
                    <Users className="w-4 h-4 xl:w-5 xl:h-5 text-primary" />
                    Participants ({participants.length}/2)
                  </CardTitle>
                </CardHeader>
                <CardContent className="max-h-60 xl:max-h-80 overflow-y-auto space-y-2">
                  {participants.length > 0 ? (
                    participants.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-2 xl:p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-center gap-2 xl:gap-3 min-w-0 flex-1">
                          <Avatar className="w-8 h-8 xl:w-9 xl:h-9 border border-border/50 flex-shrink-0">
                            <AvatarFallback className="text-xs">
                              {p.isHost ? "H" : "G"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-foreground font-mono truncate">
                              {p.isHost ? "Host" : "Guest"}
                            </p>
                            <p className="text-xs text-muted-foreground font-mono">
                              {p.hasVideo && p.hasAudio 
                                ? "Video & Audio" 
                                : p.hasVideo 
                                ? "Video Only" 
                                : p.hasAudio 
                                ? "Audio Only" 
                                : "Connected"}
                            </p>
                          </div>
                        </div>
                        {p.isStreaming && (
                          <Badge className="bg-green-500/80 border border-green-400/50 text-white text-xs shadow flex-shrink-0 ml-2">
                            <Radio className="w-3 h-3 mr-1" />
                            Live
                          </Badge>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 xl:py-8 text-muted-foreground">
                      <Users className="w-6 h-6 xl:w-8 xl:h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm font-semibold">Waiting for participants...</p>
                    </div>
                  )}
                  
                  {participants.length === 1 && (
                    <div className="text-center py-4 text-muted-foreground border-t border-white/10">
                      <p className="text-xs">
                        Share the room code below for others to join
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Broadcast Settings Card */}
              <Card className="border border-white/10 bg-white/5 backdrop-blur-md">
                <CardHeader className="pb-3">
                  <CardTitle className="font-serif text-lg xl:text-xl flex items-center gap-2">
                    <Cast className="w-4 h-4 xl:w-5 xl:h-5 text-primary" />
                    Broadcast Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-black/20 border border-white/10">
                    <div className="min-w-0 flex-1">
                      <Label className="font-semibold text-sm">HLS Streaming</Label>
                      <p className="text-xs text-muted-foreground">
                        Broadcast to unlimited viewers.
                      </p>
                    </div>
                    <Button
                      onClick={toggleHLS}
                      disabled={!isStreaming}
                      size="sm"
                      variant={isHlsEnabled ? "secondary" : "outline"}
                      className={`ml-3 flex-shrink-0 ${
                        isHlsEnabled
                          ? "bg-green-500/10 text-green-400 border-green-500/30"
                          : "bg-white/5"
                      }`}
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
                        <code className="text-xs font-mono text-foreground/80 break-all p-2 bg-black/20 rounded-md border border-border/50 flex-1 min-w-0">
                          {`${typeof window !== 'undefined' ? window.location.origin : ''}/watch?stream=${hlsUrl}`}
                        </code>
                        <Button
                          onClick={() =>
                            copyToClipboard(
                              `${typeof window !== 'undefined' ? window.location.origin : ''}/watch?stream=${hlsUrl}`
                            )
                          }
                          size="icon"
                          variant="ghost"
                          className="flex-shrink-0"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Session Info Card */}
              <Card className="border border-white/10 bg-white/5 backdrop-blur-md">
                <CardHeader className="pb-3">
                  <CardTitle className="font-serif text-lg xl:text-xl flex items-center gap-2">
                    <Settings className="w-4 h-4 xl:w-5 xl:h-5 text-primary" />
                    Session Info
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Label className="font-mono text-xs tracking-wider uppercase text-muted-foreground">
                    Room Code
                  </Label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-sm font-mono text-foreground/80 p-2 xl:p-3 bg-black/20 rounded-md border border-border/50 flex-1 min-w-0 break-all">
                      {roomId}
                    </code>
                    <Button
                      onClick={() => copyToClipboard(roomId)}
                      size="icon"
                      variant="ghost"
                      className="flex-shrink-0"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Share this code for others to join your stream
                  </p>
                </CardContent>
              </Card>
            </div>
          </aside>
        </div>
      </div>
    </TooltipProvider>
  );
}