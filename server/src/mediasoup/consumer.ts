import { types as mediasoupTypes } from 'mediasoup';
import { MediasoupTransport } from './transport';
import { MediasoupProducer } from './producer';
import { logger } from '../utils/logger';

export class MediasoupConsumer {
  private static instance: MediasoupConsumer;
  private consumers: Map<string, mediasoupTypes.Consumer> = new Map();

  public static getInstance(): MediasoupConsumer {
    if (!MediasoupConsumer.instance) {
      MediasoupConsumer.instance = new MediasoupConsumer();
    }
    return MediasoupConsumer.instance;
  }

  async createConsumer(
    transportId: string,
    producerId: string,
    rtpCapabilities: mediasoupTypes.RtpCapabilities
  ): Promise<mediasoupTypes.Consumer> {
    try {
      const transport = MediasoupTransport.getInstance().getTransport(transportId);
      if (!transport) {
        throw new Error(`Transport not found: ${transportId}`);
      }

      const producer = MediasoupProducer.getInstance().getProducer(producerId);
      if (!producer) {
        throw new Error(`Producer not found: ${producerId}`);
      }

      const consumer = await (transport as mediasoupTypes.WebRtcTransport).consume({
        producerId,
        rtpCapabilities,
        paused: true, // Start paused
      });

      this.consumers.set(consumer.id, consumer);
      logger.info(`Consumer created: ${consumer.id} for producer ${producerId}`);

      return consumer;
    } catch (error) {
      logger.error(`Error creating consumer:`, error);
      throw error;
    }
  }

  getConsumer(consumerId: string): mediasoupTypes.Consumer | undefined {
    return this.consumers.get(consumerId);
  }

  async pauseConsumer(consumerId: string): Promise<void> {
    const consumer = this.consumers.get(consumerId);
    if (consumer && !consumer.paused) {
      await consumer.pause();
      logger.info(`Consumer paused: ${consumerId}`);
    }
  }

  async resumeConsumer(consumerId: string): Promise<void> {
    const consumer = this.consumers.get(consumerId);
    if (consumer && consumer.paused) {
      await consumer.resume();
      logger.info(`Consumer resumed: ${consumerId}`);
    }
  }

  async closeConsumer(consumerId: string): Promise<void> {
    const consumer = this.consumers.get(consumerId);
    if (consumer) {
      consumer.close();
      this.consumers.delete(consumerId);
      logger.info(`Consumer closed: ${consumerId}`);
    }
  }

  getAllConsumers(): Map<string, mediasoupTypes.Consumer> {
    return this.consumers;
  }

  getConsumersByProducer(producerId: string): mediasoupTypes.Consumer[] {
    return Array.from(this.consumers.values()).filter(
      consumer => consumer.producerId === producerId
    );
  }

  async closeAllConsumers(): Promise<void> {
    for (const [consumerId, consumer] of this.consumers) {
      consumer.close();
      logger.info(`Consumer closed: ${consumerId}`);
    }
    this.consumers.clear();
  }

  getConsumerStats(): any[] {
    return Array.from(this.consumers.entries()).map(([consumerId, consumer]) => ({
      consumerId,
      producerId: consumer.producerId,
      kind: consumer.kind,
      paused: consumer.paused,
      closed: consumer.closed,
    }));
  }
}
