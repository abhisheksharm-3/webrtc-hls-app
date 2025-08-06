export interface Room {
  id: string;
  name: string;
  isActive: boolean;
  participantCount: number;
  hlsUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Participant {
  id: string;
  roomId: string;
  socketId: string;
  isHost: boolean;
  isStreaming: boolean;
  hasVideo: boolean;
  hasAudio: boolean;
  joinedAt: Date;
}

export interface StreamStats {
  bitrate: number;
  fps: number;
  resolution: {
    width: number;
    height: number;
  };
  codec: string;
}
