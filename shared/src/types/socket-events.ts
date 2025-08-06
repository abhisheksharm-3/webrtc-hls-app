// Client to Server Events
export interface ClientToServerEvents {
  'join-room': (data: { roomId: string }) => void;
  'leave-room': () => void;
  'create-transport': (data: { direction: 'send' | 'recv' }) => void;
  'connect-transport': (data: { 
    transportId: string; 
    dtlsParameters: any; 
  }) => void;
  'produce': (data: { 
    transportId: string; 
    kind: 'audio' | 'video'; 
    rtpParameters: any; 
  }) => void;
  'consume': (data: { 
    transportId: string; 
    producerId: string; 
    rtpCapabilities: any; 
  }) => void;
  'pause-producer': (data: { producerId: string }) => void;
  'resume-producer': (data: { producerId: string }) => void;
  'close-producer': (data: { producerId: string }) => void;
  'pause-consumer': (data: { consumerId: string }) => void;
  'resume-consumer': (data: { consumerId: string }) => void;
}

// Server to Client Events
export interface ServerToClientEvents {
  'room-joined': (data: { 
    roomId: string; 
    participants: any[]; 
    routerRtpCapabilities: any; 
  }) => void;
  'participant-joined': (data: { participant: any }) => void;
  'participant-left': (data: { participantId: string }) => void;
  'new-producer': (data: { 
    producerId: string; 
    participantId: string; 
    kind: 'audio' | 'video'; 
  }) => void;
  'producer-closed': (data: { 
    producerId: string; 
    participantId: string; 
  }) => void;
  'transport-created': (data: { 
    transportId: string; 
    iceParameters: any; 
    iceCandidates: any; 
    dtlsParameters: any; 
  }) => void;
  'transport-connected': (data: { transportId: string }) => void;
  'produced': (data: { producerId: string }) => void;
  'consumed': (data: { 
    consumerId: string; 
    producerId: string; 
    kind: 'audio' | 'video'; 
    rtpParameters: any; 
  }) => void;
  'hls-started': (data: { 
    roomId: string; 
    playlistUrl: string; 
  }) => void;
  'hls-stopped': (data: { roomId: string }) => void;
  'error': (data: { message: string; code?: string }) => void;
}

// Socket Event Types
export type SocketEvent = keyof ClientToServerEvents | keyof ServerToClientEvents;
