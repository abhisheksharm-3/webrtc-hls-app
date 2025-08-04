'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { Device } from 'mediasoup-client';

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

  const cleanup = useCallback(() => {
    if (isStreaming) {
      // Stop local tracks
      if (localVideoRef.current?.srcObject) {
        const stream = localVideoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        localVideoRef.current.srcObject = null;
      }
    }
    
    consumers.forEach(consumer => consumer.close());
    sendTransport?.close();
    recvTransport?.close();
    socket?.disconnect();
  }, [isStreaming, consumers, sendTransport, recvTransport, socket]);

  const handleRouterRtpCapabilities = useCallback(async (rtpCapabilities: Record<string, any>) => {
    if (!device) return;
    
    try {
      await device.load({ routerRtpCapabilities: rtpCapabilities });
      console.log('Device loaded with RTP capabilities');
      
      // Create transports
      if (socket) {
        socket.emit('create-transport', { 
          roomId,
          type: 'send' 
        });
        
        socket.emit('create-transport', { 
          roomId,
          type: 'recv' 
        });
      }
    } catch (error) {
      console.error('Error loading device:', error);
      setError('Failed to load media device capabilities');
    }
  }, [device, socket, roomId]);

  const handleTransportCreated = useCallback(async (data: { type: string; transportOptions: Record<string, any> }) => {
    if (!device) return;
    
    try {
      if (data.type === 'send') {
        const transport = device.createSendTransport(data.transportOptions);
        
        transport.on('connect', async ({ dtlsParameters }, callback, errback) => {
          try {
            socket?.emit('connect-transport', {
              transportId: transport.id,
              dtlsParameters
            });
            callback();
          } catch (error) {
            errback(error as Error);
          }
        });

        transport.on('produce', async (parameters, callback, errback) => {
          try {
            socket?.emit('produce', {
              transportId: transport.id,
              kind: parameters.kind,
              rtpParameters: parameters.rtpParameters,
              appData: parameters.appData
            });
          } catch (error) {
            errback(error as Error);
          }
        });

        setSendTransport(transport);
      } else {
        const transport = device.createRecvTransport(data.transportOptions);
        
        transport.on('connect', async ({ dtlsParameters }, callback, errback) => {
          try {
            socket?.emit('connect-transport', {
              transportId: transport.id,
              dtlsParameters
            });
            callback();
          } catch (error) {
            errback(error as Error);
          }
        });

        setRecvTransport(transport);
      }
    } catch (error) {
      console.error('Error creating transport:', error);
      setError('Failed to create media transport');
    }
  }, [device, socket]);

  const handleTransportConnected = useCallback((data: Record<string, any>) => {
    console.log('Transport connected:', data);
  }, []);

  const handleProducerCreated = useCallback((data: Record<string, any>) => {
    console.log('Producer created:', data);
  }, []);

  const handleNewProducer = useCallback(async (data: { producerId: string }) => {
    if (!recvTransport || !socket) return;
    
    try {
      socket.emit('consume', {
        producerId: data.producerId,
        rtpCapabilities: device?.rtpCapabilities
      });
    } catch (error) {
      console.error('Error consuming producer:', error);
    }
  }, [recvTransport, socket, device]);

  const handleProducerClosed = useCallback((data: { producerId: string }) => {
    console.log('Producer closed:', data);
    const consumer = consumers.get(data.producerId);
    if (consumer) {
      consumer.close();
      consumers.delete(data.producerId);
      setConsumers(new Map(consumers));
    }
  }, [consumers]);

  const initializeSocket = useCallback(() => {
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
      const device = new Device();
      setDevice(device);
      
      // Get router RTP capabilities
      newSocket.emit('get-router-rtp-capabilities');
    });

    newSocket.on('participants-list', (participantsList: Participant[]) => {
      setParticipants(participantsList);
    });

    newSocket.on('participant-joined', (participant: Participant) => {
      setParticipants(prev => [...prev, participant]);
    });

    newSocket.on('participant-left', (participantId: string) => {
      setParticipants(prev => prev.filter(p => p.id !== participantId));
      // Clean up consumer for this participant
      const consumer = consumers.get(participantId);
      if (consumer) {
        consumer.close();
        consumers.delete(participantId);
        setConsumers(new Map(consumers));
      }
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

    // Mediasoup events
    newSocket.on('router-rtp-capabilities', handleRouterRtpCapabilities);
    newSocket.on('transport-created', handleTransportCreated);
    newSocket.on('transport-connected', handleTransportConnected);
    newSocket.on('producer-created', handleProducerCreated);
    newSocket.on('new-producer', handleNewProducer);
    newSocket.on('producer-closed', handleProducerClosed);
  }, [roomId, consumers, handleRouterRtpCapabilities, handleTransportCreated, handleTransportConnected, handleProducerCreated, handleNewProducer, handleProducerClosed]);

  useEffect(() => {
    if (!roomId) {
      router.push('/');
      return;
    }

    initializeSocket();
    return () => {
      cleanup();
    };
  }, [roomId, router, initializeSocket, cleanup]);

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

      // Produce video and audio
      if (sendTransport) {
        const videoTrack = stream.getVideoTracks()[0];
        const audioTrack = stream.getAudioTracks()[0];

        if (videoTrack) {
          const videoProducer = await sendTransport.produce({
            track: videoTrack,
            encodings: [
              { maxBitrate: 100000 },
              { maxBitrate: 300000 },
              { maxBitrate: 900000 }
            ],
            codecOptions: {
              videoGoogleStartBitrate: 1000
            }
          });
          
          producers.set('video', videoProducer);
          setProducers(new Map(producers));
        }

        if (audioTrack) {
          const audioProducer = await sendTransport.produce({
            track: audioTrack
          });
          
          producers.set('audio', audioProducer);
          setProducers(new Map(producers));
        }
      }

      setIsStreaming(true);
      socket?.emit('start-streaming', { roomId });
    } catch (error) {
      console.error('Error starting stream:', error);
      setError('Failed to access camera/microphone');
    }
  };

  const stopStreaming = () => {
    // Close all producers
    producers.forEach(producer => producer.close());
    setProducers(new Map());

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
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Room: {roomId}</h1>
              <p className="text-gray-600">
                {isConnected ? '🟢 Connected' : '🔴 Disconnected'} • 
                {participants.length} participant{participants.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={copyRoomLink}
                className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Copy Room Link
              </button>
              {hlsUrl && (
                <button
                  onClick={copyHlsLink}
                  className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Copy Watch Link
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 mx-4 mt-4 rounded">
          {error}
        </div>
      )}

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Main video area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg border shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Your Stream</h2>
                <div className="flex gap-2">
                  {!isStreaming ? (
                    <button
                      onClick={startStreaming}
                      disabled={!isConnected}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      Start Streaming
                    </button>
                  ) : (
                    <button
                      onClick={stopStreaming}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                      Stop Streaming
                    </button>
                  )}
                  <button
                    onClick={toggleHLS}
                    disabled={!isStreaming}
                    className={`px-4 py-2 rounded-md disabled:opacity-50 ${
                      isHlsEnabled
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {isHlsEnabled ? 'Stop HLS' : 'Start HLS'}
                  </button>
                </div>
              </div>
              
              <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
                {!isStreaming && (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <div className="text-center">
                      <div className="text-4xl mb-2">📹</div>
                      <p>Click &quot;Start Streaming&quot; to begin</p>
                    </div>
                  </div>
                )}
              </div>

              {isStreaming && (
                <div className="mt-4 flex gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <span className={mediaDevices.video ? 'text-green-600' : 'text-red-600'}>
                      📹
                    </span>
                    Video: {mediaDevices.video ? 'On' : 'Off'}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={mediaDevices.audio ? 'text-green-600' : 'text-red-600'}>
                      🎤
                    </span>
                    Audio: {mediaDevices.audio ? 'On' : 'Off'}
                  </div>
                  {hlsUrl && (
                    <div className="flex items-center gap-1">
                      <span className="text-green-600">📡</span>
                      HLS: Broadcasting
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Participants */}
            <div className="bg-white rounded-lg border shadow-sm p-4">
              <h3 className="font-semibold mb-3">Participants ({participants.length})</h3>
              <div className="space-y-2">
                {participants.map((participant) => (
                  <div key={participant.id} className="flex items-center gap-2 text-sm">
                    <div className={`w-2 h-2 rounded-full ${
                      participant.isStreaming ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                    <span className="truncate">{participant.userId}</span>
                  </div>
                ))}
                {participants.length === 0 && (
                  <p className="text-gray-500 text-sm">No participants yet</p>
                )}
              </div>
            </div>

            {/* Stream info */}
            <div className="bg-white rounded-lg border shadow-sm p-4">
              <h3 className="font-semibold mb-3">Stream Info</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Room ID:</span>
                  <div className="font-mono text-xs bg-gray-100 p-1 rounded mt-1">
                    {roomId}
                  </div>
                </div>
                {hlsUrl && (
                  <div>
                    <span className="text-gray-600">HLS URL:</span>
                    <div className="font-mono text-xs bg-gray-100 p-1 rounded mt-1 break-all">
                      {hlsUrl}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
