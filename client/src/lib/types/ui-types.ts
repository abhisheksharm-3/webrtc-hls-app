import { Participant } from "@relay-app/shared";
import { MediaDeviceStatus } from "./stream-types";
import { UserRole } from "@/store/app-store";
import { LucideIcon } from "lucide-react";

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
  getRemoteVideoRef: (
    participantId: string
  ) => (el: HTMLVideoElement | null) => void;
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
}

export interface PlayerControlProps {
  isPlaying: boolean;
  isMuted: boolean;
  onPlayPause: () => void;
  onMuteToggle: () => void;
  onFullscreen: () => void;
}
export type JoinRoomDialogPropsType = {
  roomId: string;
  setRoomId: (id: string) => void;
  onJoinRoom: () => void;
  onWatchRoom: () => void;
  children: React.ReactNode;
};

export type JoinModeType = "participate" | "watch";
export type FooterLink = 
  | {
      name: string;
      href: string;
      icon?: LucideIcon;
    }
  | {
      name: string;
      variant: "primary" | "purple" | "emerald" | "blue";
    };
export type NavLinkItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  description: string;
};