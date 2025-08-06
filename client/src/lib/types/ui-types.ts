import { MediaDeviceStatus, Participant } from "./stream-types";

export interface StreamHeaderProps {
  isConnected: boolean;
  sidebarOpen: boolean;
  onLeave: () => void;
  onToggleSidebar: () => void;
}

export interface VideoStageProps {
  isStreaming: boolean;
  localVideoRef: React.RefObject<HTMLVideoElement>;
  remoteParticipants: Participant[];
  getRemoteVideoRef: (
    participantId: string
  ) => (el: HTMLVideoElement | null) => void;
  onStartStreaming: () => void;
  isReady: boolean;
}

export interface PreStreamOverlayProps {
  onStartStreaming: () => void;
  isReady: boolean;
  hasGuest: boolean;
}

export interface StreamControlProps {
  mediaStatus: MediaDeviceStatus;
  onToggleMedia: (type: "video" | "audio") => void;
  onStopStreaming: () => void;
}

export interface StreamSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  participants: Participant[];
  selfId?: string;
  roomId: string;
  isStreaming: boolean;
  isHlsEnabled: boolean;
  hlsUrl: string | null;
  onToggleHLS: () => void;
  onCopy: (text: string) => void;
}
