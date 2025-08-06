export interface Participant {
  id: string;
  roomId: string;
  socketId: string;
  isHost: boolean;
  isViewer?: boolean;
  isStreaming: boolean;
  hasVideo: boolean;
  hasAudio: boolean;
  joinedAt: Date;
}

export interface ParticipantUpdate {
  hasVideo?: boolean;
  hasAudio?: boolean;
  isStreaming?: boolean;
  isViewer?: boolean;
}
