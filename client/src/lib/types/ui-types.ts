import { MediaDeviceStatus, Participant } from "./stream-types";
import { UserRole } from "@/store/app-store";

export interface StreamHeaderProps {
  roomCode: string;
  userRole: UserRole;
  participantCount: number;
  isStreaming: boolean;
  onLeaveRoom: () => void;
  onToggleHLS: () => void;
  isHlsEnabled: boolean;
}

export interface VideoStageProps {
  localVideoRef: React.RefObject<HTMLVideoElement>;
  participants: Participant[];
  selfId: string | undefined;
  getRemoteVideoRef: (participantId: string) => (el: HTMLVideoElement | null) => void;
  userRole: UserRole;
  isStreaming: boolean;
}

export interface PreStreamOverlayProps {
  roomCode: string;
  userRole: UserRole;
  isConnected: boolean;
  onStartStream: () => Promise<void>;
  onLeaveRoom: () => void;
  participants: Participant[];
  error: string | null;
}

export interface StreamControlProps {
  mediaDeviceStatus: MediaDeviceStatus;
  onToggleMedia: (type: "video" | "audio") => void;
  onLeaveRoom: () => void;
  userRole: UserRole;
  isStreaming: boolean;
}

export interface StreamSidebarProps {
  roomCode: string;
  participants: Participant[];
  selfId: string | undefined;
  userRole: UserRole;
  hlsUrl: string | null;
  onCopyToClipboard: (text: string) => Promise<void>;
}

export interface PlayerControlProps {
  isPlaying: boolean;
  isMuted: boolean;
  onPlayPause: () => void;
  onMuteToggle: () => void;
  onFullscreen: () => void;
}