"use client";

import {
  useEffect,
  useReducer,
  useRef,
  useCallback,
  useMemo,
  useState,
} from "react";
import { io, Socket } from "socket.io-client";
import { Device } from "mediasoup-client";
import type {
  Consumer,
  Producer,
  Transport,
  RtpParameters,
} from "mediasoup-client/types";
import { Participant, WebRtcTransportParams } from "@relay-app/shared";
import { MediaDeviceStatus, RemoteStream } from "@/lib/types/stream-types";

// --- Constants ---
const SOCKET_EVENTS = {
  CONNECT: "connect",
  DISCONNECT: "disconnect",
  JOIN_ROOM: "join-room",
  ROOM_JOINED: "room-joined",
  NEW_PARTICIPANT: "new-participant",
  PARTICIPANT_LEFT: "participant-left",
  NEW_PRODUCER: "new-producer",
  PRODUCER_CLOSED: "producer-closed",
  CREATE_TRANSPORT: "create-transport",
  CONNECT_TRANSPORT: "connect-transport",
  PRODUCE: "produce",
  CONSUME: "consume",
  START_HLS: "start-hls",
  STOP_HLS: "stop-hls",
  HLS_STARTED: "hls-started",
  HLS_STOPPED: "hls-stopped",
} as const;


// --- State Management (Reducer) ---
interface WebRTCState {
  participants: Participant[];
  producers: Map<string, Producer>;
  consumers: Map<string, Consumer>;
}

type WebRTCAction =
  | { type: "ROOM_JOINED"; payload: { participants: Participant[] } }
  | { type: "NEW_PARTICIPANT"; payload: { participant: Participant } }
  | { type: "PARTICIPANT_LEFT"; payload: { participantId: string } }
  | { type: "ADD_PRODUCER"; payload: { producer: Producer } }
  | { type: "ADD_CONSUMER"; payload: { consumer: Consumer } }
  | {
      type: "UPDATE_PARTICIPANT";
      payload: { participantId: string; patch: Partial<Participant> };
    }
  | { type: "RESET_STATE" };

const initialState: WebRTCState = {
  participants: [],
  producers: new Map(),
  consumers: new Map(),
};

function webrtcReducer(state: WebRTCState, action: WebRTCAction): WebRTCState {
    switch (action.type) {
    case "ROOM_JOINED":
      return { ...state, participants: action.payload.participants };
    case "NEW_PARTICIPANT":
      if (state.participants.some((p) => p.id === action.payload.participant.id)) return state;
      return { ...state, participants: [...state.participants, action.payload.participant] };
    case "PARTICIPANT_LEFT":
      return { ...state, participants: state.participants.filter(p => p.id !== action.payload.participantId) };
    case "ADD_PRODUCER":
      return { ...state, producers: new Map(state.producers).set(action.payload.producer.id, action.payload.producer) };
    case "ADD_CONSUMER":
      return { ...state, consumers: new Map(state.consumers).set(action.payload.consumer.id, action.payload.consumer) };
    case "UPDATE_PARTICIPANT":
      return {
        ...state,
        participants: state.participants.map(p =>
          p.id === action.payload.participantId ? { ...p, ...action.payload.patch } : p
        ),
      };
    case "RESET_STATE":
      return initialState;
    default:
      return state;
  }
}

