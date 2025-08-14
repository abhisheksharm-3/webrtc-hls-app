"use client";

import {
  useEffect,
  useReducer,
  useRef,
  useCallback,
  useState,
  useMemo,
} from "react";
import { io, Socket } from "socket.io-client";
import { MediaDeviceStatus, RemoteStream } from "@/lib/types/stream-types";
import { ClientToServerEvents, ServerToClientEvents } from "@relay-app/shared";
import { initialState, webrtcReducer } from "@/lib/webrtc-utils/reducer";
import {
  createMediasoupManager,
  MediasoupManager,
} from "@/lib/webrtc-utils/MediasoupManager";

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

// Helper function to compare tracks between two streams
const haveTracksChanged = (
  stream1: MediaStream | null,
  stream2: MediaStream
): boolean => {
  if (!stream1) return true;
  const tracks1 = stream1.getTracks().map((t) => t.id).sort();
  const tracks2 = stream2.getTracks().map((t) => t.id).sort();
  if (tracks1.length !== tracks2.length) return true;
  return JSON.stringify(tracks1) !== JSON.stringify(tracks2);
};

export const useWebRTCStream = (
  roomId: string,
  name: string,
  role: string | null
) => {
  const [state, dispatch] = useReducer(webrtcReducer, initialState);
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [mediaDeviceStatus, setMediaDeviceStatus] = useState<MediaDeviceStatus>({ video: true, audio: true });
  const [error, setError] = useState<string | null>(null);
  const [hlsUrl, setHlsUrl] = useState<string | null>(null);
  const [isHlsEnabled, setIsHlsEnabled] = useState(false);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, RemoteStream>>(new Map());
  const [selfId, setSelfId] = useState<string | null>(null);
  const [connectionInProgress, setConnectionInProgress] = useState(false); // ✅ Add connection guard

  const socketRef = useRef<TypedSocket | null>(null);
  const mediasoupManagerRef = useRef<MediasoupManager | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRefs = useRef<Map<string, HTMLVideoElement | null>>(new Map());
  const stateRef = useRef(state); // ✅ Add state ref to avoid stale closures
  
  // Update state ref whenever state changes
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // For production, this should come from an environment variable
  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "https://06afbf738244.ngrok-free.app";

  const iceServers = useMemo(() => {
    // Try to get ICE servers from environment variable first
    const envIceServers = process.env.NEXT_PUBLIC_ICE_SERVERS;
    if (envIceServers) {
      try {
        return JSON.parse(envIceServers);
      } catch (parseError) {
        console.warn('Failed to parse NEXT_PUBLIC_ICE_SERVERS from environment, using defaults:', parseError);
      }
    }

    // Fallback to hardcoded ICE servers with multiple reliable options
    return [
      // Reliable public STUN servers
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
      // Free public TURN server for testing NAT traversal
      {
        urls: ["turn:openrelay.metered.ca:80", "turn:openrelay.metered.ca:443"],
        username: "openrelayproject",
        credential: "openrelayproject",
      },
      // Additional TURN servers for better connectivity
      {
        urls: ["turn:turn.anyfirewall.com:443?transport=tcp"],
        username: "webrtc",
        credential: "webrtc",
      },
    ];
  }, []);

  const handleError = useCallback((err: Error | string, context?: string) => {
    const message = err instanceof Error ? err.message : err;
    const errorMessage = context ? `${context}: ${message}` : message;
    console.error(`🔴 [WebRTC Error] ${errorMessage}`, err);
    setError(errorMessage);
  }, []); // ✅ No dependencies - stable function

  const cleanup = useCallback(() => {
    console.log("🧹 Cleaning up WebRTC resources...");
    
    // Close mediasoup manager first to prevent new connections
    if (mediasoupManagerRef.current) {
      try {
        mediasoupManagerRef.current.close();
        mediasoupManagerRef.current = null;
      } catch (error) {
        console.warn("Error closing mediasoup manager:", error);
      }
    }
    
    // Stop local media tracks
    if (localStreamRef.current) {
      try {
        localStreamRef.current.getTracks().forEach((track) => {
          track.stop();
          console.log(`🛑 Stopped ${track.kind} track`);
        });
        localStreamRef.current = null;
      } catch (error) {
        console.warn("Error stopping local tracks:", error);
      }
    }
    
    // Disconnect socket
    if (socketRef.current) {
      try {
        socketRef.current.disconnect();
        socketRef.current = null;
      } catch (error) {
        console.warn("Error disconnecting socket:", error);
      }
    }
    
    // Reset all state to initial values
    dispatch({ type: "RESET_STATE" });
    setIsConnected(false);
    setIsStreaming(false);
    setHlsUrl(null);
    setIsHlsEnabled(false);
    setRemoteStreams(new Map());
    setSelfId(null);
    setError(null);
    setConnectionInProgress(false); // ✅ Reset connection guard
  }, []); // ✅ No dependencies to prevent recreation and infinite loops

  // --- Main Connection Effect ---
  useEffect(() => {
    if (!roomId || !name || !role) return;

    // Prevent multiple connections
    if (socketRef.current?.connected || connectionInProgress) {
      console.log(`⚠️ [CONNECTION] Socket already connected or connection in progress, skipping connection setup`);
      return;
    }

    console.log(`🔗 [CONNECTION] Setting up WebRTC connection for ${role} in room ${roomId}`);
    setConnectionInProgress(true);

    const socket = io(socketUrl, {
      transports: ["websocket"],
      path: "/socket.io",
      extraHeaders: { "ngrok-skip-browser-warning": "true" },
      timeout: 20000, // Increase connection timeout
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      forceNew: true, // Force a new connection
    });
    
    socketRef.current = socket;
    
    const msManager = createMediasoupManager(socket, iceServers);
    mediasoupManagerRef.current = msManager;

    const setupSocketEvents = () => {
        socket.on("connect", () => {
            console.log(`✅ Socket connected: ${socket.id} (${role})`);
            setIsConnected(true);
            setConnectionInProgress(false); // ✅ Reset connection guard
            setError(null); // Clear any previous errors
            
            socket.emit("join-room", { roomId, name, role }, (res: { error: string | Error; }) => {
                if (res.error) {
                  console.error("❌ Error joining room:", res.error);
                  handleError(res.error, "Joining Room");
                } else {
                  console.log(`✅ Successfully joined room ${roomId} as ${role}`);
                }
            });
        });

        socket.on("room-joined", async (data) => {
            dispatch({ type: "ROOM_JOINED", payload: { participants: data.room.participants } });
            setSelfId(data.participantId);
            setIsHlsEnabled(data.isHlsEnabled);
            if (data.hlsUrl) setHlsUrl(data.hlsUrl);

            try {
                await msManager.loadDevice(data.routerRtpCapabilities);
                await msManager.createTransport("recv");
                await msManager.createTransport("send");

                // Process existing producers with better error handling
                for (const { producerId, participantId } of data.existingProducers) {
                    try {
                        console.log(`🔄 Processing existing producer: ${producerId} from participant ${participantId}`);
                        const consumer = await msManager.consume(producerId, participantId);
                        if (consumer) {
                            dispatch({ type: "ADD_CONSUMER", payload: { consumer } });
                            
                            // Add delay before resuming existing consumers
                            setTimeout(async () => {
                                try {
                                    await consumer.resume();
                                    console.log(`▶️ [EXISTING] Resumed existing consumer ${consumer.id}`);
                                } catch (resumeError) {
                                    console.error(`❌ [EXISTING] Failed to resume consumer ${consumer.id}:`, resumeError);
                                }
                            }, 200);
                        }
                    } catch (consumerError) {
                        console.error(`❌ [EXISTING] Failed to create consumer for producer ${producerId}:`, consumerError);
                    }
                }
                if (data.existingProducers.length > 0) setIsStreaming(true);
            } catch (err) {
                handleError(err as Error, "Setting up WebRTC media");
            }
        });

        socket.on("new-participant", ({ participant }) => dispatch({ type: "NEW_PARTICIPANT", payload: { participant } }));
        socket.on("participant-left", ({ participantId }) => dispatch({ type: "PARTICIPANT_LEFT", payload: { participantId } }));

        socket.on("new-producer", async ({ producerId, participantId }) => {
            if (role === "viewer") return;
            console.log(`✨ New producer detected: ${producerId} from participant ${participantId}`);
            try {
                const consumer = await msManager.consume(producerId, participantId);
                if (consumer) {
                    console.log(`👍 Consumer created for producer ${producerId}`, consumer);
                    dispatch({ type: "ADD_CONSUMER", payload: { consumer } });
                    
                    // Add a small delay before resuming to ensure transport is ready
                    setTimeout(async () => {
                        try {
                            await consumer.resume();
                            console.log(`▶️ [PRODUCER] Resumed new consumer ${consumer.id}`);
                        } catch (resumeError) {
                            console.error(`❌ [PRODUCER] Failed to resume consumer ${consumer.id}:`, resumeError);
                        }
                    }, 100);
                }
            } catch (err) {
                console.error(`❌ [PRODUCER] Error consuming new producer ${producerId}:`, err);
                handleError(err as Error, `Consuming new producer`);
            }
        });

        socket.on("producer-closed", ({ producerId }) => {
            // Use stateRef to get current consumers without dependency
            const currentConsumers = Array.from(stateRef.current.consumers.values());
            const consumer = currentConsumers.find((c) => c.producerId === producerId);
            if (consumer) {
                consumer.close();
                dispatch({ type: "REMOVE_CONSUMER", payload: { consumerId: consumer.id } });
            }
        });

        socket.on("disconnect", (reason) => {
            console.log(`🔌 [SOCKET] Disconnected: ${reason}`);
            setIsConnected(false);
            setConnectionInProgress(false); // ✅ Reset connection guard on disconnect
            handleError(`Disconnected: ${reason}`);
        });

        socket.on("error", (error) => {
            console.error(`🔴 [SOCKET] Socket error:`, error);
            setConnectionInProgress(false); // ✅ Reset connection guard on error
            handleError(`Socket error: ${error}`);
        });

        socket.on("connect_error", (error) => {
            console.error(`🔴 [SOCKET] Connection error:`, error);
            setConnectionInProgress(false); // ✅ Reset connection guard on connection error
            handleError(`Connection error: ${error}`);
        });
    };

    setupSocketEvents();
    
    // Cleanup function
    return () => {
      console.log(`🧹 [CONNECTION] Cleaning up connection for ${role} in room ${roomId}`);
      setConnectionInProgress(false); // ✅ Reset connection guard on cleanup
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, name, role]); // ✅ Only essential dependencies that should trigger reconnection

  // --- Effect to derive remote streams from consumers ---
  useEffect(() => {
    console.log(`🔄 Processing ${state.consumers.size} consumers into remote streams.`);
    const newRemoteStreams = new Map<string, RemoteStream>();
    
    // Group consumers by participant and track type, keeping only the latest
    const participantTracks = new Map<string, { video?: MediaStreamTrack, audio?: MediaStreamTrack }>();
    
    for (const consumer of state.consumers.values()) {
        const { participantId } = consumer.appData;
        if (participantId && consumer.track && consumer.track.readyState === 'live') {
            const pid = participantId as string;
            const existing = participantTracks.get(pid) || {};
            
            if (consumer.kind === "video") {
                existing.video = consumer.track;
            } else if (consumer.kind === "audio") {
                existing.audio = consumer.track;
            }
            
            participantTracks.set(pid, existing);
            console.log(`📹 [STREAM] Added ${consumer.kind} track for participant ${participantId}, track ready state: ${consumer.track.readyState}`);
        }
    }
    
    // Convert to RemoteStream format
    for (const [participantId, tracks] of participantTracks.entries()) {
        const remoteStream: RemoteStream = {};
        if (tracks.video) remoteStream.videoTrack = tracks.video;
        if (tracks.audio) remoteStream.audioTrack = tracks.audio;
        newRemoteStreams.set(participantId, remoteStream);
    }
    
    setRemoteStreams(newRemoteStreams);
  }, [state.consumers]); // ✅ Fixed dependency

  // --- Effect to attach remote streams to video elements ---
  useEffect(() => {
    console.log(`🔗 [ATTACH] Starting remote stream attachment process...`);
    
    // Use a timeout to debounce rapid stream updates
    const attachmentTimeout = setTimeout(() => {
      remoteVideoRefs.current.forEach((videoEl, participantId) => {
          console.log(`\n📹 [ATTACH] === Processing participant ${participantId} ===`);
          if (!videoEl) {
              console.warn(`⚠️ [ATTACH] No video element found for participant ${participantId}`);
              return;
          }
          
          const remoteStreamData = remoteStreams.get(participantId);
          if (remoteStreamData) {
              const newStream = new MediaStream();
              let hasValidTracks = false;
              
              if (remoteStreamData.videoTrack && remoteStreamData.videoTrack.readyState === 'live') {
                  newStream.addTrack(remoteStreamData.videoTrack);
                  hasValidTracks = true;
                  console.log(`📺 [ATTACH] Added video track for ${participantId}, state: ${remoteStreamData.videoTrack.readyState}`);
              }
              if (remoteStreamData.audioTrack && remoteStreamData.audioTrack.readyState === 'live') {
                  newStream.addTrack(remoteStreamData.audioTrack);
                  hasValidTracks = true;
                  console.log(`🎵 [ATTACH] Added audio track for ${participantId}, state: ${remoteStreamData.audioTrack.readyState}`);
              }
              
              if (hasValidTracks && haveTracksChanged(videoEl.srcObject as MediaStream, newStream)) {
                  console.log(`✅ [ATTACH] Tracks have changed for ${participantId}. Updating srcObject.`);
                  
                  // Pause current playback to prevent conflicts
                  if (!videoEl.paused) {
                      videoEl.pause();
                  }
                  
                  // Update the source
                  videoEl.srcObject = newStream;
                  videoEl.muted = false;
                  videoEl.playsInline = true;
                  
                  // Wait for the video to be ready before attempting to play
                  const handleLoadedData = () => {
                      console.log(`🎬 [ATTACH] Video loaded for ${participantId}, attempting autoplay`);
                      const playPromise = videoEl.play();
                      if (playPromise !== undefined) {
                          playPromise
                              .then(() => {
                                  console.log(`✅ [ATTACH] Autoplay started successfully for ${participantId}`);
                              })
                              .catch(error => {
                                  console.warn(`⚠️ [ATTACH] Autoplay failed for ${participantId}, trying muted:`, error.message);
                                  // Fallback: try muted autoplay
                                  videoEl.muted = true;
                                  return videoEl.play();
                              })
                              .catch(fallbackError => {
                                  console.warn(`❌ [ATTACH] Even muted autoplay failed for ${participantId}:`, fallbackError.message);
                              });
                      }
                      videoEl.removeEventListener('loadeddata', handleLoadedData);
                  };
                  
                  videoEl.addEventListener('loadeddata', handleLoadedData);
                  
                  // Fallback timeout in case loadeddata doesn't fire
                  setTimeout(() => {
                      videoEl.removeEventListener('loadeddata', handleLoadedData);
                      if (videoEl.paused && videoEl.readyState >= 2) {
                          console.log(`� [ATTACH] Fallback play attempt for ${participantId}`);
                          videoEl.play().catch(() => {
                              console.warn(`❌ [ATTACH] Fallback play failed for ${participantId}`);
                          });
                      }
                  }, 1000);
              } else if (!hasValidTracks) {
                  console.log(`⚠️ [ATTACH] No valid live tracks for ${participantId}`);
              } else {
                  console.log(`📦 [ATTACH] No track changes for ${participantId}, keeping existing stream.`);
              }
          } else if (videoEl.srcObject) {
              console.log(`🧹 [ATTACH] No remote stream data for ${participantId}, clearing srcObject.`);
              videoEl.srcObject = null;
          }
      });
      console.log(`🔗 [ATTACH] Remote stream attachment process completed.`);
    }, 100); // Debounce stream updates by 100ms
    
    return () => {
      clearTimeout(attachmentTimeout);
    };
  }, [remoteStreams]);

  const startStreaming = useCallback(async () => {
    if (state.producers.size > 0) return;
    try {
        console.log('🎬 [LOCAL] Starting local stream capture...');
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        console.log('✅ [LOCAL] Got user media stream:', stream.getTracks().map(t => `${t.kind}: ${t.label}`));
        
        localStreamRef.current = stream;
        
        if (localVideoRef.current) {
            console.log('🎥 [LOCAL] Setting local video srcObject');
            localVideoRef.current.srcObject = stream;
            
            // Ensure local video plays
            localVideoRef.current.muted = true;
            localVideoRef.current.playsInline = true;
            
            const playPromise = localVideoRef.current.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => console.log('✅ [LOCAL] Local video autoplay started'))
                    .catch(err => console.warn('⚠️ [LOCAL] Local video autoplay failed:', err));
            }
        } else {
            console.warn('⚠️ [LOCAL] No local video element found');
        }

        const msManager = mediasoupManagerRef.current;
        if (!msManager) throw new Error("MediasoupManager not initialized");
        
        const videoProducer = await msManager.produce(stream.getVideoTracks()[0]);
        const audioProducer = await msManager.produce(stream.getAudioTracks()[0]);

        if (videoProducer) dispatch({ type: "ADD_PRODUCER", payload: { producer: videoProducer } });
        if (audioProducer) dispatch({ type: "ADD_PRODUCER", payload: { producer: audioProducer } });

        if (selfId) {
            dispatch({
                type: "UPDATE_PARTICIPANT",
                payload: { participantId: selfId, patch: { hasVideo: true, hasAudio: true } },
            });
        }
        setIsStreaming(true);
        console.log('✅ [LOCAL] Streaming started successfully');
    } catch (err) {
        handleError(err as Error, "Start Streaming / getUserMedia");
    }
  }, [state.producers, handleError, selfId]);

  const toggleMedia = useCallback((type: "video" | "audio") => {
    const producer = Array.from(state.producers.values()).find((p) => p.kind === type);
    if (!producer) return;
    
    if (producer.paused) producer.resume();
    else producer.pause();
    
    const isEnabled = !producer.paused;
    setMediaDeviceStatus((prev) => ({ ...prev, [type]: isEnabled }));
    if (selfId) {
        const patch = type === "video" ? { hasVideo: isEnabled } : { hasAudio: isEnabled };
        dispatch({ type: "UPDATE_PARTICIPANT", payload: { participantId: selfId, patch } });
    }
  }, [state.producers, selfId]);

  const getRemoteVideoRef = useCallback((participantId: string) => (el: HTMLVideoElement | null) => {
    if (el) remoteVideoRefs.current.set(participantId, el);
    else remoteVideoRefs.current.delete(participantId);
  }, []);

  return {
    isConnected,
    isStreaming,
    error,
    participants: state.participants,
    selfId,
    localVideoRef,
    getRemoteVideoRef,
    mediaDeviceStatus,
    hlsUrl,
    isHlsEnabled,
    actions: {
      startStreaming,
      leaveRoom: cleanup,
      toggleMedia,
      toggleHLS: useCallback(() => {
        const event = isHlsEnabled ? "stop-hls" : "start-hls";
        socketRef.current?.emit(event, { roomId });
      }, [isHlsEnabled, roomId]),
    },
  };
};
