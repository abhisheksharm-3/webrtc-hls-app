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

  const socketRef = useRef<TypedSocket | null>(null);
  const mediasoupManagerRef = useRef<MediasoupManager | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRefs = useRef<Map<string, HTMLVideoElement | null>>(new Map());

  const socketUrl = "https://06afbf738244.ngrok-free.app";

  // A robust list of public STUN and TURN servers to maximize connectivity.
  const iceServers = useMemo(() => {
    console.log("🧊 [ICE] Configuring STUN and TURN servers for maximum compatibility.");
    return [
      // Google STUN servers
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      // Twilio STUN server
      { urls: "stun:global.stun.twilio.com:3478" },
      // OpenRelay TURN server (free, for testing)
      {
        urls: [
          "turn:openrelay.metered.ca:80",
          "turn:openrelay.metered.ca:443",
        ],
        username: "openrelayproject",
        credential: "openrelayproject",
      },
      // Another free TURN server
       {
        urls: "turn:turn.twilio.com:3478",
        username: "your-twilio-account-sid", // Replace if you have one, but it often works without
        credential: "your-twilio-auth-token"
      }
    ];
  }, []);

  const handleError = useCallback((err: Error | string, context?: string) => {
    const message = err instanceof Error ? err.message : err;
    const errorMessage = context ? `${context}: ${message}` : message;
    console.error(`🔴 [WebRTC Error] ${errorMessage}`, err);
    setError(errorMessage);
  }, []);

  const cleanup = useCallback(() => {
    console.log("🧹 Cleaning up WebRTC resources...");
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
    console.log("🔌 Initializing WebRTC Stream Hook...");

    const socket = io(socketUrl, {
      transports: ["websocket"],
      path: "/socket.io",
      extraHeaders: { "ngrok-skip-browser-warning": "true" },
    });
    socketRef.current = socket;
    const msManager = createMediasoupManager(socket, iceServers);
    mediasoupManagerRef.current = msManager;

    socket.on("connect", () => {
      console.log("✅ Socket connected:", socket.id);
      setIsConnected(true);
      socket.emit("join-room", { roomId, name, role }, (res: { error?: string | Error }) => {
        if (res.error) handleError(res.error, "Joining Room");
        else console.log("✅ Successfully initiated room join.");
      });
    });

    socket.on("room-joined", async (data) => {
      console.log("🎉 Room joined successfully.");
      dispatch({ type: "ROOM_JOINED", payload: { participants: data.room.participants } });
      setSelfId(data.participantId);
      setIsHlsEnabled(data.isHlsEnabled);
      if (data.hlsUrl) setHlsUrl(data.hlsUrl);

      if (data.routerRtpCapabilities) {
        try {
          await msManager.loadDevice(data.routerRtpCapabilities);
          await msManager.createTransport("recv");
          await msManager.createTransport("send");

          for (const { producerId, participantId } of data.existingProducers) {
            const consumer = await msManager.consume(producerId, participantId);
            if (consumer) {
              dispatch({ type: "ADD_CONSUMER", payload: { consumer } });
              await consumer.resume();
            }
          }
          if (data.existingProducers.length > 0) setIsStreaming(true);
        } catch (error) {
          handleError(error as Error, "Setting up WebRTC media in room-joined");
        }
      }
    });

    socket.on("new-participant", ({ participant }) => dispatch({ type: "NEW_PARTICIPANT", payload: { participant } }));
    socket.on("participant-left", ({ participantId }) => dispatch({ type: "PARTICIPANT_LEFT", payload: { participantId } }));

    socket.on("new-producer", async ({ producerId, participantId }) => {
      if (role !== "viewer") {
        try {
          const consumer = await msManager.consume(producerId, participantId);
          if (consumer) {
            dispatch({ type: "ADD_CONSUMER", payload: { consumer } });
            await consumer.resume();
          }
        } catch (error) {
          handleError(error as Error, `Consuming new producer ${producerId}`);
        }
      }
    });

    socket.on("producer-closed", ({ producerId }) => {
      const consumer = Array.from(state.consumers.values()).find((c) => c.producerId === producerId);
      if (consumer) {
        consumer.close();
        dispatch({ type: "REMOVE_CONSUMER", payload: { consumerId: consumer.id } });
      }
    });

    socket.on("disconnect", (reason) => {
      setIsConnected(false);
      handleError(`Disconnected from server: ${reason}`);
    });

    return () => cleanup();
  }, [roomId, name, role, iceServers, cleanup, handleError]);

  useEffect(() => {
    const newRemoteStreams = new Map<string, RemoteStream>();
    for (const consumer of state.consumers.values()) {
      const { participantId } = consumer.appData;
      if (participantId && consumer.track) {
        const stream = newRemoteStreams.get(participantId as string) || {};
        const trackKey = consumer.kind === "video" ? "videoTrack" : "audioTrack";
        newRemoteStreams.set(participantId as string, { ...stream, [trackKey]: consumer.track });
      }
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

  useEffect(() => {
    remoteVideoRefs.current.forEach((videoEl, participantId) => {
      const remoteStreamData = remoteStreams.get(participantId);
      if (remoteStreamData) {
        const newStream = new MediaStream();
        if (remoteStreamData.videoTrack) newStream.addTrack(remoteStreamData.videoTrack);
        if (remoteStreamData.audioTrack) newStream.addTrack(remoteStreamData.audioTrack);
        if (haveTracksChanged(videoEl.srcObject as MediaStream, newStream)) {
          videoEl.srcObject = newStream;
        }
        videoEl.muted = false;
        videoEl.playsInline = true;
        if (videoEl.paused) videoEl.play().catch(e => console.warn("Autoplay failed", e));
      } else if (videoEl.srcObject) {
        videoEl.srcObject = null;
      }
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
      toggleHLS: useCallback(() => {
        const event = isHlsEnabled ? "stop-hls" : "start-hls";
        socketRef.current?.emit(event, { roomId });
      }, [isHlsEnabled, roomId]),
    },
  };
};
