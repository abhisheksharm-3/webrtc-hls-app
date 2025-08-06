import * as mediasoup from 'mediasoup';
import { types as mediasoupTypes } from 'mediasoup';
import { mediasoupConfig } from '../config/mediasoup';
import { logger } from '../utils/logger';

export class MediasoupWorker {
  private static instance: MediasoupWorker;
  private workers: mediasoupTypes.Worker[] = [];
  private nextWorkerIndex = 0;

  public static getInstance(): MediasoupWorker {
    if (!MediasoupWorker.instance) {
      MediasoupWorker.instance = new MediasoupWorker();
    }
    return MediasoupWorker.instance;
  }

  async initialize(): Promise<void> {
    try {
      // Create workers based on CPU cores
      const numWorkers = process.env.NODE_ENV === 'production' 
        ? require('os').cpus().length 
        : 1;

      for (let i = 0; i < numWorkers; i++) {
        const worker = await mediasoup.createWorker(mediasoupConfig.worker);
        
        worker.on('died', () => {
          logger.error(`Mediasoup worker ${worker.pid} died, restarting...`);
          this.restartWorker(i);
        });

        this.workers.push(worker);
        logger.info(`Mediasoup worker ${worker.pid} created`);
      }

      logger.info(`${this.workers.length} Mediasoup workers initialized`);
    } catch (error) {
      logger.error('Error initializing Mediasoup workers:', error);
      throw error;
    }
  }

  getNextWorker(): mediasoupTypes.Worker {
    const worker = this.workers[this.nextWorkerIndex];
    this.nextWorkerIndex = (this.nextWorkerIndex + 1) % this.workers.length;
    return worker;
  }

  private async restartWorker(index: number): Promise<void> {
    try {
      const newWorker = await mediasoup.createWorker(mediasoupConfig.worker);
      
      newWorker.on('died', () => {
        logger.error(`Mediasoup worker ${newWorker.pid} died, restarting...`);
        this.restartWorker(index);
      });

      this.workers[index] = newWorker;
      logger.info(`Mediasoup worker ${newWorker.pid} restarted`);
    } catch (error) {
      logger.error('Error restarting Mediasoup worker:', error);
    }
  }

  async close(): Promise<void> {
    for (const worker of this.workers) {
      worker.close();
    }
    this.workers = [];
    logger.info('All Mediasoup workers closed');
  }

  getWorkerStats(): any[] {
    return this.workers.map(worker => ({
      pid: worker.pid,
      died: worker.closed,
    }));
  }
}
