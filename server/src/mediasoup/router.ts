import { types as mediasoupTypes } from 'mediasoup';
import { mediasoupConfig } from '../config/mediasoup';
import { logger } from '../utils/logger';

/**
 * A Map to store all active Mediasoup Router instances, with the router's ID as the key.
 * This state is private to the module.
 */
const routers = new Map<string, mediasoupTypes.Router>();

/**
 * Creates a new Mediasoup router on a given worker.
 * Each router represents a distinct media room.
 *
 * @param worker - The Mediasoup worker instance to host the new router.
 * @returns A promise that resolves with the newly created router instance.
 * @throws Will throw an error if the worker fails to create the router.
 */
export async function createRouter(
  worker: mediasoupTypes.Worker
): Promise<mediasoupTypes.Router> {
  try {
    const router = await worker.createRouter(mediasoupConfig.router);
    routers.set(router.id, router);

    // When the router is closed, remove it from our map to prevent memory leaks.
    router.on('@close', () => {
      routers.delete(router.id);
      logger.info(`Router closed, removed from state | routerId: ${router.id}`);
    });

    logger.info(`✅ Router created | routerId: ${router.id}`);
    return router;
  } catch (error) {
    logger.error('Error creating Mediasoup router', error);
    // Re-throw the error to be handled by the calling service.
    throw error;
  }
}

/**
 * Retrieves a router instance by its ID.
 *
 * @param routerId - The ID of the router to retrieve.
 * @returns The router instance, or undefined if not found.
 */
export function getRouter(routerId: string): mediasoupTypes.Router | undefined {
  return routers.get(routerId);
}

/**
 * Closes a router and all its associated transports, producers, and consumers.
 *
 * @param routerId - The ID of the router to close.
 */
export function closeRouter(routerId: string): void {
  const router = routers.get(routerId);
  if (router && !router.closed) {
    router.close(); // This will trigger the 'close' event and remove it from the map.
    logger.info(`❌ Router closed | routerId: ${routerId}`);
  }
}

/**
 * Gathers and returns statistics for all active routers.
 * Uses the router.dump() method to get detailed information about transports and other entities.
 *
 * @returns A promise that resolves to an array of objects with router statistics.
 */
export async function getRouterStats(): Promise<Array<{
  routerId: string;
  transportCount: number;
  producerCount: number;
  consumerCount: number;
  rtpObserverCount: number;
  dataProducerCount: number;
  dataConsumerCount: number;
  closed: boolean;
}>> {
  const stats = [];
  
  for (const router of routers.values()) {
    try {
      if (router.closed) {
        stats.push({
          routerId: router.id,
          transportCount: 0,
          producerCount: 0,
          consumerCount: 0,
          rtpObserverCount: 0,
          dataProducerCount: 0,
          dataConsumerCount: 0,
          closed: true,
        });
        continue;
      }

      // Use the dump() method to get detailed router information
      const dump = await router.dump();
      
      // Count producers and consumers from the mapping arrays
      const producerCount = dump.mapProducerIdConsumerIds.length;
      const consumerCount = dump.mapConsumerIdProducerId.length;
      const dataProducerCount = dump.mapDataProducerIdDataConsumerIds.length;
      const dataConsumerCount = dump.mapDataConsumerIdDataProducerId.length;
      
      stats.push({
        routerId: router.id,
        transportCount: dump.transportIds.length,
        producerCount,
        consumerCount,
        rtpObserverCount: dump.rtpObserverIds.length,
        dataProducerCount,
        dataConsumerCount,
        closed: router.closed,
      });
    } catch (error) {
      logger.error(`Error getting stats for router ${router.id}`, error);
      // Include basic info even if detailed stats fail
      stats.push({
        routerId: router.id,
        transportCount: 0,
        producerCount: 0,
        consumerCount: 0,
        rtpObserverCount: 0,
        dataProducerCount: 0,
        dataConsumerCount: 0,
        closed: router.closed,
      });
    }
  }
  
  return stats;
}

/**
 * Gets a simplified version of router stats synchronously (without detailed counts).
 * Useful when you need quick stats without the async overhead.
 *
 * @returns An array of basic router information.
 */
export function getBasicRouterStats(): Array<{
  routerId: string;
  closed: boolean;
}> {
  return Array.from(routers.values()).map(router => ({
    routerId: router.id,
    closed: router.closed,
  }));
}