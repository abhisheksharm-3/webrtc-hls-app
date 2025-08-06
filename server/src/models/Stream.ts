export interface Stream {
  id: string;
  roomId: string;
  type: 'webrtc' | 'hls';
  isActive: boolean;
  startedAt: Date;
  endedAt?: Date;
  metadata?: {
    bitrate?: number;
    fps?: number;
    resolution?: {
      width: number;
      height: number;
    };
    codec?: string;
  };
}

export interface HLSConfig {
  segmentDuration: number;
  listSize: number;
  outputPath: string;
  playlistName: string;
}
