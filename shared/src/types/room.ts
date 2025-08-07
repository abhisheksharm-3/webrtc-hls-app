export interface Room {
  id: string;
  name: string;
  isActive: boolean;
  hlsUrl?: string;
  participants: Participant[];
  createdAt: Date;
}

/**
 * Represents a user in a room.
 * This is the data model used for storage and for client-side state.
 */
export interface Participant {
  id: string; // Unique participant ID (e.g., from database)
  socketId: string; // The user's current Socket.IO connection ID
  name: string; // Display name for the participant
  isHost: boolean; // True if this participant created the room
  isViewer: boolean; // True if this participant is an HLS viewer only
  hasVideo: boolean; // True if the participant's video is on
  hasAudio: boolean; // True if the participant's audio is on
  joinedAt: Date;
}

/**
 * Defines the fields that can be updated for a participant.
 * Used for requests to change a participant's state (e.g., toggle video).
 */
export interface ParticipantUpdate {
  name?: string;
  hasVideo?: boolean;
  hasAudio?: boolean;
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

/**
 * Defines the fields that can be updated for a room.
 * Used for requests to change a room's state (e.g., rename room, toggle active status).
 */
export interface RoomUpdateInput {
  name?: string;
  isActive?: boolean;
  hlsUrl?: string;
}
