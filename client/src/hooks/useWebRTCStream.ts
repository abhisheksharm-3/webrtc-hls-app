"use client";

import { useEffect, useReducer, useRef, useCallback, useMemo, useState } from "react";
import { io, Socket } from "socket.io-client";
import { Device } from "mediasoup-client";
import type { Consumer, Producer, RtpCapabilities, Transport, RtpParameters } from "mediasoup-client/types";
import { Participant, WebRtcTransportParams } from "@relay-app/shared";
import { MediaDeviceStatus, RemoteStream } from "@/lib/types/stream-types";

// --- Constants ---
const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  JOIN_ROOM: 'join-room',
  ROOM_JOINED: 'room-joined',
  NEW_PARTICIPANT: 'new-participant',
  PARTICIPANT_LEFT: 'participant-left',
  NEW_PRODUCER: 'new-producer',
  PRODUCER_CLOSED: 'producer-closed',
  CREATE_TRANSPORT: 'create-transport',
  CONNECT_TRANSPORT: 'connect-transport',
  PRODUCE: 'produce',
  CONSUME: 'consume',
  START_HLS: 'start-hls',
  STOP_HLS: 'stop-hls',
  HLS_STARTED: 'hls-started',
  HLS_STOPPED: 'hls-stopped',
} as const;

// --- State Management (Reducer) ---

interface WebRTCState {
  participants: Participant[];
  producers: Map<string, Producer>;
  consumers: Map<string, Consumer>;
}

type WebRTCAction =
  | { type: 'ROOM_JOINED'; payload: { participants: Participant[] } }
  | { type: 'NEW_PARTICIPANT'; payload: { participant: Participant } }
  | { type: 'PARTICIPANT_LEFT'; payload: { participantId: string } }
  | { type: 'ADD_PRODUCER'; payload: { producer: Producer } }
  | { type: 'ADD_CONSUMER'; payload: { consumer: Consumer } }
  | { type: 'RESET_STATE' };

const initialState: WebRTCState = {
  participants: [],
  producers: new Map(),
  consumers: new Map(),
};

function webrtcReducer(state: WebRTCState, action: WebRTCAction): WebRTCState {
  switch (action.type) {
    case 'ROOM_JOINED':
      return { ...state, participants: action.payload.participants };
    case 'NEW_PARTICIPANT':
      if (state.participants.some(p => p.id === action.payload.participant.id)) return state;
      return { ...state, participants: [...state.participants, action.payload.participant] };
    case 'PARTICIPANT_LEFT':
      return { ...state, participants: state.participants.filter(p => p.id !== action.payload.participantId) };
    case 'ADD_PRODUCER':
      return { ...state, producers: new Map(state.producers).set(action.payload.producer.id, action.payload.producer) };
    case 'ADD_CONSUMER':
        return { ...state, consumers: new Map(state.consumers).set(action.payload.consumer.id, action.payload.consumer) };
    case 'RESET_STATE':
      return initialState;
    default:
      return state;
  }
}

// --- The Main Hook ---

