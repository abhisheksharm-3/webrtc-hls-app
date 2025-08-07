import { types as mediasoupTypes } from 'mediasoup';
import { Participant as PlainParticipant } from '@relay-app/shared';

/**
 * Represents the server's live, in-memory state for a Participant.
 */
export class LiveParticipant {
  public readonly id: string;
  public readonly socketId: string;
  public readonly roomId: string;
  
  // State properties
  public name: string;
  public isHost: boolean;
  public isViewer: boolean;
  public hasVideo = false;
  public hasAudio = false;
  public joinedAt = new Date();
  
  // Mediasoup resources
  private transports = new Map<string, mediasoupTypes.Transport>();
  private producers = new Map<string, mediasoupTypes.Producer>();
  private consumers = new Map<string, mediasoupTypes.Consumer>();

  constructor(id: string, socketId: string, roomId: string, name: string, isHost: boolean, isViewer: boolean) {
    this.id = id;
    this.socketId = socketId;
    this.roomId = roomId;
    this.name = name;
    this.isHost = isHost;
    this.isViewer = isViewer;
  }

  addTransport(transport: mediasoupTypes.Transport) { this.transports.set(transport.id, transport); }
  addProducer(producer: mediasoupTypes.Producer) { this.producers.set(producer.id, producer); }
  addConsumer(consumer: mediasoupTypes.Consumer) { this.consumers.set(consumer.id, consumer); }

  close() {
    this.transports.forEach(transport => transport.close());
    this.transports.clear();
    this.producers.clear();
    this.consumers.clear();
  }

  /**
   * Finds the transport designated for receiving media.
   * @returns The 'recv' transport instance, or undefined if not found.
   */
  getRecvTransport(): mediasoupTypes.Transport | undefined {
    for (const transport of this.transports.values()) {
      // We identify the 'recv' transport by checking its appData,
      // which is set during the 'create-transport' event.
      if (transport.appData.direction === 'recv') {
        return transport;
      }
    }
    return undefined;
  }

  toPlainObject(): PlainParticipant {
    return {
      id: this.id,
      socketId: this.socketId,
      name: this.name,
      isHost: this.isHost,
      isViewer: this.isViewer,
      hasVideo: this.hasVideo,
      hasAudio: this.hasAudio,
      joinedAt: this.joinedAt,
    };
  }
}