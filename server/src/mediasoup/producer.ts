import { types as mediasoupTypes } from 'mediasoup';
import { MediasoupTransport } from './transport';
import { logger } from '../utils/logger';

export class MediasoupProducer {
  private static instance: MediasoupProducer;
  private producers: Map<string, mediasoupTypes.Producer> = new Map();

  public static getInstance(): MediasoupProducer {
    if (!MediasoupProducer.instance) {
      MediasoupProducer.instance = new MediasoupProducer();
    }
    return MediasoupProducer.instance;
  }

  async createProducer(
    transportId: string,
    kind: mediasoupTypes.MediaKind,
    rtpParameters: mediasoupTypes.RtpParameters
  ): Promise<mediasoupTypes.Producer> {
    try {
      const transport = MediasoupTransport.getInstance().getTransport(transportId);
      if (!transport) {
        throw new Error(`Transport not found: ${transportId}`);
      }

      const producer = await (transport as mediasoupTypes.WebRtcTransport).produce({
        kind,
        rtpParameters,
      });

      // Add event listeners to the producer
      producer.on('transportclose', () => {
        logger.warn(`Producer transport closed: ${producer.id}`);
        this.producers.delete(producer.id);
      });

      producer.on('score', (score) => {
        if (score.some(s => s.score < 5)) {
          logger.warn(`Producer ${producer.id} has low score:`, score);
        }
      });

      this.producers.set(producer.id, producer);
      logger.info(`Producer created: ${producer.id} (${kind})`);

      return producer;
    } catch (error) {
      logger.error(`Error creating producer:`, error);
      throw error;
    }
  }

  getProducer(producerId: string): mediasoupTypes.Producer | undefined {
    return this.producers.get(producerId);
  }

  async pauseProducer(producerId: string): Promise<void> {
    const producer = this.producers.get(producerId);
    if (producer && !producer.paused) {
      await producer.pause();
      logger.info(`Producer paused: ${producerId}`);
    }
  }

  async resumeProducer(producerId: string): Promise<void> {
    const producer = this.producers.get(producerId);
    if (producer && producer.paused) {
      await producer.resume();
      logger.info(`Producer resumed: ${producerId}`);
    }
  }

  async closeProducer(producerId: string): Promise<void> {
    const producer = this.producers.get(producerId);
    if (producer) {
      producer.close();
      this.producers.delete(producerId);
      logger.info(`Producer closed: ${producerId}`);
    }
  }

  getAllProducers(): Map<string, mediasoupTypes.Producer> {
    return this.producers;
  }

  getProducersByKind(kind: mediasoupTypes.MediaKind): mediasoupTypes.Producer[] {
    return Array.from(this.producers.values()).filter(producer => producer.kind === kind);
  }

  async closeAllProducers(): Promise<void> {
    for (const [producerId, producer] of this.producers) {
      producer.close();
      logger.info(`Producer closed: ${producerId}`);
    }
    this.producers.clear();
  }

  getProducerStats(): any[] {
    return Array.from(this.producers.entries()).map(([producerId, producer]) => ({
      producerId,
      kind: producer.kind,
      paused: producer.paused,
      closed: producer.closed,
    }));
  }
}
