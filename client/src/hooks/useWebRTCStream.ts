"use client";

import { useEffect, useReducer, useRef, useCallback, useState, useMemo } from "react";
import { io, Socket } from "socket.io-client";
import { MediaDeviceStatus, RemoteStream } from "@/lib/types/stream-types";
import { ClientToServerEvents, ServerToClientEvents } from "@relay-app/shared";
import { initialState, webrtcReducer } from "@/lib/webrtc-utils/reducer";
import { createMediasoupManager, MediasoupManager } from "@/lib/webrtc-utils/MediasoupManager";

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

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

  const socketRef = useRef<TypedSocket | null>(null);
  const mediasoupManagerRef = useRef<MediasoupManager | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRefs = useRef<Map<string, HTMLVideoElement | null>>(new Map());

  const socketUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const isLocal = hostname === "localhost";
    const port = isLocal ? ":3001" : "";
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

  const handleError = useCallback((err: Error | string, context?: string) => {
    const message = err instanceof Error ? err.message : err;
    const errorMessage = context ? `${context}: ${message}` : message;
    console.error(errorMessage);
    setError(errorMessage);
  }, []);

  const cleanup = useCallback(() => {
    console.log("Cleaning up WebRTC resources...");
    mediasoupManagerRef.current?.close();
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    socketRef.current?.disconnect();
    
    dispatch({ type: "RESET_STATE" });
    setIsConnected(false);
    setIsStreaming(false);
    setHlsUrl(null);
    setIsHlsEnabled(false);
    setRemoteStreams(new Map());
    setSelfId(null);
    setError(null);
  }, []);

  useEffect(() => {
    if (!roomId || !name || !role) return;

    const socket = io(socketUrl, { transports: ["websocket"], path: "/socket.io" });
    socketRef.current = socket;
    const msManager = createMediasoupManager(socket, iceServers);
    mediasoupManagerRef.current = msManager;

    socket.on("connect", () => {
      setIsConnected(true);
      socket.emit("join-room", { roomId, name, role }, (res: { error: string | Error; }) => {
        if (res.error) handleError(res.error, "Joining Room");
      });
    });

    socket.on("room-joined", async (data) => {
      dispatch({ type: "ROOM_JOINED", payload: { participants: data.room.participants } });
      setSelfId(data.participantId);
      setIsHlsEnabled(data.isHlsEnabled);
      if(data.hlsUrl) setHlsUrl(data.hlsUrl);

      await msManager.loadDevice(data.routerRtpCapabilities);
      await msManager.createTransport("recv");

      for (const { producerId, participantId } of data.existingProducers) {
        const consumer = await msManager.consume(producerId, participantId);
        if (consumer) dispatch({ type: "ADD_CONSUMER", payload: { consumer } });
      }
      if(data.existingProducers.length > 0) setIsStreaming(true);
    });

    socket.on("new-participant", ({ participant }) => dispatch({ type: "NEW_PARTICIPANT", payload: { participant }}));
    socket.on("participant-left", ({ participantId }) => dispatch({ type: "PARTICIPANT_LEFT", payload: { participantId }}));
    socket.on("new-producer", async ({ producerId, participantId }) => {
        const consumer = await msManager.consume(producerId, participantId);
        if (consumer) dispatch({ type: "ADD_CONSUMER", payload: { consumer } });
    });
    socket.on("producer-closed", ({ producerId }) => {
        const consumer = Array.from(state.consumers.values()).find(c => c.producerId === producerId);
        if (consumer) {
            consumer.close();
            dispatch({ type: "REMOVE_CONSUMER", payload: { consumerId: consumer.id }});
        }
    });

    socket.on("hls-started", ({ hlsUrl }) => { setIsHlsEnabled(true); setHlsUrl(hlsUrl); });
    socket.on("hls-stopped", () => { setIsHlsEnabled(false); setHlsUrl(null); });
    socket.on("disconnect", () => { setIsConnected(false); handleError("Disconnected from server."); });

    return () => cleanup();
  }, [roomId, name, role, socketUrl, iceServers, cleanup, handleError, state.consumers]);
  
  useEffect(() => {
    const newRemoteStreams = new Map<string, RemoteStream>();
    for(const consumer of state.consumers.values()){
        const { participantId } = consumer.appData;
        if(!participantId || typeof participantId !== 'string') continue;

        const stream = newRemoteStreams.get(participantId) || {};
        const trackKey = consumer.kind === "video" ? "videoTrack" : "audioTrack";
        newRemoteStreams.set(participantId, { ...stream, [trackKey]: consumer.track });
    }
    setRemoteStreams(newRemoteStreams);
  }, [state.consumers]);

  const startStreaming = useCallback(async () => {
    if (state.producers.size > 0) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      const msManager = mediasoupManagerRef.current;
      if (!msManager) throw new Error("MediasoupManager not initialized");
      
      await msManager.createTransport("send");
      
      const videoProducer = await msManager.produce(stream.getVideoTracks()[0]);
      const audioProducer = await msManager.produce(stream.getAudioTracks()[0]);

      if (videoProducer) dispatch({ type: "ADD_PRODUCER", payload: { producer: videoProducer } });
      if (audioProducer) dispatch({ type: "ADD_PRODUCER", payload: { producer: audioProducer } });
      
      if(selfId) {
        dispatch({ type: "UPDATE_PARTICIPANT", payload: { participantId: selfId, patch: { hasVideo: true, hasAudio: true } } });
      }

      setIsStreaming(true);
    } catch (err) { handleError(err as Error, "Start Streaming") }
  }, [state.producers, handleError, selfId]);

  const toggleMedia = useCallback((type: "video" | "audio") => {
    const producer = Array.from(state.producers.values()).find(p => p.kind === type);
    if (!producer) return;
    
    if (producer.paused) producer.resume();
    else producer.pause();

    const isEnabled = !producer.paused;
    setMediaDeviceStatus(prev => ({ ...prev, [type]: isEnabled }));
    if(selfId) {
        const patch = type === 'video' ? { hasVideo: isEnabled } : { hasAudio: isEnabled };
        dispatch({ type: 'UPDATE_PARTICIPANT', payload: { participantId: selfId, patch } });
    }
  }, [state.producers, selfId]);
  
  const toggleHLS = useCallback(() => {
    const event = isHlsEnabled ? "stop-hls" : "start-hls";
    socketRef.current?.emit(event, { roomId });
  }, [isHlsEnabled, roomId]);

  const getRemoteVideoRef = useCallback((participantId: string) => (el: HTMLVideoElement | null) => {
    if (el) remoteVideoRefs.current.set(participantId, el);
    else remoteVideoRefs.current.delete(participantId);
  }, []);

  useEffect(() => {
    remoteVideoRefs.current.forEach((el, participantId) => {
      if (!el) return;
      const streamData = remoteStreams.get(participantId);
      
      let mediaStream = el.srcObject as MediaStream;
      if (!streamData) {
        if(mediaStream) el.srcObject = null;
        return;
      }
      
      if (!mediaStream) {
        mediaStream = new MediaStream();
        el.srcObject = mediaStream;
      }

      const currentVideoTrack = mediaStream.getVideoTracks()[0];
      if (streamData.videoTrack && currentVideoTrack?.id !== streamData.videoTrack.id) {
          if(currentVideoTrack) mediaStream.removeTrack(currentVideoTrack);
          mediaStream.addTrack(streamData.videoTrack);
      }
      
      const currentAudioTrack = mediaStream.getAudioTracks()[0];
      if (streamData.audioTrack && currentAudioTrack?.id !== streamData.audioTrack.id) {
          if(currentAudioTrack) mediaStream.removeTrack(currentAudioTrack);
          mediaStream.addTrack(streamData.audioTrack);
      }

      el.play().catch(e => console.warn(`Autoplay failed for ${participantId}:`, e));
    });
  }, [remoteStreams]);

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
      toggleHLS, 
    } 
  };
};
