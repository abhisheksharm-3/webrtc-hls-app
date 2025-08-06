"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { Device } from "mediasoup-client";
import { RtpCapabilities } from "mediasoup-client/lib/RtpParameters";
import { Transport } from "mediasoup-client/lib/Transport";
import { Producer } from "mediasoup-client/lib/Producer";
import { Consumer } from "mediasoup-client/lib/Consumer";

// UI Components (assuming they are correct)
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
  Video, VideoOff, Mic, MicOff, Users, Copy, Play, Square, Radio, Settings,
  AlertCircle, Wifi, WifiOff, LogOut, Cast, Menu, X,
} from "lucide-react";
import Link from "next/link";

// --- Type Definitions ---

interface Participant {
  id: string;      // Socket ID
  isHost: boolean;
  isViewer?: boolean;
  // The server should ideally provide these states based on producer status
  hasVideo: boolean;
  hasAudio: boolean;
  isStreaming: boolean;
}

interface MediaDeviceStatus {
  video: boolean;
  audio: boolean;
}

interface RemoteStream {
  videoTrack?: MediaStreamTrack;
  audioTrack?: MediaStreamTrack;
}

// --- Main Component ---

export default function StreamPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = searchParams.get("room");
  const role = searchParams.get("role") as 'host' | 'guest' | null;

  // --- State ---
  // UI State
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [mediaDeviceStatus, setMediaDeviceStatus] = useState<MediaDeviceStatus>({ video: true, audio: true });
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [hlsUrl, setHlsUrl] = useState<string | null>(null);
  const [isHlsEnabled, setIsHlsEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userRole, setUserRole] = useState<'host' | 'guest' | 'viewer'>('guest');
  
  // Remote media state
  const [remoteStreams, setRemoteStreams] = useState<Map<string, RemoteStream>>(new Map());

  // --- Refs ---
  // Refs are used to hold instances of objects that should not trigger re-renders
  // and to avoid stale closures in event handlers (a common React/Socket.IO issue).
  const socketRef = useRef<Socket | null>(null);
  const deviceRef = useRef<Device | null>(null);
  const sendTransportRef = useRef<Transport | null>(null);
  const recvTransportRef = useRef<Transport | null>(null);
  const producersRef = useRef<Map<string, Producer>>(new Map());
  const consumersRef = useRef<Map<string, Consumer>>(new Map());
  
  // DOM element refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());


  // --- Core Mediasoup & Socket Logic ---

  /**
   * Main setup effect for Socket.IO connection and event listeners.
   * This effect runs only once when the component mounts.
   */
  useEffect(() => {
    if (!roomId) {
      router.push("/");
      return;
    }

    const newSocket = io(process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3001");
    socketRef.current = newSocket;

    // --- Socket Event Listeners ---
    newSocket.on("connect", () => {
      console.log("Socket connected:", newSocket.id);
      setIsConnected(true);
      // Determine role from URL or default to guest
      const joinRole = role || (searchParams.get("host") === "true" ? "host" : "guest");
      newSocket.emit("join-room", { roomId, role: joinRole });
    });

    newSocket.on("disconnect", () => {
      console.log("Socket disconnected");
      setIsConnected(false);
      setError("Connection to server lost. Please refresh.");
      // Full cleanup on disconnect
      stopStreaming();
    });

    newSocket.on("room-joined", async ({ participants: initialParticipants, routerRtpCapabilities, isHost, isViewer, userRole: serverUserRole }: { participants: Participant[], routerRtpCapabilities: RtpCapabilities | null, isHost: boolean, isViewer: boolean, userRole: 'host' | 'guest' | 'viewer' }) => {
      console.log("Room joined successfully. Participants:", initialParticipants);
      setParticipants(initialParticipants || []);
      setUserRole(serverUserRole);
      
      // Only initialize WebRTC for non-viewers
      if (!isViewer && routerRtpCapabilities) {
        try {
          const device = new Device();
          await device.load({ routerRtpCapabilities });
          deviceRef.current = device;
          console.log("Mediasoup device loaded successfully.");
        } catch (err) {
          console.error("Error initializing Mediasoup device:", err);
          setError("Failed to initialize WebRTC device.");
        }
      }
    });

    newSocket.on("participant-joined", (participant: Participant) => {
      console.log("Participant joined:", participant);
      setParticipants((prev) => [...prev, participant]);
    });

    newSocket.on("participant-left", ({ participantId }: { participantId: string }) => {
      console.log("Participant left:", participantId);
      setParticipants((prev) => prev.filter((p) => p.id !== participantId));
      
      // Clean up remote streams and refs for the left participant
      setRemoteStreams(prev => {
        const newMap = new Map(prev);
        newMap.delete(participantId);
        return newMap;
      });
      remoteVideoRefs.current.delete(participantId);
    });

    newSocket.on("new-producer", async ({ producerId, participantId }: { producerId: string, participantId: string }) => {
      console.log(`New producer found from ${participantId}. Consuming...`);
      await consumeRemoteProducer(producerId, participantId);
    });

    newSocket.on("producer-closed", ({ producerId }: { producerId: string }) => {
      console.log("Producer closed:", producerId);
      const consumer = Array.from(consumersRef.current.values()).find(c => c.producerId === producerId);
      if (consumer) {
        consumer.close();
        consumersRef.current.delete(consumer.id);
        // Here you might want to update the remoteStreams map to remove the track
      }
    });
    
    // HLS and error listeners
    newSocket.on("hls-stream-ready", (data) => setHlsUrl(data.hlsUrl));
    newSocket.on("error", (err: Error) => setError(err.message || "An unknown error occurred."));

    // --- Cleanup Function ---
    return () => {
      console.log("Cleaning up StreamPage component.");
      if (localVideoRef.current?.srcObject) {
        (localVideoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
      socketRef.current?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, router]); // This should only run once

  /**
   * Effect to manage and update remote video elements when streams change.
   * This separates the imperative DOM manipulation from the state logic.
   */
  useEffect(() => {
    remoteStreams.forEach((stream, participantId) => {
      const videoEl = remoteVideoRefs.current.get(participantId);
      if (videoEl) {
        const mediaStream = new MediaStream();
        if (stream.videoTrack) mediaStream.addTrack(stream.videoTrack);
        if (stream.audioTrack) mediaStream.addTrack(stream.audioTrack);
        
        videoEl.srcObject = mediaStream;
        videoEl.play().catch(e => console.error("Error playing remote video:", e));
      }
    });
  }, [remoteStreams]);


  /**
   * Creates a WebRTC transport (send or recv) with the server.
   * Encapsulates the request/response logic with the server.
   */
  const createTransport = useCallback(async (direction: 'send' | 'recv') => {
    const socket = socketRef.current;
    const device = deviceRef.current;
    if (!socket || !device) {
      throw new Error("Socket or Device not initialized.");
    }
    
    console.log(`Creating ${direction} transport...`);
    // Ask server to create a transport
    const params = await new Promise<any>((resolve, reject) => {
        socket.emit('create-transport', { direction }, (response: any) => {
            if (response.error) {
                reject(new Error(response.error));
            } else {
                resolve(response);
            }
        });
    });

    // Create the transport instance on the client side
    const transport = direction === 'send'
      ? device.createSendTransport(params)
      : device.createRecvTransport(params);

    // --- Transport Event Listeners ---
    transport.on('connect', ({ dtlsParameters }, callback, errback) => {
      console.log(`Transport ${direction} connecting...`);
      socket.emit('connect-transport', { transportId: transport.id, dtlsParameters }, (response: any) => {
        if (response.error) {
          errback(new Error(response.error));
        } else {
          console.log(`Transport ${direction} connected.`);
          callback();
        }
      });
    });
    
    if (direction === 'send') {
      transport.on('produce', async ({ kind, rtpParameters, appData }, callback, errback) => {
        console.log(`Producing ${kind}...`);
        socket.emit('produce', { transportId: transport.id, kind, rtpParameters }, ({ producerId, error }: { producerId?: string, error?: string }) => {
          if (error) {
            errback(new Error(error));
            return;
          }
          console.log(`${kind} produced successfully with id: ${producerId}`);
          callback({ id: producerId! });
        });
      });
    }

    transport.on('connectionstatechange', (state) => {
        console.log(`Transport ${direction} connection state: ${state}`);
        if (state === 'failed' || state === 'closed') {
            setError(`${direction === 'send' ? 'Upload' : 'Download'} connection failed. Try reconnecting.`);
        }
    });

    return transport;
  }, []);

  /**
   * Starts the local media stream and begins producing to the server.
   */
  const startStreaming = async () => {
    if (!deviceRef.current || !socketRef.current) {
        setError("Cannot start stream: connection not ready.");
        return;
    }
    setError(null);

    try {
        // 1. Get User Media
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
            audio: { echoCancellation: true, noiseSuppression: true },
        });

        if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
            await localVideoRef.current.play();
        }

        // 2. Create Transports
        sendTransportRef.current = await createTransport('send');
        recvTransportRef.current = await createTransport('recv');

        // 3. Start Producing
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
            const videoProducer = await sendTransportRef.current.produce({ track: videoTrack });
            producersRef.current.set(videoProducer.id, videoProducer);
        }

        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack) {
            const audioProducer = await sendTransportRef.current.produce({ track: audioTrack });
            producersRef.current.set(audioProducer.id, audioProducer);
        }

        setIsStreaming(true);
        socketRef.current.emit("start-streaming", { roomId });
        console.log("Streaming started successfully.");

    } catch (err: any) {
        console.error("Error starting stream:", err);
        setError("Failed to access camera/microphone. Please check browser permissions.");
        stopStreaming(); // Cleanup on failure
    }
  };

  /**
   * Consumes a producer from a remote participant.
   */
  const consumeRemoteProducer = useCallback(async (producerId: string, participantId: string) => {
    const socket = socketRef.current;
    const device = deviceRef.current;
    const transport = recvTransportRef.current;

    if (!socket || !device || !transport) {
      console.warn("Cannot consume, connection components not ready.");
      return;
    }
    
    // Ask server to create a consumer for us
    const params = await new Promise<any>((resolve, reject) => {
      socket.emit('consume', {
          transportId: transport.id,
          producerId,
          rtpCapabilities: device.rtpCapabilities
      }, (response: any) => {
          if (response.error) reject(new Error(response.error));
          else resolve(response);
      });
    });

    // Create the consumer on the client side
    const consumer = await transport.consume(params);
    consumersRef.current.set(consumer.id, consumer);

    // Update state with the new track
    setRemoteStreams(prev => {
      const newMap = new Map(prev);
      const existingStream = newMap.get(participantId) || {};
      const updatedStream = { ...existingStream };

      if (consumer.kind === 'video') {
        updatedStream.videoTrack = consumer.track;
      } else {
        updatedStream.audioTrack = consumer.track;
      }

      newMap.set(participantId, updatedStream);
      return newMap;
    });

    // Important: resume the consumer on the server
    socket.emit('resume-consumer', { consumerId: consumer.id });
    console.log(`Consumed and resumed ${consumer.kind} from ${participantId}`);
  }, []);

  /**
   * Stops the stream and cleans up all WebRTC resources.
   */
  const stopStreaming = () => {
    setError(null);
    console.log("Stopping stream and cleaning up resources...");

    // Close all producers
    producersRef.current.forEach(producer => producer.close());
    producersRef.current.clear();

    // Close all transports
    sendTransportRef.current?.close();
    sendTransportRef.current = null;
    recvTransportRef.current?.close();
    recvTransportRef.current = null;

    // Stop local media tracks
    if (localVideoRef.current?.srcObject) {
      (localVideoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      localVideoRef.current.srcObject = null;
    }

    // Reset UI state
    setIsStreaming(false);
    setMediaDeviceStatus({ video: true, audio: true });
    socketRef.current?.emit("stop-streaming", { roomId });
  };
  
  /**
   * Toggles the enabled state of local video or audio tracks.
   */
  const toggleMedia = (type: "video" | "audio") => {
    const producer = Array.from(producersRef.current.values()).find(p => p.kind === type);
    if (!producer) return;

    const newStatus = !mediaDeviceStatus[type];
    if (newStatus) {
      producer.resume();
      socketRef.current?.emit('resume-producer', { producerId: producer.id });
    } else {
      producer.pause();
      socketRef.current?.emit('pause-producer', { producerId: producer.id });
    }
    
    // Also update the local track enabled state for immediate visual feedback
    const stream = localVideoRef.current?.srcObject as MediaStream;
    const track = type === 'video' ? stream?.getVideoTracks()[0] : stream?.getAudioTracks()[0];
    if(track) track.enabled = newStatus;
    
    setMediaDeviceStatus(prev => ({ ...prev, [type]: newStatus }));
  };
  
  const toggleHLS = () => {
    const newHlsState = !isHlsEnabled;
    socketRef.current?.emit(newHlsState ? "start-hls" : "stop-hls", { roomId });
    setIsHlsEnabled(newHlsState);
    if (!newHlsState) setHlsUrl(null);
  };

  const copyToClipboard = (text: string) => navigator.clipboard.writeText(text);

  // --- Render Logic ---
  if (!roomId) return null; // Or a loading/error state
  
  const isGuestPresent = participants.length > 1;
  const selfId = socketRef.current?.id;
  const remoteParticipants = participants.filter(p => p.id !== selfId);

  const renderPreStreamOverlay = () => (
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
          : !isGuestPresent
            ? "You're all set! Start your stream whenever you're ready."
            : "Your guest has arrived. Go live together!"}
      </p>
      <Button
        onClick={startStreaming}
        disabled={!isConnected || !deviceRef.current}
        size="lg"
        className="h-12 md:h-14 px-6 md:px-8 text-sm md:text-lg font-semibold group cursor-pointer transition-all duration-300 ease-in-out bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 shadow-[0_0_20px_theme(colors.primary/30%)] hover:shadow-[0_0_40px_theme(colors.primary/50%)]"
      >
        <Play className="w-5 h-5 md:w-6 md:h-6 mr-2 md:mr-3 transition-transform duration-300 group-hover:scale-110" />
        {isGuestPresent ? "Go Live Together" : "Start Stream"}
      </Button>
    </div>
  );

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
                <div className="font-serif text-lg md:text-xl font-bold tracking-tight">Streamify</div>
                <p className="text-xs text-muted-foreground hidden md:block">Stream Dashboard</p>
              </div>
            </Link>
            <div className="flex items-center gap-2">
              <Badge variant={isConnected ? "default" : "destructive"} className={`text-xs ${isConnected ? "bg-green-500/10 text-green-400 border-green-500/30" : ""}`}>
                {isConnected ? <Wifi className="w-3 h-3 mr-1" /> : <WifiOff className="w-3 h-3 mr-1" />}
                <span className="hidden sm:inline">{isConnected ? "Connected" : "Disconnected"}</span>
              </Badge>
              <Button onClick={() => router.push("/")} variant="outline" size="sm" className="bg-white/5 border-white/10 hover:bg-white/10 text-xs">
                <LogOut className="w-4 h-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Leave</span>
              </Button>
              <Button onClick={() => setSidebarOpen(!sidebarOpen)} variant="ghost" size="sm" className="xl:hidden">
                {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </header>

        {/* Main Layout */}
        <div className="flex h-[calc(100vh-3.5rem)] md:h-[calc(100vh-4rem)]">
          {/* Video Stage */}
          <main className="flex-1 flex flex-col overflow-hidden">
            {error && (
              <div className="mx-4 my-2 p-3 rounded-lg border-destructive/30 bg-destructive/10 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                <p className="text-sm font-medium text-destructive">{error}</p>
              </div>
            )}

            <div className="flex-1 p-2 md:p-4 xl:p-6 relative">
              {isStreaming && remoteParticipants.length > 0 ? (
                // --- Active Streaming Grid View (Host + Guest) ---
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                  <div className="relative w-full h-full overflow-hidden rounded-xl md:rounded-2xl bg-black border border-white/10 shadow-2xl shadow-primary/10">
                    <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-blue-500/90 border border-blue-400/50 text-white text-xs">You (Host)</Badge>
                    </div>
                  </div>
                  {remoteParticipants.slice(0, 1).map((p) => (
                    <div key={p.id} className="relative w-full h-full overflow-hidden rounded-xl md:rounded-2xl bg-black border border-white/10 shadow-2xl shadow-primary/10">
                      <video
                        ref={(el) => { if (el) remoteVideoRefs.current.set(p.id, el); }}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-green-500/90 border border-green-400/50 text-white text-xs">Guest</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // --- Single Video View (Lobby or Host-only stream) ---
                <div className="relative w-full h-full max-w-none mx-auto overflow-hidden rounded-xl md:rounded-2xl bg-black border border-white/10 shadow-2xl shadow-primary/10">
                  <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                  {!isStreaming && renderPreStreamOverlay()}
                </div>
              )}
              
              {/* --- Floating Live Indicator & Controls --- */}
              {isStreaming && (
                <>
                  <div className="absolute top-6 md:top-8 left-6 md:left-10 z-10">
                    <Badge className="bg-red-500/90 border border-red-400/50 text-white animate-pulse shadow-lg text-xs">
                      <Radio className="w-3 h-3 mr-1" /> LIVE
                    </Badge>
                  </div>
                  <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 w-auto z-10">
                    <div className="flex items-center gap-2 md:gap-3 rounded-xl md:rounded-2xl p-2 md:p-3 bg-black/40 border border-white/10 backdrop-blur-md shadow-2xl">
                      <Tooltip>
                        <TooltipTrigger asChild><Button onClick={() => toggleMedia("video")} size="icon" variant={mediaDeviceStatus.video ? "secondary" : "destructive"} className="h-10 w-10 md:h-12 md:w-12 rounded-lg">{mediaDeviceStatus.video ? <Video className="w-4 h-4 md:w-5 md:h-5" /> : <VideoOff className="w-4 h-4 md:w-5 md:h-5" />}</Button></TooltipTrigger>
                        <TooltipContent><p>{mediaDeviceStatus.video ? "Turn off camera" : "Turn on camera"}</p></TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild><Button onClick={() => toggleMedia("audio")} size="icon" variant={mediaDeviceStatus.audio ? "secondary" : "destructive"} className="h-10 w-10 md:h-12 md:w-12 rounded-lg">{mediaDeviceStatus.audio ? <Mic className="w-4 h-4 md:w-5 md:h-5" /> : <MicOff className="w-4 h-4 md:w-5 md:h-5" />}</Button></TooltipTrigger>
                        <TooltipContent><p>{mediaDeviceStatus.audio ? "Mute microphone" : "Unmute microphone"}</p></TooltipContent>
                      </Tooltip>
                      <div className="w-px h-6 md:h-8 bg-white/20 mx-1 md:mx-2"></div>
                      <Tooltip>
                        <TooltipTrigger asChild><Button onClick={stopStreaming} variant="destructive" className="h-10 w-20 md:h-12 md:w-28 rounded-lg text-sm md:text-base"><Square className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" />End</Button></TooltipTrigger>
                        <TooltipContent><p>End the stream for everyone</p></TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </>
              )}
            </div>
          </main>

          {/* Sidebar */}
          <aside className={`${sidebarOpen ? "translate-x-0" : "translate-x-full"} xl:translate-x-0 fixed xl:relative inset-y-0 right-0 z-40 w-80 xl:w-96 bg-background/95 xl:bg-transparent backdrop-blur-xl xl:backdrop-blur-none border-l xl:border-l-0 border-border/20 transition-transform duration-300 ease-in-out flex flex-col`}>
             {sidebarOpen && <div className="xl:hidden fixed inset-0 bg-black/50 z-30" onClick={() => setSidebarOpen(false)} />}
            <div className="flex-1 overflow-y-auto p-4 xl:p-6 space-y-4 xl:space-y-6">
                
                {/* --- Participants Card --- */}
                <Card className="border border-white/10 bg-white/5 backdrop-blur-md">
                    <CardHeader className="pb-3"><CardTitle className="font-serif text-lg xl:text-xl flex items-center gap-2"><Users className="w-4 h-4 xl:w-5 xl:h-5 text-primary" />Participants ({participants.length}/2)</CardTitle></CardHeader>
                    <CardContent className="max-h-60 xl:max-h-80 overflow-y-auto space-y-2">
                        {participants.length > 0 ? (
                            participants.map((p) => (
                                <div key={p.id} className="flex items-center justify-between p-2 xl:p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                                    <div className="flex items-center gap-2 xl:gap-3 min-w-0 flex-1">
                                        <Avatar className="w-8 h-8 xl:w-9 xl:h-9 border border-border/50 flex-shrink-0">
                                            <AvatarFallback className="text-xs">{p.id === selfId ? "You" : "G"}</AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-semibold text-foreground font-mono truncate">{p.id === selfId ? "You (Host)" : "Guest"}</p>
                                        </div>
                                    </div>
                                    {p.isStreaming && <Badge className="bg-green-500/80 border border-green-400/50 text-white text-xs shadow flex-shrink-0 ml-2"><Radio className="w-3 h-3 mr-1" />Live</Badge>}
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-6 xl:py-8 text-muted-foreground">
                                <Users className="w-6 h-6 xl:w-8 xl:h-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm font-semibold">Waiting for participants...</p>
                            </div>
                        )}
                        {participants.length === 1 && (
                          <div className="text-center py-4 text-muted-foreground border-t border-white/10"><p className="text-xs">Share the room code below for a guest to join</p></div>
                        )}
                    </CardContent>
                </Card>

                {/* --- Broadcast Settings Card --- */}
                <Card className="border border-white/10 bg-white/5 backdrop-blur-md">
                    <CardHeader className="pb-3"><CardTitle className="font-serif text-lg xl:text-xl flex items-center gap-2"><Cast className="w-4 h-4 xl:w-5 xl:h-5 text-primary" />Broadcast Settings</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-black/20 border border-white/10">
                            <div className="min-w-0 flex-1">
                                <Label className="font-semibold text-sm">HLS Streaming</Label>
                                <p className="text-xs text-muted-foreground">Broadcast to unlimited viewers.</p>
                            </div>
                            <Button onClick={toggleHLS} disabled={!isStreaming} size="sm" variant={isHlsEnabled ? "secondary" : "outline"} className={`ml-3 flex-shrink-0 ${isHlsEnabled ? "bg-green-500/10 text-green-400 border-green-500/30" : "bg-white/5"}`}>{isHlsEnabled ? "Active" : "Enable"}</Button>
                        </div>
                        {hlsUrl && (
                            <div className="space-y-2">
                                <Label className="font-mono text-xs tracking-wider uppercase text-muted-foreground">HLS Watch Link</Label>
                                <div className="flex items-center gap-2">
                                    <code className="text-xs font-mono text-foreground/80 break-all p-2 bg-black/20 rounded-md border border-border/50 flex-1 min-w-0">{`${window.location.origin}/watch?stream=${hlsUrl}`}</code>
                                    <Button onClick={() => copyToClipboard(`${window.location.origin}/watch?stream=${hlsUrl}`)} size="icon" variant="ghost" className="flex-shrink-0"><Copy className="w-4 h-4" /></Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
                
                {/* --- Session Info Card --- */}
                <Card className="border border-white/10 bg-white/5 backdrop-blur-md">
                    <CardHeader className="pb-3"><CardTitle className="font-serif text-lg xl:text-xl flex items-center gap-2"><Settings className="w-4 h-4 xl:w-5 xl:h-5 text-primary" />Session Info</CardTitle></CardHeader>
                    <CardContent>
                        <Label className="font-mono text-xs tracking-wider uppercase text-muted-foreground">Room Code</Label>
                        <div className="flex items-center gap-2 mt-1">
                            <code className="text-sm font-mono text-foreground/80 p-2 xl:p-3 bg-black/20 rounded-md border border-border/50 flex-1 min-w-0 break-all">{roomId}</code>
                            <Button onClick={() => copyToClipboard(roomId)} size="icon" variant="ghost" className="flex-shrink-0"><Copy className="w-4 h-4" /></Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">Share this code for others to join your stream</p>
                    </CardContent>
                </Card>

            </div>
          </aside>
        </div>
      </div>
    </TooltipProvider>
  );
}