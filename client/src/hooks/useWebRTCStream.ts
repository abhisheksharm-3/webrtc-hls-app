import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { Device } from "mediasoup-client";
import { 
  Consumer, 
  Producer, 
  RtpCapabilities, 
  Transport,
  TransportOptions,
  IceParameters,
  DtlsParameters,
  ProducerOptions,
  ConsumerOptions,
  RtpParameters,
  SctpParameters,
  IceCandidate
} from "mediasoup-client/types";
import { 
  Participant, 
  MediaDeviceStatus, 
  RemoteStream, 
} from "@/lib/types/stream-types";

// Enhanced types for better type safety
interface SocketResponse<T = unknown> {
  error?: string;
  data?: T;
}

interface CreateTransportResponse {
  id: string;
  iceParameters: IceParameters;
  iceCandidates: IceCandidate[];
  dtlsParameters: DtlsParameters;
  sctpParameters?: SctpParameters;
}

interface ConsumeResponse {
  id: string;
  producerId: string;
  kind: 'audio' | 'video';
  rtpParameters: RtpParameters;
  type: string;
  producerPaused: boolean;
}

interface ProduceResponse {
  producerId: string;
}

// Custom error class for better error handling
class WebRTCError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'WebRTCError';
  }
}

// Constants for better maintainability
const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  JOIN_ROOM: 'join-room',
  ROOM_JOINED: 'room-joined',
  PARTICIPANT_JOINED: 'participant-joined',
  PARTICIPANT_LEFT: 'participant-left',
  NEW_PRODUCER: 'new-producer',
  PRODUCER_CLOSED: 'producer-closed',
  HLS_STREAM_READY: 'hls-stream-ready',
  ERROR: 'error',
  CREATE_TRANSPORT: 'create-transport',
  CONNECT_TRANSPORT: 'connect-transport',
  PRODUCE: 'produce',
  CONSUME: 'consume',
  RESUME_CONSUMER: 'resume-consumer',
  START_STREAMING: 'start-streaming',
  STOP_STREAMING: 'stop-streaming',
  START_HLS: 'start-hls',
  STOP_HLS: 'stop-hls',
  PAUSE_PRODUCER: 'pause-producer',
  RESUME_PRODUCER: 'resume-producer'
} as const;

const MEDIA_CONSTRAINTS = {
  video: { 
    width: { ideal: 1280, max: 1920 }, 
    height: { ideal: 720, max: 1080 },
    frameRate: { ideal: 30, max: 60 }
  },
  audio: { 
    echoCancellation: true, 
    noiseSuppression: true,
    autoGainControl: true
  }
} as const;

