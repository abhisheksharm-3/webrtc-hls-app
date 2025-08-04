'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { Device } from 'mediasoup-client';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Separator } from '../../components/ui/separator';
import { Label } from '../../components/ui/label';
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
  Share,
  AlertCircle,
  Wifi,
  WifiOff
} from 'lucide-react';

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
  const roomId = searchParams.get('room');
  
  const [socket, setSocket] = useState<Socket | null>(null);
  const [device, setDevice] = useState<Device | null>(null);
  const [sendTransport, setSendTransport] = useState<any>(null);
  const [recvTransport, setRecvTransport] = useState<any>(null);
  const [producers, setProducers] = useState<Map<string, any>>(new Map());
  const [consumers, setConsumers] = useState<Map<string, any>>(new Map());
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [mediaDevices, setMediaDevices] = useState<MediaDevices>({ video: false, audio: false });
  const [hlsUrl, setHlsUrl] = useState<string | null>(null);
  const [isHlsEnabled, setIsHlsEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!roomId) {
      router.push('/');
      return;
    }

    console.log('Creating socket connection for room:', roomId);
    const newSocket = io(process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001');
    
    newSocket.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
      setSocket(newSocket);
      
      // Join room
      newSocket.emit('join-room', { roomId });
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });

    newSocket.on('room-joined', (data) => {
      console.log('Joined room:', data);
    });

    newSocket.on('participants-list', (participantsList: Participant[]) => {
      setParticipants(participantsList);
    });

    newSocket.on('participant-joined', (participant: Participant) => {
      setParticipants(prev => [...prev, participant]);
    });

    newSocket.on('participant-left', (participantId: string) => {
      setParticipants(prev => prev.filter(p => p.id !== participantId));
    });

    newSocket.on('streaming-started', (data) => {
      console.log('Streaming started:', data);
    });

    newSocket.on('streaming-stopped', (data) => {
      console.log('Streaming stopped:', data);
    });

    newSocket.on('hls-stream-ready', (data) => {
      console.log('HLS stream ready:', data);
      setHlsUrl(data.hlsUrl);
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
      setError(error.message);
    });

    return () => {
      console.log('Cleaning up socket connection');
      newSocket.disconnect();
      
      // Stop any active media streams
      if (localVideoRef.current?.srcObject) {
        const stream = localVideoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [roomId]);

  const startStreaming = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      setMediaDevices({ video: true, audio: true });
      setIsStreaming(true);
      socket?.emit('start-streaming', { roomId });
    } catch (error) {
      console.error('Error starting stream:', error);
      setError('Failed to access camera/microphone');
    }
  };

  const stopStreaming = () => {
    // Stop local tracks
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      localVideoRef.current.srcObject = null;
    }

    setIsStreaming(false);
    setMediaDevices({ video: false, audio: false });
    socket?.emit('stop-streaming', { roomId });
  };

  const toggleHLS = () => {
    if (isHlsEnabled) {
      socket?.emit('stop-hls', { roomId });
      setIsHlsEnabled(false);
      setHlsUrl(null);
    } else {
      socket?.emit('start-hls', { roomId });
      setIsHlsEnabled(true);
    }
  };

  const copyRoomLink = () => {
    const url = `${window.location.origin}/stream?room=${roomId}`;
    navigator.clipboard.writeText(url);
  };

  const copyHlsLink = () => {
    if (hlsUrl) {
      const watchUrl = `${window.location.origin}/watch?stream=${hlsUrl}`;
      navigator.clipboard.writeText(watchUrl);
    }
  };

  if (!roomId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="glass-effect border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-lg">
                  <Video className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">Room: {roomId}</h1>
                  <div className="flex items-center gap-2 text-sm">
                    {isConnected ? (
                      <Badge variant="outline" className="text-green-600 border-green-200">
                        <Wifi className="w-3 h-3 mr-1" />
                        Connected
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-red-600 border-red-200">
                        <WifiOff className="w-3 h-3 mr-1" />
                        Disconnected
                      </Badge>
                    )}
                    <Badge variant="secondary">
                      <Users className="w-3 h-3 mr-1" />
                      {participants.length} participant{participants.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={copyRoomLink}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Copy Room Link
              </Button>
              <Button
                onClick={() => navigator.clipboard.writeText(roomId || '')}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Share className="w-4 h-4" />
                Copy Room Code
              </Button>
              {hlsUrl && (
                <Button
                  onClick={copyHlsLink}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                >
                  <Share className="w-4 h-4" />
                  Copy Watch Link
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {error && (
        <div className="container mx-auto px-4 pt-4">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="flex items-center gap-3 pt-6">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-700">{error}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Main video area */}
          <div className="lg:col-span-3">
            <Card className="overflow-hidden shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Video className="w-5 h-5 text-primary" />
                    <CardTitle className="text-xl">Your Stream</CardTitle>
                    {isStreaming && (
                      <Badge className="bg-red-500 hover:bg-red-600 animate-pulse">
                        <Radio className="w-3 h-3 mr-1" />
                        LIVE
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {!isStreaming ? (
                      <Button
                        onClick={startStreaming}
                        disabled={!isConnected}
                        className="gradient-primary shadow-glow"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Start Streaming
                      </Button>
                    ) : (
                      <Button
                        onClick={stopStreaming}
                        variant="destructive"
                      >
                        <Square className="w-4 h-4 mr-2" />
                        Stop Streaming
                      </Button>
                    )}
                    <Button
                      onClick={toggleHLS}
                      disabled={!isStreaming}
                      variant={isHlsEnabled ? "default" : "outline"}
                      className={isHlsEnabled ? "bg-green-600 hover:bg-green-700" : ""}
                    >
                      <Radio className="w-4 h-4 mr-2" />
                      {isHlsEnabled ? 'Stop HLS' : 'Start HLS'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-0">
                <div className="aspect-video bg-black rounded-b-lg overflow-hidden relative">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  {!isStreaming && (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted/10 backdrop-blur-sm">
                      <div className="text-center space-y-4">
                        <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                          <Video className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                          <p className="text-lg font-medium text-foreground">Ready to stream</p>
                          <p className="text-sm text-muted-foreground">Click &quot;Start Streaming&quot; to begin</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Stream controls overlay */}
                  {isStreaming && (
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="glass-effect rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              {mediaDevices.video ? (
                                <Video className="w-4 h-4 text-green-400" />
                              ) : (
                                <VideoOff className="w-4 h-4 text-red-400" />
                              )}
                              <span className="text-white">Video: {mediaDevices.video ? 'On' : 'Off'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {mediaDevices.audio ? (
                                <Mic className="w-4 h-4 text-green-400" />
                              ) : (
                                <MicOff className="w-4 h-4 text-red-400" />
                              )}
                              <span className="text-white">Audio: {mediaDevices.audio ? 'On' : 'Off'}</span>
                            </div>
                            {hlsUrl && (
                              <div className="flex items-center gap-2">
                                <Radio className="w-4 h-4 text-green-400 animate-pulse" />
                                <span className="text-white">HLS: Broadcasting</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Participants */}
            <Card className="shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="w-5 h-5 text-primary" />
                  Participants ({participants.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {participants.map((participant) => (
                  <div key={participant.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="text-xs font-medium">
                          {participant.userId.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-foreground truncate max-w-24">
                          {participant.userId}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Joined {new Date(participant.joinedAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    {participant.isStreaming ? (
                      <Badge className="bg-green-500 hover:bg-green-600 text-xs">
                        <Radio className="w-3 h-3 mr-1" />
                        Live
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        Viewer
                      </Badge>
                    )}
                  </div>
                ))}
                {participants.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No participants yet</p>
                    <p className="text-xs mt-1">Share the room link to invite others</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stream info */}
            <Card className="shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Settings className="w-5 h-5 text-primary" />
                  Stream Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Room ID</Label>
                  <div className="mt-1 p-2 bg-muted/50 rounded-md border">
                    <code className="text-sm font-mono text-foreground">{roomId}</code>
                  </div>
                </div>
                
                {hlsUrl && (
                  <>
                    <Separator />
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Radio className="w-4 h-4 text-green-500" />
                        HLS Stream URL
                      </Label>
                      <div className="mt-1 p-2 bg-muted/50 rounded-md border max-h-20 overflow-y-auto">
                        <code className="text-xs font-mono text-foreground break-all">{hlsUrl}</code>
                      </div>
                    </div>
                  </>
                )}
                
                {isStreaming && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Stream Status</Label>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Video</span>
                          <Badge variant={mediaDevices.video ? "default" : "secondary"} className="text-xs">
                            {mediaDevices.video ? (
                              <>
                                <Video className="w-3 h-3 mr-1" />
                                Active
                              </>
                            ) : (
                              <>
                                <VideoOff className="w-3 h-3 mr-1" />
                                Inactive
                              </>
                            )}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Audio</span>
                          <Badge variant={mediaDevices.audio ? "default" : "secondary"} className="text-xs">
                            {mediaDevices.audio ? (
                              <>
                                <Mic className="w-3 h-3 mr-1" />
                                Active
                              </>
                            ) : (
                              <>
                                <MicOff className="w-3 h-3 mr-1" />
                                Inactive
                              </>
                            )}
                          </Badge>
                        </div>
                        {hlsUrl && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">HLS</span>
                            <Badge className="bg-green-500 hover:bg-green-600 text-xs animate-pulse">
                              <Radio className="w-3 h-3 mr-1" />
                              Broadcasting
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
