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
  public consumers = new Map<string, mediasoupTypes.Consumer>(); // Made public for event handlers

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

  /** Returns current producer ids for this participant */
  getProducerIds(): string[] { return Array.from(this.producers.keys()); }

  /** Returns current consumer ids for this participant */
  getConsumerIds(): string[] { return Array.from(this.consumers.keys()); }

  /** Get a specific consumer by ID */
  getConsumer(consumerId: string): mediasoupTypes.Consumer | undefined {
    return this.consumers.get(consumerId);
  }

  /** Remove a consumer by ID */
  removeConsumer(consumerId: string): void {
    this.consumers.delete(consumerId);
  }

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

  /**
   * Debug method to get transport information
   */
  getTransportDebugInfo(): string {
    const transportInfo = Array.from(this.transports.values()).map(t => 
      `${t.id}(${t.appData.direction || 'no-direction'})`
    );
    return `Participant ${this.id} has ${this.transports.size} transports: [${transportInfo.join(', ')}]`;
  }

  /**
   * Finds the transport designated for sending media.
   * @returns The 'send' transport instance, or undefined if not found.
   */
  getSendTransport(): mediasoupTypes.Transport | undefined {
    for (const transport of this.transports.values()) {
      if (transport.appData.direction === 'send') {
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