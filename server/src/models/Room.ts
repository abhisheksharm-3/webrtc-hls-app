import { types as mediasoupTypes } from 'mediasoup';

export interface Room {
  id: string;
  name: string;
  isActive: boolean;
  participantCount: number;
  hlsUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  router?: mediasoupTypes.Router;
  participants: Map<string, Participant>;
  producers: Map<string, mediasoupTypes.Producer>;
  hlsProcess?: any;
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
  transports: Map<string, mediasoupTypes.Transport>;
  producers: Map<string, mediasoupTypes.Producer>;
  consumers: Map<string, mediasoupTypes.Consumer>;
}

export interface CreateRoomRequest {
  name: string;
}

export interface JoinRoomRequest {
  roomId: string;
}
