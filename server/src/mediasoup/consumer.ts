import { types as mediasoupTypes } from 'mediasoup';
import { logger } from '../utils/logger';

/**
 * A Map to store all active Mediasoup Consumer instances, with the consumer's ID as the key.
 * This state is private to the module.
 */
const consumers = new Map<string, mediasoupTypes.Consumer>();

/**
 * Creates a new consumer for a given transport and producer.
 * The consumer is created in a paused state and must be resumed by the client.
 *
 * @param transport - The Mediasoup transport instance that will host the consumer.
 * @param producer - The producer instance whose media will be consumed.
 * @param rtpCapabilities - The RTP capabilities of the consuming client's endpoint.
 * @returns A promise that resolves with the newly created consumer instance.
 * @throws Will throw an error if the transport cannot consume the producer.
 */
export async function createConsumer(
  transport: mediasoupTypes.Transport,
  producer: mediasoupTypes.Producer,
  rtpCapabilities: mediasoupTypes.RtpCapabilities,
): Promise<mediasoupTypes.Consumer> {
  // Check if the router can consume the producer's media with the given capabilities.
  const router = transport.appData.router as mediasoupTypes.Router;
  if (!router.canConsume({ producerId: producer.id, rtpCapabilities })) {
    const errorMsg = `Transport cannot consume producer | transportId: ${transport.id}, producerId: ${producer.id}`;
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }

  try {
    const consumer = await transport.consume({
      producerId: producer.id,
      rtpCapabilities,
      paused: true, // Always start consumers paused. Client will resume after setup.
    });

    // Handle the transport closing, which should also close this consumer.
    consumer.on('transportclose', () => {
      logger.info(`Consumer's transport closed, closing consumer | consumerId: ${consumer.id}`);
      closeConsumer(consumer.id);
    });

    // Handle the producer closing, which should also close this consumer.
    consumer.on('producerclose', () => {
      logger.info(`Consumer's producer closed, closing consumer | consumerId: ${consumer.id}`);
      closeConsumer(consumer.id);
    });

    consumers.set(consumer.id, consumer);
    logger.info(`✅ Consumer created | consumerId: ${consumer.id}, producerId: ${producer.id}`);
    return consumer;
  } catch (error) {
    logger.error(`Error creating consumer | producerId: ${producer.id}`, error);
    throw error;
  }
}

/**
 * Retrieves a consumer instance by its ID.
 *
 * @param consumerId - The ID of the consumer to retrieve.
 * @returns The consumer instance, or undefined if not found.
 */
export function getConsumer(consumerId: string): mediasoupTypes.Consumer | undefined {
  return consumers.get(consumerId);
}

/**
 * Resumes a paused consumer, allowing media to flow to the client.
 *
 * @param consumerId - The ID of the consumer to resume.
 */
export async function resumeConsumer(consumerId: string): Promise<void> {
  const consumer = consumers.get(consumerId);
  if (consumer && consumer.paused) {
    await consumer.resume();
    logger.info(`▶️ Consumer resumed | consumerId: ${consumerId}`);
  }
}

/**
 * Closes a consumer and removes it from the managed state.
 *
 * @param consumerId - The ID of the consumer to close.
 */
export function closeConsumer(consumerId:string): void {
  const consumer = consumers.get(consumerId);
  if (consumer) {
    consumer.close();
    consumers.delete(consumerId);
    logger.info(`❌ Consumer closed | consumerId: ${consumerId}`);
  }
}

/**
 * Gathers and returns statistics for all active consumers.
 * Useful for monitoring and debugging.
 *
 * @returns An array of objects, each containing stats for a consumer.
 */
export function getConsumerStats(): object[] {
  return Array.from(consumers.values()).map(consumer => ({
    consumerId: consumer.id,
    producerId: consumer.producerId,
    kind: consumer.kind,
    paused: consumer.paused,
    closed: consumer.closed,
    score: consumer.score,
  }));
}