export const useWebRTCStream = (roomId: string, role: string | null) => {
  const router = useRouter();

  // State with better initial values
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [mediaDeviceStatus, setMediaDeviceStatus] = useState<MediaDeviceStatus>({ 
    video: true, 
    audio: true 
  });
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, RemoteStream>>(new Map());
  const [hlsUrl, setHlsUrl] = useState<string | null>(null);
  const [isHlsEnabled, setIsHlsEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'host' | 'guest' | 'viewer'>('guest');
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'failed' | 'closed'>('connecting');

  // Refs with better typing
  const socketRef = useRef<Socket | null>(null);
  const deviceRef = useRef<Device | null>(null);
  const sendTransportRef = useRef<Transport | null>(null);
  const recvTransportRef = useRef<Transport | null>(null);
  const producersRef = useRef<Map<string, Producer>>(new Map());
  const consumersRef = useRef<Map<string, Consumer>>(new Map());
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const cleanupTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  // Memoized values for performance
  const serverUrl = useMemo(() => 
    process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3001", 
    []
  );

  const socketConfig = useMemo(() => ({
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 20000,
  }), []);

  // Enhanced error handling
  const handleError = useCallback((error: Error | string, context?: string) => {
    const errorMessage = error instanceof Error ? error.message : error;
    const contextMessage = context ? `${context}: ${errorMessage}` : errorMessage;
    
    console.error('WebRTC Error:', contextMessage);
    setError(contextMessage);
    
    // Optional: Send error to monitoring service
    // sendErrorToMonitoring(contextMessage);
  }, []);

  // Improved socket response handler with proper typing
  const createSocketPromise = useCallback(<T extends object>(
    event: string, 
    data: Record<string, unknown>
  ): Promise<T> => {
    return new Promise((resolve, reject) => {
      const socket = socketRef.current;
      if (!socket) {
        reject(new WebRTCError('Socket not connected'));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new WebRTCError(`Socket timeout for event: ${event}`));
      }, 10000);

      socket.emit(event, data, (response: SocketResponse<T> | T) => {
        clearTimeout(timeout);
        
        if (response && typeof response === 'object' && response !== null && 'error' in response && response.error) {
          reject(new WebRTCError(response.error));
        } else {
          const result = response && typeof response === 'object' && 'data' in response ? response.data! : response as T;
          resolve(result);
        }
      });
    });
  }, []);

  // Enhanced transport creation with proper error handling
  const createTransport = useCallback(async (direction: 'send' | 'recv'): Promise<Transport> => {
    const device = deviceRef.current;
    if (!device) {
      throw new WebRTCError("Device not initialized");
    }

    try {
      const params = await createSocketPromise<CreateTransportResponse>(
        SOCKET_EVENTS.CREATE_TRANSPORT, 
        { direction }
      );

      const transportOptions: TransportOptions = {
        id: params.id,
        iceParameters: params.iceParameters,
        iceCandidates: params.iceCandidates,
        dtlsParameters: params.dtlsParameters,
        ...(params.sctpParameters && { sctpParameters: params.sctpParameters })
      };

      const transport = direction === 'send'
        ? device.createSendTransport(transportOptions)
        : device.createRecvTransport(transportOptions);

      // Enhanced transport event handling
      transport.on('connect', async ({ dtlsParameters }, callback, errback) => {
        try {
          await createSocketPromise(SOCKET_EVENTS.CONNECT_TRANSPORT, {
            transportId: transport.id,
            dtlsParameters
          });
          callback();
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          errback(err);
        }
      });

      transport.on('connectionstatechange', (state) => {
        console.log(`Transport ${direction} state: ${state}`);
        if (state === 'failed' || state === 'closed') {
          handleError(`Transport ${direction} ${state}`, 'Transport Connection');
        }
      });

      if (direction === 'send') {
        transport.on('produce', async ({ kind, rtpParameters }, callback, errback) => {
          try {
            const response = await createSocketPromise<ProduceResponse>(
              SOCKET_EVENTS.PRODUCE,
              { transportId: transport.id, kind, rtpParameters }
            );
            callback({ id: response.producerId });
          } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            errback(err);
          }
        });
      }

      return transport;
    } catch (error) {
      throw new WebRTCError(
        `Failed to create ${direction} transport: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }, [createSocketPromise, handleError]);

  // Enhanced remote producer consumption
  const consumeRemoteProducer = useCallback(async ({ 
    producerId, 
    participantId 
  }: { 
    producerId: string; 
    participantId: string; 
  }) => {
    const device = deviceRef.current;
    if (!device) {
      console.warn('Device not ready for consuming');
      return;
    }

    try {
      // Ensure receive transport exists
      if (!recvTransportRef.current) {
        recvTransportRef.current = await createTransport('recv');
      }

      const transport = recvTransportRef.current;
      
      const consumerParams = await createSocketPromise<ConsumeResponse>(
        SOCKET_EVENTS.CONSUME,
        {
          transportId: transport.id,
          producerId,
          rtpCapabilities: device.rtpCapabilities
        }
      );

      const consumerOptions: ConsumerOptions = {
        id: consumerParams.id,
        producerId: consumerParams.producerId,
        kind: consumerParams.kind,
        rtpParameters: consumerParams.rtpParameters,
        appData: { participantId, producerId }
      };

      const consumer = await transport.consume(consumerOptions);
      consumersRef.current.set(consumer.id, consumer);

      // Update remote streams state
      setRemoteStreams(prev => {
        const newMap = new Map(prev);
        const existingStream = newMap.get(participantId) || {};
        const trackKey = consumer.kind === 'video' ? 'videoTrack' : 'audioTrack';
        const updatedStream = { ...existingStream, [trackKey]: consumer.track };
        newMap.set(participantId, updatedStream);
        return newMap;
      });

      // Resume consumer
      await createSocketPromise(SOCKET_EVENTS.RESUME_CONSUMER, {
        consumerId: consumer.id
      });

      console.log(`Successfully consumed ${consumer.kind} from participant ${participantId}`);
    } catch (error) {
      handleError(error as Error, 'Consume Remote Producer');
    }
  }, [createTransport, createSocketPromise, handleError]);

  // Enhanced cleanup function
  const cleanupWebRTC = useCallback(() => {
    console.log("Cleaning up WebRTC resources...");
    
    // Clear any pending timeouts
    if (cleanupTimeoutRef.current) {
      clearTimeout(cleanupTimeoutRef.current);
    }

    // Close all producers
    producersRef.current.forEach((producer) => {
      try {
        producer.close();
      } catch (error) {
        console.warn('Error closing producer:', error);
      }
    });
    producersRef.current.clear();

    // Close all consumers
    consumersRef.current.forEach((consumer) => {
      try {
        consumer.close();
      } catch (error) {
        console.warn('Error closing consumer:', error);
      }
    });
    consumersRef.current.clear();

    // Close transports
    try {
      sendTransportRef.current?.close();
      sendTransportRef.current = null;
      recvTransportRef.current?.close();
      recvTransportRef.current = null;
    } catch (error) {
      console.warn('Error closing transports:', error);
    }

    // Stop local media tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (error) {
          console.warn('Error stopping track:', error);
        }
      });
      localStreamRef.current = null;
    }

    // Clear video elements
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }

    // Reset state
    setIsStreaming(false);
    setMediaDeviceStatus({ video: true, audio: true });
    setRemoteStreams(new Map());
    setConnectionState('closed');
  }, []);

  // Main setup effect with improved error handling
  useEffect(() => {
    if (!roomId) return;

    let isMounted = true;
    const currentLocalVideo = localVideoRef.current;

    const initializeConnection = async () => {
      try {
        const socket = io(serverUrl, socketConfig);
        socketRef.current = socket;

        // Socket event handlers
        const handleConnect = () => {
          if (!isMounted) return;
          console.log("Socket connected:", socket.id);
          setIsConnected(true);
          setConnectionState('connected');
          setError(null);
          reconnectAttemptsRef.current = 0;
          
          const joinRole = role || 'guest';
          socket.emit(SOCKET_EVENTS.JOIN_ROOM, { roomId, role: joinRole });
        };

        const handleDisconnect = () => {
          if (!isMounted) return;
          console.log("Socket disconnected");
          setIsConnected(false);
          setConnectionState('closed');
          
          // Don't immediately show error - might be intentional disconnect
          cleanupTimeoutRef.current = setTimeout(() => {
            if (isMounted) {
              setError("Connection to server lost. Please refresh.");
            }
          }, 2000);
        };

        const handleReconnect = () => {
          if (!isMounted) return;
          console.log("Socket reconnected");
          setError(null);
          reconnectAttemptsRef.current = 0;
        };

        const handleRoomJoined = async (data: {
          participants: Participant[];
          routerRtpCapabilities: RtpCapabilities;
          isViewer: boolean;
          userRole: 'host' | 'guest' | 'viewer';
        }) => {
          if (!isMounted) return;
          
          console.log("Room joined. Participants:", data.participants);
          setParticipants(data.participants || []);
          setUserRole(data.userRole);

          if (!data.isViewer && data.routerRtpCapabilities) {
            try {
              const device = new Device();
              await device.load({ routerRtpCapabilities: data.routerRtpCapabilities });
              deviceRef.current = device;
              console.log("Mediasoup device loaded successfully");
            } catch (err) {
              handleError(err as Error, "Device Initialization");
            }
          }
        };

        const handleParticipantLeft = ({ participantId }: { participantId: string }) => {
          if (!isMounted) return;
          
          console.log("Participant left:", participantId);
          setParticipants((prev) => prev.filter((p) => p.id !== participantId));
          setRemoteStreams(prev => {
            const newMap = new Map(prev);
            newMap.delete(participantId);
            return newMap;
          });
          remoteVideoRefs.current.delete(participantId);
        };

        const handleProducerClosed = ({ producerId }: { producerId: string }) => {
          if (!isMounted) return;
          
          console.log("Remote producer closed:", producerId);
          
          // Find and close the corresponding consumer
          const consumerEntry = Array.from(consumersRef.current.entries()).find(
            ([, consumer]) => consumer.producerId === producerId
          );

          if (consumerEntry) {
            const [consumerId, consumer] = consumerEntry;
            const participantId = consumer.appData?.participantId as string;

            try {
              consumer.close();
              consumersRef.current.delete(consumerId);

              // Update remote streams
              if (participantId) {
                setRemoteStreams(prev => {
                  const newMap = new Map(prev);
                  const stream = newMap.get(participantId);
                  if (stream) {
                    const updatedStream = { ...stream };
                    const trackKey = consumer.kind === 'video' ? 'videoTrack' : 'audioTrack';
                    delete updatedStream[trackKey];
                    
                    if (Object.keys(updatedStream).length === 0) {
                      newMap.delete(participantId);
                    } else {
                      newMap.set(participantId, updatedStream);
                    }
                  }
                  return newMap;
                });
              }
            } catch (error) {
              console.warn('Error handling producer closure:', error);
            }
          }
        };

        // Register all socket listeners
        socket.on(SOCKET_EVENTS.CONNECT, handleConnect);
        socket.on(SOCKET_EVENTS.DISCONNECT, handleDisconnect);
        socket.on('reconnect', handleReconnect);
        socket.on(SOCKET_EVENTS.ROOM_JOINED, handleRoomJoined);
        socket.on(SOCKET_EVENTS.PARTICIPANT_JOINED, (p: Participant) => {
          if (isMounted) setParticipants(prev => [...prev, p]);
        });
        socket.on(SOCKET_EVENTS.PARTICIPANT_LEFT, handleParticipantLeft);
        socket.on(SOCKET_EVENTS.NEW_PRODUCER, consumeRemoteProducer);
        socket.on(SOCKET_EVENTS.PRODUCER_CLOSED, handleProducerClosed);
        socket.on(SOCKET_EVENTS.HLS_STREAM_READY, (data: { hlsUrl: string }) => {
          if (isMounted) setHlsUrl(data.hlsUrl);
        });
        socket.on(SOCKET_EVENTS.ERROR, (err: Error) => {
          if (isMounted) handleError(err, 'Socket Error');
        });

      } catch (error) {
        if (isMounted) {
          handleError(error as Error, 'Connection Initialization');
        }
      }
    };

    initializeConnection();

    // Cleanup function
    return () => {
      isMounted = false;
      
      if (cleanupTimeoutRef.current) {
        clearTimeout(cleanupTimeoutRef.current);
      }

      // Stop local media tracks
      if (currentLocalVideo?.srcObject) {
        const stream = currentLocalVideo.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }

      // Disconnect socket
      socketRef.current?.disconnect();
      
      // Clean up WebRTC resources
      cleanupWebRTC();
    };
  }, [roomId, role, serverUrl, socketConfig, consumeRemoteProducer, handleError, cleanupWebRTC]);

  // Effect to manage remote video elements - optimized with dependency array
  useEffect(() => {
    const updateRemoteVideos = () => {
      remoteStreams.forEach((stream, participantId) => {
        const videoEl = remoteVideoRefs.current.get(participantId);
        if (videoEl) {
          const mediaStream = new MediaStream();
          if (stream.videoTrack) mediaStream.addTrack(stream.videoTrack);
          if (stream.audioTrack) mediaStream.addTrack(stream.audioTrack);
          
          videoEl.srcObject = mediaStream;
          videoEl.play().catch(e => 
            console.warn(`Error playing remote video for ${participantId}:`, e)
          );
        }
      });
    };

    updateRemoteVideos();
  }, [remoteStreams]);

  // --- Enhanced Action Functions ---

  const startStreaming = useCallback(async () => {
    if (!deviceRef.current || !socketRef.current) {
      handleError("Cannot start stream: connection not ready");
      return;
    }

    setError(null);
    
    try {
      // Get user media with enhanced constraints
      const stream = await navigator.mediaDevices.getUserMedia(MEDIA_CONSTRAINTS);
      localStreamRef.current = stream;
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Create transports
      sendTransportRef.current = await createTransport('send');
      recvTransportRef.current = await createTransport('recv');

      // Create producers for video and audio
      const videoTrack = stream.getVideoTracks()[0];
      const audioTrack = stream.getAudioTracks()[0];

      if (videoTrack) {
        const producerOptions: ProducerOptions = { track: videoTrack };
        const videoProducer = await sendTransportRef.current.produce(producerOptions);
        producersRef.current.set(videoProducer.id, videoProducer);
      }

      if (audioTrack) {
        const producerOptions: ProducerOptions = { track: audioTrack };
        const audioProducer = await sendTransportRef.current.produce(producerOptions);
        producersRef.current.set(audioProducer.id, audioProducer);
      }

      setIsStreaming(true);
      socketRef.current.emit(SOCKET_EVENTS.START_STREAMING, { roomId });
      
      console.log("Streaming started successfully");
    } catch (err) {
      const error = err as Error;
      handleError(error, "Start Streaming");
      cleanupWebRTC();
    }
  }, [roomId, createTransport, handleError, cleanupWebRTC]);

  const stopStreaming = useCallback(() => {
    setError(null);
    socketRef.current?.emit(SOCKET_EVENTS.STOP_STREAMING, { roomId });
    cleanupWebRTC();
  }, [roomId, cleanupWebRTC]);

  const toggleMedia = useCallback((type: "video" | "audio") => {
    try {
      const producer = Array.from(producersRef.current.values()).find(p => p.kind === type);
      if (!producer) return;

      const newStatus = !mediaDeviceStatus[type];
      
      if (newStatus) {
        producer.resume();
      } else {
        producer.pause();
      }
      
      // Also toggle the track itself
      const stream = localStreamRef.current;
      const track = type === 'video' 
        ? stream?.getVideoTracks()[0] 
        : stream?.getAudioTracks()[0];
      
      if (track) {
        track.enabled = newStatus;
      }
      
      setMediaDeviceStatus(prev => ({ ...prev, [type]: newStatus }));
      
      // Notify server about producer state change
      const event = newStatus ? SOCKET_EVENTS.RESUME_PRODUCER : SOCKET_EVENTS.PAUSE_PRODUCER;
      socketRef.current?.emit(event, { producerId: producer.id });
      
    } catch (error) {
      handleError(error as Error, `Toggle ${type}`);
    }
  }, [mediaDeviceStatus, handleError]);

  const toggleHLS = useCallback(() => {
    try {
      const newHlsState = !isHlsEnabled;
      const event = newHlsState ? SOCKET_EVENTS.START_HLS : SOCKET_EVENTS.STOP_HLS;
      
      socketRef.current?.emit(event, { roomId });
      setIsHlsEnabled(newHlsState);
      
      if (!newHlsState) {
        setHlsUrl(null);
      }
    } catch (error) {
      handleError(error as Error, "Toggle HLS");
    }
  }, [isHlsEnabled, roomId, handleError]);

  const leaveRoom = useCallback(() => {
    cleanupWebRTC();
    socketRef.current?.disconnect();
    router.push("/");
  }, [cleanupWebRTC, router]);

  const getRemoteVideoRef = useCallback((participantId: string) => 
    (el: HTMLVideoElement | null) => {
      if (el) {
        remoteVideoRefs.current.set(participantId, el);
      } else {
        remoteVideoRefs.current.delete(participantId);
      }
    }, []
  );

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      handleError(error as Error, "Copy to Clipboard");
    }
  }, [handleError]);

  // Memoized actions object for performance
  const actions = useMemo(() => ({
    startStreaming,
    stopStreaming,
    toggleMedia,
    toggleHLS,
    copyToClipboard,
    leaveRoom,
  }), [startStreaming, stopStreaming, toggleMedia, toggleHLS, copyToClipboard, leaveRoom]);

  return {
    isConnected,
    isStreaming,
    error,
    participants,
    selfId: socketRef.current?.id,
    userRole,
    connectionState,
    localVideoRef,
    getRemoteVideoRef,
    mediaDeviceStatus,
    hlsUrl,
    isHlsEnabled,
    actions,
  };
};