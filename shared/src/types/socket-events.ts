// Client to Server Events
export interface ClientToServerEvents {
  'join-room': (data: { roomId: string; name: string; role: 'host' | 'guest' | 'viewer' }) => void;
  'leave-room': () => void;
  'create-transport': (data: { direction: 'send' | 'recv' }) => void;
  'connect-transport': (data: { transportId: string; dtlsParameters: any; }) => void;
  'produce': (data: { transportId: string; kind: 'audio' | 'video'; rtpParameters: any; }) => void;
  'consume': (data: { producerId: string; rtpCapabilities: any; }) => void;
  'start-hls': (data: { roomId: string }) => void;
  'stop-hls': (data: { roomId: string }) => void;
}

// Server to Client Events
export interface ServerToClientEvents {
  'room-joined': (data: {
    room: any;
    participantId: string;
    routerRtpCapabilities: any | null;
    existingProducers?: { producerId: string; participantId: string }[];
  }) => void;
  'new-participant': (data: { participant: any }) => void;
  'participant-left': (data: { participantId: string }) => void;
  'new-producer': (data: { producerId: string; participantId: string; }) => void;
  'producer-closed': (data: { producerId: string; participantId: string; }) => void;
  'hls-started': (data: { roomId: string; playlistUrl: string; }) => void;
  'hls-stopped': (data: { roomId: string }) => void;
  'error': (data: { message: string; code?: string }) => void;
}

// Socket Event Types
export type SocketEvent = keyof ClientToServerEvents | keyof ServerToClientEvents;
