import { types as mediasoupTypes } from 'mediasoup';
import type { ChildProcess } from 'child_process';
import { LiveParticipant } from './Participant';
import { Room as PlainRoom } from '@relay-app/shared';

// Interface for HLS-specific data
interface HlsAppData {
  transports?: mediasoupTypes.PlainTransport[];
  consumers?: mediasoupTypes.Consumer[];
  sdpPath?: string;
}

/**
 * Represents the server's live, in-memory state for a Room.
 */
export class LiveRoom {
  public readonly id: string;
  public readonly router: mediasoupTypes.Router;
  public hlsProcess?: ChildProcess;
  public appData: { hls?: HlsAppData } = {};
  public participants = new Map<string, LiveParticipant>();
  
  constructor(id: string, router: mediasoupTypes.Router) {
    this.id = id;
    this.router = router;
    this.appData = {};
    
    router.on('@close', () => {
      this.hlsProcess?.kill();
      // Clean up HLS resources when router closes
      this.appData.hls?.transports?.forEach(transport => {
        if (!transport.closed) transport.close();
      });
      this.appData.hls?.consumers?.forEach(consumer => {
        if (!consumer.closed) consumer.close();
      });
    });
  }
  
  addParticipant(participant: LiveParticipant) {
    this.participants.set(participant.socketId, participant);
  }
  
  removeParticipant(socketId: string) {
    this.participants.get(socketId)?.close();
    this.participants.delete(socketId);
  }
  
  /**
   * Creates a serializable, plain data object from this live room instance.
   * @param dbRoomData - The corresponding room data from the database.
   */
  toPlainObject(dbRoomData: { name: string, createdAt: Date, hlsUrl?: string | null }): PlainRoom {
    return {
      id: this.id,
      name: dbRoomData.name,
      isActive: !this.router.closed,
      hlsUrl: dbRoomData.hlsUrl || undefined,
      participants: Array.from(this.participants.values()).map(p => p.toPlainObject()),
      createdAt: dbRoomData.createdAt,
    };
  }
}