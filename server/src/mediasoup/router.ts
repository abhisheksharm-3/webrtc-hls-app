import { types as mediasoupTypes } from 'mediasoup';
import { MediasoupWorker } from './worker';
import { mediasoupConfig } from '../config/mediasoup';
import { logger } from '../utils/logger';

export class MediasoupRouter {
  private static instance: MediasoupRouter;
  private routers: Map<string, mediasoupTypes.Router> = new Map();

  public static getInstance(): MediasoupRouter {
    if (!MediasoupRouter.instance) {
      MediasoupRouter.instance = new MediasoupRouter();
    }
    return MediasoupRouter.instance;
  }

  async createRouter(roomId: string): Promise<mediasoupTypes.Router> {
    try {
      const worker = MediasoupWorker.getInstance().getNextWorker();
      const router = await worker.createRouter(mediasoupConfig.router);

      this.routers.set(roomId, router);
      logger.info(`Router created for room ${roomId}`);

      return router;
    } catch (error) {
      logger.error(`Error creating router for room ${roomId}:`, error);
      throw error;
    }
  }

  getRouter(roomId: string): mediasoupTypes.Router | undefined {
    return this.routers.get(roomId);
  }

  async closeRouter(roomId: string): Promise<void> {
    const router = this.routers.get(roomId);
    if (router) {
      router.close();
      this.routers.delete(roomId);
      logger.info(`Router closed for room ${roomId}`);
    }
  }

  getRtpCapabilities(roomId: string): mediasoupTypes.RtpCapabilities | null {
    const router = this.routers.get(roomId);
    return router ? router.rtpCapabilities : null;
  }

  async closeAllRouters(): Promise<void> {
    for (const [roomId, router] of this.routers) {
      router.close();
      logger.info(`Router closed for room ${roomId}`);
    }
    this.routers.clear();
  }

  getRouterStats(): any[] {
    return Array.from(this.routers.entries()).map(([roomId, router]) => ({
      roomId,
      closed: router.closed,
    }));
  }
}
