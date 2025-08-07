import { types as mediasoupTypes } from 'mediasoup';
import { logger } from '../utils/logger';

/**
 * A Map to store all active Mediasoup Producer instances, with the producer's ID as the key.
 * This state is private to the module.
 */
const producers = new Map<string, mediasoupTypes.Producer>();

/**
 * Creates a new producer to receive media from a client.
 *
 * @param transport - The Mediasoup transport that will receive the media.
 * @param kind - The kind of media being produced ('audio' or 'video').
 * @param rtpParameters - The RTP parameters of the producing client's endpoint.
 * @returns A promise that resolves with the newly created producer instance.
 * @throws Will throw an error if the transport fails to create the producer.
 */
export async function createProducer(
  transport: mediasoupTypes.Transport,
  kind: mediasoupTypes.MediaKind,
  rtpParameters: mediasoupTypes.RtpParameters
): Promise<mediasoupTypes.Producer> {
  try {
    const producer = await transport.produce({
      kind,
      rtpParameters,
    });

    // When the transport closes, the producer is automatically closed.
    // We listen for this event to clean up our state.
    producer.on('transportclose', () => {
      logger.info(`Producer's transport closed, removing producer | producerId: ${producer.id}`);
      producers.delete(producer.id);
    });

    // (Optional) You can listen for the 'score' event to monitor stream quality.
    producer.on('score', (score) => {
      // A score of 10 is perfect, while 1 is very poor.
      // This can be used to notify users of network issues.
      logger.debug(`Producer score | producerId: ${producer.id}`, score);
    });

    producers.set(producer.id, producer);
    logger.info(`✅ Producer created | producerId: ${producer.id}, kind: ${kind}`);
    return producer;
  } catch (error) {
    logger.error(`Error creating producer | transportId: ${transport.id}`, error);
    throw error;
  }
}

/**
 * Retrieves a producer instance by its ID.
 *
 * @param producerId - The ID of the producer to retrieve.
 * @returns The producer instance, or undefined if not found.
 */
export function getProducer(producerId: string): mediasoupTypes.Producer | undefined {
  return producers.get(producerId);
}

/**
 * Closes a producer and removes it from the managed state.
 *
 * @param producerId - The ID of the producer to close.
 */
export function closeProducer(producerId: string): void {
  const producer = producers.get(producerId);
  if (producer) {
    producer.close();
    producers.delete(producerId);
    logger.info(`❌ Producer closed | producerId: ${producerId}`);
  }
}

/**
 * Retrieves all producers currently active for a specific room.
 * This relies on the room's router ID being stored in the transport's appData.
 *
 * @param routerId - The ID of the router associated with the room.
 * @returns An array of producer instances for that room.
 */
export function getProducersForRouter(routerId: string): mediasoupTypes.Producer[] {
  const producersForRouter: mediasoupTypes.Producer[] = [];
  for (const producer of producers.values()) {
    // A producer belongs to a router via its transport.
    const transport = producer.appData.transport as mediasoupTypes.Router;
    if (transport && transport.appData && transport.appData.routerId === routerId) {
      producersForRouter.push(producer);
    }
  }
  return producersForRouter;
}

/**
 * Gathers and returns statistics for all active producers.
 * Useful for monitoring and debugging.
 *
 * @returns An array of objects, each containing stats for a producer.
 */
export function getProducerStats(): object[] {
  return Array.from(producers.values()).map(producer => ({
    producerId: producer.id,
    kind: producer.kind,
    paused: producer.paused,
    closed: producer.closed,
    score: producer.score,
  }));
}