// --- The Main Hook ---
export const useWebRTCStream = (roomId: string, name: string, role: string | null) => {
  const [state, dispatch] = useReducer(webrtcReducer, initialState);
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [mediaDeviceStatus, setMediaDeviceStatus] = useState<MediaDeviceStatus>({ video: true, audio: true });
  const [error, setError] = useState<string | null>(null);
  const [hlsUrl, setHlsUrl] = useState<string | null>(null);
  const [isHlsEnabled, setIsHlsEnabled] = useState(false);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, RemoteStream>>(new Map());
  const [selfId, setSelfId] = useState<string | null>(null);

  // --- Refs ---
  const socketRef = useRef<Socket | null>(null);
  const deviceRef = useRef<Device | null>(null);
  const sendTransportRef = useRef<Transport | null>(null);
  const recvTransportRef = useRef<Transport | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRefs = useRef<Map<string, HTMLVideoElement | null>>(new Map());
  const producersRef = useRef<Map<string, Producer>>(new Map());
  const nameRef = useRef(name);
  const roleRef = useRef(role);
  
  const isCleaningUpRef = useRef(false);
  
  const createTransportRef = useRef<any>();
  const consumeRemoteProducerRef = useRef<any>();

  // --- Memoized Values ---
  const resolvedName = useMemo(() => (name && name.trim().length > 0) ? name : `User-${Math.random().toString(36).slice(2, 6)}`, [name]);
  const resolvedRole = useMemo(() => role || "guest", [role]);
  
const socketUrl = useMemo(() => {
    if (typeof window === "undefined") return ""; // Prevent server-side execution
    
    // Check the protocol (http: or https:)
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    
    // For ngrok/production, the port is handled by the proxy, so we don't need to add it.
    // For local development, we connect directly to the port.
    const isLocal = hostname === "localhost";
    const port = isLocal ? ":3001" : "";
    
    // Use wss:// for https:// pages, and ws:// for http://
    const wsProtocol = protocol === "https:" ? "wss://" : "ws://";

    return `${wsProtocol}${hostname}${port}`;
  }, []);

  const iceServers = useMemo(() => {
    const iceServersEnv = process.env.NEXT_PUBLIC_ICE_SERVERS;
    if (!iceServersEnv) return [];
    try {
      return JSON.parse(iceServersEnv);
    } catch (e) {
      console.error("Failed to parse NEXT_PUBLIC_ICE_SERVERS:", e);
      return [];
    }
  }, []);

  // --- Callbacks ---
  const handleError = useCallback((err: Error | string, context?: string) => {
    const message = err instanceof Error ? err.message : err;
    const errorMessage = context ? `${context}: ${message}` : message;
    console.error(errorMessage);
    setError(errorMessage);
  }, []);

  const createSocketPromise = useCallback(<T extends object>(event: string, data: Record<string, unknown>): Promise<T> => {
      return new Promise((resolve, reject) => {
        if (!socketRef.current?.connected) return reject(new Error('Socket not connected.'));
        socketRef.current.emit(event, data, (response: { error?: string } & T) => {
          if (response.error) reject(new Error(response.error));
          else resolve(response);
        });
      });
    }, []);

  const createTransport = useCallback(async (direction: "send" | "recv"): Promise<Transport> => {
    if (!deviceRef.current) throw new Error("Device not initialized");
    const params = await createSocketPromise<WebRtcTransportParams>(SOCKET_EVENTS.CREATE_TRANSPORT, { direction });
    
    const transport = direction === "send"
      ? deviceRef.current.createSendTransport({ ...params, iceServers })
      : deviceRef.current.createRecvTransport({ ...params, iceServers });

    transport.on("connect", async ({ dtlsParameters }, callback, errback) => {
      try {
        await createSocketPromise(SOCKET_EVENTS.CONNECT_TRANSPORT, { transportId: transport.id, dtlsParameters });
        callback();
      } catch (err) { errback(err as Error) }
    });

    if (direction === "send") {
      transport.on("produce", async ({ kind, rtpParameters }, callback, errback) => {
        try {
          const { id } = await createSocketPromise<{ id: string }>(SOCKET_EVENTS.PRODUCE, { transportId: transport.id, kind, rtpParameters });
          callback({ id });
          if (selfId) {
            if (kind === "video") dispatch({ type: "UPDATE_PARTICIPANT", payload: { participantId: selfId, patch: { hasVideo: true } } });
            if (kind === "audio") dispatch({ type: "UPDATE_PARTICIPANT", payload: { participantId: selfId, patch: { hasAudio: true } } });
          }
        } catch (err) { errback(err as Error) }
      });
    }
    return transport;
  }, [createSocketPromise, selfId, iceServers]);

  const consumeRemoteProducer = useCallback(async (producerId: string, participantId: string) => {
    if (!deviceRef.current || !recvTransportRef.current) return;
    try {
      const consumerData = await createSocketPromise<{ id: string; kind: "audio" | "video"; rtpParameters: RtpParameters; }>(
        SOCKET_EVENTS.CONSUME, { producerId, rtpCapabilities: deviceRef.current.rtpCapabilities, }
      );
      const consumer = await recvTransportRef.current.consume({ ...consumerData, producerId, appData: { participantId }, });
      dispatch({ type: "ADD_CONSUMER", payload: { consumer } });
      setRemoteStreams(prev => {
        const newMap = new Map(prev);
        const existingStream = newMap.get(participantId) || {};
        const trackKey = consumer.kind === "video" ? "videoTrack" : "audioTrack";
        newMap.set(participantId, { ...existingStream, [trackKey]: consumer.track, });
        return newMap;
      });
    } catch (err) { handleError(err as Error, `Consume producer ${producerId}`) }
  }, [createSocketPromise, handleError]);
  
  const cleanup = useCallback(() => {
    console.log("Cleaning up WebRTC resources...");
    producersRef.current.forEach((p) => p.close());
    sendTransportRef.current?.close();
    recvTransportRef.current?.close();
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
    }
    dispatch({ type: "RESET_STATE" });
    setIsStreaming(false);
    setSelfId(null);
  }, []);

  // --- Effects ---
  useEffect(() => {
    nameRef.current = resolvedName;
    roleRef.current = resolvedRole;
    createTransportRef.current = createTransport;
    consumeRemoteProducerRef.current = consumeRemoteProducer;
  });

  useEffect(() => {
    producersRef.current = state.producers;
  }, [state.producers]);

  useEffect(() => {
    if (!roomId) return;
    isCleaningUpRef.current = false;

    const socket = io(socketUrl, {
      transports: ["websocket", "polling"],
      path: "/socket.io",
    });
    socketRef.current = socket;

    const onConnect = () => {
      console.log(`✅ Socket connected! Client ID: ${socket.id}`);
      setIsConnected(true);
      socket.emit(SOCKET_EVENTS.JOIN_ROOM, { roomId, name: nameRef.current, role: roleRef.current });
    };

    const onDisconnect = () => {
      console.log("❌ Socket disconnected.");
      handleError("You have been disconnected from the server.");
      setIsConnected(false);
    };
    
    const onRoomJoined = async (data: any) => {
        dispatch({ type: "ROOM_JOINED", payload: { participants: data.room.participants } });
        setSelfId(data.participantId);

        if (data.routerRtpCapabilities) {
            try {
                const device = new Device();
                await device.load({ routerRtpCapabilities: data.routerRtpCapabilities });
                deviceRef.current = device;
                
                recvTransportRef.current = await (createTransportRef.current as any)("recv");

                if (data.existingProducers?.length) {
                    for (const { producerId, participantId } of data.existingProducers) {
                        await (consumeRemoteProducerRef.current as any)(producerId, participantId);
                    }
                    if (data.existingProducers.length > 0) {
                        setIsStreaming(true);
                    }
                }
            } catch (err) {
                handleError(err as Error, "Device initialization or transport creation");
            }
        }
    };
    
    const onNewProducer = (data: { producerId: string, participantId: string }) => {
      (consumeRemoteProducerRef.current as any)(data.producerId, data.participantId);
    };

    socket.on(SOCKET_EVENTS.CONNECT, onConnect);
    socket.on(SOCKET_EVENTS.DISCONNECT, onDisconnect);
    socket.on(SOCKET_EVENTS.ROOM_JOINED, onRoomJoined);
    socket.on(SOCKET_EVENTS.NEW_PARTICIPANT, (d) => dispatch({ type: 'NEW_PARTICIPANT', payload: d }));
    socket.on(SOCKET_EVENTS.PARTICIPANT_LEFT, (d) => dispatch({ type: 'PARTICIPANT_LEFT', payload: d }));
    socket.on(SOCKET_EVENTS.NEW_PRODUCER, onNewProducer);
    socket.on("error", (err) => handleError(err.message || "An error occurred"));

    return () => {
      if (isCleaningUpRef.current) return;
      isCleaningUpRef.current = true;
      cleanup();
    };
  }, [roomId, socketUrl, cleanup, handleError]);

  const startStreaming = useCallback(async () => {
    // ✅ FIX: Check if this user has already produced media, not if the room is globally live.
    if (state.producers.size > 0 || !deviceRef.current) {
        console.warn("Start streaming called but conditions not met.", { hasProducers: state.producers.size > 0, device: !!deviceRef.current });
        return;
    };

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        
        if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
            localVideoRef.current.play().catch((err) => console.error("Local video play failed:", err));
        } else {
            console.error("FATAL: localVideoRef was not available when startStreaming was called.");
        }

        sendTransportRef.current = await (createTransportRef.current as any)("send");
        if (!sendTransportRef.current) throw new Error("Send transport could not be created.");
        
        const videoTrack = stream.getVideoTracks()[0];
        const audioTrack = stream.getAudioTracks()[0];

        if (videoTrack) {
            const producer = await sendTransportRef.current.produce({ track: videoTrack, appData: { kind: "video" } });
            dispatch({ type: "ADD_PRODUCER", payload: { producer } });
        }
        if (audioTrack) {
            const producer = await sendTransportRef.current.produce({ track: audioTrack, appData: { kind: "audio" } });
            dispatch({ type: "ADD_PRODUCER", payload: { producer } });
        }
        
        setIsStreaming(true);

    } catch (err) { 
        handleError(err as Error, "Error in startStreaming") 
    }
  }, [state.producers, handleError]);
  
  const toggleMedia = useCallback((type: "video" | "audio") => {
    const producer = Array.from(state.producers.values()).find(p => p.kind === type);
    if (!producer) return;
    if (producer.paused) {
      producer.resume();
    } else {
      producer.pause();
    }
    setMediaDeviceStatus(prev => ({ ...prev, [type]: !producer.paused }));
  }, [state.producers]);

  const toggleHLS = useCallback(() => {
    const event = isHlsEnabled ? SOCKET_EVENTS.STOP_HLS : SOCKET_EVENTS.START_HLS;
    socketRef.current?.emit(event, { roomId });
  }, [isHlsEnabled, roomId]);

  const copyToClipboard = useCallback(async (text: string) => {
    try { await navigator.clipboard.writeText(text) }
    catch (err) { handleError(err as Error, "Copy to Clipboard") }
  }, [handleError]);

  // ✅ FIX: This callback now ONLY sets the ref. The useEffect below handles the stream.
  const getRemoteVideoRef = useCallback((participantId: string) => (el: HTMLVideoElement | null) => {
    if (el) {
      remoteVideoRefs.current.set(participantId, el);
    } else {
      remoteVideoRefs.current.delete(participantId);
    }
  }, []);

  // ✅ FIX: This useEffect is now the single source of truth for managing remote video elements.
  // It runs whenever remote streams change, preventing the AbortError race condition.
  useEffect(() => {
    remoteVideoRefs.current.forEach((el, participantId) => {
        if (!el) return;
        const streamData = remoteStreams.get(participantId);
        
        if (!streamData || (!streamData.videoTrack && !streamData.audioTrack)) {
          if (el.srcObject) el.srcObject = null;
          return;
        }

        let mediaStream = el.srcObject as MediaStream;
        if (!mediaStream) {
            mediaStream = new MediaStream();
            el.srcObject = mediaStream;
        }

        const hasVideo = mediaStream.getVideoTracks().length > 0;
        const hasAudio = mediaStream.getAudioTracks().length > 0;

        if (streamData.videoTrack && !hasVideo) {
            mediaStream.addTrack(streamData.videoTrack);
        }
        if (streamData.audioTrack && !hasAudio) {
            mediaStream.addTrack(streamData.audioTrack);
        }

        el.muted = true;
        el.playsInline = true;
        el.play().catch((e) => console.warn(`Autoplay failed for ${participantId}:`, e));
    });
  }, [remoteStreams]);

  const hasRemoteMedia = useMemo(() => {
    for (const stream of remoteStreams.values()) {
        if (stream.videoTrack || stream.audioTrack) return true;
    }
    return false;
  }, [remoteStreams]);

  return { 
    isConnected, 
    isStreaming, 
    hasRemoteMedia, 
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
      toggleHLS, 
      copyToClipboard 
    } 
  };
};