export const useWebRTCStream = (roomId: string, name: string, role: string | null) => {
  
  const [state, dispatch] = useReducer(webrtcReducer, initialState);
  // Keep a ref in sync for stable cleanup without re-creating callbacks
  const producersRef = useRef<Map<string, Producer>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [mediaDeviceStatus, setMediaDeviceStatus] = useState<MediaDeviceStatus>({ video: true, audio: true });
  const [error, setError] = useState<string | null>(null);
  const [hlsUrl, setHlsUrl] = useState<string | null>(null);
  const [isHlsEnabled, setIsHlsEnabled] = useState(false);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, RemoteStream>>(new Map());

  const socketRef = useRef<Socket | null>(null);
  const deviceRef = useRef<Device | null>(null);
  const sendTransportRef = useRef<Transport | null>(null);
  const recvTransportRef = useRef<Transport | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRefs = useRef<Map<string, HTMLVideoElement | null>>(new Map());
  const nameRef = useRef<string>(name);
  const roleRef = useRef<string | null>(role);
  const socketStartedRef = useRef<boolean>(false);
  
  const serverUrl = useMemo(() => process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3001", []);

  const handleError = useCallback((err: Error | string, context?: string) => {
    const message = err instanceof Error ? err.message : err;
    const errorMessage = context ? `${context}: ${message}` : message;
    console.error(errorMessage);
    setError(errorMessage);
  }, []);

  const createSocketPromise = useCallback(<T extends object>(event: string, data: Record<string, unknown>): Promise<T> => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current) return reject(new Error('Socket not connected.'));
      socketRef.current.emit(event, data, (response: { error?: string } & T) => {
        if (response.error) reject(new Error(response.error));
        else resolve(response);
      });
    });
  }, []);

  const createTransport = useCallback(async (direction: 'send' | 'recv'): Promise<Transport> => {
    if (!deviceRef.current) throw new Error("Device not initialized");
    const params = await createSocketPromise<WebRtcTransportParams>(SOCKET_EVENTS.CREATE_TRANSPORT, { direction });
    const iceServers = [
      { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
      {
        urls: ['turn:openrelay.metered.ca:80', 'turn:openrelay.metered.ca:443', 'turn:openrelay.metered.ca:3478'],
        username: 'openrelayproject',
        credential: 'openrelayproject',
      },
    ];
    const transport = direction === 'send'
      ? deviceRef.current.createSendTransport({ ...params, iceServers })
      : deviceRef.current.createRecvTransport({ ...params, iceServers });

    transport.on('connect', async ({ dtlsParameters }, callback, errback) => {
      try {
        await createSocketPromise(SOCKET_EVENTS.CONNECT_TRANSPORT, { transportId: transport.id, dtlsParameters });
        callback();
      } catch (err) { errback(err as Error) }
    });

    if (direction === 'send') {
      transport.on('produce', async ({ kind, rtpParameters }, callback, errback) => {
        try {
          const { id } = await createSocketPromise<{ id: string }>(SOCKET_EVENTS.PRODUCE, { transportId: transport.id, kind, rtpParameters });
          callback({ id });
        } catch (err) { errback(err as Error) }
      });
    }
    return transport;
  }, [createSocketPromise]);

  const consumeRemoteProducer = useCallback(async (producerId: string, participantId: string) => {
    if (!deviceRef.current || !recvTransportRef.current) return;
    try {
      const consumerData = await createSocketPromise<{ id: string; kind: 'audio' | 'video'; rtpParameters: RtpParameters }>(
        SOCKET_EVENTS.CONSUME,
        { producerId, rtpCapabilities: deviceRef.current.rtpCapabilities }
      );
      const consumer = await recvTransportRef.current.consume({ ...consumerData, producerId, appData: { participantId } });
      dispatch({ type: 'ADD_CONSUMER', payload: { consumer } });

      setRemoteStreams(prev => {
        const newMap = new Map(prev);
        const existingStream = newMap.get(participantId) || {};
        const trackKey = consumer.kind === 'video' ? 'videoTrack' : 'audioTrack';
        newMap.set(participantId, { ...existingStream, [trackKey]: consumer.track });
        return newMap;
      });

    } catch (err) { handleError(err as Error, `Consume producer ${producerId}`) }
  }, [createSocketPromise, handleError]);

  useEffect(() => {
    // Sync producers ref whenever reducer state changes
    producersRef.current = state.producers;
  }, [state.producers]);

  const cleanup = useCallback(() => {
    console.log("Cleaning up WebRTC resources...");
    producersRef.current.forEach(p => p.close());
    sendTransportRef.current?.close();
    recvTransportRef.current?.close();
    localStreamRef.current?.getTracks().forEach(track => track.stop());
    socketRef.current?.disconnect();
    dispatch({ type: 'RESET_STATE' });
    setIsStreaming(false);
  }, []);

  useEffect(() => {
    nameRef.current = name;
  }, [name]);
  useEffect(() => {
    roleRef.current = role;
  }, [role]);

  useEffect(() => {
    if (socketStartedRef.current) return;
    socketStartedRef.current = true;
    const socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      timeout: 20000,
      forceNew: true,
    });
    socketRef.current = socket;

    const onConnect = () => {
      setIsConnected(true);
      socket.emit(SOCKET_EVENTS.JOIN_ROOM, { roomId, name: nameRef.current, role: roleRef.current || 'guest' });
    };
    const onDisconnect = () => {
      // Do not teardown everything on transient disconnect; allow auto-reconnect
      setIsConnected(false);
    };
    const onReconnect = () => {
      // Rejoin after reconnect to restore room state
      socket.emit(SOCKET_EVENTS.JOIN_ROOM, { roomId, name: nameRef.current, role: roleRef.current || 'guest' });
    };
    const onRoomJoined = async (data: { room: { participants: Participant[], hlsUrl?: string }, routerRtpCapabilities: RtpCapabilities | null, existingProducers?: { producerId: string, participantId: string }[] }) => {
      dispatch({ type: 'ROOM_JOINED', payload: { participants: data.room.participants } });
      if (data.room.hlsUrl) {
        setHlsUrl(data.room.hlsUrl);
        setIsHlsEnabled(true);
      }
      // Only initialize mediasoup Device for non-viewers
      if (data.routerRtpCapabilities) {
        try {
          const device = new Device();
          await device.load({ routerRtpCapabilities: data.routerRtpCapabilities });
          deviceRef.current = device;
          recvTransportRef.current = await createTransport('recv');
          // Immediately start consuming any existing producers in the room
          if (data.existingProducers?.length) {
            for (const { producerId, participantId } of data.existingProducers) {
              await consumeRemoteProducer(producerId, participantId);
            }
            setIsStreaming(true);
          }
        } catch (err) { handleError(err as Error, 'Device initialization') }
      }
    };
    const onNewParticipant = (data: { participant: Participant }) => dispatch({ type: 'NEW_PARTICIPANT', payload: data });
    const onParticipantLeft = (data: { participantId: string }) => dispatch({ type: 'PARTICIPANT_LEFT', payload: data });
    const onNewProducer = (data: { producerId: string, participantId: string }) => {
      consumeRemoteProducer(data.producerId, data.participantId);
      setIsStreaming(true);
    };
    const onHlsStarted = (data: { playlistUrl: string }) => {
        setHlsUrl(data.playlistUrl);
        setIsHlsEnabled(true);
    };
    const onHlsStopped = () => {
        setHlsUrl(null);
        setIsHlsEnabled(false);
    };

    const onConnectError = (err: Error) => {
      console.warn('Socket connect error:', err.message);
    };
    socket.on(SOCKET_EVENTS.CONNECT, onConnect);
    socket.io.on('reconnect', onReconnect);
    socket.on(SOCKET_EVENTS.DISCONNECT, onDisconnect);
    socket.io.on('error', onConnectError);
    socket.on(SOCKET_EVENTS.ROOM_JOINED, onRoomJoined);
    socket.on(SOCKET_EVENTS.NEW_PARTICIPANT, onNewParticipant);
    socket.on(SOCKET_EVENTS.PARTICIPANT_LEFT, onParticipantLeft);
    socket.on(SOCKET_EVENTS.NEW_PRODUCER, onNewProducer);
    socket.on(SOCKET_EVENTS.HLS_STARTED, onHlsStarted);
    socket.on(SOCKET_EVENTS.HLS_STOPPED, onHlsStopped);
    // Surface server-side errors (e.g., room full, not found)
    socket.on('error', (data: { message?: string }) => {
      handleError(data?.message || 'An error occurred while joining the room');
    });
    // Note: do not hard-cleanup on disconnect; we handle that explicitly on leave

    return () => {
      socket.off(SOCKET_EVENTS.CONNECT, onConnect);
      socket.off(SOCKET_EVENTS.DISCONNECT, onDisconnect);
      socket.io.off('reconnect', onReconnect);
      socket.io.off('error', onConnectError);
      cleanup();
    };
  }, [roomId, serverUrl, createTransport, consumeRemoteProducer, handleError]);

  const startStreaming = useCallback(async () => {
    if (isStreaming || !deviceRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      sendTransportRef.current = await createTransport('send');
      const videoTrack = stream.getVideoTracks()[0];
      const audioTrack = stream.getAudioTracks()[0];

      if (videoTrack) {
        const producer = await sendTransportRef.current.produce({ track: videoTrack, appData: { kind: 'video' } });
        dispatch({ type: 'ADD_PRODUCER', payload: { producer } });
      }
      if (audioTrack) {
        const producer = await sendTransportRef.current.produce({ track: audioTrack, appData: { kind: 'audio' } });
        dispatch({ type: 'ADD_PRODUCER', payload: { producer } });
      }
      setIsStreaming(true);
    } catch (err) { handleError(err as Error, 'Start streaming') }
  }, [isStreaming, createTransport, handleError]);

  const toggleMedia = useCallback((type: "video" | "audio") => {
    const producer = Array.from(state.producers.values()).find(p => p.kind === type);
    if (!producer) return;
    if (producer.paused) producer.resume();
    else producer.pause();
    setMediaDeviceStatus(prev => ({ ...prev, [type]: !prev[type] }));
  }, [state.producers]);

  const toggleHLS = useCallback(() => {
    const event = isHlsEnabled ? SOCKET_EVENTS.STOP_HLS : SOCKET_EVENTS.START_HLS;
    socketRef.current?.emit(event, { roomId });
  }, [isHlsEnabled, roomId]);

  const copyToClipboard = useCallback(async (text: string) => {
    try { await navigator.clipboard.writeText(text) }
    catch (err) { handleError(err as Error, "Copy to Clipboard") }
  }, [handleError]);

  const getRemoteVideoRef = useCallback((participantId: string) => (el: HTMLVideoElement | null) => {
    const videoEl = remoteVideoRefs.current.get(participantId);
    if(el && !videoEl) {
        const stream = remoteStreams.get(participantId);
        if(stream) {
            const mediaStream = new MediaStream();
            if (stream.videoTrack) mediaStream.addTrack(stream.videoTrack);
            if (stream.audioTrack) mediaStream.addTrack(stream.audioTrack);
            el.srcObject = mediaStream;
            el.play().catch(e => console.warn(`Autoplay failed for ${participantId}`, e));
        }
        remoteVideoRefs.current.set(participantId, el);
    }
  }, [remoteStreams]);

  // Keep existing video elements in sync when new remote tracks arrive
  useEffect(() => {
    remoteVideoRefs.current.forEach((el, participantId) => {
      if (!el) return;
      const stream = remoteStreams.get(participantId);
      if (!stream) return;
      const mediaStream = (el.srcObject as MediaStream) || new MediaStream();
      const currentVideo = mediaStream.getVideoTracks()[0];
      const currentAudio = mediaStream.getAudioTracks()[0];
      if (stream.videoTrack && stream.videoTrack !== currentVideo) {
        if (currentVideo) mediaStream.removeTrack(currentVideo);
        mediaStream.addTrack(stream.videoTrack);
      }
      if (stream.audioTrack && stream.audioTrack !== currentAudio) {
        if (currentAudio) mediaStream.removeTrack(currentAudio);
        mediaStream.addTrack(stream.audioTrack);
      }
      if (el.srcObject !== mediaStream) {
        el.srcObject = mediaStream;
      }
      // Attempt play in case browser paused due to autoplay policy
      el.play().catch(() => {});
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
    selfId: socketRef.current?.id || null,
    localVideoRef,
    getRemoteVideoRef,
    mediaDeviceStatus,
    hlsUrl,
    isHlsEnabled,
    actions: { startStreaming, leaveRoom: cleanup, toggleMedia, toggleHLS, copyToClipboard },
  };
};
