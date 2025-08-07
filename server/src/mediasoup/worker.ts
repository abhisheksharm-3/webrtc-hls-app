import * as mediasoup from 'mediasoup';
import { types as mediasoupTypes } from 'mediasoup';
import os from 'os';
import { mediasoupConfig } from '../config/mediasoup';
import { logger } from '../utils/logger';
import env from '../config/environment';

/**
 * An array to hold all active Mediasoup Worker instances.
 * This state is private to the module.
 */
let workers: mediasoupTypes.Worker[] = [];

/**
 * The index of the next worker to be used for round-robin load distribution.
 */
let nextWorkerIndex = 0;

/**
 * Initializes the Mediasoup workers.
 * This function should be called once when the server starts.
 * It creates one worker per available CPU core in production for optimal performance.
 *
 * @throws Will throw an error if workers cannot be created, stopping the server startup.
 */
export async function initializeWorkers(): Promise<void> {
  const numWorkers = env.NODE_ENV === 'production' ? os.cpus().length : 1;

  logger.info(`Initializing ${numWorkers} Mediasoup worker(s)...`);

  for (let i = 0; i < numWorkers; i++) {
    try {
      const worker = await createWorker(i);
      workers.push(worker);
    } catch (error) {
      logger.error('Failed to create a Mediasoup worker. Aborting server startup.');
      // Re-throw the error to halt the application start process.
      throw error;
    }
  }

  logger.info(`✅ ${workers.length} Mediasoup worker(s) initialized successfully.`);
}

/**
 * Creates a single Mediasoup worker and sets up a 'died' event listener for auto-recovery.
 *
 * @param workerIndex - The index in the workers array where this worker will be stored.
 * @returns A promise that resolves with the newly created worker instance.
 */
async function createWorker(workerIndex: number): Promise<mediasoupTypes.Worker> {
  const worker = await mediasoup.createWorker(mediasoupConfig.worker);

  // Set up a listener for the 'died' event. If a worker process unexpectedly crashes,
  // this will log the event and attempt to restart it automatically.
  worker.on('died', (error) => {
    logger.error(`Mediasoup worker has died | pid: ${worker.pid}`, error);
    logger.info('Attempting to restart the worker...');
    // The worker is already closed, so remove it from the array.
    workers.splice(workerIndex, 1);
    // Attempt to create a new worker to replace the dead one.
    createWorker(workerIndex).then(newWorker => {
        workers.splice(workerIndex, 0, newWorker);
        logger.info(`✅ Mediasoup worker restarted successfully | newPid: ${newWorker.pid}`);
    }).catch(restartError => {
        logger.error('Failed to restart Mediasoup worker', restartError);
    });
  });

  logger.info(`Mediasoup worker created | pid: ${worker.pid}`);
  return worker;
}

/**
 * Retrieves the next available worker using a round-robin algorithm.
 * This distributes the load of new rooms (routers) evenly across all workers.
 *
 * @returns A Mediasoup worker instance.
 */
export function getNextWorker(): mediasoupTypes.Worker {
  const worker = workers[nextWorkerIndex];
  nextWorkerIndex = (nextWorkerIndex + 1) % workers.length;
  return worker;
}

/**
 * Gathers and returns statistics for all active workers.
 *
 * @returns An array of objects, each containing stats for a worker.
 */
export function getWorkerStats(): object[] {
  return workers.map(worker => ({
    pid: worker.pid,
    routerCount: (worker.appData.routers && typeof (worker.appData.routers as { size?: number }).size === 'number')
      ? (worker.appData.routers as { size: number }).size
      : 0, // Safely get size if routers is a Set/Map
    closed: worker.closed,
  }));
}


/**
 * Closes a Mediasoup worker at the specified index and removes it from the workers array.
 * 
 * @param workerIndex - The index of the worker to close.
 * @returns A promise that resolves when the worker is closed.
 */
export async function closeAllWorkers(): Promise<void> {
  for (const worker of workers) {
    try {
      await worker.close();
      logger.info(`Mediasoup worker closed | pid: ${worker.pid}`);
    } catch (error) {
      logger.error(`Error closing Mediasoup worker | pid: ${worker.pid}`, error);
    }
  }
  workers = [];
  nextWorkerIndex = 0;
}
