import type {Participant} from "@relay-app/shared";
/**
 * Local media device on/off status.
 */
export interface MediaDeviceStatus {
  video: boolean;
  audio: boolean;
}

/**
 * Holds the tracks for a remote participant's stream.
 */
export interface RemoteStream {
  videoTrack?: MediaStreamTrack;
  audioTrack?: MediaStreamTrack;
}

/**
 * Socket event payloads for creating a transport.
 */
export interface TransportParams {
  id: string;
  iceParameters: object;
  iceCandidates: object[];
  dtlsParameters: object;
}

/**
 * Main interface for the return value of our custom hook.
 */
export interface WebRTCStreamHook {
  isConnected: boolean;
  isStreaming: boolean;
  error: string | null;
  participants: Participant[];
  selfId: string | undefined;
  userRole: 'host' | 'guest' | 'viewer';
  localVideoRef: React.RefObject<HTMLVideoElement>;
  getRemoteVideoRef: (participantId: string) => (el: HTMLVideoElement | null) => void;
  mediaDeviceStatus: MediaDeviceStatus;
  hlsUrl: string | null;
  isHlsEnabled: boolean;
  actions: {
    startStreaming: () => Promise<void>;
    stopStreaming: () => void;
    toggleMedia: (type: "video" | "audio") => void;
    toggleHLS: () => void;
    copyToClipboard: (text: string) => void;
    leaveRoom: () => void;
  };
}

export interface StreamMetadata {
  id: string;
  roomId: string;
  hlsUrl: string;
  title: string;
  isLive: boolean;
  viewers: number;
  startedAt: Date;
}
export interface StreamPlayerProps {
  currentStream: StreamMetadata;
  allStreams: StreamMetadata[];
  onSelectStream: (stream: StreamMetadata) => void;
  onPlaybackError: (message: string) => void;
}